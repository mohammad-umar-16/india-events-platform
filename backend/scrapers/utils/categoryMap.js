import { CATEGORIES } from '../../models/Event.js';

const KEYWORD_MAP = [
  { keywords: ['music', 'concert', 'gig', 'band', 'live performance', 'dj'], category: 'Music & Concerts' },
  { keywords: ['comedy', 'stand-up', 'standup', 'open mic'], category: 'Comedy' },
  { keywords: ['nightlife', 'party', 'club', 'lounge', 'edm'], category: 'Nightlife & Parties' },
  { keywords: ['workshop', 'class', 'course', 'training', 'masterclass'], category: 'Workshops & Classes' },
  { keywords: ['conference', 'business', 'summit', 'networking', 'seminar', 'expo', 'meetup', 'startup', 'tech'], category: 'Conferences & Business' },
  { keywords: ['theatre', 'theater', 'exhibition', 'art', 'literature', 'film', 'screening', 'culture'], category: 'Arts & Culture' },
  { keywords: ['sport', 'marathon', 'yoga', 'fitness', 'run', 'trek', 'adventure'], category: 'Sports & Fitness' },
  { keywords: ['food', 'drink', 'tasting', 'culinary', 'brunch', 'wine', 'beer'], category: 'Food & Drink' },
  { keywords: ['kids', 'family', 'children'], category: 'Kids & Family' },
  { keywords: ['spiritual', 'wellness', 'meditation', 'yoga retreat', 'religious', 'satsang'], category: 'Spiritual & Wellness' },
  { keywords: ['college', 'fest', 'youth', 'campus', 'hackathon'], category: 'College Fests & Youth' }
];

export function normalizeCategory(rawLabel = '') {
  const lower = rawLabel.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) return entry.category;
  }
  return CATEGORIES.includes(rawLabel) ? rawLabel : 'Other';
}