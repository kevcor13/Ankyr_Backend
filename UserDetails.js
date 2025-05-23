import mongoose from "mongoose";


const NotificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['like','follow','accept'],
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    username: {type: String, required: true},
    message: String,
    imageUrl: String,
    userProfileImageUrl: {type: String},
    createdAt: {
        type: Date,
        default: Date.now,
    },
    read: {
        type: Boolean,
        default: false,
    },
}, {
    collection: "Notifications", // Use a specific collection name (optional)
});

export const Notification = mongoose.model("Notification", NotificationSchema);


// User Schema and Model
const UserDetailSchema= new mongoose.Schema({
    name: {type: String, required: true},
    username: String,
    email: { type: String, unique: true },
    password: String,
    questionnaire: { type: Boolean, default: false },
    profileImage: String,
    // Each follower/following entry now includes a 'request' status
    followers: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo" },
            request: { type: Boolean, default: null },
        }
    ],
    following: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo" },
            request: { type: Boolean, default: null },
        }
    ]
}, {
    collection: "UserInfo",
});
export const User = mongoose.model("UserInfo", UserDetailSchema);

const UserSettingsSchema = new mongoose.Schema({
    UserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserInfo',
        required: true,
    },
    notifications: {
        type: Boolean,
    },
    quotes: {
        type: Boolean,
    },
    challenges: {
        type: Boolean,
    },
    follows: {
        type: Boolean,
    },
    interactions: {
        type: Boolean,
    },
    snaps: {
        type: Boolean,
    },
}, {
    collection: "Settings",
})
export const Settings = mongoose.model("Settings", UserSettingsSchema);

const CodesSchema = new mongoose.Schema({
    codes: [
        {
            type: Number,
        }
    ]
}, {
    collection: "Codes",
})
export const Codes = mongoose.model("Codes", CodesSchema)
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
                workGroup: { type: String, required: true }, // Muscle group targeted (e.g., Chest, Back, etc.)
                timeStamp: { type: Number, required: true}, // Timestamp for the workout routine
                warmup: [
                    { type: String, required: true }, // Array of warm-up exercises
                ],
                workoutRoutine: [
                    {
                        exercise: { type: String, required: true }, // Exercise name
                        sets: { type: Number, required: true }, // Number of sets
                        reps: { type: String, required: true }, // Repetitions or time duration
                        weight: { type: Number, required: true }, // Weight used for the exercise
                        XP: {type: Number, required: true}, // Experience points for the exercise

                    },
                ],
                totalXP: {type: Number, required: true}, // Total experience points for the workout
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
    userProfileImageUrl: String,
    createdAt: { type: Date, default: Date.now },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ]
},
    {collection: 'Post'
});
export const Post = mongoose.model("Post", PostSchema);

