// Eventbrite India - hybrid rendering, Playwright for safety/consistency.
const CITY_SLUGS = {
  Delhi: 'india--new-delhi',
  Mumbai: 'india--mumbai',
  Bangalore: 'india--bangalore',
  Hyderabad: 'india--hyderabad',
  Pune: 'india--pune'
};
import { newStealthPage, autoScrollToLoadImages } from '../utils/browser.js';
import { normalizeCategory } from '../utils/categoryMap.js';

export async function scrape(browser, city) {
  const slug = CITY_SLUGS[city];
  if (!slug) return [];

  const { context, page } = await newStealthPage(browser);
  const events = [];

  try {
    await page.goto(`https://www.eventbrite.com/d/${slug}/events/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.waitForSelector('[data-testid="search-event-card"], .search-event-card', { timeout: 10000 }).catch(() => {});
    await autoScrollToLoadImages(page); // trigger lazy-loaded images before extracting

    const raw = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid="search-event-card"], .search-event-card, .event-card');
      return Array.from(cards).map(card => {
        const titleEl = card.querySelector('h3, h2, [class*="title"], [class*="Title"]');
        const linkEl = card.querySelector('a[href*="/e/"]');
        const dateEl = card.querySelector('[class*="date"], time, [datetime]');
        const venueEl = card.querySelector('[class*="venue"], [class*="location"]');
        const imgEl = card.querySelector('img');
        const priceEl = card.querySelector('[class*="price"]');
        return {
          title: titleEl?.textContent?.trim(),
          link: linkEl?.href,
          dateStr: dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime'),
          venue: venueEl?.textContent?.trim(),
          imageUrl: imgEl?.src,
          priceInfo: priceEl?.textContent?.trim()
        };
      }).filter(e => e.title && e.link);
    });

    raw.forEach(item => {
      events.push({
        title: item.title,
        dateTime: parseLooseDate(item.dateStr),
        venueName: item.venue || 'TBA',
        venueAddress: `${city}, India`,
        city,
        description: item.title,
        category: normalizeCategory(item.title),
        tags: [],
        imageUrl: item.imageUrl || '',
        priceInfo: item.priceInfo || '',
        sourceWebsite: 'Eventbrite',
        originalUrl: item.link
      });
    });
  } catch (err) {
    console.error(`[Eventbrite] ${city} scrape failed:`, err.message);
  } finally {
    await context.close();
  }

  return events;
}

function parseLooseDate(dateStr) {
  if (!dateStr) return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : parsed;
}