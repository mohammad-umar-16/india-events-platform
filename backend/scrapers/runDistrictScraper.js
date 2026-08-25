// Standalone District scraper - runs independently of the main orchestrator
// (npm run scrape), since District's direct-API approach was proven working
// in isolation but something environment-specific broke when imported
// through the shared eventScraper.js chain. This mirrors the original
// working standalone script almost exactly, just adding the DB save step.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import axios from 'axios';
import Event from '../models/Event.js';
import { normalizeCategory } from './utils/categoryMap.js';

dotenv.config();

const CITY_META = {
  Delhi: { city_id: 1, lat: 28.6139, lng: 77.209, key: 'new-delhi', pName: 'New Delhi', pState: 'delhi', placeId: 'ChIJJ2Y8jc3jDDkR67es_mNuAqw', subzone: '111', pCityId: '58' },
  Mumbai: { city_id: 3, lat: 19.128567073099326, lng: 72.87749886851958, key: 'mumbai', pName: 'Mumbai', pState: 'maharashtra', placeId: 'ChIJLRxpsh_I5zsR-oxj6sW1ZmM', subzone: '2117', pCityId: '20' },
  Bangalore: { city_id: 4, lat: 12.999581446760843, lng: 77.63576701984482, key: 'bengaluru', pName: 'Bengaluru', pState: 'karnataka', placeId: 'ChIJ0yIIfcQWrjsR5lDZQOy0ZCM', subzone: '5405', pCityId: '4' },
  Hyderabad: { city_id: 6, lat: 17.39784178559756, lng: 78.47682085228203, key: 'hyderabad', pName: 'Hyderabad', pState: 'telangana', placeId: 'ChIJY9_EyNiZyzsRSgkedoAUinI', subzone: '7001', pCityId: '12' },
  Pune: { city_id: 5, lat: 18.525186644572884, lng: 73.85291481807889, key: 'pune', pName: 'Pune', pState: 'maharashtra', placeId: 'ChIJsz3nt3zAwjsRoIMu5FN1Cco', subzone: '3009', pCityId: '23' }
};

const NCR_ALIASES = ['delhi', 'new delhi', 'gurugram', 'gurgaon', 'noida', 'faridabad', 'ghaziabad'];

function mapToOurCity(rawCity, requestedCity) {
  const lower = (rawCity || '').toLowerCase();
  if (requestedCity === 'Delhi' && NCR_ALIASES.includes(lower)) return 'Delhi';
  return requestedCity;
}

function generateChecksum(event) {
  const data = `${event.title}${event.dateTime}${event.venueName}${event.description}`;
  return crypto.createHash('md5').update(data).digest('hex');
}

async function fetchCity(cityName) {
  const meta = CITY_META[cityName];

  const headers = {
    'content-type': 'application/json',
    'origin': 'https://www.district.in',
    'referer': 'https://www.district.in/events/',
    'x-app-type': 'ed_web',
    'x-app-version': '11.11.1',
    'x-client-id': 'district-web',
    'x-city-id': String(meta.city_id),
    'x-city-key': meta.key,
    'x-city-name': cityName,
    'x-country-id': '1',
    'x-gps-lat': String(meta.lat),
    'x-gps-lng': String(meta.lng),
    'x-user-lat': String(meta.lat),
    'x-user-lng': String(meta.lng),
    'x-is-events-supported': 'true',
    'x-is-movies-supported': 'true',
    'x-available-tabs': 'movies,events,dining,shopping,attraction,play,comedy',
    'x-place-id': meta.placeId,
    'x-place-type': 'GOOGLE_PLACE',
    'x-pcity-id': meta.pCityId,
    'x-pcity-key': meta.key,
    'x-pcity-name': meta.pName,
    'x-pstate-key': meta.pState,
    'x-subzone-id': meta.subzone,
    'x-device-id': '1212',
    'x-guest-token': '1212'
  };

  const body = {
    layout_type: 'events_home_v2',
    location: { city_id: meta.city_id, user_lat: meta.lat, user_lng: meta.lng, gps_lat: meta.lat, gps_lng: meta.lng },
    request_type: 'tab_switch'
  };

  const res = await axios.post('https://www.district.in/gw/web/get_discovery_results', body, {
    headers, timeout: 15000, validateStatus: () => true
  });

  console.log(`District / ${cityName}: HTTP ${res.status}`);
  if (res.status !== 200) return [];

  const eventNodes = [];
  (function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.event_id && obj.name && obj.event_slug) eventNodes.push(obj);
    for (const key of Object.keys(obj)) walk(obj[key]);
  })(res.data);

  return eventNodes.map(node => ({
    title: node.name.trim(),
    dateTime: node.start_time_epoch ? new Date(node.start_time_epoch * 1000) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    venueName: node.venue_name || 'TBA',
    venueAddress: `${node.city || cityName}, India`,
    city: mapToOurCity(node.city, cityName),
    description: node.name.trim(),
    category: normalizeCategory(node.name),
    tags: [],
    imageUrl: node.image || node.horizontal_image || '',
    priceInfo: node.price_string || '',
    sourceWebsite: 'District',
    originalUrl: `https://district.in/events/${node.event_slug}`
  }));
}

async function saveEvents(events) {
  let newCount = 0, updatedCount = 0;
  for (const eventData of events) {
    const checksum = generateChecksum(eventData);
    const existing = await Event.findOne({ originalUrl: eventData.originalUrl });
    if (existing) {
      if (existing.checksum !== checksum) {
        Object.assign(existing, { ...eventData, checksum, status: 'updated', lastScrapedAt: new Date(), isActive: true });
        await existing.save();
        updatedCount++;
      }
    } else {
      await new Event({ ...eventData, checksum, status: 'new' }).save();
      newCount++;
    }
  }
  return { newCount, updatedCount };
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/india-events');
  console.log('✓ Connected to MongoDB');

  let allEvents = [];
  for (const city of Object.keys(CITY_META)) {
    const events = await fetchCity(city);
    console.log(`  -> ${events.length} events`);
    allEvents.push(...events);
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`\nTotal District events: ${allEvents.length}`);
  const { newCount, updatedCount } = await saveEvents(allEvents);
  console.log(`New: ${newCount}, Updated: ${updatedCount}`);

  await mongoose.connection.close();
  process.exit(0);
}

run().catch(err => {
  console.error('District scraper failed:', err);
  process.exit(1);
});
