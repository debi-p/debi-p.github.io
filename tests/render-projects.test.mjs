import assert from 'node:assert/strict';
import test from 'node:test';

import { prepareProjects, renderProject, renderProjects } from '../assets/js/render-projects.js';

const project = {
  title: 'Project One',
  summary: 'A useful project with a clear purpose.',
  sourceUrl: 'https://github.com/debi-p/project-one',
  liveUrl: 'https://debi-p.github.io/project-one/',
  coverImage: 'assets/1/assets/profile.png',
  order: 2,
  status: 'active',
};

test('keeps only active projects and sorts them by numeric order', () => {
  const projects = [
    project,
    { ...project, title: 'First', order: 1 },
    { ...project, title: 'Hidden', order: 0, status: 'draft' },
    { ...project, title: 'Third', order: 3 },
  ];

  assert.deepEqual(prepareProjects(projects).map(({ title }) => title), [
    'First',
    'Project One',
    'Third',
  ]);
  assert.equal(projects[0].title, 'Project One', 'input order must not be mutated');
});

test('renders a solution row with a plain title and separate source and live links', () => {
  const output = renderProject(project);

  assert.match(output, /<article class="project">/);
  assert.doesNotMatch(output, /data-reveal/);
  assert.doesNotMatch(output, /project-index|data-project-order/);
  assert.match(output, /<img src="assets\/1\/assets\/profile\.png" alt=""/);
  assert.match(output, /<h3>Project One<\/h3>/);
  assert.doesNotMatch(output, /<h3>\s*<a/);
  assert.match(output, /href="https:\/\/github\.com\/debi-p\/project-one"[^>]*>View Source<\/a>/);
  assert.match(output, /href="https:\/\/debi-p\.github\.io\/project-one\/"[^>]*>Explore Live<\/a>/);
});

test('allows source and live URLs to be identical', () => {
  const output = renderProject({ ...project, liveUrl: project.sourceUrl });

  assert.equal((output.match(/href="https:\/\/github\.com\/debi-p\/project-one"/g) ?? []).length, 2);
  assert.match(output, />View Source<\/a>[\s\S]*>Explore Live<\/a>/);
});

test('escapes project text and rejects unsafe URLs', () => {
  const output = renderProject({
    ...project,
    title: '<script>alert(1)</script>',
    summary: 'Useful & safe',
    sourceUrl: 'javascript:alert(1)',
    liveUrl: 'data:text/html,bad',
    coverImage: 'javascript:alert(2)',
  });

  assert.doesNotMatch(output, /<script|javascript:|data:text/i);
  assert.match(output, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(output, /Useful &amp; safe/);
  assert.doesNotMatch(output, /<img|Explore solution/);
});

test('renders any number of eligible projects in configured order', () => {
  const output = renderProjects([
    { ...project, title: 'Second', order: 20 },
    { ...project, title: 'First', order: 10 },
    { ...project, title: 'Third', order: 30 },
  ]);

  assert.equal((output.match(/<article class="project"/g) ?? []).length, 3);
  assert.ok(output.indexOf('>First<') < output.indexOf('>Second<'));
  assert.ok(output.indexOf('>Second<') < output.indexOf('>Third<'));
  assert.doesNotMatch(output, /project-index|data-project-order/);
});
