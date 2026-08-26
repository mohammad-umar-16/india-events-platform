
import { newStealthPage, autoScrollToLoadImages } from '../utils/browser.js';
import { normalizeCategory } from '../utils/categoryMap.js';

const CITY_SLUGS = { Delhi: 'delhi', Mumbai: 'mumbai', Bangalore: 'bengaluru', Hyderabad: 'hyderabad', Pune: 'pune' };

export async function scrape(browser, city) {
  const slug = CITY_SLUGS[city];
  if (!slug) return [];

  const { context, page } = await newStealthPage(browser);
  const events = [];

  try {
    await page.goto(`https://www.townscript.com/in/${slug}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000); // Angular SPA needs real time to bootstrap and render
    await page.waitForSelector('.card-container, .event-card, [class*="event-card"]', { timeout: 10000 }).catch(() => {});
    await autoScrollToLoadImages(page); // trigger lazy-loaded images before extracting
    await page.waitForTimeout(1500); // let blur-up placeholders finish swapping to sharp images

    const raw = await page.evaluate(() => {
      const cards = document.querySelectorAll('.card-container, .event-card, [class*="event-card"]');
      return Array.from(cards).map(card => {
        const linkEl = card.tagName === 'A' ? card : card.querySelector('a');
        const titleEl = card.querySelector('.event-name, h3, h2, [class*="title"]');
        const dateEl = card.querySelector('[class*="date"], time');
        const venueEl = card.querySelector('.location, [class*="venue"], [class*="location"]');
        const imgEl = card.querySelector('img');
        const priceEl = card.querySelector('[class*="price"]');
        return {
          title: titleEl?.textContent?.trim(),
          link: linkEl?.href,
          dateStr: dateEl?.textContent?.trim(),
          venue: venueEl?.textContent?.trim(),
          imageUrl: imgEl?.src,
          priceInfo: priceEl?.textContent?.trim()
        };
      }).filter(e => e.title && e.link);
    });

    raw.forEach(item => {
      // Imgix blur-up placeholders sometimes still linger in src at extraction
      // time even after the wait above - strip the blur param as a fallback.
      const cleanImage = item.imageUrl
        ? item.imageUrl.replace(/([?&])blur=\d+&?/i, '$1').replace(/[?&]$/, '')
        : '';
      events.push({
        title: item.title,
        dateTime: parseLooseDate(item.dateStr),
        venueName: item.venue || 'TBA',
        venueAddress: `${city}, India`,
        city,
        description: item.title,
        category: normalizeCategory(item.title),
        tags: [],
        imageUrl: cleanImage,
        priceInfo: item.priceInfo || '',
        sourceWebsite: 'Townscript',
        originalUrl: item.link
      });
    });
  } catch (err) {
    console.error(`[Townscript] ${city} scrape failed:`, err.message);
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