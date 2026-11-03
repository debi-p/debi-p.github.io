import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadPlaywright } from './helpers/playwright.mjs';
import { startStaticServer } from '../scripts/local-static-server.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const { chromium } = await loadPlaywright();
const server = await startStaticServer(root);
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
  });
} catch (error) {
  await server.close();
  throw error;
}
await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
test.after(async () => { await browser.close(); await server.close(); });

for (const width of [390, 1440]) {
  test(`recognition images open and navigate at ${width}px`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    try {
      await page.goto(server.url, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('.recognition-image').count(), 18);
      assert.equal(await page.locator('.recognition-image:visible').count(), 6);
      assert.equal(await page.locator('.portrait-slide[src*="award"]').count(), 0);
      await page.locator('.recognition-image').first().click();
      const dialog = page.locator('.recognition-preview');
      assert.ok(await dialog.isVisible());
      assert.match(await dialog.locator('p').textContent(), /Award Ceremony/);
      await dialog.getByRole('button', { name: 'Next image' }).click();
      assert.match(await dialog.locator('p').textContent(), /AI Impact Award/);
      await page.keyboard.press('ArrowLeft');
      assert.match(await dialog.locator('p').textContent(), /Award Ceremony/);
      await page.keyboard.press('Escape');
      assert.equal(await dialog.isVisible(), false);
      await page.getByRole('button', { name: 'Show More', exact: true }).click();
      assert.equal(await page.locator('.recognition-image:visible').count(), 12);
      await page.getByRole('button', { name: 'Show More', exact: true }).click();
      assert.equal(await page.locator('.recognition-image:visible').count(), 18);
      await page.getByRole('button', { name: 'Show Less', exact: true }).click();
      assert.equal(await page.locator('.recognition-image:visible').count(), 6);
      assert.ok(await page.getByRole('button', { name: 'Show More', exact: true }).isVisible());
      await page.locator('.recognition-gallery').screenshot({ path: new URL(`../artifacts/recognition-${width}.png`, import.meta.url).pathname });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    } finally { await page.close(); }
  });
}

for (const width of [390, 1440]) {
  test(`seven key FAQs open without overflow at ${width}px`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    try {
      await page.goto(server.url, { waitUntil: 'networkidle' });
      const questions = page.locator('#faqs details');
      assert.equal(await questions.count(), 7);
      for (let i = 1; i < 7; i++) {
        await questions.nth(i).locator('summary').click();
        assert.ok(await questions.nth(i).locator('p').isVisible());
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.ok(await page.locator('#faqs h2').first().evaluate((h) => parseFloat(getComputedStyle(h).fontSize) <= 40));
      assert.equal(await page.locator('#faqs h2').textContent(), 'About My Work');
      assert.equal(await page.locator('#contact .connect-links a').count(), 4);
      assert.equal(await page.locator('.site-footer a[href^="mailto:"]').count(), 0);
      await page.locator('#faqs details').evaluateAll((items) => items.forEach((item) => { item.open = false; }));
      await page.locator('#faqs').screenshot({ path: new URL(`../artifacts/about-work-${width}.png`, import.meta.url).pathname });
    } finally { await page.close(); }
  });
}

