import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import OpenAI from "openai";
import bodyParser from "body-parser";
import cors from "cors";
import { User, FitnessInfo, GameSystem, WorkoutRoutine, WorkoutSchema, Photo, Post} from "./UserDetails.js"; // Import models


const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({apiKey: "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"});

const mongoUrl = "mongodb+srv://ankyrservices:ankyr.services@ankyr.3zroc.mongodb.net/?retryWrites=true&w=majority&appName=ANKYR"

const JET_SECRET = "abcdefg123456"
mongoose
    .connect(mongoUrl)
    .then(()=>{
    console.log("MongoDB Connected!")
    })
    .catch((e)=>{
        console.log(e);
    })

app.get("/", (req, res) => {
    res.send({status:"started"})
})


app.post("/save-workout", async (req, res) => {
    const {rawResponse} = req.body;
    console.log(rawResponse);
    try {
        await WorkoutSchema.create({
            randomData: rawResponse,
        })
        res.json({ message: "Workout saved successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//create the workout
app.post ("/workoutInfo", async (req, res) => {
    const{UserID, routine} = req.body;

    const user = await User.findById(UserID);
    if(!user){
        return res.send({status:"error", data: "User not found"})
    }
    try{
        await WorkoutRoutine.create({
            UserID: UserID,
            routine: routine,
        });
        res.send({status:"success", data:"user created"})
    } catch (error){
        res.send({status:"error", data: error})
    }
})

// create the game system
app.post("/gameSystem", async (req, res) => {
    const {UserID, streak, points} = req.body;
    const user = await User.findById(UserID);
    if(!user){
        return res.send({status:"error", data: "User not found"})
    }
    try{
        await GameSystem.create({
            UserID: UserID,
            streak: streak,
            points: points,
        })
        res.send({status:"success", data:"user created"})
    } catch (error){
        res.send({status:"error", data: error})
    }
})

//create the fitness file
app.post("/fitnessInfo", async(req,res)=>{
    const {UserID, gender, weight, fitness, workoutDays, goal} = req.body;
    const user = await User.findById(UserID)
    if (!user) {
        return res.send({ status: "error", data: "User not found" });
    }
    try{
        await FitnessInfo.create({
            UserID: UserID,
            gender: gender,
            weight: weight,
            fitnessLevel: fitness,
            workoutDays: workoutDays,
            fitnessGoal: goal,
        })
        res.send({status:"success", data:"user created"})
    } catch (error){
        res.send({status:"error", data: error})
    }
})

//Register the account
app.post('/register', async(req,res) =>{
    const {username,email, password, profile} =req.body;
    console.log(username,email,password, profile);
    const oldUser = await User.findOne({email: email});
    if(oldUser){
        return res.send({data: "User already exists"});
    }
    const encryptedPassword = await bcrypt.hash(password, 12);
    try {
        await User.create({
            username,
            email: email,
            password: encryptedPassword,
            profileImage: profile
        })
        const token = jwt.sign({email: email}, JET_SECRET)
        res.send({status: "success", data: token})
    } catch (error){
        res.send({status:"error", data: error})
    }
})

//upload image into DB
app.post('/upload', async (req, res) => {
    const { image, UserID } = req.body;
    
    if (!image) {
        return res.status(400).json({ status: "error", data: "No image provided" });
    }
    
    if (!UserID) {
        return res.status(400).json({ status: "error", data: "No UserID provided" });
    }

    try {
        // Verify the user exists
        const user = await User.findById(UserID);
        if (!user) {
            return res.status(404).json({ status: "error", data: "User not found" });
        }

        // Create a unique URL for the image
        const url = `data:image/jpeg;base64,${image}`;
        
        const savedPhoto = await Photo.create({ 
            UserID: UserID,
            image: image,
            url: url
        });
        
        res.status(200).json({ 
            status: "success", 
            data: {
                url: savedPhoto.url
            }
        });
    } catch (error) {
        console.error('Error saving image:', error);
        res.status(500).json({ status: "error", data: error.message });
    }
});

//get user images
app.post('/UserImages', async(req,res) =>{
    const {token, UserID} = req.body;
    const user = jwt.verify(token, JET_SECRET);
    const userEmail = user.email;
    if(!userEmail){
        return res.send({status:"error", data: "User not found"})
    }
    try{
        Photo.find({UserID: UserID})
            .sort({ createdAt: -1 })
            .then(data=>{
                return res.send({status:"success", data:data})
            })
    }catch (error){
        res.send({status:"error", data: error})
    }
});

// fetch users posts
app.post('/getUserPosts', async(req, res) => {
    const {token, UserId} = req.body;
    const user = jwt.verify(token, JET_SECRET);
    const userEmail = user.email;
    if(!userEmail){
        return res.send({status:"error", data: "User not found"})
    }
    try{
        const posts = await Post.find({ UserId }).sort({ createdAt: -1 });
        console.log(posts)

        return res.json({ status: 'success', data: posts });
    } catch (error) {
        console.error("Error fetching user posts:", error);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// login user
app.post("/login", async(req,res) =>{
    const {email, password} = req.body;
    const oldUser = await User.findOne({email: email});
    if(!oldUser){
        return res.send({status:"error", data:"User not found"})
    }
    if(await bcrypt.compare(password, oldUser.password)){
        const token = jwt.sign({email:oldUser.email}, JET_SECRET);

        if(res.status(201)){
            return res.send({status:"success", data:token})
        } else {
            return res.send({status:"error"})
        }
    }
})

//get the user Data
app.post("/userdata", async(req,res) =>{
    const {token} = req.body;
    try{
        const user = jwt.verify(token, JET_SECRET);
        const userEmail = user.email;

        User.findOne({email: userEmail})
            .then(data=>{
                return res.send({status:"success", data:data})
        })
    }catch (error){
        res.send({status:"error", data: error})
    }
})

//get the user Game Data
app.post("/gamedata", async(req,res) =>{
    const {token, UserID} = req.body;
    const user = jwt.verify(token, JET_SECRET);
    const userEmail = user.email;
    if(!userEmail){
        return res.send({status:"error", data: "User not found"})
    }
    try{
        GameSystem.findOne({UserID: UserID}).then(data=>{
            return res.send({status:"success", data:data})
        })
    }catch (error){
        res.send({status:"error", data: error})
    }
})

//get the workout DATA
app.post("/workout", async(req,res) =>{
    const {token, UserID} = req.body;
    const user = jwt.verify(token, JET_SECRET);
    const userEmail = user.email;
    if(!userEmail){
        return res.send({status:"error", data: "User not found"})
    }
    try{
        WorkoutRoutine.findOne({UserID: UserID}).then(data=>{
            return res.send({status:"success", data:data})
        })
    }catch (error){
        res.send({status:"error", data: error})
    }
})

// Function to generate and save a workout plan
app.post("/aI", async (req, res) => {
    const { UserID, message } = req.body; // Ensure UserID is passed in the request body

    try {
        console.log("Generating weekly workouts for UserID:", UserID);

        // Send request to ChatGPT
        const chatGPTResponse = await openai.chat.completions.create({
            model: "gpt-4o-2024-08-06",
            messages: [
                { role: "system", content: "You are a helpful fitness trainer. Provide a structured workout plan for a full week." },
                { role: "user", content: message }
            ],
            store: true,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "weekly_workout_response",
                    schema: {
                        type: "object",
                        properties: {
                            routine: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        day: { type: "string" }, // Day of the week
                                        warmup: {
                                            type: "array",
                                            items: { type: "string" }
                                        },
                                        workoutRoutine: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    exercise: { type: "string" },
                                                    sets: { type: "number" },
                                                    reps: { type: "string" }
                                                },
                                                required: ["exercise", "sets", "reps"],
                                                additionalProperties: false
                                            }
                                        }
                                    },
                                    required: ["day", "warmup", "workoutRoutine"],
                                    additionalProperties: false
                                }
                            }
                        },
                        required: ["routine"],
                        additionalProperties: false
                    },
                    strict: true
                }
            }
        });

        // Parse and validate the response content
        const workoutPlan = JSON.parse(chatGPTResponse.choices[0].message.content);
        console.log("Generated weekly workout plan:", workoutPlan);

        // Save to database
        const savedWorkout = await WorkoutRoutine.create({ UserID, routine: workoutPlan.routine });
        console.log("Weekly workout plan saved to database:", savedWorkout);

        // Respond with success
        res.json({ message: "Weekly workout plan generated and saved successfully!", workout: savedWorkout });
    } catch (error) {
        console.error("Error generating or saving weekly workout plan:", error);
        res.status(500).json({ error: error.message });
    }
});

