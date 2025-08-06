import express from 'express';
import { checkCodeMatch, register, login} from '../controllers/auth.controllers.js';


const router = express.Router();

router.post('/checkCodeMatch', checkCodeMatch);
router.post('/register', register);
router.post('/login', login);

export default router;