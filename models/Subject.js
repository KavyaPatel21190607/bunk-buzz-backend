import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [100, 'Subject name must not exceed 100 characters'],
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Subject code must not exceed 20 characters'],
    },
    totalLectures: {
      type: Number,
      required: [true, 'Total lectures is required'],
      min: [0, 'Total lectures cannot be negative'],
      default: 0,
    },
    attendedLectures: {
      type: Number,
      required: [true, 'Attended lectures is required'],
      min: [0, 'Attended lectures cannot be negative'],
      default: 0,
      validate: {
        validator: function (value) {
          return value <= this.totalLectures;
        },
        message: 'Attended lectures cannot exceed total lectures',
      },
    },
    minimumAttendance: {
      type: Number,
      required: [true, 'Minimum attendance percentage is required'],
      min: [0, 'Minimum attendance cannot be negative'],
      max: [100, 'Minimum attendance cannot exceed 100'],
      default: 75,
    },
    color: {
      type: String,
      default: '#8B5CF6',
      match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color code'],
    },
    faculty: {
      type: String,
      trim: true,
      maxlength: [100, 'Faculty name must not exceed 100 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for attendance percentage
subjectSchema.virtual('attendancePercentage').get(function () {
  if (this.totalLectures === 0) return 0;
  return Number(((this.attendedLectures / this.totalLectures) * 100).toFixed(2));
});

// Virtual for absent lectures count
subjectSchema.virtual('absentLectures').get(function () {
  return this.totalLectures - this.attendedLectures;
});

// Virtual for classes needed to meet minimum attendance
subjectSchema.virtual('classesNeeded').get(function () {
  const current = this.attendancePercentage;
  if (current >= this.minimumAttendance) return 0;

  let needed = 0;
  let attended = this.attendedLectures;
  let total = this.totalLectures;

  while (((attended + needed + 1) / (total + needed + 1)) * 100 < this.minimumAttendance) {
    needed++;
  }

  return needed + 1;
});

// Virtual for safe bunks calculation
subjectSchema.virtual('safeBunks').get(function () {
  const current = this.attendancePercentage;
  if (current < this.minimumAttendance) return 0;

  let bunks = 0;
  let attended = this.attendedLectures;
  let total = this.totalLectures;

  while ((attended / (total + bunks + 1)) * 100 >= this.minimumAttendance) {
    bunks++;
  }

  return bunks;
});

// Compound index for user queries
subjectSchema.index({ userId: 1, isActive: 1 });

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;
