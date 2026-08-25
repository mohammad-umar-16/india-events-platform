import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EventScraper from './eventScraper.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/india-events';

async function runScraper() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    await new EventScraper().run();
    console.log('\n✓ Scraping completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Scraping failed:', error);
    process.exit(1);
  }
}

runScraper();