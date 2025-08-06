import express from 'express';
import { createFitnessInfo, createGameSystem, createWorkout, 
         deleteNotifications, getFollowers, getFollowing, getGameData, 
         getNotifications, getUserData, getWorkoutData, updateProfileImage 
        } from '../controllers/userInfo.controllers.js';

const router = express.Router();

router.post('/createWorkout', createWorkout);
router.post('/createGameSystem', createGameSystem );
router.post('/createFitness', createFitnessInfo);
router.post('/getUserData', getUserData);
router.post('/getGameData', getGameData);
router.post('/getWorkoutData', getWorkoutData);
router.post('/getFollowers', getFollowers);
router.post('/getFollowing', getFollowing);
router.post('/updateProfile', updateProfileImage);
router.post('/getNotifications', getNotifications);
router.post('/deleteNotifications', deleteNotifications);



export default router;