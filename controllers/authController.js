import User from '../models/User.js';
import PendingUser from '../models/PendingUser.js';
import { generateTokens, verifyRefreshToken } from '../utils/tokenUtils.js';
import { generateVerificationToken } from '../utils/tokenGenerator.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../utils/emailService.js';
import { verifyGoogleToken } from '../config/googleOAuth.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user (email & password)
 * @access  Public
 */
export const signup = async (req, res, next) => {
  try {
    const { name, email, college, password } = req.body;

    // Check if user already exists in Users collection
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
    }

    // Check if user already has a pending verification
    const existingPending = await PendingUser.findOne({ email });
    if (existingPending) {
      // Delete old pending user and create new one (resend verification)
      await PendingUser.deleteOne({ email });
    }

    // Generate verification token
    const { token, expiry } = generateVerificationToken();

    // Create pending user
    const pendingUser = await PendingUser.create({
      name,
      email,
      college,
      password,
      verificationToken: token,
      tokenExpiry: expiry,
    });

    // Send verification email (non-blocking)
    const emailSent = await sendVerificationEmail(email, name, token);

    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'Verification email sent. Please check your inbox to verify your email.'
        : 'Account created successfully. Email verification is temporarily unavailable, but you can still use your account.',
      data: {
        email: pendingUser.email,
        tokenExpiry: pendingUser.tokenExpiry,
        emailSent,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email using token
 * @access  Public
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(new AppError('Verification token is required', 400));
    }

    // Find pending user with valid token
    const pendingUser = await PendingUser.findOne({
      verificationToken: token,
      tokenExpiry: { $gt: new Date() },
    });

    if (!pendingUser) {
      return next(new AppError('Invalid or expired verification token', 400));
    }

    // Create actual user
    const user = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      college: pendingUser.college,
      password: pendingUser.password,
      emailVerified: true,
      authProvider: 'local',
    });

    // Delete pending user
    await PendingUser.deleteOne({ _id: pendingUser._id });

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          college: user.college,
          emailVerified: user.emailVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login with email & password
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and select password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return next(new AppError('Please verify your email before logging in', 403));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated', 403));
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          college: user.college,
          profilePicture: user.profilePicture,
          semesterStart: user.semesterStart,
          semesterEnd: user.semesterEnd,
          overallMinimumAttendance: user.overallMinimumAttendance,
          emailVerified: user.emailVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/google
 * @desc    Login/Signup with Google OAuth
 * @access  Public
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { token } = req.body;

    // Verify Google token
    const googleUser = await verifyGoogleToken(token);

    // Check if user exists
    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      // User exists - log them in
      if (!user.googleId) {
        // Link Google account to existing account
        user.googleId = googleUser.googleId;
        user.profilePicture = googleUser.profilePicture;
        user.emailVerified = true;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        profilePicture: googleUser.profilePicture,
        college: 'Not specified',
        emailVerified: true,
        authProvider: 'google',
      });

      // Send welcome email
      await sendWelcomeEmail(user.email, user.name);
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          college: user.college,
          profilePicture: user.profilePicture,
          semesterStart: user.semesterStart,
          semesterEnd: user.semesterEnd,
          overallMinimumAttendance: user.overallMinimumAttendance,
          emailVerified: user.emailVerified,
          authProvider: user.authProvider,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return next(new AppError('Refresh token is required', 400));
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Find user with this refresh token
    const user = await User.findOne({
      _id: decoded.userId,
      refreshToken: token,
    }).select('+refreshToken');

    if (!user) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
export const logout = async (req, res, next) => {
  try {
    // Clear refresh token
    req.user.refreshToken = null;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if user already verified
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email is already verified', 400));
    }

    // Find pending user
    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) {
      return next(new AppError('No pending verification found for this email', 404));
    }

    // Generate new token
    const { token, expiry } = generateVerificationToken();

    // Update pending user
    pendingUser.verificationToken = token;
    pendingUser.tokenExpiry = expiry;
    await pendingUser.save();

    // Resend verification email
    await sendVerificationEmail(email, pendingUser.name, token);

    res.status(200).json({
      success: true,
      message: 'Verification email resent successfully',
      data: {
        email: pendingUser.email,
        tokenExpiry: pendingUser.tokenExpiry,
      },
    });
  } catch (error) {
    next(error);
  }
};
