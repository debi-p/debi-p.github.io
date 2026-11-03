import assert from 'node:assert/strict';
import test from 'node:test';

import { prepareProjects, renderProject, renderProjects } from '../assets/js/render-projects.js';

const project = {
  title: 'Project One',
  summary: 'A useful project with a clear purpose.',
  sourceUrl: 'https://github.com/debi-p/project-one',
  liveUrl: 'https://debi-p.github.io/project-one/',
  coverImage: 'assets/images/project-one.webp',
  order: 2,
  status: 'active',
};

test('keeps only active projects and preserves numeric order', () => {
  const input = [
    project,
    { ...project, title: 'First', order: 1 },
    { ...project, title: 'Draft', order: 0, status: 'draft' },
  ];
  assert.deepEqual(prepareProjects(input).map(({ title }) => title), ['First', 'Project One']);
  assert.equal(input[0].title, 'Project One');
});

test('renders an image-led editorial project without numbering', () => {
  const output = renderProject(project);
  assert.match(output, /<article\b[^>]*class="[^"]*project-editorial\b/);
  assert.match(output, /<img src="assets\/images\/project-one\.webp" alt=""/);
  assert.match(output, /<h3>Project One<\/h3>/);
  assert.match(output, /<p>A useful project with a clear purpose\.<\/p>/);
  assert.match(
    output,
    /href="https:\/\/github\.com\/debi-p\/project-one"[^>]*>View Source<\/a>/,
  );
  assert.match(
    output,
    /href="https:\/\/debi-p\.github\.io\/project-one\/"[^>]*>Explore Live<\/a>/,
  );
  assert.doesNotMatch(output, /project-index|data-project-order|>\s*0?\d+\s*</);
});

test('renders every eligible project as an editorial article', () => {
  const output = renderProjects([
    { ...project, title: 'Second', order: 20 },
    { ...project, title: 'First', order: 10 },
    { ...project, title: 'Hidden', order: 0, status: 'inactive' },
  ]);
  assert.equal((output.match(/project-editorial/g) ?? []).length, 2);
  assert.ok(output.indexOf('>First<') < output.indexOf('>Second<'));
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
  assert.doesNotMatch(output, /<a\b|href=/i, 'unsafe actions must be omitted');
  assert.doesNotMatch(output, /<img\b/i, 'unsafe cover images must be omitted');
  assert.match(
    output,
    /<span class="project-visual-fallback" aria-hidden="true"><\/span>/,
    'unsafe cover images must use the visual fallback',
  );
  assert.match(output, /<div class="project-actions"><\/div>/);
});
