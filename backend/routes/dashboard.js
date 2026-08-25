import express from 'express';
import Event, { CITIES } from '../models/Event.js';
import EmailCapture from '../models/EmailCapture.js';
import { ensureAuthenticated, ensureAdmin } from '../middleware/auth.js';

const router = express.Router();
const MAX_LIMIT = 100;

router.use(ensureAuthenticated);

router.get('/stats', async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments({ isActive: true });
    const newEvents = await Event.countDocuments({ status: 'new', isActive: true });
    const updatedEvents = await Event.countDocuments({ status: 'updated', isActive: true });
    const inactiveEvents = await Event.countDocuments({ status: 'inactive' });
    const importedEvents = await Event.countDocuments({ imported: true });
    const totalEmailCaptures = await EmailCapture.countDocuments();
    res.json({ totalEvents, newEvents, updatedEvents, inactiveEvents, importedEvents, totalEmailCaptures });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const { city, status, search, fromDate, toDate, imported, page = 1, limit = 20 } = req.query;
    const query = {};
    if (city) query.city = city;
    if (status) query.status = status;
    if (search) query.$text = { $search: search };
    if (fromDate || toDate) {
      query.dateTime = {};
      if (fromDate) query.dateTime.$gte = new Date(fromDate);
      if (toDate) query.dateTime.$lte = new Date(toDate);
    }
    if (imported !== undefined) query.imported = imported === 'true';

    const boundedLimit = Math.min(parseInt(limit) || 20, MAX_LIMIT);
    const skip = (parseInt(page) - 1) * boundedLimit;

    const events = await Event.find(query)
      .sort({ dateTime: 1 }).skip(skip).limit(boundedLimit).populate('importedBy', 'name email');
    const total = await Event.countDocuments(query);

    res.json({ events, pagination: { page: parseInt(page), limit: boundedLimit, total, pages: Math.ceil(total / boundedLimit) } });
  } catch (error) {
    console.error('Error fetching dashboard events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('importedBy', 'name email picture');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

router.post('/events/:id/import', async (req, res) => {
  try {
    const { importNotes } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    event.imported = true;
    event.importedAt = new Date();
    event.importedBy = req.user._id;
    event.importNotes = importNotes || '';
    event.status = 'imported';
    await event.save();

    const updatedEvent = await Event.findById(event._id).populate('importedBy', 'name email picture');
    res.json({ message: 'Event imported successfully', event: updatedEvent });
  } catch (error) {
    console.error('Error importing event:', error);
    res.status(500).json({ error: 'Failed to import event' });
  }
});

router.patch('/events/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'updated', 'inactive', 'imported'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const event = await Event.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('importedBy', 'name email picture');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event status updated', event });
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
});

router.get('/email-captures', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const captures = await EmailCapture.find()
      .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).populate('eventId', 'title dateTime sourceWebsite');
    const total = await EmailCapture.countDocuments();
    res.json({ captures, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    console.error('Error fetching email captures:', error);
    res.status(500).json({ error: 'Failed to fetch email captures' });
  }
});

router.get('/meta/cities', async (req, res) => res.json(CITIES));

export default router;