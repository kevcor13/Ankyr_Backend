import { User, GameSystem, FitnessInfo} from "../models/userInfo.models.js";
import { UserRoutine } from "../models/workout.model.js";
import { Notification } from "../models/post.models.js";
import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

dotenv.config();

//creates the workout
export const createWorkout = async (req, res) => {
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
}

export const createGameSystem = async (req, res) => {
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
}

export const createFitnessInfo = async(req,res)=>{
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
}

export const getUserData = async(req,res) =>{
    const {token} = req.body;
    try{
        const user = jwt.verify(token, process.env.JWT_SECRET);
        const userEmail = user.email;

        User.findOne({email: userEmail})
            .then(data=>{
                return res.send({status:"success", data:data})
        })
    }catch (error){
        res.send({status:"error", data: error})
    }
}

export const getGameData = async(req,res) =>{
    const {token, UserID} = req.body;
    const user = jwt.verify(token, process.env.JWT_SECRET);
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
}

export const getWorkoutData =  async (req, res) => {
    const { token, UserID } = req.body;

    if (!token) {
        return res.status(401).json({ status: "error", data: "Authentication token is missing." });
    }

    let user;
    try {
        user = jwt.verify(token, process.env.JWT_SECRET);
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
};

export const getFollowers = async (req, res) => {
    try {
        const { userId } = req.body;

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
};

export const getFollowing = async (req, res) => {
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
};

export const updateProfileImage =  async (req, res) => {
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
};

export const getNotifications = async (req, res) => {
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
};

export const deleteNotifications =  async (req, res) => {
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
};