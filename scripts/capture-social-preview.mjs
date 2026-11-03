import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { loadPlaywright } from '../tests/helpers/playwright.mjs';
import { startStaticServer } from './local-static-server.mjs';

const rootDirectory = fileURLToPath(new URL('..', import.meta.url));
const outputDirectory = new URL('../assets/images/', import.meta.url);
const outputPath = new URL('../assets/images/social-preview.png', import.meta.url);

await mkdir(outputDirectory, { recursive: true });

let browser;
let localServer;
try {
  const explicitUrl = process.env.PORTFOLIO_URL;
  localServer = explicitUrl ? null : await startStaticServer(rootDirectory);
  const siteUrl = explicitUrl || localServer.url;
  const { chromium } = await loadPlaywright();
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  const response = await page.goto(siteUrl, { waitUntil: 'networkidle' });
  if (!response?.ok()) throw new Error(`Portfolio returned HTTP ${response?.status() ?? 'unknown'}`);
  await page.addStyleTag({
    content: `
      .site-header { display: none !important; }
      .hero { height: 630px !important; min-height: 630px !important; }
      .hero-content {
        width: 100% !important;
        height: 630px !important;
        min-height: 630px !important;
        grid-template-columns: 42% 58% !important;
        padding: 0 !important;
      }
      .hero-portrait-frame { min-height: 630px !important; }
      .hero-copy { padding: 48px 64px !important; }
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
    const title = document.querySelector('#hero-title');
    const profile = document.querySelector('.hero-profile');
    return Boolean(
      title?.textContent?.trim() === 'Debi Prasad Pradhan'
      && profile?.complete
      && profile.naturalWidth > 0
      && profile.naturalHeight > 0,
    );
  });
  await page.evaluate(() => document.fonts?.ready ?? Promise.resolve());
  await page.waitForTimeout(100);
  await page.screenshot({
    path: outputPath.pathname,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });
} finally {
  try {
    await browser?.close();
  } finally {
    await localServer?.close();
  }
}
