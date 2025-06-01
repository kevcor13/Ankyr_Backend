import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import OpenAI from "openai";
import bodyParser from "body-parser";
import { GoogleGenAI } from "@google/genai";
import multer from 'multer';
import cors from "cors";
import { User, FitnessInfo, GameSystem, WorkoutRoutine, WorkoutSchema, Photo, Post, Notification, Settings, Codes} from "./UserDetails.js"; // Import models


const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

//const openai = new OpenAI({apiKey: "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"});

const mongoUrl = "mongodb+srv://ankyrservices:ankyrservice@ankyr.3zroc.mongodb.net/?retryWrites=true&w=majority&appName=ANKYR"

const JET_SECRET = "abcdefg123456"
mongoose
    .connect(mongoUrl)
    .then(()=>{
    console.log("MongoDB Connected!")
    })
    .catch((e)=>{
        console.log(e);
    })

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile-images/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.jpg';
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

app.get("/", (req, res) => {
    res.send({status:"started"})
})

app.post('/checkCodeMatch', async (req, res) => {
    try {
        const { documentId, code } = req.body;
        console.log('Checking code:', documentId, code);

        if (!documentId || code === undefined) {
            return res
                .status(400)
                .json({ status: 'error', message: 'Missing documentId or code' });
        }

        // Coerce to number
        const numCode = Number(code);
        if (Number.isNaN(numCode)) {
            return res
                .status(400)
                .json({ status: 'error', message: 'Code must be numeric' });
        }
        console.log("this is numCode " + numCode);

        // Find the document, selecting only the `codes` array
        const doc = await Codes.findById(documentId)
            .select('Codes')
            .lean();

        console.log(doc)
        if (!doc) {
            return res
                .status(404)
                .json({ status: 'error', message: 'Document not found' });
        }

        // Make sure doc.codes is an array
        const arr = Array.isArray(doc.Codes) ? doc.Codes : [];
        console.log(arr)
        // Check for membership
        const exists = arr.includes(numCode);

        return res.json({
            status: 'success',
            found: exists
        });

    } catch (error) {
        console.error('Error checking code match:', error);
        return res
            .status(500)
            .json({ status: 'error', message: error.message });
    }
});



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

//create the fitness file
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
//Register the account
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


app.post("/geminiTest", async (req, res) => {
    const { message } = req.body;
    try {
        const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: message,
    });
        console.log(response.text);
    } catch (error) {
        console.error("gemini test has failed", error);
        res.status(500).json({ error: error.message });
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


//get the following list
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

//delete notifications
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

//get all the notifications.
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

