import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadPlaywright } from './helpers/playwright.mjs';
import { startStaticServer } from '../scripts/local-static-server.mjs';

const rootDirectory = fileURLToPath(new URL('..', import.meta.url));
const artifactsDirectory = fileURLToPath(new URL('../artifacts/', import.meta.url));
const baselinesDirectory = fileURLToPath(new URL('./baselines/', import.meta.url));
const { chromium } = await loadPlaywright();
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const localServer = await startStaticServer(rootDirectory);
const baseUrl = localServer.url;
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
} catch (error) {
  await localServer.close();
  throw error;
}

await mkdir(artifactsDirectory, { recursive: true });
await mkdir(baselinesDirectory, { recursive: true });

test.after(async () => {
  try {
    await browser.close();
  } finally {
    await localServer.close();
  }
});

test('generated visual artifacts remain untracked', async () => {
  const gitignore = await readFile(new URL('../.gitignore', import.meta.url), 'utf8');
  assert.match(gitignore, /^artifacts\/$/m);
});

function isSameOrigin(url) {
  try {
    return new URL(url).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}

function collectBrowserFailures(page) {
  const failures = [];

  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    if (isSameOrigin(request.url())) {
      failures.push(`requestfailed: ${request.method()} ${request.url()}`);
    }
  });
  page.on('response', (response) => {
    if (isSameOrigin(response.url()) && response.status() >= 400) {
      failures.push(`response: ${response.status()} ${response.url()}`);
    }
  });

  return failures;
}

async function withPage(options, run) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const browserFailures = collectBrowserFailures(page);

  try {
    await run(page);
    assert.deepEqual(browserFailures, [], 'browser must not report runtime or response failures');
  } finally {
    await context.close();
  }
}

async function openPortfolio(page) {
  const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
  assert.equal(response?.status(), 200);
}

async function assertNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  assert.ok(
    dimensions.scrollWidth <= dimensions.clientWidth + 1,
    `document overflows horizontally: ${dimensions.scrollWidth} > ${dimensions.clientWidth}`,
  );
  assert.ok(
    dimensions.bodyScrollWidth <= dimensions.bodyClientWidth + 1,
    `body overflows horizontally: ${dimensions.bodyScrollWidth} > ${dimensions.bodyClientWidth}`,
  );
}

async function assertReferenceLayout(page) {
  const layout = await page.evaluate(() => {
    const hero = document.querySelector('.hero-content');
    const portrait = document.querySelector('.hero-portrait-frame');
    const copy = document.querySelector('.hero-copy');
    const faq = document.querySelector('.faq-column');
    const contact = document.querySelector('.contact-panel');
    const heroStyle = getComputedStyle(hero);
    return {
      contactBesideFaq: contact.getBoundingClientRect().left > faq.getBoundingClientRect().left,
      heroColumns: heroStyle.gridTemplateColumns.split(' ').length >= 2,
      portraitLeft: portrait.getBoundingClientRect().left < copy.getBoundingClientRect().left,
      systemImages: document.querySelectorAll('.system-card img').length,
    };
  });
  assert.equal(layout.portraitLeft, true);
  assert.equal(layout.contactBesideFaq, true);
  assert.equal(layout.heroColumns, true);
  assert.equal(layout.systemImages, 4);
}

async function assertVisibleCaseControls(page) {
  const controls = page.locator('[data-case-study]');
  assert.equal(await controls.count(), 4);
  for (let index = 0; index < 4; index += 1) {
    assert.equal(await controls.nth(index).isVisible(), true, `case control ${index + 1} must be visible`);
  }
}

async function openReleaseHub(page) {
  const trigger = page.getByRole('button', { name: 'Inspect ReleaseHub system' });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  return { dialog, trigger };
}

async function assertAllHeadingsFit(page) {
  const overflows = await page.locator('h2').evaluateAll((headings) => {
    return headings
      .filter((heading) => heading.scrollWidth > heading.clientWidth + 1)
      .map((heading) => heading.textContent.trim());
  });
  assert.deepEqual(overflows, [], `h2 text overflows: ${overflows.join(' | ')}`);
}

