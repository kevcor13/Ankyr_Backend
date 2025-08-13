import express from 'express';
import { updateTheme , updatePointsAndStreak, logWorkout, recordWorkoutCompletion, getLoggedWorkouts, updateBadge} from '../controllers/update.controllers.js';

const router = express.Router();

router.post('/updateTheme', updateTheme);
router.post('/updatePointsAndStreak', updatePointsAndStreak);
router.post('/logWorkout', logWorkout);
router.post('/recordWorkoutCompletion', recordWorkoutCompletion);
router.post('/getLoggedWorkouts', getLoggedWorkouts);
router.post('/updateBadge', updateBadge);

export default router;