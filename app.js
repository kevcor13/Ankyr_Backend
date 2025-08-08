import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import OpenAI from "openai"; // No longer needed for Gemini API
import bodyParser from "body-parser";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"; // Correct import for Gemini
import cors from "cors";
import { FitnessInfo, GameSystem, User, Codes} from "./models/userInfo.models.js";
import {Post, Notification, Photo} from "./models/post.models.js";
//import {Settings} from "./UserDetails.js"; // Import models
import { ExerciseLibrary, UserRoutine} from "./models/workout.model.js";

import authRoutes from "./routes/auth.routes.js";
import userData from "./routes/userInfo.routes.js";
import ai from "./routes/ai.routes.js";
import update from "./routes/update.routes.js";


const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

//const openai = new OpenAI({apiKey: "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"});

const mongoUrl = "mongodb+srv://ankyrservices:ankyr@ankyr.3zroc.mongodb.net/?retryWrites=true&w=majority&appName=ANKYR"

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
//test 

app.post("/test/add-exercise", async (req, res) => {
    try {
        const { name, description, videoUrl, category, equipment, difficulty, recommendedSets, recommendedReps, isWarmupExercise, isCooldownExercise, tags, isMainWorkoutExercise} = req.body;
        console.log("Adding exercise:", name, description, videoUrl, category, equipment, difficulty, recommendedSets, recommendedReps, isWarmupExercise, isCooldownExercise, tags, isMainWorkoutExercise);
        // Basic validation (you'd want more robust validation in a real app)
        if (!name || !description || !videoUrl || !category || !equipment || !difficulty) {
            return res.status(400).json({ status: "error", message: "Missing required fields." });
        }

        const newExerciseData = {
            name,
            description,
            videoUrl,
            category,
            equipment,
            difficulty,
            recommendedSets: recommendedSets || null,
            recommendedReps: recommendedReps || null,
            isWarmupExercise: isWarmupExercise || false,
            isCooldownExercise: isCooldownExercise || false,
            isMainWorkoutExercise,
            tags: tags || []
        };

        // Check if an exercise with this name already exists
        const existingExercise = await ExerciseLibrary.findOne({ name: newExerciseData.name });

        if (existingExercise) {
            // Option 1: Update the existing exercise
            await ExerciseLibrary.updateOne({ name: newExerciseData.name }, newExerciseData);
            console.log(`Updated existing exercise: ${newExerciseData.name}`);
            return res.status(200).json({
                status: "success",
                message: `Exercise "${newExerciseData.name}" updated successfully.`,
                exercise: newExerciseData
            });
            // Option 2: Return an error if you don't want to allow updates via this endpoint
            // return res.status(409).json({ status: "error", message: `Exercise "${name}" already exists.` });
        } else {
            // Create a new exercise entry
            const createdExercise = await ExerciseLibrary.create(newExerciseData);
            console.log(`Added new exercise: ${createdExercise.name} (ID: ${createdExercise._id})`);
            return res.status(201).json({
                status: "success",
                message: `Exercise "${createdExercise.name}" added successfully.`,
                exercise: createdExercise
            });
        }

    } catch (error) {
        console.error("Error adding exercise:", error);
        res.status(500).json({ status: "error", message: "Failed to add exercise.", error: error.message });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userData);
app.use('/api/GenAI', ai);
app.use('/api/update', update);

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

//DONE
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

//DONE
app.post("/gameSystem", async (req, res) => {
    const {UserID, streak, points, league} = req.body;
    console.log(UserID, streak, points, league);
    const user = await User.findById(UserID);
    if(!user){
        return res.send({status:"error", data: "User not found"})
    }
    try{
        await GameSystem.create({
            UserID: UserID,
            streak: streak,
            points: points,
            league: league,
        })
        res.send({status:"success", data:"user created"})
    } catch (error){
        res.send({status:"error", data: error})
    }
})

//DONE
app.post("/fitnessInfo", async(req,res)=>{
    const {UserID, gender, age, weight, fitnessLevel, workoutDays, fitnessGoal} = req.body;
    const user = await User.findById(UserID)
    if (!user) {
        return res.send({ status: "error", data: "User not found" });
    }
    try{
        console.log(gender, weight, fitnessLevel, workoutDays, fitnessGoal);
        
        await FitnessInfo.create({
            UserID: UserID,
            gender: gender,
            age: age,
            weight: weight,
            fitnessLevel: fitnessLevel,
            workoutDays: workoutDays,
            fitnessGoal: fitnessGoal,
        })
        res.send({status:"success", data:"user created"})
    } catch (error){
        res.send({status:"error", data: error})
    }
})
//create user settings 
app.post("/userSettings", async (req, res) => {
    const {UserID} = req.body;
    console.log(UserID);
    const user = await User.findById(UserID)
    if (!user) {
        return res.send({ status: "error", data: "User not found" });
    }
    try {
        await Settings.create({
            UserID,
            notifications: true,
            quotes: true,
            challenges: true,
            follows: true,
            interactions: true,
            snaps: true,
        })
        res.send({status: "success", data:"settings created"})
    } catch (error){
        res.send({status:"error", data: error})
    }
})


// DONE
app.post('/register', async(req,res) =>{
    const {username,email, password, profile, name} =req.body;
    console.log(username,email,password, profile);
    const oldUser = await User.findOne({email: email});
    if(oldUser){
        return res.send({data: "User already exists"});
    }
    const encryptedPassword = await bcrypt.hash(password, 12);
    try {
        await User.create({
            name,
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

// DONE
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

//DONE
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

//DONE
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

//DONE
app.post("/workout", async (req, res) => {
    const { token, UserID } = req.body;

    if (!token) {
        return res.status(401).json({ status: "error", data: "Authentication token is missing." });
    }

    let user;
    try {
        user = jwt.verify(token, JET_SECRET); // Verify the JWT to get the UserID
    } catch (error) {
        console.error("JWT verification failed:", error);
        return res.status(403).json({ status: "error", data: "Invalid or expired token." });
    }

    const userIDFromToken = user.id; // Assuming 'id' is where UserID is stored in your JWT payload
    let userObjectId;
    try {
        userObjectId = new mongoose.Types.ObjectId(UserID);
    } catch (error) {
        console.error("Invalid UserID format from token:", userIDFromToken, error);
        return res.status(400).json({ status: "error", data: "Invalid User ID format." });
    }

    try {
        console.log("Fetching user routine for UserID:", userObjectId);

        // Find the user's routine in UserRoutine collection and populate its references
        const userRoutine = await UserRoutine.findOne({ UserID: userObjectId })
            .populate([
                { path: 'routine.warmupRef', model: 'IndividualWorkout' },       // Populate warmup segments
                { path: 'routine.workoutRoutineRef', model: 'IndividualWorkout' }, // Populate main workout segments
                // { path: 'routine.cooldownRef', model: 'IndividualWorkout' } // If cooldowns are cached separately
            ])
            .lean(); // Use .lean() for faster reads and easier manipulation

        if (!userRoutine) {
            console.log("No workout routine found for UserID:", userObjectId);
            return res.status(404).json({ status: "error", data: "No workout routine found for this user." });
        }

        // Reconstruct the routine to send to the client
        // The 'content' of the populated IndividualWorkout now directly includes 'videoUrl'
        const populatedRoutineForClient = userRoutine.routine.map(day => {
            return {
                day: day.day,
                focus: day.focus,
                timeEstimate: day.timeEstimate,
                // If warmupRef exists, use its content; otherwise, an empty array
                warmup: day.warmupRef ? day.warmupRef.content : [],
                // If workoutRoutineRef exists, use its content; otherwise, an empty array
                workoutRoutine: day.workoutRoutineRef ? day.workoutRoutineRef.content : [],
                cooldown: day.cooldownText, // Cooldown text is directly stored
            };
        });

        console.log("Successfully fetched and populated user routine with video URLs for UserID:", userObjectId);
        // Send the full routine, but replace the references array with the fully populated one
        return res.json({
            status: "success",
            data: {
                ...userRoutine, // Send other userRoutine properties (generatedAt, expiresAt, etc.)
                routine: populatedRoutineForClient // Send the transformed routine with full exercise details
            }
        });

    } catch (error) {
        console.error("Error fetching user routine:", error);
        res.status(500).json({ status: "error", data: "An error occurred while fetching the workout routine." });
    }
});

// DONE
app.post("/aI", async (req, res) => {
    const { UserID, Gmessage } = req.body;

    try {
        if (!UserID || !Gmessage) {
            console.error("Error: UserID or Gmessage is missing from request body.");
            return res.status(400).json({ error: "UserID and workout generation message are required." });
        }

        const userObjectId = new mongoose.Types.ObjectId(UserID);
        const currentTime = new Date();

        // --- 1. Parse Gmessage to filter relevant exercises from your ExerciseLibrary ---
        // This is a simplified example. In a production app, you'd use more sophisticated
        // NLP or keyword extraction to determine user preferences (equipment, difficulty, focus).
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
        // Add more parsing logic for other fields like 'category' or 'time'
        // Example: if (lowerGmessage.includes("chest") || lowerGmessage.includes("upper body")) { exerciseQuery.category = "Chest"; }

        // Fetch relevant exercises from your ExerciseLibrary.
        // Limiting to 200 exercises to keep the AI prompt size manageable.
        // .lean() converts Mongoose documents to plain JavaScript objects for performance.
        const availableExercises = await ExerciseLibrary.find(exerciseQuery).limit(200).lean();

        if (availableExercises.length === 0) {
            console.warn("No exercises found matching criteria for Gmessage:", Gmessage);
            return res.status(400).json({ error: "Could not find any suitable exercises from the library based on your request. Please try a different message or add more exercises to the library." });
        }

        // --- 2. Format available exercises for the AI prompt (only data AI needs) ---
        // Do NOT include videoUrl here; AI doesn't need it and it saves tokens.
        const exercisesForAI = availableExercises.map(ex => ({
            name: ex.name,
            category: ex.category,
            equipment: ex.equipment,
            difficulty: ex.difficulty,
            recommendedSets: ex.recommendedSets,
            recommendedReps: ex.recommendedReps,
            // description: ex.description // Can include description if AI needs more context, but watch token limits
        }));

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const safetySettings = [
            { category: HarmCategory.HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE, },
            { category: HarmCategory.HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE, },
            { category: HarmCategory.SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE, },
            { category: HarmCategory.DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE, },
        ];

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
            //safetySettings: safetySettings,
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
        cacheExpirationDate.setDate(currentTime.getDate() + 30); // Individual workout segments cached for a month

        // --- 4. Process each day's routine, validate exercises, add video URLs, and cache segments ---
        for (const day of generatedRoutine) {
            const dayRoutine = {
                day: day.day,
                focus: day.focus,
                timeEstimate: day.timeEstimate,
                warmupRef: null,
                workoutRoutineRef: null,
                cooldownRef: null, // If cooldowns also become cached segments
                cooldownText: day.cooldown || "" // Simple text cooldown
            };

            // Helper function to process either warmup or main_workout segments
            const processWorkoutSegment = async (segment, type) => {
                if (!segment || !Array.isArray(segment) || segment.length === 0) return null;

                const exercisesWithDetails = [];
                for (const item of segment) {
                    // Find the exercise in the full availableExercises list (which has videoUrl and other details)
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
            // If you decide to cache cooldowns as IndividualWorkouts, process similarly:
            // dayRoutine.cooldownRef = await processWorkoutSegment(day.cooldown, 'cooldown');

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
});


//create a post
app.post("/createPost", async (req, res) => {
    const { UserId, username, content, imageUrl, userProfileImageUrl} = req.body;
    console.log(UserId, username, content, imageUrl);
    try {
        const newPost = new Post({
            UserId,
            username,
            content,
            imageUrl,
            userProfileImageUrl
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
        // Add follow request to current user's following array
        await User.findByIdAndUpdate(userId, {
            $addToSet: { following: { user: targetId} }
        });

        // Add follow request to target user's followers array
        await User.findByIdAndUpdate(targetId, {
            $addToSet: { followers: { user: userId} }
        });

        res.json({ status: "success", data: "Follow request sent", request: null });
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

//following response
app.post('/response', async (req, res) => {
    const { userId, targetId, accept } = req.body;
    // userId = the private-profile owner (approver)
    // targetId = the one who sent the follow request

    try {
        // Update the "request" flag in the *following* array of the target user (they follow you)
        // and in the *followers* array of the approver.
        await Promise.all([
            User.updateOne(
                { _id: targetId },
                { $set: { "following.$[f].request": accept } },
                { arrayFilters: [{ "f.user": userId }] }
            ),
            User.updateOne(
                { _id: userId },
                { $set: { "followers.$[f].request": accept } },
                { arrayFilters: [{ "f.user": targetId }] }
            )
        ]);

        return res.json({
            status: "success",
            data: accept ? "Follow accepted" : "Follow rejected",
            request: accept
        });
    } catch (error) {
        console.error("Response error:", error);
        return res.status(500).json({ status: "error", data: error.message });
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

//DONE
app.post('/getFollowers', async (req, res) => {
    try {
        const { userId } = req.body;

        // 1. Find the user and only grab the `following` array,
        //    while populating each entry's `user` ref:
        const user = await User
            .findById(userId)
            .select('followers')
            .populate('followers.user', 'username email profileImage');

        if (!user) {
            return res.json({ status: 'error', message: 'User not found' });
        }

        // 2. Map each "following" entry down to the fields you care about:
        const followerList = user.followers.map(f => ({
            userId:        f.user._id,
            username:      f.user.username,
            email:         f.user.email,
            profileImage:  f.user.profileImage,
            requestStatus: f.request      // true / false / null
        }));

        // 3. Return that structured array
        return res.json({
            status: 'success',
            data: followerList
        });

    } catch (error) {
        console.error('Error fetching following users:', error);
        return res.json({
            status: 'error',
            message: 'Failed to fetch following users',
            error: error.message
        });
    }
});

//DONE
app.post('/getFollowing', async (req, res) => {
    try {
        const { userId } = req.body;

        // 1. Find the user and only grab the `following` array,
        //    while populating each entry's `user` ref:
        const user = await User
            .findById(userId)
            .select('following')
            .populate('following.user', 'username email profileImage');

        if (!user) {
            return res.json({ status: 'error', message: 'User not found' });
        }

        // 2. Map each "following" entry down to the fields you care about:
        const followingList = user.following.map(f => ({
            userId:        f.user._id,
            username:      f.user.username,
            email:         f.user.email,
            profileImage:  f.user.profileImage,
            requestStatus: f.request      // true / false / null
        }));

        // 3. Return that structured array
        return res.json({
            status: 'success',
            data: followingList
        });

    } catch (error) {
        console.error('Error fetching following users:', error);
        return res.json({
            status: 'error',
            message: 'Failed to fetch following users',
            error: error.message
        });
    }
});

//like the post
app.post('/like', async (req, res) => {
    const { postId, postOwner, likedUser } = req.body;
    try {
        // add to post.likes
        await Post.findByIdAndUpdate(postId, {
            $addToSet: { likes: likedUser }
        });
        // push notification into post-owner’s notifications
        await User.findByIdAndUpdate(postOwner, {
            $push: {
                notifications: {
                    type: 'like',
                    from: likedUser,
                    post: postId,
                    message: 'Someone liked your post'
                }
            }
        });
        res.json({ status: 'success' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

//DONE
app.post('/updateProfileImage', async (req, res) => {
    const { userId, profileImage } = req.body;

    try {
        if (!userId || !profileImage) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID and profile image are required'
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profileImage: profileImage },
        );
        if (!updatedUser) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        res.json({
            status: 'success',
            data: {
                profileImage: profileImage
            }
        });
    } catch (error) {
        console.error('Error updating profile image:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update profile image'
        });
    }
})

// Unlike a post
app.post('/unlike', async (req, res) => {
    const { postId, likedUser } = req.body;
    try {
        await Post.findByIdAndUpdate(postId, {
            $pull: { likes: likedUser }
        });
        res.json({ status: 'success' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

//check if the user has liked the images.
app.post('/hasLiked', async (req, res) => {
    const {postId, likedUser} = req.body;

    try {
        // Check if there's a post with this ID that already has userId in its likes array
        const exists = await Post.exists({ _id: postId, likes: likedUser });
        return res.json({ status: 'success', liked: Boolean(exists) });
    } catch (err) {
        console.error('Error checking like status:', err);
        return res.status(500).json({ status: 'error', message: err.message });
    }
})

//function to create all the post notifications
app.post('/createNotification', async (req, res) => {
    const { type, from, owner, imageUrl, userProfileImageUrl,username,message} = req.body;
    console.log(username);

    try {
        const notification = new Notification({
            type,     // 'like' or 'follow'
            from,     // ObjectId of the user who triggered it
            owner,     // (optional) ObjectId of the post involved
            imageUrl,
            userProfileImageUrl,
            username,
            message,
            // createdAt & read default automatically
        });

        await notification.save();

        // 4) Return the saved doc
        return res.json({ status: 'success', data: notification });
    } catch (err) {
        console.error('Error creating notification:', err);
        return res
            .status(500)
            .json({ status: 'error', message: err.message });
    }
});

//DONE
app.post('/deleteNotification', async (req, res) => {
    const { notificationId } = req.body;
    console.log(notificationId);
    if (!notificationId) {
        return res
            .status(400)
            .json({ status: 'error', message: 'notificationId is required' });
    }

    try {
        const deleted = await Notification.findByIdAndDelete(notificationId);

        if (!deleted) {
            return res
                .status(404)
                .json({ status: 'error', message: 'Notification not found' });
        }

        return res.json({ status: 'success', message: 'Notification deleted' });
    } catch (err) {
        console.error('Error deleting notification:', err);
        return res
            .status(500)
            .json({ status: 'error', message: err.message });
    }
});

//DONE
app.post('/getNotifications', async (req, res) => {
    const { userId } = req.body;
    try {
        const notifications = await Notification
            .find({ owner: userId })                  // ← or { to: userId } if you add a recipient field
            .sort({ createdAt: -1 })
            .then(data=>{
                return res.send({status:"success", data:data})
        })
    } catch (err) {
        console.error('Error fetching notifications:', err);
        return res
            .status(500)
            .json({ status: 'error', message: err.message });
    }
});



app.listen(5002, () =>{
    console.log("node js server started");
})

