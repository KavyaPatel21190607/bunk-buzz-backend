import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount,
} from '../controllers/profileController.js';
import { authenticate, requireEmailVerified } from '../middleware/auth.js';

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

router
  .route('/')
  .get(getProfile)
  .put(updateProfile)
  .delete(deactivateAccount);

router.put('/password', requireEmailVerified, changePassword);

export default router;
