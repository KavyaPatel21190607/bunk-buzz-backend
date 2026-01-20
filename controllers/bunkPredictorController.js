import Subject from '../models/Subject.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * @route   POST /api/bunk-predictor/predict
 * @desc    Predict if bunking is safe for a subject
 * @access  Private
 */
export const predictBunk = async (req, res, next) => {
  try {
    const { subjectId } = req.body;

    const subject = await Subject.findOne({
      _id: subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    const currentPercentage = subject.attendancePercentage;
    const minAttendance = subject.minimumAttendance;

    // Calculate after bunking one lecture
    const afterBunkAttended = subject.attendedLectures;
    const afterBunkTotal = subject.totalLectures + 1;
    const afterBunkPercentage = Number(
      ((afterBunkAttended / afterBunkTotal) * 100).toFixed(2)
    );

    const canBunk = afterBunkPercentage >= minAttendance;
    const safeBunks = subject.safeBunks;

    // Calculate classes needed to recover if bunked
    let classesNeededToRecover = 0;
    if (!canBunk) {
      let attended = subject.attendedLectures;
      let total = subject.totalLectures + 1; // After bunk
      
      while (((attended + classesNeededToRecover + 1) / (total + classesNeededToRecover + 1)) * 100 < minAttendance) {
        classesNeededToRecover++;
      }
      classesNeededToRecover++;
    }

    const result = {
      canBunk,
      safeBunks,
      currentAttendance: currentPercentage,
      afterBunkAttendance: afterBunkPercentage,
      minimumRequired: minAttendance,
      attendanceDrop: Number((currentPercentage - afterBunkPercentage).toFixed(2)),
      classesNeededToRecover,
      recommendation: canBunk
        ? `You can safely bunk. Your attendance will be ${afterBunkPercentage}%, which is above the minimum ${minAttendance}%.`
        : `You should NOT bunk. Your attendance will drop to ${afterBunkPercentage}%, which is below the minimum ${minAttendance}%. You'll need to attend ${classesNeededToRecover} consecutive classes to recover.`,
      details: {
        currentTotal: subject.totalLectures,
        currentAttended: subject.attendedLectures,
        afterBunkTotal: afterBunkTotal,
        afterBunkAttended: afterBunkAttended,
      },
    };

    res.status(200).json({
      success: true,
      data: {
        subject: {
          id: subject._id,
          name: subject.name,
          code: subject.code,
        },
        prediction: result,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/bunk-predictor/bulk-predict
 * @desc    Predict bunk safety for all subjects
 * @access  Private
 */
export const bulkPredictBunk = async (req, res, next) => {
  try {
    const subjects = await Subject.find({
      userId: req.user._id,
      isActive: true,
    });

    const predictions = subjects.map((subject) => {
      const currentPercentage = subject.attendancePercentage;
      const minAttendance = subject.minimumAttendance;

      const afterBunkAttended = subject.attendedLectures;
      const afterBunkTotal = subject.totalLectures + 1;
      const afterBunkPercentage = Number(
        ((afterBunkAttended / afterBunkTotal) * 100).toFixed(2)
      );

      const canBunk = afterBunkPercentage >= minAttendance;

      return {
        subjectId: subject._id,
        subjectName: subject.name,
        currentAttendance: currentPercentage,
        canBunk,
        safeBunks: subject.safeBunks,
        afterBunkAttendance: afterBunkPercentage,
      };
    });

    const totalSafeBunks = predictions.reduce((sum, p) => sum + p.safeBunks, 0);
    const safeSubjects = predictions.filter((p) => p.canBunk).length;
    const riskySubjects = predictions.filter((p) => !p.canBunk).length;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSubjects: subjects.length,
          safeSubjects,
          riskySubjects,
          totalSafeBunks,
        },
        predictions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/bunk-predictor/simulate
 * @desc    Simulate attendance after multiple bunks
 * @access  Private
 */
export const simulateBunks = async (req, res, next) => {
  try {
    const { subjectId, numberOfBunks } = req.body;

    if (!numberOfBunks || numberOfBunks < 1) {
      return next(new AppError('Number of bunks must be at least 1', 400));
    }

    if (numberOfBunks > 50) {
      return next(new AppError('Cannot simulate more than 50 bunks', 400));
    }

    const subject = await Subject.findOne({
      _id: subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return next(new AppError('Subject not found', 404));
    }

    const simulation = [];
    let attended = subject.attendedLectures;
    let total = subject.totalLectures;

    for (let i = 1; i <= numberOfBunks; i++) {
      total += 1;
      const percentage = Number(((attended / total) * 100).toFixed(2));
      const isSafe = percentage >= subject.minimumAttendance;

      simulation.push({
        bunkNumber: i,
        totalLectures: total,
        attendedLectures: attended,
        attendance: percentage,
        isSafe,
        status: isSafe ? 'safe' : 'danger',
      });
    }

    const turningPoint = simulation.findIndex((s) => !s.isSafe);

    res.status(200).json({
      success: true,
      data: {
        subject: {
          id: subject._id,
          name: subject.name,
          currentAttendance: subject.attendancePercentage,
        },
        simulation,
        analysis: {
          requestedBunks: numberOfBunks,
          safeBunks: turningPoint === -1 ? numberOfBunks : turningPoint,
          turningPoint: turningPoint === -1 ? null : turningPoint + 1,
          finalAttendance: simulation[simulation.length - 1].attendance,
          recommendation:
            turningPoint === -1
              ? `All ${numberOfBunks} bunks are safe!`
              : `You can safely bunk ${turningPoint} time(s). Bunking ${turningPoint + 1} times will drop you below ${subject.minimumAttendance}%.`,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
