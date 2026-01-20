import express from 'express';
import {
  signup,
  verifyEmail,
  login,
  googleAuth,
  refreshToken,
  logout,
  getCurrentUser,
  resendVerification,
} from '../controllers/authController.js';
import {
  signupValidation,
  loginValidation,
  googleAuthValidation,
} from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import {
  authLimiter,
  verificationLimiter,
} from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/signup', authLimiter, signupValidation, signup);
router.post('/verify-email', verificationLimiter, verifyEmail);
router.post('/login', authLimiter, loginValidation, login);
router.post('/google', authLimiter, googleAuthValidation, googleAuth);
router.post('/refresh', refreshToken);
router.post('/resend-verification', verificationLimiter, resendVerification);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

export default router;
