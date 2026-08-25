// District (formerly Paytm Insider / insider.in) - direct API call, no
// browser needed. Confirmed live: the internal get_discovery_results API
// accepts a static x-device-id/x-guest-token pair ('1212') without requiring
// a real authenticated session - city selection is entirely header-driven
// (x-city-id, x-place-id, lat/lng, etc.), no URL routing involved.
// This is simpler and faster than driving the UI, though as with any
// internal (non-SEO-facing) API on an Akamai-protected site, it isn't
// guaranteed to keep working forever if District changes their API.
import axios from 'axios';
import { normalizeCategory } from '../utils/categoryMap.js';
import fs from 'fs';
import path from 'path';

const CITY_META = {
  Delhi: { city_id: 1, lat: 28.6139, lng: 77.209, key: 'new-delhi', pName: 'New Delhi', pState: 'delhi', placeId: 'ChIJJ2Y8jc3jDDkR67es_mNuAqw', subzone: '111', pCityId: '58' },
  Mumbai: { city_id: 3, lat: 19.128567073099326, lng: 72.87749886851958, key: 'mumbai', pName: 'Mumbai', pState: 'maharashtra', placeId: 'ChIJLRxpsh_I5zsR-oxj6sW1ZmM', subzone: '2117', pCityId: '20' },
  Bangalore: { city_id: 4, lat: 12.999581446760843, lng: 77.63576701984482, key: 'bengaluru', pName: 'Bengaluru', pState: 'karnataka', placeId: 'ChIJ0yIIfcQWrjsR5lDZQOy0ZCM', subzone: '5405', pCityId: '4' },
  Hyderabad: { city_id: 6, lat: 17.39784178559756, lng: 78.47682085228203, key: 'hyderabad', pName: 'Hyderabad', pState: 'telangana', placeId: 'ChIJY9_EyNiZyzsRSgkedoAUinI', subzone: '7001', pCityId: '12' },
  Pune: { city_id: 5, lat: 18.525186644572884, lng: 73.85291481807889, key: 'pune', pName: 'Pune', pState: 'maharashtra', placeId: 'ChIJsz3nt3zAwjsRoIMu5FN1Cco', subzone: '3009', pCityId: '23' }
};

// NCR suburbs commonly show up under Delhi's request even though they carry
// their own city name in the response data - fold them into our Delhi bucket
// since our schema only tracks broad metros.
const NCR_ALIASES = ['delhi', 'new delhi', 'gurugram', 'gurgaon', 'noida', 'faridabad', 'ghaziabad'];

function mapToOurCity(rawCity, requestedCity) {
  const lower = (rawCity || '').toLowerCase();
  if (requestedCity === 'Delhi' && NCR_ALIASES.includes(lower)) return 'Delhi';
  return requestedCity;
}

export async function scrape(city) {
  const meta = CITY_META[city];
  if (!meta) return [];

  // Unconditional diagnostic - always prints regardless of DISTRICT_DEBUG,
  // so we can see exactly what value process.env actually holds at runtime.
  console.log(`[District debug] ${city}: DISTRICT_DEBUG env value = "${process.env.DISTRICT_DEBUG}"`);

  // Match the spacing from the working standalone test - our orchestrator
  // calls all 5 cities back-to-back with no gap, unlike the isolated test
  // that worked, so this rules that out as a factor.
  await new Promise((r) => setTimeout(r, 800));

  const events = [];

  const headers = {
    'content-type': 'application/json',
    'origin': 'https://www.district.in',
    'referer': 'https://www.district.in/events/',
    'x-app-type': 'ed_web',
    'x-app-version': '11.11.1',
    'x-client-id': 'district-web',
    'x-city-id': String(meta.city_id),
    'x-city-key': meta.key,
    'x-city-name': city,
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
    location: {
      city_id: meta.city_id,
      user_lat: meta.lat,
      user_lng: meta.lng,
      gps_lat: meta.lat,
      gps_lng: meta.lng
    },
    request_type: 'tab_switch'
  };

  try {
    const res = await axios.post(
      'https://www.district.in/gw/web/get_discovery_results',
      body,
      { headers, timeout: 15000, validateStatus: () => true }
    );

    if (res.status !== 200) {
      console.error(`[District] ${city}: HTTP ${res.status}`);
      return [];
    }

    // Always write the debug file for now - unconditional, to stop chasing
    // why the DISTRICT_DEBUG flag wasn't taking effect.
    const debugPath = path.join(process.cwd(), `debug-district-${city}.json`);
    fs.writeFileSync(debugPath, JSON.stringify(res.data, null, 2));
    console.log(`[District debug] ${city}: saved response to ${debugPath}`);

    const eventNodes = [];
    (function walk(obj) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.event_id && obj.name && obj.event_slug) eventNodes.push(obj);
      for (const key of Object.keys(obj)) walk(obj[key]);
    })(res.data);

    eventNodes.forEach(node => {
      events.push({
        title: node.name.trim(),
        dateTime: node.start_time_epoch ? new Date(node.start_time_epoch * 1000) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        venueName: node.venue_name || 'TBA',
        venueAddress: `${node.city || city}, India`,
        city: mapToOurCity(node.city, city),
        description: node.name.trim(),
        category: normalizeCategory(node.name),
        tags: [],
        imageUrl: node.image || node.horizontal_image || '',
        priceInfo: node.price_string || '',
        sourceWebsite: 'District',
        originalUrl: `https://district.in/events/${node.event_slug}`
      });
    });
  } catch (err) {
    console.error(`[District] ${city} scrape failed:`, err.message);
  }

  return events;
}