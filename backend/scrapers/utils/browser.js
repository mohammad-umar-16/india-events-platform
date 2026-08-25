import { chromium } from 'playwright';

// Shared headless browser launcher for JS-rendered sources.
// One browser instance per scrape run, reused across sources/pages to avoid
// repeated Chromium boot cost - each source module opens/closes its own page.
export async function launchBrowser() {
  return chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
}

export async function newStealthPage(browser) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
    locale: 'en-IN'
  });
  const page = await context.newPage();
  return { context, page };
}

// Mobile-emulated context - some sites (confirmed: District) serve
// meaningfully different markup/interaction flow at mobile viewport widths
// than desktop, so a source that was inspected on a phone-sized screen
// should scrape with a matching viewport rather than the default desktop one.
export async function newMobileStealthPage(browser) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36',
    viewport: { width: 393, height: 680 },
    isMobile: true,
    hasTouch: true,
    locale: 'en-IN'
  });
  const page = await context.newPage();
  return { context, page };
}

// Most sites only populate an <img>'s real src once it scrolls into view
// (lazy loading) - without this, only cards visible on initial load get a
// real image and everything below the fold stays empty. Scrolls down in
// steps, pausing to let each batch load, then scrolls back to top.
export async function autoScrollToLoadImages(page, { steps = 8, stepDelay = 400 } = {}) {
  for (let i = 0; i < steps; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5));
    await page.waitForTimeout(stepDelay);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}