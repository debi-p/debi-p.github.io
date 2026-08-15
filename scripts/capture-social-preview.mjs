import { mkdir } from 'node:fs/promises';

import { loadPlaywright } from '../tests/helpers/playwright.mjs';

const siteUrl = 'http://127.0.0.1:4173';
const outputDirectory = new URL('../assets/images/', import.meta.url);
const outputPath = new URL('../assets/images/social-preview.png', import.meta.url);

await mkdir(outputDirectory, { recursive: true });

let browser;
try {
  const { chromium } = await loadPlaywright();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  await page.goto(siteUrl, { waitUntil: 'networkidle' });
  await page.addStyleTag({
    content: `
      .site-header,
      .impact-band { display: none !important; }
      .hero { height: 630px !important; min-height: 630px !important; }
      .hero-content {
        min-height: 630px !important;
        justify-content: center !important;
        padding: 46px min(520px, 43vw) 38px 0 !important;
      }
      .hero h1 { font-size: 4.25rem !important; }
      .hero-summary { font-size: 1.08rem !important; }
      .reveal-ready [data-reveal],
      [data-reveal] {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
      }
      *, *::before, *::after {
        animation: none !important;
        scroll-behavior: auto !important;
        transition: none !important;
      }
    `,
  });

  await page.waitForFunction(() => {
    const canvas = document.querySelector('#system-map');
    if (!canvas || canvas.width === 0 || canvas.height === 0) return false;
    const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
    if (!pixels) return false;

    let visiblePixels = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] > 0) visiblePixels += 1;
      if (visiblePixels > 100) return true;
    }
    return false;
  });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(100);
  await page.screenshot({
    path: outputPath.pathname,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });
} finally {
  await browser?.close();
}
