import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadPlaywright } from './helpers/playwright.mjs';

const baseUrl = 'http://127.0.0.1:4173';
const artifactsDirectory = fileURLToPath(new URL('../artifacts/', import.meta.url));
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });

await mkdir(artifactsDirectory, { recursive: true });

test.after(async () => {
  await browser.close();
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

async function waitForCanvas(page) {
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#system-map');
    if (!canvas || canvas.width === 0 || canvas.height === 0) return false;
    const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
    if (!pixels) return false;

    let alphaPixels = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] > 0) alphaPixels += 1;
      if (alphaPixels > 100) return true;
    }
    return false;
  });
}

async function assertCanvasNonblank(page) {
  const stats = await page.locator('#system-map').evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let alphaPixels = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] > 0) alphaPixels += 1;
    }

    return {
      alphaPixels,
      backingHeight: canvas.height,
      backingWidth: canvas.width,
      cssHeight: rect.height,
      cssWidth: rect.width,
      dpr: window.devicePixelRatio,
    };
  });

  assert.ok(stats.alphaPixels > 100, 'canvas must contain more than 100 nontransparent pixels');
  assert.ok(stats.backingWidth > 0 && stats.backingHeight > 0, 'canvas backing size must be nonzero');
  assert.ok(
    stats.backingWidth <= Math.ceil(stats.cssWidth * Math.min(stats.dpr, 2)) + 1,
    'canvas backing width must cap DPR at 2',
  );
  assert.ok(
    stats.backingHeight <= Math.ceil(stats.cssHeight * Math.min(stats.dpr, 2)) + 1,
    'canvas backing height must cap DPR at 2',
  );
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

async function assertCanvasAvoidsHeroContent(page) {
  const intersections = await page.evaluate(() => {
    const canvas = document.querySelector('#system-map');
    if (!canvas) return ['missing canvas'];
    const canvasRect = canvas.getBoundingClientRect();
    const selectors = [
      '.hero-copy > .eyebrow',
      '.hero-copy > .hero-name',
      '#hero-title',
      '.hero-summary',
      '.hero-actions',
    ];

    return selectors.flatMap((selector) => {
      const element = document.querySelector(selector);
      if (!element) return [`missing ${selector}`];
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const visible = style.display !== 'none' && style.visibility !== 'hidden'
        && rect.width > 0 && rect.height > 0;
      if (!visible) return [];
      const intersects = canvasRect.left < rect.right
        && canvasRect.right > rect.left
        && canvasRect.top < rect.bottom
        && canvasRect.bottom > rect.top;
      return intersects ? [selector] : [];
    });
  });

  assert.deepEqual(intersections, [], `canvas intersects hero content: ${intersections.join(', ')}`);
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
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => window.scrollY === 0);
  await assertAllRevealContentVisible(page);
}

async function canvasHash(page) {
  return page.locator('#system-map').evaluate((canvas) => {
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261;
    for (let index = 0; index < pixels.length; index += 17) {
      hash ^= pixels[index];
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  });
}

test('desktop renders the complete portfolio and interactive case study', async () => {
  await withPage({ viewport: { width: 1440, height: 1000 } }, async (page) => {
    await openPortfolio(page);
    await page.locator('.project').first().waitFor({ state: 'visible' });
    await waitForCanvas(page);

    assert.equal(
      (await page.locator('h1').textContent()).trim(),
      'I build intelligent platforms engineered for real-world scale.',
    );
    assert.equal(await page.locator('.project').first().isVisible(), true);
    await assertVisibleCaseControls(page);
    await assertCanvasNonblank(page);
    await assertNoHorizontalOverflow(page);
    await assertCanvasAvoidsHeroContent(page);

    const { dialog, trigger } = await openReleaseHub(page);
    assert.equal(
      (await page.locator('#case-study-metric').textContent()).trim(),
      '1TB Web Upload Support · Secure Release Distribution',
    );
    assert.match(await dialog.textContent(), /My role/);
    assert.ok((await page.locator('#case-study-role').textContent()).trim().length > 30);
    await page.getByRole('button', { name: 'Close case study' }).click();
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
    await page.screenshot({
      path: path.join(artifactsDirectory, 'portfolio-desktop.png'),
      fullPage: true,
    });
  });
});

test('mobile navigation, project, canvas, dialog, and full page stay usable', async () => {
  await withPage({ viewport: { width: 390, height: 844 } }, async (page) => {
    await openPortfolio(page);
    await page.locator('.project').first().waitFor({ state: 'visible' });
    await waitForCanvas(page);

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
    await assertCanvasNonblank(page);
    await assertCanvasAvoidsHeroContent(page);

    const impactHint = await page.locator('.achievement-orbit').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
    });
    assert.ok(impactHint > 0, 'the first viewport must show the achievement evidence');

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
    await page.screenshot({
      path: path.join(artifactsDirectory, 'portfolio-mobile.png'),
      fullPage: true,
    });
  });
});

test('responsive boundaries keep headings and hero regions contained', async () => {
  for (const viewport of [
    { width: 901, height: 900 },
    { width: 601, height: 900 },
  ]) {
    await withPage({ viewport }, async (page) => {
      await openPortfolio(page);
      await waitForCanvas(page);
      await assertNoHorizontalOverflow(page);
      await assertAllHeadingsFit(page);
      await assertCanvasAvoidsHeroContent(page);
    });
  }
});

test('reduced motion produces a stable canvas and visible reveal content', async () => {
  await withPage({
    viewport: { width: 1200, height: 800 },
    reducedMotion: 'reduce',
  }, async (page) => {
    await openPortfolio(page);
    await waitForCanvas(page);
    await assertCanvasNonblank(page);

    const before = await canvasHash(page);
    const hero = await page.locator('.hero').boundingBox();
    assert.ok(hero);
    await page.mouse.move(hero.x + hero.width - 20, hero.y + 20);
    await page.waitForTimeout(160);
    const after = await canvasHash(page);
    assert.equal(after, before, 'reduced-motion canvas frames must remain identical');

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
    assert.equal(await page.locator('#project-list noscript .project').isVisible(), true);
    assert.match(await page.locator('#project-list noscript').textContent(), /Learn, Play & Code with Code Blocks/);
    assert.equal(await page.locator('.system-row').count(), 4);
    assert.equal(await page.locator('.timeline li').count(), 4);
    for (const element of await page.locator('.system-row, .timeline li').all()) {
      assert.equal(await element.isVisible(), true, 'static enterprise content must be visible');
    }
    await assertNoHorizontalOverflow(page);
  });
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
    assert.equal(await page.locator('#system-map').getAttribute('aria-hidden'), 'true');
    for (const visual of await page.locator('.project-visual').all()) {
      assert.equal(await visual.getAttribute('aria-hidden'), 'true');
    }
  });
});
