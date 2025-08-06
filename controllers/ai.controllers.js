import dotenv from 'dotenv';
import mongoose from "mongoose";
import { UserRoutine, ExerciseLibrary, IndividualWorkout } from '../models/workout.model.js'; // Added IndividualWorkout
import { GoogleGenerativeAI } from '@google/generative-ai'; // Added GoogleGenerativeAI library

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
            console.error("Error: UserID or Gmessage is missing from request body.");
            return res.status(400).json({ error: "UserID and workout generation message are required." });
        }

        const userObjectId = new mongoose.Types.ObjectId(UserID);
        const currentTime = new Date();

//      --- 1. Parse Gmessage to filter relevant exercises from your ExerciseLibrary ---

        let exerciseQuery = {};
        const lowerGmessage = Gmessage.toLowerCase();

        if (lowerGmessage.includes("dumbbells")) {
            exerciseQuery.equipment = "Dumbbells";
        }
        if (lowerGmessage.includes("bodyweight") || lowerGmessage.includes("no equipment")) {
             exerciseQuery.equipment = "Bodyweight";
        }
        if (lowerGmessage.includes("beginner")) {
            exerciseQuery.difficulty = "Beginner";
        } else if (lowerGmessage.includes("intermediate")) {
            exerciseQuery.difficulty = "Intermediate";
        } else if (lowerGmessage.includes("advanced")) {
            exerciseQuery.difficulty = "Advanced";
        }


        const availableExercises = await ExerciseLibrary.find(exerciseQuery).limit(200).lean();

        if (availableExercises.length === 0) {
            console.warn("No exercises found matching criteria for Gmessage:", Gmessage);
            return res.status(400).json({ error: "Could not find any suitable exercises from the library based on your request. Please try a different message or add more exercises to the library." });
        }

        // --- 2. Format available exercises for the AI prompt (only data AI needs) ---
        const exercisesForAI = availableExercises.map(ex => ({
            name: ex.name,
            category: ex.category,
            equipment: ex.equipment,
            difficulty: ex.difficulty,
            recommendedSets: ex.recommendedSets,
            recommendedReps: ex.recommendedReps,
        }));

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });



        // --- 3. Construct the AI Prompt with the Exercise List and specific instructions ---
        const systemInstruction = `You are a helpful and expert fitness trainer. Your task is to generate a structured weekly workout plan tailored to the user's request.
        You MUST ONLY use exercises from the provided JSON list of "Available Exercises".
        For each exercise you include in the workout routine, you MUST use its exact 'name' as it appears in the "Available Exercises" list.
        Adapt sets and reps based on the user's request, the exercise's recommended values, and general fitness principles.
        DO NOT include rest days in the routine.
        The response MUST be in pure JSON format, matching the specified schema.
        Ensure 'warmup' and 'workoutRoutine' arrays are present, even if empty.`;

        const fullPrompt = `${systemInstruction}\n\n
        Available Exercises (use ONLY these, reference by 'name'):\n${JSON.stringify(exercisesForAI)}\n\n
        User Request: ${Gmessage}\n\n
        FORMAT:
        Return the full structured data in pure JSON format, no extra commentary. The JSON should adhere to the following schema:
        {
            "routine": [
                {
                    "day": "string",
                    "focus": "string",
                    "timeEstimate": "number",
                    "warmup": [
                        {
                            "exerciseName": "string", // This MUST be an exact 'name' from the provided list
                            "sets": "number",
                            "reps": "string"
                        }
                    ],
                    "workoutRoutine": [
                        {
                            "exerciseName": "string", // This MUST be an exact 'name' from the provided list
                            "sets": "number",
                            "reps": "string",
                            "difficulty": "string" // e.g., "easy", "moderate", or "hard" for this specific execution
                        }
                    ],
                    "cooldown": "string" // Brief cooldown recommendation (text)
                }
            ]
        }`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        const geminiResponse = result.response;
        const responseText = geminiResponse.text();

        let generatedRoutine;
        try {
            const parsedResponse = JSON.parse(responseText);
            if (!parsedResponse || !Array.isArray(parsedResponse.routine)) {
                throw new Error("AI response did not match expected 'routine' array structure.");
            }
            generatedRoutine = parsedResponse.routine;
        } catch (parseError) {
            console.error("Failed to parse Gemini response as JSON or invalid structure:", parseError);
            console.error("Raw Gemini Response Text (for debugging):", responseText);
            return res.status(500).json({ error: "AI generated an unparseable or invalid workout plan. Please try again." });
        }

        console.log("Gemini successfully generated routine structure for", generatedRoutine.length, "days.");

        const userRoutineToSave = [];
        const cacheExpirationDate = new Date();
        cacheExpirationDate.setDate(currentTime.getDate() + 30); 


        // --- 4. Process each day's routine, validate exercises, add video URLs, and cache segments ---
        for (const day of generatedRoutine) {
            const dayRoutine = {
                day: day.day,
                focus: day.focus,
                timeEstimate: day.timeEstimate,
                warmupRef: null,
                workoutRoutineRef: null,
                cooldownRef: null, 
                cooldownText: day.cooldown || "" 
            };

            // Helper function to process either warmup or main_workout segments
            const processWorkoutSegment = async (segment, type) => {
                if (!segment || !Array.isArray(segment) || segment.length === 0) return null;

                const exercisesWithDetails = [];
                for (const item of segment) {
                    const exerciseFromLibrary = availableExercises.find(ex => ex.name === item.exerciseName);

                    if (!exerciseFromLibrary) {
                        console.warn(`AI suggested unknown or unavailable exercise: "${item.exerciseName}". Skipping this exercise from the segment.`);
                        continue; // Skip this specific exercise if not found in our library
                    }

                    exercisesWithDetails.push({
                        exercise: exerciseFromLibrary.name, // Use the official name from library
                        sets: item.sets,
                        reps: item.reps,
                        difficulty: item.difficulty || exerciseFromLibrary.difficulty, // AI can override, else use library default
                        videoUrl: exerciseFromLibrary.videoUrl, // <--- CRUCIAL: Get the video URL here!
                    });
                }

                if (exercisesWithDetails.length === 0) return null; // If all suggested exercises for this segment were invalid/skipped

                // Generate hash for the segment's content (now including videoUrl in content for hashing)
                const contentHash = IndividualWorkout.generateContentHash(exercisesWithDetails, type);
                let cachedSegment = await IndividualWorkout.findOne({ contentHash: contentHash });

                if (!cachedSegment) {
                    console.log(`Caching new ${type} segment: ${contentHash.substring(0, 10)}...`);
                    cachedSegment = await IndividualWorkout.create({
                        contentHash: contentHash,
                        type: type,
                        content: exercisesWithDetails, // Save exercises with video URLs here!
                        expiresAt: cacheExpirationDate,
                    });
                } else {
                    console.log(`${type} cache hit: ${contentHash.substring(0, 10)}...`);
                    // Optionally, update expiresAt for cached segment on hit to keep it fresh
                    if (cachedSegment.expiresAt < currentTime) {
                        await IndividualWorkout.updateOne({ _id: cachedSegment._id }, { expiresAt: cacheExpirationDate });
                        console.log(`Updated expiration for cached ${type} segment.`);
                    }
                }
                return cachedSegment._id;
            };

            dayRoutine.warmupRef = await processWorkoutSegment(day.warmup, 'warmup');
            dayRoutine.workoutRoutineRef = await processWorkoutSegment(day.workoutRoutine, 'main_workout');

            userRoutineToSave.push(dayRoutine);
        }

        // --- 5. Save/Update the user's weekly routine in the UserRoutine collection ---
        const userRoutineExpirationDate = new Date();
        userRoutineExpirationDate.setDate(currentTime.getDate() + 7); // User's overall routine document expires in 7 days

        let savedUserRoutine;
        try {
            savedUserRoutine = await UserRoutine.findOneAndUpdate(
                { UserID: userObjectId }, // Find routine for this specific user
                {
                    routine: userRoutineToSave,
                    generatedAt: currentTime,
                    expiresAt: userRoutineExpirationDate,
                },
                {
                    upsert: true, // Create if not found
                    new: true,   // Return the updated/new document
                    setDefaultsOnInsert: true // Apply schema defaults on creation
                }
            );
            console.log("User's weekly routine saved/updated in UserRoutine collection:", savedUserRoutine._id);

            // Populate the references to IndividualWorkout documents before sending to client
            await savedUserRoutine.populate([
                { path: 'routine.warmupRef', model: 'IndividualWorkout' },
                { path: 'routine.workoutRoutineRef', model: 'IndividualWorkout' },
                // { path: 'routine.cooldownRef', model: 'IndividualWorkout' }
            ]);

            res.json({
                message: "Weekly workout plan generated and cached/saved successfully!",
                workout: savedUserRoutine, // This object now contains fully populated content with video URLs
                source: "ai_generated_and_cached_segments_with_videos"
            });

        } catch (dbError) {
            console.error("Error saving user routine or populating:", dbError);
            res.status(500).json({ error: "An error occurred while saving the user's routine." });
        }

    } catch (error) {
        console.error("Overall error in /aI endpoint:", error);
        if (error.response && error.response.candidates && error.response.candidates.length > 0) {
            console.error("Gemini API Error Candidates:", error.response.candidates);
        }
        res.status(500).json({ error: error.message || "An unknown error occurred during workout generation." });
    }
}