for (const width of [390, 1440]) {
  test(`JSON solutions are ordered, clamped, and equal-sized at ${width}px`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    try {
      await page.goto(server.url, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('.article-card').count(), 3);
      await page.getByRole('button', { name: 'Explore All Solutions', exact: true }).click();
      assert.equal(await page.locator('.article-card').count(), 4);
      assert.equal(await page.locator('#solutions-more').isVisible(), false);
      await page.goto(`${server.url}/solutions.html`, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('.article-card').count(), 4);
      assert.equal(await page.locator('.article-grid').evaluate((grid) => getComputedStyle(grid).display), 'grid');
      const visibleCards = await page.locator('.article-grid').evaluate((grid) => grid.clientWidth / grid.querySelector('.article-card').getBoundingClientRect().width);
      assert.ok(width === 1440 ? visibleCards > 3 && visibleCards < 3.3 : Math.abs(visibleCards - 1) < .05);
      assert.equal(await page.locator('.solution-image').first().evaluate((img) => getComputedStyle(img).objectFit), 'cover');
      await page.locator('.solution-link').first().hover();
      assert.equal(await page.locator('.solution-link').first().evaluate((link) => getComputedStyle(link).textDecorationLine), 'none');
      await page.locator('.article-grid').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('.solution-image')].every((img) => img.complete && img.naturalWidth > 0));
      assert.equal(await page.locator('.solution-image').count(), 4);
      await page.route('**/solutions.json', (route) => route.fulfill({ json: { items: [
        { title: 'Second', summary: 'Long summary '.repeat(100), url: 'https://example.com/second', order: 2, status: 'active' },
        { title: 'Hidden', summary: 'Hidden', url: 'https://example.com', order: 0, status: 'draft' },
        { title: 'First', summary: 'Short', url: 'https://example.com/first', order: 1, status: 'active' },
        { title: 'Unsafe', summary: 'Unsafe', url: 'javascript:alert(1)', order: 3, status: 'active' },
      ] } }));
      await page.reload({ waitUntil: 'networkidle' });
      assert.deepEqual(await page.locator('.article-card h3').allTextContents(), ['First', 'Second']);
      const cards = await page.locator('.article-card').evaluateAll((items) => items.map((item) => ({ width: item.getBoundingClientRect().width, height: item.getBoundingClientRect().height, overflow: item.scrollHeight > item.clientHeight })));
      assert.equal(cards[0].width, cards[1].width);
      assert.equal(cards[0].height, cards[1].height);
      assert.ok(cards.every((card) => !card.overflow));
      assert.equal(await page.locator('.article-card p').last().evaluate((p) => getComputedStyle(p).webkitLineClamp), '3');
      const link = page.locator('.solution-link').first();
      assert.equal(await page.locator('.article-card b').count(), 0);
      assert.equal(await page.locator('.article-card h3 > a').count(), 2);
      assert.equal(await link.getAttribute('target'), '_blank');
      assert.match(await link.getAttribute('rel'), /noopener/);
      assert.equal(await link.getAttribute('href'), 'https://example.com/first');
      await page.unroute('**/solutions.json');
      await page.reload({ waitUntil: 'networkidle' });
      await page.locator('.article-grid').screenshot({ path: new URL(`../artifacts/solutions-${width}.png`, import.meta.url).pathname });
    } finally { await page.close(); }
  });
}

