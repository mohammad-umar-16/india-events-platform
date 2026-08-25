import mongoose from 'mongoose';

// India metro cities this platform supports (v1 scope)
export const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune'];

// Normalized category taxonomy - each scraper source maps its own labels into this list
export const CATEGORIES = [
  'Music & Concerts',
  'Comedy',
  'Nightlife & Parties',
  'Workshops & Classes',
  'Conferences & Business',
  'Arts & Culture',
  'Sports & Fitness',
  'Food & Drink',
  'Kids & Family',
  'Spiritual & Wellness',
  'College Fests & Youth',
  'Other'
];

export const SOURCES = ['AllEvents', 'Townscript', 'District', 'Meetup', 'Eventbrite'];

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date
  },
  venueName: {
    type: String,
    trim: true
  },
  venueAddress: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: true,
    enum: CITIES
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: CATEGORIES,
    default: 'Other'
  },
  tags: [String],
  imageUrl: {
    type: String
  },
  priceInfo: {
    type: String // e.g. "Free", "Starts at ₹499" - kept as display string since sources format this differently
  },
  sourceWebsite: {
    type: String,
    required: true,
    enum: SOURCES
  },
  originalUrl: {
    type: String,
    required: true,
    unique: true
  },
  lastScrapedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['new', 'updated', 'inactive', 'imported'],
    default: 'new'
  },
  imported: {
    type: Boolean,
    default: false
  },
  importedAt: {
    type: Date
  },
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  importNotes: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  checksum: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
eventSchema.index({ city: 1, dateTime: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ originalUrl: 1 });
eventSchema.index({ title: 'text', description: 'text', venueName: 'text' });

export default mongoose.model('Event', eventSchema);