async function assertVisibleTextWithinViewport(page) {
  const viewportHeight = page.viewportSize().height;
  const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.max(1, Math.floor(viewportHeight * 0.75));

  for (let y = 0; y < documentHeight; y += step) {
    await page.evaluate((nextY) => window.scrollTo(0, nextY), y);
    await page.waitForTimeout(20);
    const violations = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight;
      const selector = 'h1, h2, h3, p, a, button, strong, span, time, li';
      return [...document.querySelectorAll(selector)].flatMap((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const visible = style.display !== 'none'
          && style.visibility !== 'hidden'
          && style.opacity !== '0'
          && rect.width > 0
          && rect.height > 0
          && rect.bottom > 0
          && rect.top < viewportHeight;
        if (!visible || element.textContent.trim() === '') return [];
        if (rect.left >= -1 && rect.right <= viewportWidth + 1) return [];
        return [{
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          text: element.textContent.trim().replace(/\s+/g, ' ').slice(0, 80),
        }];
      });
    });
    assert.deepEqual(violations, [], `visible text escapes viewport near scrollY ${y}`);
  }
}

async function assertAllRevealContentVisible(page) {
  const hidden = await page.locator('[data-reveal]').evaluateAll((elements) => {
    return elements.flatMap((element) => {
      const style = getComputedStyle(element);
      return style.opacity === '1' && style.visibility !== 'hidden'
        ? []
        : [element.textContent.trim().replace(/\s+/g, ' ').slice(0, 80)];
    });
  });
  assert.deepEqual(hidden, [], `screenshot contains unrevealed content: ${hidden.join(' | ')}`);
}

