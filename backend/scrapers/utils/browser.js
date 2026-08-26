import { chromium } from 'playwright';

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

export async function autoScrollToLoadImages(page, { stepDelay = 350, maxSteps = 40 } = {}) {

  let steps = 0;
  let lastHeight = 0;
  while (steps < maxSteps) {
    const { scrollY, innerHeight, scrollHeight } = await page.evaluate(() => ({
      scrollY: window.scrollY,
      innerHeight: window.innerHeight,
      scrollHeight: document.body.scrollHeight
    }));

    if (scrollY + innerHeight >= scrollHeight - 50) break; // reached the bottom
    if (scrollHeight === lastHeight && steps > 3) break; // page stopped growing, avoid spinning

    lastHeight = scrollHeight;
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5));
    await page.waitForTimeout(stepDelay);
    steps++;
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}