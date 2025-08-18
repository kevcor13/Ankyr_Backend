import express from 'express';
import { createFitnessInfo, createGameSystem, createWorkout, 
         deleteNotifications, getFollowers, getFollowing, getGameData, 
         getLeagueMembers, 
         getNotifications, getUserData, getWorkoutData, updateProfileImage 
        } from '../controllers/userInfo.controllers.js';
import upload from "../middlewares/upload.js";

const router = express.Router();

router.post('/createWorkout', createWorkout);
router.post('/createGameSystem', createGameSystem );
router.post('/createFitness', createFitnessInfo);
router.post('/getUserData', getUserData);
router.post('/getGameData', getGameData);
router.post('/getWorkoutData', getWorkoutData);
router.post('/getFollowers', getFollowers);
router.post('/getFollowing', getFollowing);
router.post("/updateProfile", upload.single("image"), updateProfileImage);
router.post('/getNotifications', getNotifications);
router.post('/deleteNotifications', deleteNotifications);
router.post('/getLeagueMembers', getLeagueMembers);



export default router;