test('solution archive searches, filters and paginates 50 entries', async () => {
  const page = await browser.newPage();
  try {
    await page.route('**/solutions.json', (route) => route.fulfill({ json: { items: Array.from({ length: 50 }, (_, i) => ({ title: `Project ${i + 1}`, summary: `Summary ${i + 1}`, url: `https://example.com/${i + 1}`, status: 'active', order: i + 1, category: i % 2 ? 'Cloud' : 'AI', featured: i < 3 })) } }));
    await page.goto(`${server.url}/solutions.html`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.article-card').count(), 9);
    assert.equal(await page.locator('#solutions-count').textContent(), '50 solutions');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    assert.equal(await page.locator('.article-card h3').first().textContent(), 'Project 10');
    await page.locator('#solutions-category').selectOption('AI');
    assert.equal(await page.locator('#solutions-count').textContent(), '25 solutions');
    assert.equal(await page.locator('#solutions-page').textContent(), 'Page 1 of 3');
    await page.locator('#solutions-search').fill('Project 49');
    assert.equal(await page.locator('.article-card').count(), 1);
    await page.locator('#solutions-search').fill('no match');
    assert.equal(await page.locator('.article-card').count(), 0);
    assert.equal(await page.locator('#solutions-status').textContent(), 'No solutions found.');
    await page.goto(server.url, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.article-card').count(), 3);
    await page.getByRole('button', { name: 'Explore All Solutions', exact: true }).click();
    assert.equal(await page.locator('.article-card').count(), 6);
    await page.getByRole('button', { name: 'Explore More', exact: true }).click();
    assert.equal(await page.locator('.article-card').count(), 9);
    assert.equal(page.url(), server.url + '/');
  } finally { await page.close(); }
});

for (const width of [390, 1440]) {
  test(`capability cards have equal dimensions without clipping at ${width}px`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    try {
      await page.goto(server.url, { waitUntil: 'networkidle' });
      const grid = page.locator('.capability-grid');
      await grid.scrollIntoViewIfNeeded();
      const cards = await grid.locator('.capability-group').evaluateAll((items) => items.map((item) => {
        const bounds = item.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height, overflow: item.scrollWidth > item.clientWidth || item.scrollHeight > item.clientHeight, groups: item.querySelectorAll('p strong').length };
      }));
      assert.equal(cards.length, 6);
      for (const card of cards) {
        assert.ok(Math.abs(card.width - cards[0].width) < 2);
        assert.ok(Math.abs(card.height - cards[0].height) < 2);
        assert.equal(card.overflow, false);
        assert.equal(card.groups, 3);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await grid.screenshot({ path: new URL(`../artifacts/capabilities-${width}.png`, import.meta.url).pathname });
    } finally { await page.close(); }
  });
}

test('mobile portraits fit completely and illustrative slides autoplay', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto(server.url, { waitUntil: 'networkidle' });
    const frame = page.locator('.portrait-window');
    await frame.tap();
    assert.equal(await page.locator('.portrait-slide').count(), 6);
    const before = await page.locator('.portrait-slide.is-active').getAttribute('src');
    await page.waitForFunction((src) => document.querySelector('.portrait-slide.is-active').getAttribute('src') !== src, before, { timeout: 6500 });
    for (let index = 0; index < 6; index++) {
      await page.locator(`[data-slide="${index}"]`).click();
      const fit = await page.locator('.portrait-slide.is-active').evaluate((image) => {
        const frame = image.parentElement.getBoundingClientRect();
        const bounds = image.getBoundingClientRect();
        return getComputedStyle(image).objectFit === 'cover'
          && bounds.left >= frame.left && bounds.right <= frame.right
          && bounds.top >= frame.top && bounds.bottom <= frame.bottom;
      });
      assert.ok(fit, `slide ${index + 1} must fit inside the mobile frame`);
    }
    await page.waitForTimeout(900);
    await frame.screenshot({ path: new URL('../artifacts/mobile-portrait-fit.png', import.meta.url).pathname });
  } finally { await context.close(); }
});

for (const width of [390, 1440]) {
  test(`SoftwareHub visual tour loads and rotates at ${width}px`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 768, hasTouch: width < 768 });
    try {
      await page.goto(server.url, { waitUntil: 'networkidle' });
      const media = page.getByRole('group', { name: 'SoftwareHub conceptual visual tour', exact: true });
      await media.scrollIntoViewIfNeeded();
      assert.deepEqual(await media.locator('figcaption strong').allTextContents(), ['Large-File Web Uploads', 'Secure Customer Downloads', 'Publishing to Secure Delivery']);
      for (let index = 0; index < 3; index++) {
        await media.locator(`[data-service-slide="${index}"]`).click();
        assert.ok(await media.locator('.service-slide.is-active img').evaluate((img) => img.complete && img.naturalWidth > 0 && getComputedStyle(img).objectFit === 'contain'));
      }
      await page.mouse.move(0, 0);
      await media.locator('[data-service-slide="2"]').blur();
      await page.waitForFunction(() => document.querySelector('[aria-label="SoftwareHub conceptual visual tour"] [data-service-slide="2"]').getAttribute('aria-pressed') === 'false', null, { timeout: 6500 });
      await media.screenshot({ path: new URL(`../artifacts/softwarehub-${width}.png`, import.meta.url).pathname });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    } finally { await page.close(); }
  });
}

