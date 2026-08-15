function escapeHtml(value) {
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return String(value ?? '').replace(/[&<>"']/g, (character) => entities[character]);
}

function normalizeExternalUrl(value) {
  const candidate = typeof value === 'string' ? value.trim() : '';
  if (!candidate) return '';

  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) ? candidate : '';
  } catch {
    return '';
  }
}

function normalizeImageUrl(value) {
  const candidate = typeof value === 'string' ? value.trim() : '';
  if (!candidate || candidate.startsWith('//')) return '';
  if (/^(?:\.\.\/|\/)/.test(candidate)) return '';
  if (!candidate.includes(':')) return candidate;
  return normalizeExternalUrl(candidate);
}

export function prepareProjects(projects) {
  if (!Array.isArray(projects)) return [];

  return projects
    .map((project, inputIndex) => ({ project, inputIndex }))
    .filter(({ project }) => project && project.status === 'active')
    .sort((left, right) => {
      const leftOrder = Number.isFinite(Number(left.project.order))
        ? Number(left.project.order)
        : Number.POSITIVE_INFINITY;
      const rightOrder = Number.isFinite(Number(right.project.order))
        ? Number(right.project.order)
        : Number.POSITIVE_INFINITY;
      return leftOrder - rightOrder || left.inputIndex - right.inputIndex;
    })
    .map(({ project }) => project);
}

export function renderProject(project) {
  const sourceUrl = normalizeExternalUrl(project.sourceUrl);
  const liveUrl = normalizeExternalUrl(project.liveUrl);
  const coverImage = normalizeImageUrl(project.coverImage);
  const title = escapeHtml(project.title);
  const visual = coverImage
    ? `<img src="${escapeHtml(coverImage)}" alt="" loading="lazy" decoding="async">`
    : '<span class="project-visual-fallback" aria-hidden="true"></span>';
  const sourceAction = sourceUrl
    ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">View Source</a>`
    : '';
  const liveAction = liveUrl
    ? `<a href="${escapeHtml(liveUrl)}" target="_blank" rel="noreferrer">Explore Live</a>`
    : '';

  return `<article class="project">
  <div class="project-visual" aria-hidden="true">${visual}</div>
  <div class="project-copy">
    <h3>${title}</h3>
    <p>${escapeHtml(project.summary)}</p>
    <div class="project-actions">${sourceAction}${liveAction}</div>
  </div>
</article>`;
}

export function renderProjects(projects) {
  return prepareProjects(projects)
    .map(renderProject)
    .join('');
}
