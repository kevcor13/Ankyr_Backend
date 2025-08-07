import dotenv from 'dotenv';
import mongoose from "mongoose";
// Removed IndividualWorkout, as it's no longer needed.
import { UserRoutine, ExerciseLibrary } from '../models/workout.model.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

// Initialize Gemini API
const geminiAPIKey = process.env.GEMINI_API_KEY;
if (!geminiAPIKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
}
const genAI = new GoogleGenerativeAI(geminiAPIKey);

export const AI = async (req, res) => {
    const { UserID, Gmessage } = req.body;

    try {
        if (!UserID || !Gmessage) {
            return res.status(400).json({ error: "UserID and workout generation message are required." });
        }

        const userObjectId = new mongoose.Types.ObjectId(UserID);

        // --- 1. Filter exercises from your library based on the user's request ---
        let exerciseQuery = {};
        const lowerGmessage = Gmessage.toLowerCase();

        if (lowerGmessage.includes("dumbbells")) exerciseQuery.equipment = "Dumbbells";
        if (lowerGmessage.includes("bodyweight") || lowerGmessage.includes("no equipment")) exerciseQuery.equipment = "Bodyweight";
        if (lowerGmessage.includes("beginner")) exerciseQuery.difficulty = "Beginner";
        else if (lowerGmessage.includes("intermediate")) exerciseQuery.difficulty = "Intermediate";
        else if (lowerGmessage.includes("advanced")) exerciseQuery.difficulty = "Advanced";

        const availableExercises = await ExerciseLibrary.find(exerciseQuery).limit(200).lean();

        if (availableExercises.length === 0) {
            return res.status(400).json({ error: "Could not find suitable exercises based on your request." });
        }

        // Create a quick lookup map for faster access to exercise details
        const exerciseMap = new Map(availableExercises.map(ex => [ex.name, ex]));

        // --- 2. Format available exercises for the AI prompt ---
        const exercisesForAI = availableExercises.map(ex => ({
            name: ex.name,
            category: ex.category,
            equipment: ex.equipment,
            difficulty: ex.difficulty,
            recommendedSets: ex.recommendedSets,
            recommendedReps: ex.recommendedReps,
        }));

        // --- 3. Construct the AI Prompt (Schema remains the same) ---
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const systemInstruction = `You are a helpful and expert fitness trainer. Your task is to generate a structured weekly workout plan tailored to the user's request.
        You MUST ONLY use exercises from the provided JSON list of "Available Exercises".
        For each exercise you include, you MUST use its exact 'name'.
        The response MUST be in pure JSON format, matching the specified schema.
        DO NOT include rest days.
        Ensure 'warmup', 'workoutRoutine', and 'cooldown' arrays are present, even if empty.`;

        const fullPrompt = `${systemInstruction}\n\n
        Available Exercises:\n${JSON.stringify(exercisesForAI)}\n\n
        User Request: ${Gmessage}\n\n
        FORMAT:
        Return the full structured data in pure JSON format. The JSON should adhere to the following schema:
        {
            "routine": [
                {
                    "day": "string",
                    "focus": "string",
                    "timeEstimate": "number",
                    "warmup": [{"exerciseName": "string", "sets": "number", "reps": "string"}],
                    "workoutRoutine": [{"exerciseName": "string", "sets": "number", "reps": "string", "difficulty": "string"}],
                    "cooldown": [{"exerciseName": "string", "sets": "number", "reps": "string"}]
                }
            ]
        }`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            generationConfig: { responseMimeType: "application/json" },
        });

        const responseText = result.response.text();
        let generatedPlan;
        try {
            generatedPlan = JSON.parse(responseText).routine;
            if (!Array.isArray(generatedPlan)) throw new Error("AI response was not a valid routine array.");
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", parseError);
            console.error("Raw Gemini Response:", responseText);
            return res.status(500).json({ error: "AI generated an invalid workout plan. Please try again." });
        }

        // --- 4. Process and Enrich the AI-Generated Plan (Simplified Logic) ---
        const finalUserRoutine = [];

        for (const day of generatedPlan) {
            // Helper function to process each segment (warmup, workout, cooldown)
            const processSegment = (segment) => {
                if (!segment || !Array.isArray(segment)) return [];
                
                return segment.map(item => {
                    const exerciseDetails = exerciseMap.get(item.exerciseName);
                    if (!exerciseDetails) {
                        console.warn(`AI suggested an unknown exercise: "${item.exerciseName}". Skipping.`);
                        return null; // This will be filtered out later
                    }
                    // Create the final exercise object with all required details
                    return {
                        exerciseName: item.exerciseName,
                        sets: item.sets,
                        reps: item.reps,
                        difficulty: item.difficulty || exerciseDetails.difficulty,
                        videoUrl: exerciseDetails.videoUrl, // Add the video URL
                    };
                }).filter(Boolean); // Filter out any null (skipped) exercises
            };

            finalUserRoutine.push({
                day: day.day,
                focus: day.focus,
                timeEstimate: day.timeEstimate,
                warmup: processSegment(day.warmup),
                workoutRoutine: processSegment(day.workoutRoutine),
                cooldown: processSegment(day.cooldown),
            });
        }

        // --- 5. Save the Complete, Self-Contained Routine for the User ---
        const userRoutineExpirationDate = new Date();
        userRoutineExpirationDate.setDate(new Date().getDate() + 7); // Routine expires in 7 days

        const savedUserRoutine = await UserRoutine.findOneAndUpdate(
            { UserID: userObjectId },
            {
                routine: finalUserRoutine, // Save the complete, enriched routine object
                generatedAt: new Date(),
                expiresAt: userRoutineExpirationDate,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        
        console.log("User's weekly routine saved/updated:", savedUserRoutine._id);
        
        // No .populate() needed anymore! The data is already in the document.
        res.json({
            message: "Weekly workout plan generated and saved successfully!",
            workout: savedUserRoutine,
            source: "ai_generated_and_saved"
        });

    } catch (error) {
        console.error("Overall error in /aI endpoint:", error);
        res.status(500).json({ error: error.message || "An unknown error occurred." });
    }
};