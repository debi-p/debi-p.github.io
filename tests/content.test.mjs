import assert from 'node:assert/strict';
import test from 'node:test';

import { caseStudies } from '../assets/js/content.js';

const forbiddenPublicText = [
  'thermofisher.atlassian.net',
  'jira',
  'confluence',
  'revenera',
  'flexera',
  'workflow forge',
  'dfp',
  'signed url',
  'bucket',
];

test('exports exactly four complete enterprise case studies', () => {
  assert.equal(caseStudies.length, 4);

  const caseStudyIds = caseStudies.map(({ id }) => id);
  assert.equal(
    new Set(caseStudyIds).size,
    caseStudyIds.length,
    `case study IDs must be unique: ${caseStudyIds.join(', ')}`,
  );
  assert.deepEqual(
    caseStudies.map(({ id, name }) => ({ id, name })),
    [
      { id: 'specflow-ai', name: 'Mesh - Agentic Workflow' },
      {
        id: 'scilens',
        name: 'PyIntelligence - Governed Multi-Agent Scientific Intelligence',
      },
      { id: 'evidencegraph', name: 'MolecularGraph - Analytical Data Intelligence' },
      { id: 'releasegrid', name: 'ReleaseHub - Enterprise Software Distribution' },
    ],
    'case-study catalog must contain the expected identities in order',
  );

  for (const caseStudy of caseStudies) {
    assert.match(
      caseStudy.id,
      /^[a-z0-9-]+$/,
      `${caseStudy.id}: id must contain only lowercase letters, numbers, and hyphens`,
    );
    assert.ok(caseStudy.name.length > 3, `${caseStudy.id}: name is incomplete`);
    assert.ok(caseStudy.summary.length > 30, `${caseStudy.id}: summary is incomplete`);
    assert.ok(caseStudy.problem.length > 30, `${caseStudy.id}: problem is incomplete`);
    assert.ok(caseStudy.role.length > 30, `${caseStudy.id}: role is incomplete`);
    assert.ok(caseStudy.approach.length >= 3, `${caseStudy.id}: approach is incomplete`);
    assert.ok(caseStudy.outcomes.length >= 1, `${caseStudy.id}: outcomes are incomplete`);
    assert.ok(
      caseStudy.technologies.length >= 3,
      `${caseStudy.id}: technologies are incomplete`,
    );
  }
});

test('keeps forbidden internal text out of public content', () => {
  const publicContent = JSON.stringify({ caseStudies }).toLowerCase();

  for (const forbiddenText of forbiddenPublicText) {
    assert.equal(
      publicContent.includes(forbiddenText),
      false,
      `forbidden public text found: ${forbiddenText}`,
    );
  }
});

test('states completed ReleaseHub web-upload capacity accurately', () => {
  const releaseGrid = caseStudies.find(({ id }) => id === 'releasegrid');

  assert.ok(releaseGrid, 'releasegrid: case study is required');
  assert.equal(
    releaseGrid.metric,
    '1TB Web Upload Support · Secure Release Distribution',
    'releasegrid: metric must state the completed web-upload capability',
  );

  const releaseGridText = JSON.stringify(releaseGrid);
  assert.match(releaseGridText, /1TB/);
  assert.doesNotMatch(releaseGridText, /support in progress/i);
});