async function prepareFullPageScreenshot(page) {
  const reveals = page.locator('[data-reveal]');
  const count = await reveals.count();
  for (let index = 0; index < count; index += 1) {
    await reveals.nth(index).evaluate((element) => {
      element.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForFunction((revealIndex) => {
      return document.querySelectorAll('[data-reveal]')[revealIndex]?.classList
        .contains('is-visible');
    }, index);
  }

  await page.waitForTimeout(550);
  await page.evaluate(() => {
    document.activeElement?.blur();
    const year = document.querySelector('[data-current-year]');
    if (year) year.textContent = 'YEAR';
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => window.scrollY === 0);
  await assertAllRevealContentVisible(page);
}

async function assertMatchesBaseline(page, artifactName) {
  const artifactPath = path.join(artifactsDirectory, artifactName);
  const baselinePath = path.join(baselinesDirectory, artifactName);
  const current = await readFile(artifactPath);

  if (process.env.UPDATE_VISUAL_BASELINES === '1') {
    await writeFile(baselinePath, current);
  }

  const baseline = await readFile(baselinePath);
  const comparison = await page.evaluate(async ({ baselineBase64, currentBase64 }) => {
    const decode = (base64) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = `data:image/png;base64,${base64}`;
    });
    const [expected, actual] = await Promise.all([
      decode(baselineBase64),
      decode(currentBase64),
    ]);
    if (expected.width !== actual.width || expected.height !== actual.height) {
      return {
        actual: [actual.width, actual.height],
        expected: [expected.width, expected.height],
        ratio: 1,
      };
    }

    const canvas = document.createElement('canvas');
    canvas.width = actual.width;
    canvas.height = actual.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(expected, 0, 0);
    const expectedPixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(actual, 0, 0);
    const actualPixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let differentPixels = 0;
    for (let index = 0; index < actualPixels.length; index += 4) {
      const maximumDelta = Math.max(
        Math.abs(actualPixels[index] - expectedPixels[index]),
        Math.abs(actualPixels[index + 1] - expectedPixels[index + 1]),
        Math.abs(actualPixels[index + 2] - expectedPixels[index + 2]),
        Math.abs(actualPixels[index + 3] - expectedPixels[index + 3]),
      );
      if (maximumDelta > 24) differentPixels += 1;
    }
    return {
      actual: [actual.width, actual.height],
      expected: [expected.width, expected.height],
      ratio: differentPixels / (actual.width * actual.height),
    };
  }, {
    baselineBase64: baseline.toString('base64'),
    currentBase64: current.toString('base64'),
  });

  assert.deepEqual(comparison.actual, comparison.expected, `${artifactName} dimensions changed`);
  assert.ok(
    comparison.ratio <= 0.003,
    `${artifactName} differs from its approved baseline by ${(comparison.ratio * 100).toFixed(2)}%`,
  );
}

async function captureSectionBaselines(page, viewportName) {
  await page.addStyleTag({
    content: `
      .site-header { position: relative !important; }
      .skip-link { display: none !important; }
      *, *::before, *::after {
        animation: none !important;
        caret-color: transparent !important;
        transition: none !important;
      }
    `,
  });
  const sections = [
    ['hero', '.hero'],
    ['systems', '#systems'],
    ['projects', '#projects'],
    ['faqs', '#faqs'],
  ];
  for (const [sectionName, selector] of sections) {
    const artifactName = `${viewportName}-${sectionName}.png`;
    await page.locator(selector).screenshot({
      animations: 'disabled',
      path: path.join(artifactsDirectory, artifactName),
    });
    await assertMatchesBaseline(page, artifactName);
  }
}

test('desktop renders the complete portfolio and interactive case study', async () => {
  await withPage({ viewport: { width: 1440, height: 1000 } }, async (page) => {
    await openPortfolio(page);
    await page.locator('.project').first().waitFor({ state: 'visible' });

    assert.equal(
      (await page.locator('h1').textContent()).trim(),
      'Debi Prasad Pradhan',
    );
    assert.equal(await page.locator('.project').first().isVisible(), true);
    assert.equal(await page.locator('.hero-profile').isVisible(), true);
    const heroImage = await page.locator('.hero-profile').evaluate((image) => ({
      complete: image.complete,
      naturalHeight: image.naturalHeight,
      naturalWidth: image.naturalWidth,
    }));
    assert.equal(heroImage.complete, true);
    assert.ok(heroImage.naturalWidth > 0 && heroImage.naturalHeight > 0, 'hero image must load');
    assert.equal(await page.locator('#systems .system-card').count(), 4);
    await assertVisibleCaseControls(page);
    await assertNoHorizontalOverflow(page);
    assert.equal(await page.locator('canvas, #system-map').count(), 0);
    await assertReferenceLayout(page);

    const firstProject = page.locator('.project').first();
    assert.equal(
      await firstProject.getByRole('link', { name: 'View Source', exact: true }).getAttribute('href'),
      'https://github.com/debi-p/codeblockplay',
    );
    assert.equal(
      await firstProject.getByRole('link', { name: 'Explore Live', exact: true }).getAttribute('href'),
      'https://codeblockplay.github.io/',
    );

    const firstFaq = page.locator('#faqs details').first();
    assert.equal(await firstFaq.getAttribute('open'), null);
    await firstFaq.locator('summary').click();
    assert.notEqual(await firstFaq.getAttribute('open'), null, 'FAQ must expand');

    let { dialog, trigger } = await openReleaseHub(page);
    assert.equal(
      (await page.locator('#case-study-metric').textContent()).trim(),
      '1TB Web Upload Support · Secure Release Distribution',
    );
    assert.match(await dialog.textContent(), /Architecture & delivery leadership/);
    assert.ok((await page.locator('#case-study-role').textContent()).trim().length > 30);
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await trigger.evaluate((element) => document.activeElement === element), true);

    ({ dialog, trigger } = await openReleaseHub(page));
    await page.getByRole('button', { name: 'Close case study' }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await trigger.evaluate((element) => document.activeElement === element), true);

    const resumeResults = await page.evaluate(async () => {
      const urls = [...new Set([...document.querySelectorAll('a[href$=".pdf"]')]
        .map((link) => link.href))];
      return Promise.all(urls.map(async (url) => {
        const response = await fetch(url);
        const body = new Uint8Array(await response.arrayBuffer());
        const signature = String.fromCharCode(...body.subarray(0, 5));
        return {
          contentType: response.headers.get('content-type') || '',
          signature,
          status: response.status,
          url,
        };
      }));
    });
    assert.equal(resumeResults.length, 1);
    for (const result of resumeResults) {
      assert.equal(result.status, 200, `${result.url} must return 200`);
      assert.ok(
        result.contentType.includes('application/pdf') || result.signature === '%PDF-',
        `${result.url} must identify as a PDF`,
      );
    }

    await prepareFullPageScreenshot(page);
    const artifactName = 'portfolio-desktop.png';
    await page.screenshot({
      path: path.join(artifactsDirectory, artifactName),
      fullPage: true,
    });
    await captureSectionBaselines(page, 'desktop');
  });
});

