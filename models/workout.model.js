import mongoose from "mongoose";
import crypto from 'crypto';

const IndividualWorkoutSchema = new mongoose.Schema({
    contentHash: {
        type: String,
        required: true,
        unique: true,
    },
    // The type of workout segment (e.g., 'warmup', 'main_workout', 'cooldown')
    type: {
        type: String,
        enum: ['warmup', 'main_workout', 'cooldown'],
        required: true,
    },
    // The actual content of the workout segment.
    // This will be an array of ExerciseContentSchema for 'warmup' and 'main_workout'.
    // For 'cooldown', it might remain a string for simplicity, or become an array too.
    content: mongoose.Schema.Types.Mixed, // Stays Mixed to allow both array and string (if cooldown is a string)

    createdAt: {
        type: Date,
        default: Date.now,
    },
    // When this cached segment should expire and potentially be cleaned up.
    expiresAt: {
        type: Date,
        required: true,
    }
}, {
    collection: "IndividualWorkouts", // Explicit collection name
    timestamps: true // Adds `createdAt` and `updatedAt`
});

// Static method to generate a consistent hash for workout content
IndividualWorkoutSchema.statics.generateContentHash = function(content, type) {
    let contentString;
    if (type === 'cooldown' && typeof content === 'string') {
        contentString = content.trim().toLowerCase();
    } else if (Array.isArray(content)) {
        // Ensure consistent hashing by sorting and normalizing keys, including videoUrl
        contentString = JSON.stringify(content.map(ex => ({
            exercise: ex.exercise.trim().toLowerCase(),
            sets: ex.sets,
            reps: String(ex.reps).trim().toLowerCase(),
            difficulty: ex.difficulty ? ex.difficulty.trim().toLowerCase() : undefined,
            videoUrl: ex.videoUrl.trim() // Include videoUrl in hash for true uniqueness of this specific exercise instance
        })).sort((a, b) => (a.exercise > b.exercise) ? 1 : -1)); // Sort by exercise name
    } else {
        throw new Error("Invalid content type for hashing.");
    }
    return crypto.createHash('sha256').update(`${type}:${contentString}`).digest('hex');
};

export const IndividualWorkout = mongoose.model("IndividualWorkout", IndividualWorkoutSchema);

const ExerciseLibrarySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    // The URL to the high-quality video demonstration of this exercise.
    // This is what your frontend will use to play the video.
    videoUrl: {
        type: String,
        required: true,
    },
    // Main muscle group or focus area (e.g., "Chest", "Legs", "Cardio", "Core").
    category: {
        type: String,
        required: true,
    },
    // An array of equipment required for the exercise (e.g., ["Dumbbells", "Bodyweight"]).
    equipment: [{
        type: String,
        required: true,
    }],
    // The general difficulty level of the exercise.
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'], // Restrict to these options
        required: true,
    },
    // Recommended number of sets (e.g., "3", "3-4"). Used as guidance for the AI.
    recommendedSets: {
        type: String,
        required: false, // Optional
    },
    // Recommended repetition range or duration (e.g., "8-12", "30 seconds"). Used as guidance for the AI.
    recommendedReps: {
        type: String,
        required: false, // Optional
    },
    // Boolean flag if the exercise is suitable for warmups.
    isWarmupExercise: {
        type: Boolean,
        default: false,
    },
    // Boolean flag if the exercise is suitable for cooldowns.
    isCooldownExercise: {
        type: Boolean,
        default: false,
    },
    isMainWorkoutExercise: {
        type: Boolean,
        default: true,
    },
    // Optional: More specific tags for granular filtering or AI understanding
    // (e.g., "compound", "isolation", "plyometric", "HIIT").
    tags: [{
        type: String,
    }],
}, {
    // Specifies the collection name in MongoDB.
    collection: "ExerciseLibrary",
    // Adds `createdAt` and `updatedAt` timestamps automatically.
    timestamps: true,
});

// Export the Mongoose model for use in other parts of your application.
export const ExerciseLibrary = mongoose.model("ExerciseLibrary", ExerciseLibrarySchema);


const UserDayRoutineSchema = new mongoose.Schema({
    day: { type: String, required: true }, // e.g., "Monday", "Tuesday"
    focus: { type: String, required: true }, // e.g., "Upper Body", "Legs", "Cardio"
    timeEstimate: { type: Number, required: true }, // Estimated duration in minutes

    // Reference to the cached Warmup segment in the IndividualWorkouts collection
    warmupRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IndividualWorkout', // References the IndividualWorkout model
        required: false // A day might not have a warmup
    },
    // Reference to the cached Main Workout segment in the IndividualWorkouts collection
    workoutRoutineRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IndividualWorkout', // References the IndividualWorkout model
        required: false // A day might not have a main workout
    },
    // You could also cache cooldowns as IndividualWorkouts, or keep as simple text:
    cooldownRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IndividualWorkout',
        required: false
    },
    // Or just store the cooldown text directly if it's not complex enough to cache
    cooldownText: { type: String, required: false }

}, { _id: false }); 

const UserRoutineSchema = new mongoose.Schema({
    // The ID of the user this routine belongs to
    UserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserInfo", // Assuming you have a UserInfo or User model
        required: true,
        unique: true, // Each user has only one active routine
    },
    // An array of UserDayRoutineSchema, defining the weekly plan
    routine: [UserDayRoutineSchema],

    // Timestamp when this routine was generated/last updated
    generatedAt: {
        type: Date,
        default: Date.now,
    },
    // When this user's routine should expire (e.g., 7 days after generation)
    expiresAt: {
        type: Date,
        required: true,
    },
}, {
    collection: "UserRoutines", // Explicit collection name
    timestamps: true // Adds `createdAt` and `updatedAt` for the routine document itself
});

export const UserRoutine = mongoose.model("UserRoutine", UserRoutineSchema);