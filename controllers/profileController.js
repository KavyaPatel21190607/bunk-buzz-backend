import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // Fields that can be updated
    const allowedUpdates = [
      'name',
      'college',
      'semesterStart',
      'semesterEnd',
      'currentOverallAttendance',
      'overallMinimumAttendance',
      'profilePicture',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/profile/password
 * @desc    Change password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Please provide current and new password', 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters', 400));
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check if user has a password (not OAuth user)
    if (!user.password) {
      return next(new AppError('Cannot change password for OAuth accounts', 400));
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/profile
 * @desc    Deactivate account
 * @access  Private
 */
export const deactivateAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    user.isActive = false;
    user.refreshToken = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};
