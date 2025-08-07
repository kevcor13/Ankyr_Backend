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

export const getWorkoutData = async (req, res) => {
    // The 'token' should ideally come from an Authorization header, not the body.
    // Example: const token = req.headers.authorization?.split(' ')[1];
    const { token, UserID } = req.body;

    console.log("recieved items",token, UserID);
    if (!token) {
        return res.status(401).json({ status: "error", message: "Authentication token is missing." });
    }
    // --- 2. Fetch the user's routine ---
    try {
        const userObjectId = new mongoose.Types.ObjectId(UserID);

        // Fetch the entire routine for the user.
        const userRoutine = await UserRoutine.findOne({ UserID: userObjectId }).lean();

        if (!userRoutine || !userRoutine.routine || userRoutine.routine.length === 0) {
            return res.status(404).json({ status: "error", message: "No workout routine found for this user." });
        }

        // --- 3. Determine the current day and filter the routine ---

        const todaysDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        // Find the specific workout scheduled for today, case-insensitively.
        const todaysWorkout = userRoutine.routine.find(
            daySchedule => daySchedule.day.toLowerCase() === todaysDayName.toLowerCase()
        );

        if (!todaysWorkout) {
            return res.status(404).json({
                status: "success", // Success in fetching, but no workout today.
                message: `No workout scheduled for today (${todaysDayName}). Time to rest! 💪`,
                data: null
            });
        }

        // --- 4. Return just the workout for today ---
        return res.json({
            status: "success",
            message: `Found workout for ${todaysDayName}!`,
            data: todaysWorkout
        });
    } catch (error) {
        // This will catch errors from both mongoose.Types.ObjectId and UserRoutine.findOne
        console.error("Error fetching user routine:", error);
        res.status(500).json({ status: "error", message: "An error occurred while fetching the workout routine." });
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