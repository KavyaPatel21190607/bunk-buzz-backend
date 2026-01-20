import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  
  next();
};

/**
 * Validation rules for user signup
 */
export const signupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('college')
    .trim()
    .notEmpty()
    .withMessage('College name is required')
    .isLength({ max: 200 })
    .withMessage('College name must not exceed 200 characters'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  validate,
];

/**
 * Validation rules for user login
 */
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validate,
];

/**
 * Validation rules for Google OAuth
 */
export const googleAuthValidation = [
  body('token')
    .notEmpty()
    .withMessage('Google token is required'),
  
  validate,
];

/**
 * Validation rules for subject creation/update
 */
export const subjectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Subject name is required')
    .isLength({ max: 100 })
    .withMessage('Subject name must not exceed 100 characters'),
  
  body('code')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Subject code must not exceed 20 characters'),
  
  body('totalLectures')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total lectures must be a non-negative integer'),
  
  body('attendedLectures')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Attended lectures must be a non-negative integer')
    .custom((value, { req }) => {
      if (req.body.totalLectures && value > req.body.totalLectures) {
        throw new Error('Attended lectures cannot exceed total lectures');
      }
      return true;
    }),
  
  body('minimumAttendance')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Minimum attendance must be between 0 and 100'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Please provide a valid hex color code'),
  
  validate,
];

/**
 * Validation rules for timetable entry
 */
export const timetableValidation = [
  body('subjectId')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isMongoId()
    .withMessage('Invalid subject ID'),
  
  body('dayOfWeek')
    .notEmpty()
    .withMessage('Day of week is required')
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day of week'),
  
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide valid time format (HH:mm)'),
  
  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide valid time format (HH:mm)'),
  
  validate,
];

/**
 * Validation rules for attendance marking
 */
export const attendanceValidation = [
  body('subjectId')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isMongoId()
    .withMessage('Invalid subject ID'),
  
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  
  body('status')
    .notEmpty()
    .withMessage('Attendance status is required')
    .isIn(['present', 'absent'])
    .withMessage('Status must be either present or absent'),
  
  validate,
];

/**
 * Validation rules for MongoDB ObjectId param
 */
export const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  validate,
];
