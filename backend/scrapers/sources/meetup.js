// Meetup - Next.js app. Real data lives in a <script id="__NEXT_DATA__"> JSON
// blob (Apollo cache), NOT in scrapeable DOM classes - confirmed from a live
// page dump. This is axios+cheerio (no browser needed) extracting that JSON
// and recursively collecting Event-typed nodes, which is far more robust
// than guessing CSS selectors on a Next.js app.
//
// NOTE: the dump used to confirm this was a topic/groups page, not the
// /find/ events search page, so exact Event field names are a best-effort
// guess (title/name, dateTime/startTime, venue, eventUrl/url, imageUrl) -
// verify against a real /find/ events page dump if this returns 0 results.
import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeCategory } from '../utils/categoryMap.js';

const CITY_LOCATIONS = {
  Delhi: 'in--delhi',
  Mumbai: 'in--mumbai',
  Bangalore: 'in--bangalore',
  Hyderabad: 'in--hyderabad',
  Pune: 'in--pune'
};

function collectEventNodes(obj, found = []) {
  if (!obj || typeof obj !== 'object') return found;
  if (obj.__typename && /event/i.test(obj.__typename) && (obj.title || obj.name)) {
    found.push(obj);
  }
  for (const key of Object.keys(obj)) {
    collectEventNodes(obj[key], found);
  }
  return found;
}

export async function scrape(city) {
  const location = CITY_LOCATIONS[city];
  if (!location) return [];

  const events = [];
  try {
    const { data } = await axios.get(`https://www.meetup.com/find/?location=${location}&source=EVENTS`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });

    const $ = cheerio.load(data);
    const nextDataRaw = $('#__NEXT_DATA__').html();
    if (!nextDataRaw) {
      console.error(`[Meetup] ${city}: __NEXT_DATA__ script not found on page`);
      return [];
    }

    const nextData = JSON.parse(nextDataRaw);
    const nodes = collectEventNodes(nextData);

    nodes.forEach(node => {
      const title = node.title || node.name;
      const link = node.eventUrl || node.url;
      if (!title || !link) return;

      const dateStr = node.dateTime || node.startTime || node.startDate;
      const venue = node.venue?.name || node.venue?.address || '';
      const imageUrl = node.keyEventPhoto?.standardUrl || node.image?.url || node.eventPhoto?.highResUrl || '';

      const cat = normalizeCategory(title);
      events.push({
        title,
        dateTime: parseLooseDate(dateStr),
        venueName: venue || 'TBA',
        venueAddress: `${city}, India`,
        city,
        description: `Meetup event - ${title}`,
        category: cat === 'Other' ? 'Conferences & Business' : cat,
        tags: [],
        imageUrl,
        priceInfo: '',
        sourceWebsite: 'Meetup',
        originalUrl: link.startsWith('http') ? link : `https://www.meetup.com${link}`
      });
    });
  } catch (err) {
    console.error(`[Meetup] ${city} scrape failed:`, err.message);
  }

  return events;
}

function parseLooseDate(dateStr) {
  if (!dateStr) return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : parsed;
}