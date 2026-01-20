import express from 'express';
import {
  getAttendanceRecords,
  getAttendanceByDate,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
  getSubjectAttendanceHistory,
} from '../controllers/attendanceController.js';
import { authenticate, requireEmailVerified } from '../middleware/auth.js';
import {
  attendanceValidation,
  mongoIdValidation,
} from '../middleware/validation.js';

const router = express.Router();

// All attendance routes require authentication and email verification
router.use(authenticate, requireEmailVerified);

router.get('/stats', getAttendanceStats);
router.get('/date/:date', getAttendanceByDate);
router.get('/subject/:subjectId/history', getSubjectAttendanceHistory);

router
  .route('/')
  .get(getAttendanceRecords)
  .post(attendanceValidation, markAttendance);

router
  .route('/:id')
  .put(mongoIdValidation, updateAttendance)
  .delete(mongoIdValidation, deleteAttendance);

export default router;
