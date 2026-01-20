import mongoose from 'mongoose';

const dailyAttendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    status: {
      type: String,
      required: [true, 'Attendance status is required'],
      enum: ['present', 'absent'],
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: [200, 'Notes must not exceed 200 characters'],
    },
    timetableEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance for same subject on same date
dailyAttendanceSchema.index(
  { userId: 1, subjectId: 1, date: 1 },
  { unique: true }
);

// Compound indexes for efficient queries
dailyAttendanceSchema.index({ userId: 1, date: 1 });
dailyAttendanceSchema.index({ userId: 1, subjectId: 1, date: -1 });

const DailyAttendance = mongoose.model('DailyAttendance', dailyAttendanceSchema);

export default DailyAttendance;
