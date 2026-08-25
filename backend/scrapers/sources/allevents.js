// AllEvents.in - JS-rendered listing, needs Playwright.
// NOTE: selectors are best-effort based on typical AllEvents markup (event-card
// containers with title/venue/date/thumb children). Verify against live DOM
// periodically - AllEvents changes card markup without notice.
import { newStealthPage, autoScrollToLoadImages } from '../utils/browser.js';
import { normalizeCategory } from '../utils/categoryMap.js';

const CITY_SLUGS = {
  Delhi: 'new-delhi',
  Mumbai: 'mumbai',
  Bangalore: 'bangalore',
  Hyderabad: 'hyderabad',
  Pune: 'pune'
};

export async function scrape(browser, city) {
  const slug = CITY_SLUGS[city];
  if (!slug) return [];

  const { context, page } = await newStealthPage(browser);
  const events = [];

  try {
    await page.goto(`https://allevents.in/${slug}/all`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000); // let client-side rendering settle
    await page.waitForSelector('.event-card, [class*="event-card"], article', { timeout: 10000 }).catch(() => {});
    await autoScrollToLoadImages(page); // trigger lazy-loaded images before extracting
    await page.waitForTimeout(1500); // give lazy images time to finish loading

    const raw = await page.evaluate(() => {
      const cards = document.querySelectorAll('.event-card, [class*="event-card"], article[class*="event"]');
      return Array.from(cards).map(card => {
        const titleEl = card.querySelector('h3, h2, [class*="title"]');
        const linkEl = card.querySelector('a[href*="/e/"], a[href]');
        const dateEl = card.querySelector('[class*="date"], time');
        const venueEl = card.querySelector('[class*="venue"], [class*="location"]');
        const imgEl = card.querySelector('img');
        const priceEl = card.querySelector('[class*="price"], [class*="tickets"]');
        return {
          title: titleEl?.textContent?.trim(),
          link: linkEl?.href,
          dateStr: dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime'),
          venue: venueEl?.textContent?.trim(),
          // Real src may be a 1x1 lazy-load placeholder gif until the image
          // scrolls into view; check common lazy-load attributes as fallback.
          imageUrl: (imgEl?.src && !imgEl.src.startsWith('data:'))
            ? imgEl.src
            : (imgEl?.getAttribute('data-src')
              || imgEl?.getAttribute('data-lazy-src')
              || imgEl?.getAttribute('data-original')
              || imgEl?.getAttribute('data-echo')
              || imgEl?.src
              || ''),
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
        sourceWebsite: 'AllEvents',
        originalUrl: item.link
      });
    });
  } catch (err) {
    console.error(`[AllEvents] ${city} scrape failed:`, err.message);
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