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
    askedThemeQuestions: { type: Boolean, default: false },
    defaultTheme :{type: Boolean, default: true},
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
    league: {
        type: String, 
    }
}, {
    collection: "GameSystem",
});


export const GameSystem = mongoose.model("GameSystem", GameSystemSchema);

// Workout Routine Schema and Model
const WorkoutRoutineSchema = new mongoose.Schema({
    // This will now be the unique key for the workout content itself
    // It's the hash of the Gmessage, allowing workouts to be shared across users.
    generationParams: {
        type: String,
        required: true,
        unique: true, // This makes the workout content unique, not tied to a single user initially
    },
    // Array to store all UserIDs that have been assigned this specific cached workout.
    // When a cache hit occurs, we'll add the new UserID to this array if not already present.
    UserID: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserInfo",
        required: true,
    }],
    routine: [
        {
            day: { type: String, required: true },
            focus: {type: String, require: true},
            timeEstimate: {type: Number, require: true},
            warmup: [
                {
                    exercise: { type: String, required: true },
                    sets: { type: Number, required: true },
                    reps: { type: String, required: true },
                },
            ],
            workoutRoutine: [
                {
                    exercise: { type: String, required: true },
                    sets: { type: Number, required: true },
                    reps: { type: String, required: true },
                    difficulty: {type: String}
                },
            ],
            cooldown: { type: String, required: true },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
},
{
    collection: "WorkoutRoutines",
    // The unique index is now ONLY on generationParams, as that defines the unique workout content.
    // No compound index with UserID anymore for the *cache itself*.
    indexes: [{ unique: true, fields: { generationParams: 1 } }]
});

// Ensure you export the model correctly
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
const fitnessInfo = new mongoose.Schema({
    UserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserInfo",
        required: true,
    },
    gender: {
        type: String,
        require:true
    },
    age: {
        type: Number,
        require:true
    },
    weight: {
        type: Number,
        require:true
    },
    fitnessLevel: {
        type: String,
        require:true
    },
    workoutDays: {
        type: Number,
        require:true
    },
    fitnessGoal: {
        type: String,
        require:true
    },
}, {
    collection: "FitnessInfo", // Corrected "collections" to "collection"
});

export const FitnessInfo = mongoose.model("FitnessInfo", fitnessInfo);

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

