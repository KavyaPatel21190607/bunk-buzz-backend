import DailyAttendance from '../models/DailyAttendance.js';
import Subject from '../models/Subject.js';
import Timetable from '../models/Timetable.js';
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
 * @desc    Get comprehensive attendance analytics with predictions
 * @access  Private
 */
export const getAttendanceStats = async (req, res, next) => {
  try {
    const user = req.user;
    const subjects = await Subject.find({
      userId: req.user._id,
      isActive: true,
    });

    // Fetch user's timetable to get realistic schedule
    const timetable = await Timetable.find({
      userId: req.user._id,
      isActive: true,
    }).populate('subjectId', 'name');

    // Calculate lectures per week from timetable
    const lecturesPerWeek = timetable.length;
    const lecturesPerDay = lecturesPerWeek > 0 ? lecturesPerWeek / 5 : subjects.length; // Assume 5 working days

    // Group timetable by subject to see frequency
    const subjectFrequency = {};
    timetable.forEach(entry => {
      const subjectId = entry.subjectId?._id?.toString();
      if (subjectId) {
        subjectFrequency[subjectId] = (subjectFrequency[subjectId] || 0) + 1;
      }
    });

    let totalLectures = 0;
    let totalAttended = 0;
    let subjectsAboveMin = 0;
    let subjectsBelowMin = 0;
    let totalSafeBunks = 0;

    const subjectStats = subjects.map((subject) => {
      totalLectures += subject.totalLectures;
      totalAttended += subject.attendedLectures;

      if (subject.attendancePercentage >= subject.minimumAttendance) {
        subjectsAboveMin++;
      } else {
        subjectsBelowMin++;
      }

      totalSafeBunks += subject.safeBunks || 0;

      const subjectId = subject._id.toString();
      const weeklyFrequency = subjectFrequency[subjectId] || 1;
      const weeksNeeded = subject.classesNeeded > 0 
        ? Math.ceil(subject.classesNeeded / weeklyFrequency) 
        : 0;

      return {
        id: subject._id,
        name: subject.name,
        code: subject.code,
        attendance: subject.attendancePercentage,
        totalLectures: subject.totalLectures,
        attendedLectures: subject.attendedLectures,
        minimumRequired: subject.minimumAttendance,
        safeBunks: subject.safeBunks,
        classesNeeded: subject.classesNeeded,
        weeklyFrequency,
        weeksNeeded,
        status: subject.attendancePercentage >= subject.minimumAttendance ? 'safe' : 'risk',
      };
    });

    // Use user's manually set attendance if available (from college records)
    const calculatedAttendance = totalLectures > 0 
      ? Number(((totalAttended / totalLectures) * 100).toFixed(2))
      : 0;
    
    const overallAttendance = user.currentOverallAttendance ?? calculatedAttendance;

    // Calculate overall attendance target (use user's preference or default 75%)
    const targetAttendance = user.overallMinimumAttendance || 75;

    // Calculate classes needed to reach target attendance BASED ON ACTUAL TIMETABLE
    let overallClassesNeeded = 0;
    let estimatedWeeks = 0;
    let estimatedDays = 0;

    if (overallAttendance < targetAttendance) {
      // If using college records, calculate based on that
      let currentAttended = user.currentOverallAttendance 
        ? Math.round((overallAttendance * totalLectures) / 100)
        : totalAttended;
      let currentTotal = totalLectures;

      while (((currentAttended + overallClassesNeeded + 1) / (currentTotal + overallClassesNeeded + 1)) * 100 < targetAttendance) {
        overallClassesNeeded++;
        if (overallClassesNeeded > 1000) break; // Safety limit
      }
      overallClassesNeeded++; // Add one more for safety

      // Calculate realistic timeline based on timetable
      if (lecturesPerWeek > 0) {
        estimatedWeeks = Math.ceil(overallClassesNeeded / lecturesPerWeek);
        estimatedDays = estimatedWeeks * 5; // 5 working days per week
      } else {
        // Fallback if no timetable
        estimatedDays = Math.ceil(overallClassesNeeded / (subjects.length || 1));
      }
    }

    // Calculate overall safe bunks (how many lectures can be bunked while staying above target)
    let overallSafeBunks = 0;
    if (overallAttendance >= targetAttendance) {
      let attended = totalAttended;
      let total = totalLectures;

      while (((attended) / (total + 1)) * 100 >= targetAttendance) {
        overallSafeBunks++;
        total++;
        if (overallSafeBunks > 1000) break; // Safety limit
      }
    }

    // Calculate projected attendance after attending next N classes
    const projectedAfter5Classes = totalLectures > 0
      ? Number((((totalAttended + 5) / (totalLectures + 5)) * 100).toFixed(2))
      : 0;
    
    const projectedAfter10Classes = totalLectures > 0
      ? Number((((totalAttended + 10) / (totalLectures + 10)) * 100).toFixed(2))
      : 0;

    // Get recent attendance (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRecords = await DailyAttendance.find({
      userId: req.user._id,
      date: { $gte: sevenDaysAgo },
    }).populate('subjectId', 'name');

    const presentCount = recentRecords.filter(r => r.status === 'present').length;
    const absentCount = recentRecords.filter(r => r.status === 'absent').length;

    const currentWeekPercentage = recentRecords.length > 0
      ? Number(((presentCount / recentRecords.length) * 100).toFixed(2))
      : 0;

    // Get previous week data for trend comparison
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const previousWeekRecords = await DailyAttendance.find({
      userId: req.user._id,
      date: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
    });

    const previousWeekPresent = previousWeekRecords.filter(r => r.status === 'present').length;
    const previousWeekPercentage = previousWeekRecords.length > 0
      ? Number(((previousWeekPresent / previousWeekRecords.length) * 100).toFixed(2))
      : 0;
    
    const trend = currentWeekPercentage - previousWeekPercentage;

    // Generate timetable-aware recommendations
    const recommendations = [];
    
    if (overallAttendance < targetAttendance) {
      const timelineMessage = lecturesPerWeek > 0
        ? `Based on your timetable (${lecturesPerWeek} lectures/week), you need approximately ${estimatedWeeks} weeks (${estimatedDays} days) of perfect attendance.`
        : `You need to attend ${overallClassesNeeded} consecutive classes.`;

      recommendations.push({
        type: 'warning',
        message: `Your attendance is below target (${targetAttendance}%). You need to attend ${overallClassesNeeded} more classes to reach ${targetAttendance}%. ${timelineMessage}`,
        priority: 'high',
      });
      
      // Find subjects most affecting overall attendance
      const criticalSubjects = subjectStats
        .filter(s => s.status === 'risk')
        .sort((a, b) => a.attendance - b.attendance)
        .slice(0, 3);
      
      if (criticalSubjects.length > 0) {
        const criticalDetails = criticalSubjects.map(s => {
          const freq = s.weeklyFrequency || 1;
          return `${s.name} (${s.classesNeeded} classes needed, ${freq}x/week → ~${s.weeksNeeded} weeks)`;
        }).join('; ');

        recommendations.push({
          type: 'action',
          message: `Priority subjects based on timetable: ${criticalDetails}`,
          priority: 'high',
          subjects: criticalSubjects.map(s => s.id),
        });
      }

      // Timetable-specific advice
      if (lecturesPerWeek > 0) {
        recommendations.push({
          type: 'action',
          message: `Your timetable has ${lecturesPerWeek} lectures per week. Attending all of them consistently will help you reach your target faster.`,
          priority: 'medium',
        });
      }
    } else {
      recommendations.push({
        type: 'success',
        message: `Great! Your attendance is above target. You can safely bunk ${overallSafeBunks} lectures while maintaining ${targetAttendance}%.`,
        priority: 'low',
      });
    }

    if (trend < -5) {
      recommendations.push({
        type: 'warning',
        message: `Your attendance has dropped by ${Math.abs(trend).toFixed(1)}% this week. Try to attend more classes.`,
        priority: 'medium',
      });
    } else if (trend > 5) {
      recommendations.push({
        type: 'success',
        message: `Excellent! Your attendance improved by ${trend.toFixed(1)}% this week.`,
        priority: 'low',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        overall: {
          currentAttendance: overallAttendance,
          targetAttendance,
          totalLectures,
          totalAttended,
          totalAbsent: totalLectures - totalAttended,
          subjectsAboveMin,
          subjectsBelowMin,
          totalSubjects: subjects.length,
          status: overallAttendance >= targetAttendance ? 'safe' : 'risk',
        },
        predictions: {
          classesNeededToReachTarget: overallClassesNeeded,
          safeBunksAvailable: overallSafeBunks,
          projectedAfter5Classes,
          projectedAfter10Classes,
          estimatedDaysToTarget: estimatedDays,
          estimatedWeeksToTarget: estimatedWeeks,
          lecturesPerWeek,
          lecturesPerDay: Number(lecturesPerDay.toFixed(1)),
        },
        timetableInfo: {
          totalWeeklyLectures: lecturesPerWeek,
          hasSchedule: timetable.length > 0,
          subjectFrequency,
        },
        recentActivity: {
          last7Days: {
            present: presentCount,
            absent: absentCount,
            total: recentRecords.length,
            percentage: currentWeekPercentage.toFixed(2),
            trend: trend.toFixed(2),
            trendDirection: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
          },
        },
        subjects: subjectStats,
        recommendations,
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
