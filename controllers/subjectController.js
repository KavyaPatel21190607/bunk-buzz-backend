import Subject from '../models/Subject.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/subjects
 * @desc    Get all subjects for logged-in user
 * @access  Private
 */
export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({
      userId: req.user._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    // Calculate overall attendance
    let totalLectures = 0;
    let totalAttended = 0;

    subjects.forEach((subject) => {
      totalLectures += subject.totalLectures;
      totalAttended += subject.attendedLectures;
    });

    const overallAttendance = totalLectures > 0 
      ? Number(((totalAttended / totalLectures) * 100).toFixed(2))
      : 0;

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: {
        subjects,
        overallAttendance,
        totalLectures,
        totalAttended,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/subjects/:id
 * @desc    Get single subject by ID
 * @access  Private
 */
export const getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        subject,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/subjects
 * @desc    Create a new subject
 * @access  Private
 */
export const createSubject = async (req, res, next) => {
  try {
    const subjectData = {
      ...req.body,
      userId: req.user._id,
    };

    const subject = await Subject.create(subjectData);

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: {
        subject,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/subjects/:id
 * @desc    Update a subject
 * @access  Private
 */
export const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    // Update fields
    const allowedUpdates = [
      'name',
      'code',
      'totalLectures',
      'attendedLectures',
      'minimumAttendance',
      'color',
      'faculty',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        subject[field] = req.body[field];
      }
    });

    await subject.save();

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: {
        subject,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/subjects/:id
 * @desc    Delete a subject (soft delete)
 * @access  Private
 */
export const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    // Soft delete
    subject.isActive = false;
    await subject.save();

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/subjects/:id/stats
 * @desc    Get detailed statistics for a subject
 * @access  Private
 */
export const getSubjectStats = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    const stats = {
      currentAttendance: subject.attendancePercentage,
      safeBunks: subject.safeBunks,
      classesNeeded: subject.classesNeeded,
      totalLectures: subject.totalLectures,
      attendedLectures: subject.attendedLectures,
      missedLectures: subject.totalLectures - subject.attendedLectures,
      minimumAttendance: subject.minimumAttendance,
      isAboveMinimum: subject.attendancePercentage >= subject.minimumAttendance,
    };

    res.status(200).json({
      success: true,
      data: {
        subject: subject.name,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};
