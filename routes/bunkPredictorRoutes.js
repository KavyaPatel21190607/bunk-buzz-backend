import express from 'express';
import {
  predictBunk,
  bulkPredictBunk,
  simulateBunks,
} from '../controllers/bunkPredictorController.js';
import { authenticate, requireEmailVerified } from '../middleware/auth.js';

const router = express.Router();

// All bunk predictor routes require authentication and email verification
router.use(authenticate, requireEmailVerified);

router.post('/predict', predictBunk);
router.get('/bulk-predict', bulkPredictBunk);
router.post('/simulate', simulateBunks);

export default router;
