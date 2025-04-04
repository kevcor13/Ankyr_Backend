import mongoose from "mongoose";

// User Schema and Model
const UserDetailSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String,
    questionnaire: { type: Boolean, default: false },
    profileImage: String,
    followers: [
        { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo" }
    ],
    following: [
        { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo" }
    ]
}, {
    collection: "UserInfo",
});

export const User = mongoose.model("UserInfo", UserDetailSchema);

// Game System Schema and Model
const GameSystemSchema = new mongoose.Schema({
    UserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserInfo",
        required: true,
    },
    streak: {
        type: Number,
    },
    points: {
        type: Number,
    },
}, {
    collection: "GameSystem",
});

export const GameSystem = mongoose.model("GameSystem", GameSystemSchema);

// Workout Routine Schema and Model
const WorkoutRoutineSchema = new mongoose.Schema({
        UserID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserInfo", // Reference to the UserInfo collection
            required: true,
        },
        routine: [
            {
                day: { type: String, required: true }, // Day of the week (e.g., Monday, Tuesday, etc.)
                warmup: [
                    { type: String, required: true }, // Array of warm-up exercises
                ],
                workoutRoutine: [
                    {
                        exercise: { type: String, required: true }, // Exercise name
                        sets: { type: Number, required: true }, // Number of sets
                        reps: { type: String, required: true }, // Repetitions or time duration
                    },
                ],
            },
        ],
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        collection: "WorkoutRoutines", // Specifies the collection name in MongoDB
    }
);

export const WorkoutRoutine = mongoose.model("WorkoutRoutine", WorkoutRoutineSchema);

const WorkoutRSchema = new mongoose.Schema({
    UserID: {
        type: mongoose.Schema.Types.ObjectId,
            ref: "UserInfo", // Reference to the UserInfo collection
            required: true,
    },
    routine: [
        {
            day: { type: String, required: true }, // Day of the week
            warmup: [
                { type: String, required: true }, // Array of warm-up exercises
            ],
            workoutRoutine: [
                {
                    exercise: { type: String, required: true }, // Exercise name
                    sets: { type: Number, required: true }, // Number of sets
                    reps: { type: String, required: true }, // Repetitions or time duration
                },
            ],
        },
    ],
        createdAt: {
    type: Date,
default: Date.now,
},
},
{
    collection: "WorkoutRoutines", // Optional: specifies the collection name in MongoDB
});

export const WorkoutSchema = mongoose.model("WorkoutSchema", WorkoutRSchema);


// Fitness Info (Questionnaire) Schema and Model
const QuestionnaireSchema = new mongoose.Schema({
    UserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserInfo",
        required: true,
    },
    gender: {
        type: String,
    },
    age: {
        type: Number,
    },
    weight: {
        type: Number,
    },
    fitnessLevel: {
        type: String,
    },
    workoutDays: {
        type: Number,
    },
    fitnessGoal: {
        type: String,
    },
}, {
    collection: "FitnessInfo", // Corrected "collections" to "collection"
});

export const FitnessInfo = mongoose.model("FitnessInfo", QuestionnaireSchema);

const photoSchema = new mongoose.Schema({
    UserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserInfo",
        required: true,
    },
    username: String,
    content: String,
    image: String,
    url: String,
    createdAt: { type: Date, default: Date.now }
}, {
    collection: "Photos"
});

export const Photo = mongoose.model("Photo", photoSchema);

const PostSchema = new mongoose.Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserInfo",
        required: true,
    },
    username: String,
    content: String,
    imageUrl: String,
    createdAt: { type: Date, default: Date.now },
},
    {collection: 'Post'
});
export const Post = mongoose.model("Post", PostSchema);