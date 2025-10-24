import mongoose from "mongoose";

const UserDetailSchema= new mongoose.Schema({
    name: {type: String, required: true},
    username: String,
    email: { type: String, unique: true },
    password: String,
    questionnaire: { type: Boolean, default: false },
    profileImage: String,
    askedThemeQuestion: {type: Boolean, default: false},
    defaultTheme:{type: Boolean, deafult: true},
    profileImage: String,
    friends: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo" },
          request: { type: Boolean, default: null },
        },
      ],
    savedMeals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: false }],
    lastWorkoutCompletionData: {type: Date, default: null} 
}, {
    collection: "UserInfo",
});
export const User = mongoose.model("UserInfo", UserDetailSchema);

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

