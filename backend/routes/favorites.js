import express from 'express';
import Favorite from '../models/Favorite.js';
import { ensureAuthenticated } from '../middleware/auth.js'; // adjust path if your middleware file lives elsewhere

const router = express.Router();

// Toggle save/unsave
router.post('/:eventId', ensureAuthenticated, async (req, res) => {
  try {
    const { eventId } = req.params;
    const existing = await Favorite.findOne({ userId: req.user._id, eventId });

    if (existing) {
      await existing.deleteOne();
      return res.json({ saved: false });
    }

    await Favorite.create({ userId: req.user._id, eventId });
    res.json({ saved: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// List my saved events, populated with event details
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id }).populate('eventId').sort({ createdAt: -1 });
    const events = favorites.filter(f => f.eventId).map(f => f.eventId);
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

export default router;