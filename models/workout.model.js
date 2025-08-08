import mongoose from "mongoose";

// Note: The 'IndividualWorkoutSchema' and its hashing logic have been removed completely.

// This is the schema for the exercises within your Exercise Library.
// --- NO CHANGES WERE MADE HERE, AS REQUESTED ---
const ExerciseLibrarySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    category: { type: String, required: true },
    equipment: [{ type: String, required: true }],
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
    recommendedSets: { type: String },
    recommendedReps: { type: String },
    isWarmupExercise: { type: Boolean, default: false },
    isCooldownExercise: { type: Boolean, default: false },
    isMainWorkoutExercise: { type: Boolean, default: true },
    tags: [{ type: String }],
}, {
    collection: "ExerciseLibrary",
    timestamps: true,
});

export const ExerciseLibrary = mongoose.model("ExerciseLibrary", ExerciseLibrarySchema);


// --- NEW SIMPLIFIED SUB-SCHEMAS ---

// A new, simple schema to define the structure of an exercise within a routine.
const WorkoutExerciseSchema = new mongoose.Schema({
    exerciseName: { type: String, required: true },
    sets: { type: Number, required: true },
    reps: { type: String, required: true },
    difficulty: { type: String }, // AI-assigned difficulty for this specific instance
    videoUrl: { type: String, required: true } // The direct video URL from the library
}, { _id: false }); // _id is not needed for sub-documents

// The schema for a single day's plan. It now directly contains arrays of exercises.
const UserDayRoutineSchema = new mongoose.Schema({
    day: { type: String, required: true },
    focus: { type: String, required: true },
    timeEstimate: { type: Number, required: true },
    warmup: [WorkoutExerciseSchema],
    workoutRoutine: [WorkoutExerciseSchema],
    cooldown: [WorkoutExerciseSchema]
}, { _id: false });


// --- MODIFIED PRIMARY SCHEMA ---

// The main UserRoutine schema is now self-contained.
// It holds the entire weekly plan without referencing other collections.
const UserRoutineSchema = new mongoose.Schema({
    UserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserInfo",
        required: true,
        unique: true, // Each user has one active routine document
    },
    // The routine is now an array of the simplified UserDayRoutineSchema
    routine: [UserDayRoutineSchema],
    generatedAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, {
    collection: "UserRoutines",
    timestamps: true
});

export const UserRoutine = mongoose.model("UserRoutine", UserRoutineSchema);

const WorkoutLogSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserInfo",
        required: true,
        idex:true
    },
    workoutName:{type: String, required: true},
    date:{
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    durationSeconds: {type: Number},
    exercises: [
        {
            name:{ type: String, required: true },
            sets:[
                {
                    reps: { type: Number, required: true },
                    weight: { type: Number, required: true }, // Weight lifted in kg or lbs
                }
            ]
        }
    ],
    points: {type: Number}
}, {timestamps: true, collection: "WorkoutLogs"});

export const WorkoutLog = mongoose.model("WorkoutLog", WorkoutLogSchema);
