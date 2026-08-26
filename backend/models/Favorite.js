import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
}, { timestamps: true });

favoriteSchema.index({ userId: 1, eventId: 1 }, { unique: true }); // prevents duplicate saves

export default mongoose.model('Favorite', favoriteSchema);