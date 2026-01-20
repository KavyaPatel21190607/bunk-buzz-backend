import Timetable from '../models/Timetable.js';
import Subject from '../models/Subject.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/timetable
 * @desc    Get all timetable entries for logged-in user
 * @access  Private
 */
export const getTimetable = async (req, res, next) => {
  try {
    const { day } = req.query;

    const filter = {
      userId: req.user._id,
      isActive: true,
    };

    if (day) {
      filter.dayOfWeek = day;
    }

    const timetable = await Timetable.find(filter)
      .populate('subjectId', 'name code color')
      .sort({ dayOfWeek: 1, startTime: 1 });

    // Map the timetable to include both 'day' and 'dayOfWeek' for compatibility
    const mappedTimetable = timetable.map(entry => ({
      _id: entry._id,
      day: entry.dayOfWeek,
      dayOfWeek: entry.dayOfWeek,
      subjectId: entry.subjectId._id,
      subjectName: entry.subjectId.name,
      subjectCode: entry.subjectId.code,
      color: entry.subjectId.color,
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room,
      lectureType: entry.lectureType,
    }));

    // Group by day
    const groupedByDay = mappedTimetable.reduce((acc, entry) => {
      if (!acc[entry.day]) {
        acc[entry.day] = [];
      }
      acc[entry.day].push(entry);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: mappedTimetable.length,
      data: {
        timetable: mappedTimetable,
        groupedByDay,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/timetable/:id
 * @desc    Get single timetable entry
 * @access  Private
 */
export const getTimetableById = async (req, res, next) => {
  try {
    const entry = await Timetable.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('subjectId', 'name code color');

    if (!entry) {
      return next(new AppError('Timetable entry not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        entry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/timetable
 * @desc    Create a new timetable entry
 * @access  Private
 */
export const createTimetableEntry = async (req, res, next) => {
  try {
    const { subjectId, dayOfWeek, startTime, endTime, room, lectureType } = req.body;

    // Verify subject belongs to user
    const subject = await Subject.findOne({
      _id: subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    // Check for time conflicts
    const conflicts = await Timetable.find({
      userId: req.user._id,
      dayOfWeek,
      isActive: true,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    });

    if (conflicts.length > 0) {
      return next(new AppError('Time slot conflicts with existing entry', 400));
    }

    const entry = await Timetable.create({
      userId: req.user._id,
      subjectId,
      dayOfWeek,
      startTime,
      endTime,
      room,
      lectureType,
    });

    const populatedEntry = await Timetable.findById(entry._id).populate(
      'subjectId',
      'name code color'
    );

    res.status(201).json({
      success: true,
      message: 'Timetable entry created successfully',
      data: {
        entry: populatedEntry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/timetable/:id
 * @desc    Update a timetable entry
 * @access  Private
 */
export const updateTimetableEntry = async (req, res, next) => {
  try {
    const entry = await Timetable.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!entry) {
      return next(new AppError('Timetable entry not found', 404));
    }

    // If updating subject, verify it exists
    if (req.body.subjectId) {
      const subject = await Subject.findOne({
        _id: req.body.subjectId,
        userId: req.user._id,
      });

      if (!subject) {
        return next(new AppError('Subject not found', 404));
      }
    }

    // Check for time conflicts if time is being updated
    if (req.body.startTime || req.body.endTime || req.body.dayOfWeek) {
      const dayOfWeek = req.body.dayOfWeek || entry.dayOfWeek;
      const startTime = req.body.startTime || entry.startTime;
      const endTime = req.body.endTime || entry.endTime;

      const conflicts = await Timetable.find({
        userId: req.user._id,
        dayOfWeek,
        isActive: true,
        _id: { $ne: entry._id },
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
          },
        ],
      });

      if (conflicts.length > 0) {
        return next(new AppError('Time slot conflicts with existing entry', 400));
      }
    }

    // Update fields
    const allowedUpdates = [
      'subjectId',
      'dayOfWeek',
      'startTime',
      'endTime',
      'room',
      'lectureType',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        entry[field] = req.body[field];
      }
    });

    await entry.save();

    const populatedEntry = await Timetable.findById(entry._id).populate(
      'subjectId',
      'name code color'
    );

    res.status(200).json({
      success: true,
      message: 'Timetable entry updated successfully',
      data: {
        entry: populatedEntry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/timetable/:id
 * @desc    Delete a timetable entry
 * @access  Private
 */
export const deleteTimetableEntry = async (req, res, next) => {
  try {
    const entry = await Timetable.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!entry) {
      return next(new AppError('Timetable entry not found', 404));
    }

    // Soft delete
    entry.isActive = false;
    await entry.save();

    res.status(200).json({
      success: true,
      message: 'Timetable entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/timetable/today
 * @desc    Get today's timetable
 * @access  Private
 */
export const getTodayTimetable = async (req, res, next) => {
  try {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];

    const timetable = await Timetable.find({
      userId: req.user._id,
      dayOfWeek: today,
      isActive: true,
    })
      .populate('subjectId', 'name code color')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      day: today,
      count: timetable.length,
      data: {
        timetable,
      },
    });
  } catch (error) {
    next(error);
  }
};
