const mongoose=require('mongoose');

const QuestionnaireSchema = new mongoose.Schema({
    userID: {
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
    collections: "FitnessInfo"
});

mongoose.model("Questionnaire", QuestionnaireSchema);