test('EdgeCore has a concise summary, captioned images, and top-right slideshow controls', async () => {
  const titles = ['Instrument, Desktop & EdgeCore', 'Scientific File Processing', 'Scientific Data Analysis'];
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 768, hasTouch: width < 768 });
    try {
      await page.goto(server.url, { waitUntil: 'networkidle' });
      const card = page.locator('.service-card').first();
      const summary = await card.locator('.card-body>p').textContent();
      assert.ok(summary.length >= 90 && summary.length <= 160);
      const media = page.getByRole('group', { name: 'EdgeCore visual tour', exact: true });
      await media.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('[aria-label="EdgeCore visual tour"] img')].every((image) => image.complete && image.naturalWidth > 0));
      const position = await media.locator('.service-slide-controls').evaluate((controls) => {
        const container = controls.closest('.service-media').getBoundingClientRect();
        const bounds = controls.getBoundingClientRect();
        return { top: bounds.top - container.top, right: container.right - bounds.right };
      });
      assert.ok(position.top >= 0 && position.top <= 20 && position.right >= 0 && position.right <= 20);
      for (let index = 0; index < 3; index++) {
        await media.locator(`[data-service-slide="${index}"]`).click();
        const slide = media.locator('.service-slide.is-active');
        assert.equal(await slide.locator('figcaption strong').textContent(), titles[index]);
        assert.equal(await slide.locator('img').evaluate((image) => getComputedStyle(image).objectFit), 'contain');
        if (width !== 320) {
          await page.waitForTimeout(700);
          await media.screenshot({ path: new URL(`../artifacts/edgecore-${width}-slide-${index + 1}.png`, import.meta.url).pathname });
        }
      }
      if (width === 390) {
        await media.tap();
        await page.waitForFunction(() => document.querySelector('[aria-label="EdgeCore visual tour"] .service-slide.is-active figcaption strong').textContent !== 'Scientific Data Analysis', null, { timeout: 6500 });
      }
    } finally { await page.close(); }
  }
});

for (const width of [390, 1440]) {
  test(`AnalyticalGraph imagery and detailed modal work at ${width}px`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 768, hasTouch: width < 768 });
    try {
      await page.goto(server.url, { waitUntil: 'networkidle' });
      const media = page.getByRole('group', { name: 'AnalyticalGraph conceptual visual tour', exact: true });
      await media.scrollIntoViewIfNeeded();
      assert.equal(await media.locator('.service-slide').count(), 3);
      assert.deepEqual(await media.locator('figcaption strong').allTextContents(), [
        'Structural Biology Exploration', 'Mass Spectrometry Discovery', 'Scientific Data to Connected Discovery',
      ]);
      for (let index = 0; index < 3; index++) {
        await media.locator(`[data-service-slide="${index}"]`).click();
        assert.ok(await media.locator('.service-slide.is-active img').evaluate((img) => img.complete && img.naturalWidth > 0));
      }
      await page.mouse.move(0, 0);
      await media.locator('[data-service-slide="2"]').blur();
      await page.waitForFunction(() => !document.querySelector('[aria-label="AnalyticalGraph conceptual visual tour"] [data-service-slide="2"]').matches('[aria-pressed="true"]'), null, { timeout: 6500 });
      await media.screenshot({ path: new URL(`../artifacts/analyticalgraph-${width}.png`, import.meta.url).pathname });
      await page.locator('[data-open-system="analyticalgraph"]').click();
      const dialog = page.locator('#analyticalgraph-dialog');
      assert.ok(await dialog.isVisible());
      await dialog.getByRole('tab', { name: 'Scientific Data', exact: true }).click();
      assert.match(await dialog.locator('#ag-data').innerText(), /\.cdResult[\s\S]*CIF[\s\S]*VCF/);
      await dialog.getByRole('button', { name: 'Close system details' }).click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    } finally { await page.close(); }
  });
}

