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

// Meetup's __NEXT_DATA__ contains an Apollo normalized cache
// (props.pageProps.__APOLLO_STATE__): entities are stored flat, keyed
// "Type:id". title/dateTime/eventUrl are inlined directly on each Event
// entity, but its photo is a SEPARATE PhotoInfo entity referenced via
// {"__ref": "PhotoInfo:id"} (PhotoInfo is reused across events + member
// avatars, so Apollo normalizes it) - confirmed via live page dump.
// We resolve that ref ourselves instead of expecting it inlined.
function collectEventNodes(obj, found = []) {
  if (!obj || typeof obj !== 'object') return found;
  // exact match, not /event/i - that regex also matched
  // RecommendedEventsEdge/RecommendedEventsConnection junk
  if (obj.__typename === 'Event' && (obj.title || obj.name) && obj.id) {
    found.push(obj);
  }
  for (const key of Object.keys(obj)) {
    collectEventNodes(obj[key], found);
  }
  return found;
}

function resolvePhotoUrl(eventNode, entityMap) {
  for (const key of Object.keys(eventNode)) {
    const val = eventNode[key];
    if (val && typeof val === 'object' && typeof val.__ref === 'string' && val.__ref.startsWith('PhotoInfo:')) {
      const photo = entityMap[val.__ref];
      if (photo?.highResUrl) return photo.highResUrl;
    }
  }
  return '';
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
    const entityMap = nextData?.props?.pageProps?.__APOLLO_STATE__ || {};
    const nodes = collectEventNodes(nextData);

    nodes.forEach(node => {
      const title = node.title || node.name;
      const link = node.eventUrl || node.url;
      if (!title || !link) return;

      const dateStr = node.dateTime || node.startTime || node.startDate;
      const venue = node.venue?.name || node.venue?.address || '';
      const imageUrl = resolvePhotoUrl(node, entityMap);

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