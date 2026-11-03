import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { caseStudies } from '../assets/js/content.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const projectData = JSON.parse(readFileSync(new URL('../public.json', import.meta.url), 'utf8'));

function position(pattern, label) {
  const match = pattern.exec(html);
  assert.ok(match, `${label} must exist`);
  return match.index;
}

function elementBlocks(source, openingPattern, closingTag) {
  return [...source.matchAll(openingPattern)].map((match) => {
    const end = source.indexOf(closingTag, match.index + match[0].length);
    assert.notEqual(end, -1, `${closingTag} must exist`);
    return source.slice(match.index, end + closingTag.length);
  });
}

test('uses the approved reference page sequence', () => {
  const regions = [
    [/<header\b/i, 'header'],
    [/<section\b[^>]*class=["'][^"']*\bhero\b/i, 'hero'],
    [/<section\b[^>]*id=["']systems["']/i, 'enterprise systems'],
    [/<section\b[^>]*id=["']experience["']/i, 'experience'],
    [/<section\b[^>]*id=["']projects["']/i, 'applied projects'],
    [/<section\b[^>]*id=["']faqs["']/i, 'FAQ'],
    [/<(?:aside|section)\b[^>]*id=["']contact["']/i, 'contact'],
    [/<footer\b/i, 'footer'],
  ];
  const positions = regions.map(([pattern, label]) => position(pattern, label));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});

test('removes the dashboard impact and system-map composition', () => {
  assert.doesNotMatch(
    html,
    /id=["'](?:system-map|impact)["']|\bachievement-orbit\b|\bhero-impact\b|\bimpact-band\b|<canvas\b/i,
  );
});

test('uses a portrait-led hero with proof points, capabilities, and resume actions', () => {
  const hero = html.match(/<section\b[^>]*class=["'][^"']*\bhero\b[^>]*>[\s\S]*?<\/section>/i)?.[0] ?? '';
  assert.match(hero, /<img\b[^>]*class=["'][^"']*hero-profile/i);
  assert.match(hero, /Debi Prasad Pradhan/i);
  assert.match(hero, /Staff Software Engineer/i);
  for (const proof of ['11\\+', '20\\+', '3X']) assert.match(hero, new RegExp(proof));
  for (const capability of ['Agentic Engineering', 'Scientific Intelligence', 'Data Platforms', 'Software Distribution']) {
    assert.match(hero, new RegExp(capability, 'i'));
  }
  assert.match(hero, />\s*Open Resume\s*</i);
  assert.match(hero, />\s*Download Resume\s*</i);
});

test('presents four image-led enterprise system cards', () => {
  const systemsStart = position(/<section\b[^>]*id=["']systems["']/i, 'systems');
  const experienceStart = position(/<section\b[^>]*id=["']experience["']/i, 'experience');
  const systems = html.slice(systemsStart, experienceStart);
  const cards = elementBlocks(
    systems,
    /<article\b[^>]*class=["'][^"']*\bsystem-card\b[^"']*["'][^>]*>/gi,
    '</article>',
  );

  assert.equal(cards.length, 4);
  assert.match(systems, /AnalyticalGraph - Scientific Data Intelligence/);
  assert.doesNotMatch(systems, /MolecularGraph - Analytical Data Intelligence/);
  for (const card of cards) {
    assert.equal((card.match(/<img\b/gi) ?? []).length, 1, 'each system card must have one image');
    assert.equal(
      (card.match(/data-case-study=/gi) ?? []).length,
      1,
      'each system card must have one case-study trigger',
    );

    const caseStudyId = card.match(/data-case-study=["']([^"']+)["']/i)?.[1];
    const heading = card.match(/<h3\b[^>]*>\s*([^<]+?)\s*<\/h3>/i)?.[1];
    const record = caseStudies.find(({ id }) => id === caseStudyId);
    assert.ok(record, `system card case-study ID must exist: ${caseStudyId}`);
    assert.equal(heading, record.name, `${caseStudyId}: card heading must match dialog title`);

    const proof = card.match(/<ul\b[^>]*class=["'][^"']*\bsystem-proof\b[^"']*["'][^>]*>[\s\S]*?<\/ul>/i)?.[0] ?? '';
    assert.doesNotMatch(proof, /<li\b[^>]*>\s*•/i, `${caseStudyId}: list items must not include literal bullets`);
  }
});

test('nests engineering capability beneath the approved experience progression', () => {
  const experienceStart = position(/<section\b[^>]*id=["']experience["']/i, 'experience');
  const projectsStart = position(/<section\b[^>]*id=["']projects["']/i, 'applied projects');
  const experience = html.slice(experienceStart, projectsStart);

  assert.match(
    experience,
    /<section\b[^>]*id=["']expertise["'][^>]*aria-labelledby=["']expertise-title["']/i,
  );
  assert.match(experience, /<h3\b[^>]*id=["']expertise-title["'][^>]*>\s*Engineering Capability\s*<\/h3>/i);
  const outsideExperience = html.slice(0, experienceStart) + html.slice(projectsStart);
  assert.doesNotMatch(outsideExperience, /id=["']expertise["']/i);

  const employers = [
    'Thermo Fisher Scientific',
    'Xebia',
    'Oracle',
    'HCL Technologies',
  ].map((employer) => {
    const match = new RegExp(employer, 'i').exec(experience);
    assert.ok(match, `${employer} must exist in Experience`);
    return match.index;
  });
  assert.deepEqual(employers, [...employers].sort((a, b) => a - b));
});

test('keeps projects data-driven and FAQ/contact content accessible', () => {
  assert.match(html, /id=["']project-list["']/i);
  assert.equal((html.match(/<details\b[^>]*class=["'][^"']*faq-item\b/gi) ?? []).length, 4);
  assert.match(html, /id=["']contact["']/i);
  assert.match(html, /mailto:dpp2017@gmail\.com/i);
});

test('authored project fallback matches every active project in numeric order', () => {
  const projectsStart = position(/<section\b[^>]*id=["']projects["']/i, 'applied projects');
  const faqStart = position(/<section\b[^>]*id=["']faqs["']/i, 'FAQ');
  const projects = html.slice(projectsStart, faqStart);
  const fallbackTitles = elementBlocks(
    projects,
    /<article\b[^>]*data-project-fallback[^>]*>/gi,
    '</article>',
  ).map((article) => article.match(/<h3\b[^>]*>\s*([^<]+?)\s*<\/h3>/i)?.[1]);
  const activeTitles = projectData.projects
    .filter(({ status }) => status === 'active')
    .sort((left, right) => Number(left.order) - Number(right.order))
    .map(({ title }) => title.replaceAll('&', '&amp;'));

  assert.deepEqual(fallbackTitles, activeTitles);
});

test('does not preload a persistent JavaScript state before the module executes', () => {
  assert.doesNotMatch(html, /documentElement\.classList\.add\(\s*['"]js['"]\s*\)/);
});