test('mobile navigation, project, dialog, and full page stay usable', async () => {
  await withPage({ viewport: { width: 390, height: 844 } }, async (page) => {
    await openPortfolio(page);
    await page.locator('.project').first().waitFor({ state: 'visible' });

    const toggle = page.locator('.nav-toggle');
    assert.equal(await toggle.isVisible(), true);
    assert.equal(await toggle.getAttribute('aria-label'), 'Open navigation');
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await toggle.getAttribute('aria-label'), 'Close navigation');
    assert.equal(await page.locator('#site-navigation').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await toggle.evaluate((element) => document.activeElement === element), true);

    const project = page.locator('.project').first();
    assert.equal(
      await project.getByRole('link', { name: 'View Source', exact: true }).getAttribute('href'),
      'https://github.com/debi-p/codeblockplay',
    );
    assert.equal(
      await project.getByRole('link', { name: 'Explore Live', exact: true }).getAttribute('href'),
      'https://codeblockplay.github.io/',
    );
    await assertNoHorizontalOverflow(page);

    await assertVisibleTextWithinViewport(page);
    await assertNoHorizontalOverflow(page);

    const { dialog } = await openReleaseHub(page);
    const dialogLayout = await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const canScroll = element.scrollHeight > element.clientHeight;
      element.scrollTop = element.scrollHeight;
      return {
        bottom: rect.bottom,
        canScroll,
        left: rect.left,
        right: rect.right,
        scrollTop: element.scrollTop,
        top: rect.top,
      };
    });
    assert.ok(dialogLayout.left >= -1 && dialogLayout.right <= 391, 'dialog must fit mobile width');
    assert.ok(dialogLayout.top >= -1 && dialogLayout.bottom <= 845, 'dialog must fit mobile height');
    assert.equal(dialogLayout.canScroll, true, 'long dialog content must be scrollable');
    assert.ok(dialogLayout.scrollTop > 0, 'dialog scroll position must advance');
    await page.getByRole('button', { name: 'Close case study' }).click();

    await prepareFullPageScreenshot(page);
    const artifactName = 'portfolio-mobile.png';
    await page.screenshot({
      path: path.join(artifactsDirectory, artifactName),
      fullPage: true,
    });
    await captureSectionBaselines(page, 'mobile');
  });
});

test('responsive boundaries keep headings and hero regions contained', async () => {
  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
  ]) {
    await withPage({ viewport }, async (page) => {
      await openPortfolio(page);
      await assertNoHorizontalOverflow(page);
      await assertAllHeadingsFit(page);
      assert.equal(await page.locator('#systems .system-card').count(), 4);
      assert.equal(await page.locator('#faqs details').count(), 4);
      assert.equal(await page.locator('#contact').isVisible(), true);
    });
  }
});

test('intermediate navigation remains collapsed and usable at 800px', async () => {
  await withPage({ viewport: { width: 800, height: 900 } }, async (page) => {
    await openPortfolio(page);

    const toggle = page.locator('.nav-toggle');
    const navigation = page.locator('#site-navigation');
    assert.equal(await toggle.isVisible(), true);
    assert.equal(await navigation.isVisible(), false);
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await navigation.isVisible(), true);
    await navigation.getByRole('link', { name: 'Enterprise Systems', exact: true }).click();
    await page.waitForFunction(() => location.hash === '#systems');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    await assertNoHorizontalOverflow(page);
  });
});

test('reduced motion keeps reveal content visible', async () => {
  await withPage({
    viewport: { width: 1200, height: 800 },
    reducedMotion: 'reduce',
  }, async (page) => {
    await openPortfolio(page);

    const hiddenReveals = await page.locator('[data-reveal]').evaluateAll((elements) => {
      return elements.filter((element) => {
        const style = getComputedStyle(element);
        return style.opacity === '0' || style.visibility === 'hidden';
      }).length;
    });
    assert.equal(hiddenReveals, 0, 'reveal content must remain visible');
  });
});

test('no JavaScript preserves navigation, content, and project fallback', async () => {
  await withPage({
    viewport: { width: 390, height: 844 },
    javaScriptEnabled: false,
  }, async (page) => {
    await openPortfolio(page);

    assert.equal(await page.locator('#site-navigation').isVisible(), true);
    for (const link of await page.locator('#site-navigation a').all()) {
      assert.equal(await link.isVisible(), true, 'no-JavaScript nav links must remain visible');
    }
    assert.equal(await page.locator('.nav-toggle').isVisible(), false);
    for (const control of await page.locator('[data-case-study]').all()) {
      assert.equal(await control.isVisible(), false, 'system controls must remain hidden');
    }
    const fallbackProjects = page.locator('#project-list > [data-project-fallback]');
    assert.equal(await fallbackProjects.count(), 2);
    for (const project of await fallbackProjects.all()) {
      assert.equal(await project.isVisible(), true);
    }
    assert.match(await page.locator('#project-list').textContent(), /Learn, Play & Code with Code Blocks/);
    assert.equal(await page.locator('article.system-card').count(), 4);
    assert.equal(await page.locator('.timeline > li').count(), 4);
    for (const element of await page.locator('article.system-card, article.timeline-item').all()) {
      assert.equal(await element.isVisible(), true, 'static enterprise content must be visible');
    }
    await assertNoHorizontalOverflow(page);
  });
});

