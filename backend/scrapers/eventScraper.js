import crypto from 'crypto';
import Event, { CITIES } from '../models/Event.js';
import { launchBrowser } from './utils/browser.js';
import * as allevents from './sources/allevents.js';
import * as townscript from './sources/townscript.js';

import * as meetup from './sources/meetup.js';
import * as eventbrite from './sources/eventbrite.js';

// Sources that need a real browser (JS-rendered) vs plain HTTP (server-rendered
// or, for Meetup, data extracted directly from its __NEXT_DATA__ JSON blob)
const BROWSER_SOURCES = [
  { name: 'AllEvents', module: allevents },
  { name: 'Townscript', module: townscript },
  { name: 'Eventbrite', module: eventbrite }
];
const HTTP_SOURCES = [
  { name: 'Meetup', module: meetup }
];

class EventScraper {
  generateChecksum(event) {
    const data = `${event.title}${event.dateTime}${event.venueName}${event.description}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  // Scrape every source x city combination. Browser-based sources share one
  // Chromium instance across all calls to avoid repeated launch overhead.
  async scrapeAll() {
    console.log('Starting India event scraping...');
    const allScraped = [];

    const browser = await launchBrowser();
    try {
      for (const { name, module } of BROWSER_SOURCES) {
        for (const city of CITIES) {
          try {
            const events = await module.scrape(browser, city);
            allScraped.push(...events);
            console.log(`✓ ${name} / ${city}: ${events.length} events`);
          } catch (error) {
            console.error(`✗ ${name} / ${city} failed:`, error.message);
          }
        }
      }
    } finally {
      await browser.close();
    }

    for (const { name, module } of HTTP_SOURCES) {
      for (const city of CITIES) {
        try {
          const events = await module.scrape(city);
          allScraped.push(...events);
          console.log(`✓ ${name} / ${city}: ${events.length} events`);
        } catch (error) {
          console.error(`✗ ${name} / ${city} failed:`, error.message);
        }
      }
    }

    console.log(`\nTotal events scraped: ${allScraped.length}`);
    return allScraped;
  }

  async saveEvents(events) {
    let newCount = 0;
    let updatedCount = 0;
    let inactiveCount = 0;

    for (const eventData of events) {
      try {
        const checksum = this.generateChecksum(eventData);
        const existingEvent = await Event.findOne({ originalUrl: eventData.originalUrl });

        if (existingEvent) {
          if (existingEvent.checksum !== checksum) {
            Object.assign(existingEvent, {
              title: eventData.title,
              dateTime: eventData.dateTime,
              venueName: eventData.venueName,
              venueAddress: eventData.venueAddress,
              description: eventData.description,
              category: eventData.category,
              imageUrl: eventData.imageUrl,
              priceInfo: eventData.priceInfo,
              lastScrapedAt: new Date(),
              checksum,
              status: 'updated',
              isActive: true
            });
            await existingEvent.save();
            updatedCount++;
          } else {
            existingEvent.lastScrapedAt = new Date();
            existingEvent.isActive = true;
            await existingEvent.save();
          }
        } else {
          const newEvent = new Event({ ...eventData, checksum, status: 'new' });
          await newEvent.save();
          newCount++;
        }
      } catch (error) {
        console.error(`Error saving event ${eventData.title}:`, error.message);
      }
    }

    const scrapedUrls = events.map(e => e.originalUrl);
    const result = await Event.updateMany(
      { originalUrl: { $nin: scrapedUrls }, isActive: true, dateTime: { $gte: new Date() } },
      { status: 'inactive', isActive: false, lastScrapedAt: new Date() }
    );
    inactiveCount = result.modifiedCount;

    console.log(`\nDatabase Update Summary:`);
    console.log(`  New events: ${newCount}`);
    console.log(`  Updated events: ${updatedCount}`);
    console.log(`  Inactive events: ${inactiveCount}`);

    return { newCount, updatedCount, inactiveCount };
  }

  async run() {
    console.log('='.repeat(50));
    console.log('EVENT SCRAPER - India Events');
    console.log('='.repeat(50));

    const events = await this.scrapeAll();

    if (events.length > 0) {
      return this.saveEvents(events);
    }

    return { newCount: 0, updatedCount: 0, inactiveCount: 0 };
  }
}

export default EventScraper;