for (const width of [390, 1440]) {
  test(`PyLens images rotate with matching workflow captions at ${width}px`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 768, hasTouch: width < 768 });
    try {
      await page.goto(server.url, { waitUntil: 'networkidle' });
      const media = page.getByRole('group', { name: 'PyLens visual tour', exact: true });
      await media.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('[aria-label="PyLens visual tour"] img')].every((image) => image.complete && image.naturalWidth > 0));
      const titles = ['Scientific File Intake', 'Orchestration & Adjudication', 'Expert Review'];
      for (let index = 0; index < titles.length; index++) {
        await media.locator(`[data-service-slide="${index}"]`).click();
        const active = media.locator('.service-slide.is-active');
        assert.equal(await active.locator('.slide-brand').count(), 0);
        assert.equal(await active.locator('figcaption strong').textContent(), titles[index]);
        const captionFits = await active.locator('figcaption').evaluate((caption) => {
          const bounds = caption.closest('.service-media').getBoundingClientRect();
          const rect = caption.getBoundingClientRect();
          return rect.left >= bounds.left && rect.right <= bounds.right && rect.bottom <= bounds.bottom + 1;
        });
        assert.ok(captionFits);
      }
      if (width < 768) await media.tap();
      else await page.mouse.move(1, 80);
      await page.waitForFunction(() => document.querySelector('[aria-label="PyLens visual tour"] .service-slide.is-active figcaption strong').textContent !== 'Expert Review', null, { timeout: 6500 });
      if (width >= 768) {
        await media.hover();
        const paused = await media.locator('.service-slide.is-active figcaption strong').textContent();
        await page.waitForTimeout(4300);
        assert.equal(await media.locator('.service-slide.is-active figcaption strong').textContent(), paused);
      }
      await media.locator('[data-service-slide="0"]').click();
      await page.waitForTimeout(700);
      await media.screenshot({ path: new URL(`../artifacts/pylens-slides-${width}.png`, import.meta.url).pathname });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      assert.equal(overflow, false);
    } finally { await page.close(); }
  });

  test(`system dialogs open independently and remain usable at ${width}px`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    try {
      await page.goto(server.url, { waitUntil: 'networkidle' });
      assert.equal(await page.getByText('Explore System', { exact: true }).count(), 0);
      assert.equal(await page.locator('.service-card').count(), 6);
      for (const system of ['edgecore', 'pyintelligence', 'analyticalgraph', 'releasehub', 'agentic-delivery', 'cloud-rationalisation']) {
        const trigger = page.locator(`[data-open-system="${system}"]`);
        const dialog = page.locator(`#${system}-dialog`);
        assert.equal(await trigger.evaluate((element) => element.closest('h3') !== null), true);
        await trigger.focus();
        await page.keyboard.press('Enter');
        await dialog.waitFor({ state: 'visible', timeout: 3000 });
        assert.equal(await dialog.evaluate((element) => element.open), true, `${system} opens from its title`);
        assert.equal(await page.locator('dialog[open]').count(), 1);
        if (await dialog.getByRole('tab').count()) {
          const detailTab = system === 'analyticalgraph' ? 'Scientific Data' : 'Capabilities';
          for (const title of ['Architecture', detailTab, 'Overview']) {
            await dialog.getByRole('tab', { name: title, exact: true }).click();
            assert.equal(await dialog.locator('[role="tabpanel"]:visible').count(), 1);
          }
          const tab = dialog.getByRole('tab', { name: 'Overview', exact: true });
          await tab.focus();
          await page.keyboard.press('ArrowRight');
          assert.equal(await dialog.getByRole('tab', { name: 'Architecture', exact: true }).getAttribute('aria-selected'), 'true');
        } else {
          assert.equal(await dialog.locator('h2').textContent(), await trigger.textContent());
          assert.equal(await dialog.locator('.system-detail-list li').count(), 3);
        }
        const overflow = await dialog.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
        assert.equal(overflow, false);
        if (system === 'pyintelligence') {
          await dialog.screenshot({ path: new URL(`../artifacts/pyintelligence-${width}.png`, import.meta.url).pathname });
        }
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(await dialog.evaluate((element) => element.open), false);
        assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
      }
      const dimensions = await page.locator('.service-card').evaluateAll((cards) => cards.map((card) => [Math.round(card.getBoundingClientRect().width), Math.round(card.getBoundingClientRect().height), card.querySelectorAll('.card-body li').length]));
      assert.ok(dimensions.every((size) => size.join() === dimensions[0].join()));
      assert.equal(dimensions[0][2], 3);
    } finally { await page.close(); }
  });
}
