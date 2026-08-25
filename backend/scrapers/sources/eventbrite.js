import axios from 'axios';
import { normalizeCategory } from '../utils/categoryMap.js';

const CITY_SLUGS = {
  Delhi: 'india--new-delhi',
  Mumbai: 'india--mumbai',
  Bangalore: 'india--bangalore',
  Hyderabad: 'india--hyderabad',
  Pune: 'india--pune'
};

// Eventbrite embeds clean Schema.org JSON-LD event data inside
// window.__SERVER_DATA__.jsonld[0].itemListElement[].item - confirmed
// via live page dump. No DOM parsing needed; each item already has
// name/url/image/startDate/location(address+geo).
export async function scrape(city) {
  const slug = CITY_SLUGS[city];
  if (!slug) return [];

  const events = [];
  try {
    const { data } = await axios.get(`https://www.eventbrite.com/d/${slug}/events/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });

    const marker = 'window.__SERVER_DATA__ = ';
    const startIdx = data.indexOf(marker);
    if (startIdx === -1) {
      console.error(`[Eventbrite] ${city}: __SERVER_DATA__ not found on page`);
      return [];
    }

    // brace-matching extraction since the JSON is inlined in a <script> tag, not isolated
    const jsonStart = startIdx + marker.length;
    let depth = 0, i = jsonStart, started = false;
    for (; i < data.length; i++) {
      if (data[i] === '{') { depth++; started = true; }
      else if (data[i] === '}') { depth--; if (started && depth === 0) break; }
    }
    const serverData = JSON.parse(data.slice(jsonStart, i + 1));
    if (city === 'Delhi') {
  console.log(`[Eventbrite DEBUG] jsonld exists:`, !!serverData?.jsonld);
  console.log(`[Eventbrite DEBUG] jsonld length:`, serverData?.jsonld?.length);
  console.log(`[Eventbrite DEBUG] itemListElement length:`, serverData?.jsonld?.[0]?.itemListElement?.length);
}

    const items = serverData?.jsonld?.[0]?.itemListElement || [];
    items.forEach(entry => {
      const ev = entry.item;
      if (!ev?.name || !ev?.url) return;

      const addr = ev.location?.address;
      const venueAddress = addr
        ? [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode].filter(Boolean).join(', ')
        : `${city}, India`;

      events.push({
        title: ev.name,
        dateTime: ev.startDate ? new Date(ev.startDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        venueName: ev.location?.name || 'TBA',
        venueAddress,
        city,
        description: ev.description || `Eventbrite event - ${ev.name}`,
        category: normalizeCategory(ev.name),
        tags: [],
        imageUrl: ev.image || '',
        priceInfo: '',
        sourceWebsite: 'Eventbrite',
        originalUrl: ev.url
      });
    });
  } catch (err) {
    console.error(`[Eventbrite] ${city} scrape failed:`, err.message);
  }

  return events;
}