import mongoose from 'mongoose';

const emailCaptureSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  consent: {
    type: Boolean,
    required: true,
    default: false
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  eventTitle: {
    type: String
  },
  eventDate: {
    type: Date
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for querying
emailCaptureSchema.index({ email: 1, eventId: 1 });

export default mongoose.model('EmailCapture', emailCaptureSchema);
