
import { newStealthPage } from '../utils/browser.js';
import { normalizeCategory } from '../utils/categoryMap.js';

const CITY_SLUGS = {
  Delhi: 'india--new-delhi',
  Mumbai: 'india--mumbai',
  Bangalore: 'india--bangalore',
  Hyderabad: 'india--hyderabad',
  Pune: 'india--pune'
};

export async function scrape(browser, city) {
  const slug = CITY_SLUGS[city];
  if (!slug) return [];

  const { context, page } = await newStealthPage(browser);
  const events = [];

  try {
    let items = [];

    for (let attempt = 1; attempt <= 2; attempt++) {
      await page.goto(`https://www.eventbrite.com/d/${slug}/events/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(attempt === 1 ? 1500 : 3000);

      items = await page.evaluate(() => {
        // eslint-disable-next-line no-undef
        const data = window.__SERVER_DATA__;
        return data?.jsonld?.[0]?.itemListElement || [];
      });

      if (items.length > 0) break;
      if (attempt === 1) console.log(`[Eventbrite] ${city}: 0 items on first attempt, retrying with longer wait...`);
    }

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
  } finally {
    await context.close();
  }

  return events;
}