//create a post
app.post("/createPost", async (req, res) => {
    const { UserId, username, content, imageUrl } = req.body;
    console.log(UserId, username, content, imageUrl);
    try {
        const newPost = new Post({
            UserId,
            username,
            content,
            imageUrl,
            // Make sure your Post model has `likes` and `createdAt` fields:
            // likes: { type: Number, default: 0 },
            // createdAt: { type: Date, default: Date.now },
        });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Follow a user
app.post('/follow', async (req, res) => {
    const { userId, targetId } = req.body; // userId = current user, targetId = user to follow

    try {
        // Add targetId to current user's following array
        await User.findByIdAndUpdate(userId, { $addToSet: { following: targetId }});
        // Add current user's id to target user's followers array
        await User.findByIdAndUpdate(targetId, { $addToSet: { followers: userId }});
        res.json({ status: "success", data: "Followed successfully" });
    } catch (error) {
        res.status(500).json({ status: "error", data: error.message });
    }
});

// Unfollow a user
app.post('/unfollow', async (req, res) => {
    const { userId, targetId } = req.body;

    try {
        await User.findByIdAndUpdate(userId, { $pull: { following: targetId }});
        await User.findByIdAndUpdate(targetId, { $pull: { followers: userId }});
        res.json({ status: "success", data: "Unfollowed successfully" });
    } catch (error) {
        res.status(500).json({ status: "error", data: error.message });
    }
});

// Search for users
app.post("/searchUsers", async (req, res) => {
    const { token, query } = req.body;

    try {
        // Verify token
        const user = jwt.verify(token, JET_SECRET);
        const userEmail = user.email;

        if (!userEmail) {
            return res.status(401).json({ status: "error", data: "Unauthorized" });
        }

        // Search for users by username (case insensitive)
        const searchResults = await User.find({
            username: { $regex: query, $options: 'i' }
        }).select('username profileImage followers');

        res.json({ status: "success", data: searchResults });
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ status: "error", data: error.message });
    }
});

// Get user by ID
app.post("/getUserById", async (req, res) => {
    const { token, userId } = req.body;

    try {
        // Verify token
        const user = jwt.verify(token, JET_SECRET);
        const userEmail = user.email;

        if (!userEmail) {
            return res.status(401).json({ status: "error", data: "Unauthorized" });
        }

        // Get user by ID
        const targetUser = await User.findById(userId).select('username profileImage followers following');

        if (!targetUser) {
            return res.status(404).json({ status: "error", data: "User not found" });
        }

        res.json({ status: "success", data: targetUser });
    } catch (error) {
        console.error("Error getting user by ID:", error);
        res.status(500).json({ status: "error", data: error.message });
    }
});

app.listen(5001, () =>{
    console.log("node js server started");
})
