import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
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
    dayOfWeek: {
      type: String,
      required: [true, 'Day of week is required'],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time format (HH:mm)'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time format (HH:mm)'],
    },
    room: {
      type: String,
      trim: true,
      maxlength: [50, 'Room info must not exceed 50 characters'],
    },
    lectureType: {
      type: String,
      enum: ['Theory', 'Lab', 'Tutorial', 'Practical'],
      default: 'Theory',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate end time is after start time
timetableSchema.pre('save', function (next) {
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  if (endMinutes <= startMinutes) {
    next(new Error('End time must be after start time'));
  }
  
  next();
});

// Compound index for efficient queries
timetableSchema.index({ userId: 1, dayOfWeek: 1, isActive: 1 });
timetableSchema.index({ userId: 1, subjectId: 1 });

const Timetable = mongoose.model('Timetable', timetableSchema);

export default Timetable;
