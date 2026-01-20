import express from 'express';
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectStats,
} from '../controllers/subjectController.js';
import { authenticate, requireEmailVerified } from '../middleware/auth.js';
import {
  subjectValidation,
  mongoIdValidation,
} from '../middleware/validation.js';

const router = express.Router();

// All subject routes require authentication and email verification
router.use(authenticate, requireEmailVerified);

router
  .route('/')
  .get(getSubjects)
  .post(subjectValidation, createSubject);

router
  .route('/:id')
  .get(mongoIdValidation, getSubjectById)
  .put(mongoIdValidation, updateSubject)
  .delete(mongoIdValidation, deleteSubject);

router.get('/:id/stats', mongoIdValidation, getSubjectStats);

export default router;
