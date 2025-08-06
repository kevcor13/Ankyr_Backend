import express from 'express';
import { AI } from '../controllers/ai.controllers.js';

const router = express.Router();

router.post('/ai', AI);

export default router;