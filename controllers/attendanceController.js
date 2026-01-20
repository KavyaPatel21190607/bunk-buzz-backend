import DailyAttendance from '../models/DailyAttendance.js';
import Subject from '../models/Subject.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/attendance
 * @desc    Get attendance records with optional filters
 * @access  Private
 */
export const getAttendanceRecords = async (req, res, next) => {
  try {
    const { subjectId, startDate, endDate, status } = req.query;

    const filter = { userId: req.user._id };

    if (subjectId) filter.subjectId = subjectId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const records = await DailyAttendance.find(filter)
      .populate('subjectId', 'name code color')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: {
        records,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attendance/date/:date
 * @desc    Get attendance for a specific date
 * @access  Private
 */
export const getAttendanceByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    // Set to start of day
    targetDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await DailyAttendance.find({
      userId: req.user._id,
      date: {
        $gte: targetDate,
        $lte: endOfDay,
      },
    }).populate('subjectId', 'name code color');

    res.status(200).json({
      success: true,
      date: targetDate,
      count: records.length,
      data: {
        records,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/attendance
 * @desc    Mark attendance for a subject
 * @access  Private
 */
export const markAttendance = async (req, res, next) => {
  try {
    const { subjectId, date, status, notes } = req.body;

    // Verify subject belongs to user
    const subject = await Subject.findOne({
      _id: subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already marked for this date
    let existing = await DailyAttendance.findOne({
      userId: req.user._id,
      subjectId,
      date: attendanceDate,
    });

    let attendance;
    let isUpdate = false;

    if (existing) {
      // Update existing attendance record
      isUpdate = true;
      const oldStatus = existing.status;
      
      existing.status = status;
      if (notes !== undefined) existing.notes = notes;
      await existing.save();
      
      // Update subject counts if status changed
      if (status !== oldStatus) {
        if (oldStatus === 'present' && status === 'absent') {
          subject.attendedLectures -= 1;
        } else if (oldStatus === 'absent' && status === 'present') {
          subject.attendedLectures += 1;
        }
        await subject.save();
      }
      
      attendance = existing;
    } else {
      // Create new attendance record
      attendance = await DailyAttendance.create({
        userId: req.user._id,
        subjectId,
        date: attendanceDate,
        status,
        notes,
      });

      // Update subject lecture counts
      subject.totalLectures += 1;
      if (status === 'present') {
        subject.attendedLectures += 1;
      }
      await subject.save();
    }

    const populatedAttendance = await DailyAttendance.findById(attendance._id).populate(
      'subjectId',
      'name code color'
    );

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Attendance updated successfully' : 'Attendance marked successfully',
      data: {
        attendance: populatedAttendance,
        subject: {
          id: subject._id,
          name: subject.name,
          totalLectures: subject.totalLectures,
          attendedLectures: subject.attendedLectures,
          absentLectures: subject.absentLectures,
          attendancePercentage: subject.attendancePercentage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/attendance/:id
 * @desc    Update attendance record
 * @access  Private
 */
export const updateAttendance = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const attendance = await DailyAttendance.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!attendance) {
      return next(new AppError('Attendance record not found', 404));
    }

    const oldStatus = attendance.status;
    const subject = await Subject.findById(attendance.subjectId);

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    // Update attendance record
    if (status) attendance.status = status;
    if (notes !== undefined) attendance.notes = notes;
    await attendance.save();

    // Update subject counts if status changed
    if (status && status !== oldStatus) {
      if (oldStatus === 'present' && status === 'absent') {
        subject.attendedLectures -= 1;
      } else if (oldStatus === 'absent' && status === 'present') {
        subject.attendedLectures += 1;
      }
      await subject.save();
    }

    const populatedAttendance = await DailyAttendance.findById(attendance._id).populate(
      'subjectId',
      'name code color'
    );

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: {
        attendance: populatedAttendance,
        subject: {
          id: subject._id,
          name: subject.name,
          totalLectures: subject.totalLectures,
          attendedLectures: subject.attendedLectures,
          attendancePercentage: subject.attendancePercentage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/attendance/:id
 * @desc    Delete attendance record
 * @access  Private
 */
export const deleteAttendance = async (req, res, next) => {
  try {
    const attendance = await DailyAttendance.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!attendance) {
      return next(new AppError('Attendance record not found', 404));
    }

    const subject = await Subject.findById(attendance.subjectId);

    if (subject) {
      // Update subject counts
      subject.totalLectures -= 1;
      if (attendance.status === 'present') {
        subject.attendedLectures -= 1;
      }
      await subject.save();
    }

    await DailyAttendance.deleteOne({ _id: attendance._id });

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attendance/stats
 * @desc    Get overall attendance statistics
 * @access  Private
 */
export const getAttendanceStats = async (req, res, next) => {
  try {
    const subjects = await Subject.find({
      userId: req.user._id,
      isActive: true,
    });

    let totalLectures = 0;
    let totalAttended = 0;
    let subjectsAboveMin = 0;
    let subjectsBelowMin = 0;

    const subjectStats = subjects.map((subject) => {
      totalLectures += subject.totalLectures;
      totalAttended += subject.attendedLectures;

      if (subject.attendancePercentage >= subject.minimumAttendance) {
        subjectsAboveMin++;
      } else {
        subjectsBelowMin++;
      }

      return {
        id: subject._id,
        name: subject.name,
        attendance: subject.attendancePercentage,
        safeBunks: subject.safeBunks,
        classesNeeded: subject.classesNeeded,
      };
    });

    const overallAttendance = totalLectures > 0 
      ? Number(((totalAttended / totalLectures) * 100).toFixed(2))
      : 0;

    // Get recent attendance (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRecords = await DailyAttendance.find({
      userId: req.user._id,
      date: { $gte: sevenDaysAgo },
    });

    const presentCount = recentRecords.filter(r => r.status === 'present').length;
    const absentCount = recentRecords.filter(r => r.status === 'absent').length;

    res.status(200).json({
      success: true,
      data: {
        overall: {
          totalLectures,
          totalAttended,
          overallAttendance,
          subjectsAboveMin,
          subjectsBelowMin,
          totalSubjects: subjects.length,
        },
        recentActivity: {
          last7Days: {
            present: presentCount,
            absent: absentCount,
            total: recentRecords.length,
          },
        },
        subjects: subjectStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attendance/subject/:subjectId/history
 * @desc    Get attendance history for a specific subject
 * @access  Private
 */
export const getSubjectAttendanceHistory = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { limit = 30 } = req.query;

    // Verify subject belongs to user
    const subject = await Subject.findOne({
      _id: subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    const history = await DailyAttendance.find({
      userId: req.user._id,
      subjectId,
    })
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: history.length,
      data: {
        subject: {
          id: subject._id,
          name: subject.name,
          attendance: subject.attendancePercentage,
        },
        history,
      },
    });
  } catch (error) {
    next(error);
  }
};