test('module load failure leaves mobile navigation and authored content usable', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.route('**/assets/js/main.js', (route) => route.abort('failed'));
    const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
    assert.equal(response?.status(), 200);

    assert.equal(await page.locator('#site-navigation').isVisible(), true);
    assert.equal(await page.locator('.nav-toggle').isVisible(), false);
    assert.equal(await page.locator('#project-list [data-project-fallback]').count(), 2);
    const hiddenContent = await page.locator('[data-reveal]').evaluateAll((elements) => {
      return elements.filter((element) => {
        const style = getComputedStyle(element);
        return style.opacity === '0' || style.visibility === 'hidden';
      }).length;
    });
    assert.equal(hiddenContent, 0, 'authored content must fail open when the module does not load');
    await assertNoHorizontalOverflow(page);
  } finally {
    await context.close();
  }
});

test('accessibility basics remain intact after enhancement', async () => {
  await withPage({ viewport: { width: 1440, height: 1000 } }, async (page) => {
    await openPortfolio(page);
    await page.locator('.project').first().waitFor({ state: 'visible' });

    assert.equal(await page.locator('h1').count(), 1);
    for (const selector of ['header', 'nav', 'main', 'footer']) {
      assert.ok(await page.locator(selector).count(), `${selector} landmark must exist`);
    }

    for (const control of await page.locator('a:visible, button:visible').all()) {
      const snapshot = await control.ariaSnapshot();
      assert.match(snapshot, /^- (?:link|button) ".+"/m, `control needs a name: ${snapshot}`);
    }

    const buttonLikeSelector = [
      'button:visible',
      'a.button:visible',
      '.nav-contact:visible',
      '.hero-specialties a:visible',
      '.system-action:visible',
    ].join(', ');
    for (const control of await page.locator(buttonLikeSelector).all()) {
      const snapshot = await control.ariaSnapshot();
      const box = await control.boundingBox();
      assert.ok(
        box && box.width >= 43.5 && box.height >= 43.5,
        `button-like target must be at least 44x44px: ${snapshot} (${box?.width ?? 0}x${box?.height ?? 0}px)`,
      );
    }
    // Inline navigation and editorial text links use the WCAG target-spacing exception;
    // they retain at least 44px line height or explicit layout gaps instead of button geometry.

    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.keyboard.press('Tab');
    const focusIndicator = await page.evaluate(() => {
      const element = document.activeElement;
      const style = getComputedStyle(element);
      return {
        focusVisible: element.matches(':focus-visible'),
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        shadow: style.boxShadow,
      };
    });
    assert.equal(focusIndicator.focusVisible, true);
    assert.ok(
      (focusIndicator.outlineStyle !== 'none' && focusIndicator.outlineWidth !== '0px')
        || focusIndicator.shadow !== 'none',
      'keyboard focus must have a computed indicator',
    );

    const duplicateIds = await page.evaluate(() => {
      const counts = new Map();
      for (const element of document.querySelectorAll('[id]')) {
        counts.set(element.id, (counts.get(element.id) || 0) + 1);
      }
      return [...counts].filter(([, count]) => count > 1);
    });
    assert.deepEqual(duplicateIds, []);

    const unsafeExternalLinks = await page.evaluate(() => {
      return [...document.querySelectorAll('a[target="_blank"]')].flatMap((link) => {
        if (link.origin === location.origin) return [];
        return link.rel.split(/\s+/).includes('noreferrer') ? [] : [link.href];
      });
    });
    assert.deepEqual(unsafeExternalLinks, []);
    assert.equal(await page.locator('.project-visual img').count(), 2);
    assert.equal(await page.locator('.hero-profile').count(), 1);
    for (const visual of await page.locator('.project-visual').all()) {
      assert.equal(await visual.getAttribute('aria-hidden'), 'true');
    }
  });
});
