import dotenv from "dotenv";
import mongoose from "mongoose";
import { UserRoutine, ExerciseLibrary } from "../models/workout.model.js";
import OpenAI from "openai";

dotenv.config();

// Initialize OpenAI API
const openaiAPIKey = process.env.OPENAI_API_KEY;
if (!openaiAPIKey) {
  throw new Error("OPENAI_API_KEY is not set in environment variables.");
}
const openai = new OpenAI({ apiKey: openaiAPIKey });

export const AI = async (req, res) => {
  const { UserID, Gmessage } = req.body;

  try {
    if (!UserID || !Gmessage) {
      return res
        .status(400)
        .json({ error: "UserID and workout generation message are required." });
    }

    const userObjectId = new mongoose.Types.ObjectId(UserID);

    // --- 1) Filter exercises from library based on heuristics ---
    const exerciseQuery = {};
    const lowerGmessage = String(Gmessage).toLowerCase();

    if (lowerGmessage.includes("dumbbells")) exerciseQuery.equipment = "Dumbbells";
    if (lowerGmessage.includes("bodyweight") || lowerGmessage.includes("no equipment"))
      exerciseQuery.equipment = "Bodyweight";
    if (lowerGmessage.includes("beginner")) exerciseQuery.difficulty = "Beginner";
    else if (lowerGmessage.includes("intermediate"))
      exerciseQuery.difficulty = "Intermediate";
    else if (lowerGmessage.includes("advanced")) exerciseQuery.difficulty = "Advanced";

    const availableExercises = await ExerciseLibrary.find(exerciseQuery).limit(200).lean();

    if (!availableExercises || availableExercises.length === 0) {
      return res
        .status(400)
        .json({ error: "Could not find suitable exercises based on your request." });
    }

    const exerciseMap = new Map(availableExercises.map((ex) => [ex.name, ex]));
    const exercisesForAI = availableExercises.map((ex) => ({
      name: ex.name,
      category: ex.category,
      equipment: ex.equipment,
      difficulty: ex.difficulty,
      recommendedSets: ex.recommendedSets,
      recommendedReps: ex.recommendedReps,
    }));

    // --- 2) Build prompt and call OpenAI ---
    const systemInstruction = `You are a helpful and expert fitness trainer. 
Your task is to generate a structured weekly workout plan tailored to the user's request.
You MUST ONLY use exercises from the provided JSON list of "Available Exercises" and use each exercise's exact "name".
Respond in pure JSON matching the schema, with no commentary or markdown.
Do NOT include rest days.
Always include arrays for "warmup", "workoutRoutine", and "cooldown" (can be empty).
If an exercise is bodyweight or a stretch, omit "recommendedWeight".
If you provide "recommendedWeight", it MUST be a pure number (no units).`;

    const fullPrompt = `${systemInstruction}

Available Exercises:
${JSON.stringify(exercisesForAI)}

User Request:
${Gmessage}

FORMAT:
Return ONLY JSON:
{
  "routine": [
    {
      "day": "string",
      "focus": "string",
      "timeEstimate": "number",
      "warmup": [{"exerciseName": "string", "sets": "number", "reps": "string"}],
      "workoutRoutine": [{"exerciseName": "string", "sets": "number", "reps": "string", "difficulty": "string", "recommendedWeight": "number"}],
      "cooldown": [{"exerciseName": "string", "sets": "number", "reps": "string"}]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: fullPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0].message.content;
    let generatedPlan;
    try {
      const parsed = JSON.parse(responseText);
      generatedPlan = parsed.routine;
      if (!Array.isArray(generatedPlan)) {
        throw new Error("AI response was not a valid routine array.");
      }
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Raw OpenAI Response:", responseText);
      return res
        .status(500)
        .json({ error: "AI generated an invalid workout plan. Please try again." });
    }

    // --- 3) Sanitize and enrich output ---
    const toInt = (val, fallback = 0) => {
      if (typeof val === "number" && Number.isFinite(val)) return Math.round(val);
      if (typeof val === "string") {
        const n = parseInt(val, 10);
        return Number.isFinite(n) ? n : fallback;
      }
      return fallback;
    };

    const numFromAny = (val) => {
      if (val == null) return undefined;
      if (typeof val === "number" && Number.isFinite(val)) return val;
      if (typeof val === "string") {
        const m = val.match(/-?\d+(\.\d+)?/);
        if (m) return parseFloat(m[0]);
      }
      return undefined;
    };

    const str = (val, fallback = "") => (val == null ? fallback : String(val));

    const finalUserRoutine = [];

    const buildExercise = (item, details, includeWeightAndDifficulty) => {
      const base = {
        exerciseName: str(item.exerciseName),
        sets: toInt(item.sets ?? details?.recommendedSets, 0),
        reps: str(item.reps ?? details?.recommendedReps ?? ""),
        videoUrl: str(details?.videoUrl || item.videoUrl || ""),
      };

      if (includeWeightAndDifficulty) {
        const rw = numFromAny(item.recommendedWeight ?? details?.recommendedWeight);
        return {
          ...base,
          difficulty: str(item.difficulty ?? details?.difficulty ?? "Intermediate"),
          ...(rw !== undefined ? { recommendedWeight: rw } : {}),
        };
      }
      return base;
    };

    for (const day of generatedPlan) {
      const makeSegment = (seg, kind) => {
        if (!Array.isArray(seg)) return [];
        return seg
          .map((item) => {
            const details = exerciseMap.get(item.exerciseName);
            if (!details) {
              console.warn(`Unknown exercise from AI: "${item.exerciseName}" — skipping.`);
              return null;
            }
            return buildExercise(item, details, kind === "workout");
          })
          .filter(Boolean);
      };

      finalUserRoutine.push({
        day: str(day.day),
        focus: str(day.focus),
        timeEstimate: toInt(day.timeEstimate, 45),
        warmup: makeSegment(day.warmup, "warmup"),
        workoutRoutine: makeSegment(day.workoutRoutine, "workout"),
        cooldown: makeSegment(day.cooldown, "cooldown"),
      });
    }

    // --- 4) Save/Upsert routine document ---
    const userRoutineExpirationDate = new Date();
    userRoutineExpirationDate.setDate(new Date().getDate() + 7);

    const savedUserRoutine = await UserRoutine.findOneAndUpdate(
      { UserID: userObjectId },
      {
        routine: finalUserRoutine,
        generatedAt: new Date(),
        expiresAt: userRoutineExpirationDate,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("User's weekly routine saved/updated:", savedUserRoutine._id);

    res.json({
      message: "Weekly workout plan generated and saved successfully!",
      workout: savedUserRoutine,
      source: "openai_generated_and_saved",
    });
  } catch (error) {
    console.error("Overall error in /AI endpoint:", error);
    res.status(500).json({ error: error.message || "An unknown error occurred." });
  }
};
