import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const pendingUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    college: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      maxlength: [200, 'College name must not exceed 200 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    verificationToken: {
      type: String,
      required: true,
      unique: true,
    },
    tokenExpiry: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
pendingUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Auto-delete expired pending users (1 hour after token expiry)
pendingUserSchema.index({ tokenExpiry: 1 }, { expireAfterSeconds: 3600 });

const PendingUser = mongoose.model('PendingUser', pendingUserSchema);

export default PendingUser;
