import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
const js = await readFile(new URL('../assets/js/main.js', import.meta.url), 'utf8');

test('uses the complete reference page sequence', () => {
  for (const id of ['enterprise-systems', 'technical-leadership', 'engineering-capabilities', 'innovation-lab', 'technical-insights', 'contact']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.ok(html.indexOf('id="enterprise-systems"') < html.indexOf('id="innovation-lab"'));
  assert.ok(html.indexOf('id="innovation-lab"') < html.indexOf('id="recognition"'));
  assert.ok(html.indexOf('id="recognition"') < html.indexOf('id="faqs"'));
  assert.match(html, /data-recognition-url="recognition.json"/);
  assert.equal((html.match(/class="service-card"/g) || []).length, 6);
  assert.match(html, /data-solutions-url="solutions.json"/);
});

test('uses the approved professional identity', () => {
  assert.match(html, /Debi Prasad Pradhan/);
  assert.match(html, /<strong>Staff Software Engineer<\/strong><span>ML Platforms &amp; Inference Systems<\/span>/);
  assert.doesNotMatch(html, /Architecting intelligent systems from strategy to production\./);
  assert.match(html, /memory-efficient model serving and multi-team technical leadership/);
  assert.ok(html.indexOf('<h1>Debi Prasad') < html.indexOf('class="eyebrow hero-role"'));
  assert.doesNotMatch(html, /class="programme-links"/);
  assert.match(html, /class="shell hero-impact"/);
  assert.doesNotMatch(html, /class="brand-copy"><strong>Debi Prasad Pradhan<\/strong><span>/);
});

test('uses exactly four primary navigation links with recognition last', () => {
  assert.match(html, /id="primary-links"><a href="#enterprise-systems">Enterprise Systems<\/a><a href="#technical-leadership">Engineering Capabilities<\/a><a href="#innovation-lab">Innovation Lab<\/a><a href="#recognition">Recognition<\/a><\/div>/);
  assert.doesNotMatch(html, /class="button button-primary nav-cta"/);
  assert.doesNotMatch(html, /id="primary-links"[^>]*>[^<]*(?:<a[^>]*>[^<]*<\/a>){6}/);
});

test('ships local imagery and reference interactions', () => {
  assert.equal((html.match(/class="portrait-slide/g) || []).length, 6);
  assert.doesNotMatch(html, /drtusharnayak\.com/i);
  assert.match(js, /menu-toggle/);
  assert.match(js, /showSlide/);
  assert.match(js, /3000/);
  assert.equal((html.match(/data-ai-composite="true"/g) || []).length, 6);
  assert.doesNotMatch(html, /profile-placeholders\//);
  assert.match(js, /touchstart/);
  assert.match(html, /<details open>/);
  assert.match(html, /class="brand-mark"[^>]*>DP</);
  assert.match(html, /rel="icon"[^>]*favicon\.svg\?v=2/);
  assert.match(html, /rel="shortcut icon"[^>]*favicon\.svg\?v=2/);
});

test('keeps enterprise cards uniform and gives EdgeCore three rotating visuals', () => {
  const cards = [...html.matchAll(/<article class="service-card">([\s\S]*?)<\/article>/g)].map((match) => match[1]);
  assert.equal(cards.length, 6);
  for (const card of cards) {
    assert.equal((card.match(/<li>/g) || []).length, 3);
  }
  assert.equal((cards[0].match(/<figure class="service-slide/g) || []).length, 3);
  assert.equal((cards[0].match(/data-service-slide/g) || []).length, 3);
  assert.doesNotMatch(html, /Explore System/);
  assert.equal(cards.filter((card) => /<h3><button class="system-title"[^>]+data-open-system=/.test(card)).length, 6);
  assert.doesNotMatch(html, /Inspect system/i);
  assert.match(cards[0], /NVIDIA GB10, with GPT-OSS-20B chat and BGE-M3 embedding defaults/);
  for (const card of cards) assert.equal((card.match(/<li><strong>/g) || []).length, 3);
  assert.match(js, /initServiceCarousel/);
  assert.match(css, /\.service-card\{[^}]*display:flex/);
});

test('implements the navy cyan responsive system', () => {
  assert.match(css, /--bg:#0a1628/);
  assert.match(css, /--cyan:#22d3ee/);
  assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:767px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@keyframes photo-pan/);
  assert.match(css, /width:auto/);
  assert.match(css, /left:calc\(100% - 9px\)/);
  assert.match(css, /translateX\(-100%\)/);
  assert.match(css, /\.hero h1\{[^}]*white-space:nowrap/);
});
