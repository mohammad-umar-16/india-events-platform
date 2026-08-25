import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Event, { CITIES, CATEGORIES } from '../models/Event.js';
import EmailCapture from '../models/EmailCapture.js';
import { emailCaptureLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
const MAX_LIMIT = 100;

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
}

router.get('/',
  [
    query('city').optional().isIn(CITIES).withMessage('Invalid city'),
    query('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
    query('limit').optional().isInt({ min: 1, max: MAX_LIMIT }).toInt(),
    query('page').optional().isInt({ min: 1 }).toInt()
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { city, category, search, fromDate, toDate, page = 1, limit = 50 } = req.query;
      const query = { isActive: true, dateTime: { $gte: new Date() } };

      if (city) query.city = city;
      if (category) query.category = category;
   
      if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
       query.$or = [
         { title: { $regex: escaped, $options: 'i' } },
         { venueName: { $regex: escaped, $options: 'i' } },
         { description: { $regex: escaped, $options: 'i' } }
         ];
      }
      if (fromDate || toDate) {
        query.dateTime = {};
        if (fromDate) query.dateTime.$gte = new Date(fromDate);
        if (toDate) query.dateTime.$lte = new Date(toDate);
      }

      const boundedLimit = Math.min(parseInt(limit) || 50, MAX_LIMIT);
      const skip = (parseInt(page) - 1) * boundedLimit;

      const events = await Event.find(query)
        .sort({ dateTime: 1 }).skip(skip).limit(boundedLimit).select('-checksum -__v');
      const total = await Event.countDocuments(query);

      res.json({ events, pagination: { page: parseInt(page), limit: boundedLimit, total, pages: Math.ceil(total / boundedLimit) } });
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('-checksum -__v');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

router.post('/capture-email',
  emailCaptureLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('consent').isBoolean().withMessage('Consent must be true or false'),
    body('eventId').isMongoId().withMessage('Invalid event id')
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { email, consent, eventId } = req.body;
      if (!consent) return res.status(400).json({ error: 'User consent is required' });

      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });

      await EmailCapture.create({
        email, consent, eventId, eventTitle: event.title, eventDate: event.dateTime,
        ipAddress: req.ip, userAgent: req.get('user-agent')
      });

      res.json({ success: true, redirectUrl: event.originalUrl, message: 'Email captured successfully' });
    } catch (error) {
      console.error('Error capturing email:', error);
      res.status(500).json({ error: 'Failed to capture email' });
    }
  });

router.get('/meta/categories', async (req, res) => res.json(CATEGORIES));
router.get('/meta/cities', async (req, res) => res.json(CITIES));

export default router;