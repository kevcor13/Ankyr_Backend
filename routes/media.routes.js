import express from 'express';
import { follow } from '../controllers/media.controllers.js';

const router = express.Router();

router.post('/follow', follow);

export default router;
