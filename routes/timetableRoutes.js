import express from 'express';
import {
  getTimetable,
  getTimetableById,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  getTodayTimetable,
} from '../controllers/timetableController.js';
import { authenticate, requireEmailVerified } from '../middleware/auth.js';
import {
  timetableValidation,
  mongoIdValidation,
} from '../middleware/validation.js';

const router = express.Router();

// All timetable routes require authentication and email verification
router.use(authenticate, requireEmailVerified);

router.get('/today', getTodayTimetable);

router
  .route('/')
  .get(getTimetable)
  .post(timetableValidation, createTimetableEntry);

router
  .route('/:id')
  .get(mongoIdValidation, getTimetableById)
  .put(mongoIdValidation, updateTimetableEntry)
  .delete(mongoIdValidation, deleteTimetableEntry);

export default router;
