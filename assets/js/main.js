import { caseStudies } from './content.js';
import { renderProjects } from './render-projects.js';

const caseStudiesById = new Map(caseStudies.map((record) => [record.id, record]));

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function renderList(selector, values) {
  const list = document.querySelector(selector);
  if (!list) return;

  const items = values.map((value) => {
    const item = document.createElement('li');
    item.textContent = value;
    return item;
  });
  list.replaceChildren(...items);
}

async function initProjects() {
  const mount = document.querySelector('#project-list');
  if (!mount) return;

  const response = await fetch('public.json');
  if (!response.ok) throw new Error(`Unable to load projects: ${response.status}`);
  const payload = await response.json();
  mount.innerHTML = renderProjects(payload.projects);
}

function initFooterYear() {
  const year = document.querySelector('[data-current-year]');
  if (year) year.textContent = String(new Date().getFullYear());
}

function initNavigation() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('#site-navigation');
  if (!header || !toggle || !navLinks) return;

  const links = navLinks.querySelectorAll('a');
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  const close = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    navLinks.classList.remove('is-open');
  };
  const updateHeader = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  };

  toggle.addEventListener('click', () => {
    const shouldOpen = !isOpen();
    toggle.setAttribute('aria-expanded', String(shouldOpen));
    toggle.setAttribute(
      'aria-label',
      shouldOpen ? 'Close navigation' : 'Open navigation',
    );
    navLinks.classList.toggle('is-open', shouldOpen);
  });
  links.forEach((link) => link.addEventListener('click', close));
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen()) return;
    close();
    toggle.focus();
  });
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (typeof window.matchMedia === 'function') {
    const desktopQuery = window.matchMedia('(min-width: 901px)');
    const closeOnDesktop = (event) => {
      if (event.matches) close();
    };
    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', closeOnDesktop);
    } else if (typeof desktopQuery.addListener === 'function') {
      desktopQuery.addListener(closeOnDesktop);
    }
  }

  updateHeader();
  toggle.hidden = false;
}

function initCaseStudyDialog() {
  const dialog = document.querySelector('#case-study-dialog');
  if (
    !dialog ||
    typeof HTMLDialogElement === 'undefined' ||
    typeof dialog.showModal !== 'function'
  ) return;

  const triggers = document.querySelectorAll('[data-case-study]');
  const closeButton = dialog.querySelector('.dialog-close');
  if (!closeButton) return;
  let activeTrigger;

  const openDialog = (trigger) => {
    const record = caseStudiesById.get(trigger.dataset.caseStudy);
    if (!record) return;

    setText('#case-study-category', record.category);
    setText('#case-study-title', record.name);
    setText('#case-study-summary', record.summary);
    setText('#case-study-metric', record.metric);
    setText('#case-study-problem', record.problem);
    setText('#case-study-role', record.role);
    renderList('#case-study-approach', record.approach);
    renderList('#case-study-outcomes', record.outcomes);
    renderList('#case-study-technologies', record.technologies);

    activeTrigger = trigger;
    dialog.showModal();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => openDialog(trigger));
  });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    const trigger = activeTrigger;
    activeTrigger = undefined;
    trigger?.focus();
  });
  triggers.forEach((trigger) => {
    trigger.hidden = false;
  });
}

function initReveals() {
  const elements = [...document.querySelectorAll('[data-reveal]')];
  const showAll = () => {
    elements.forEach((element) => element.classList.add('is-visible'));
  };
  const reducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || typeof IntersectionObserver === 'undefined') {
    showAll();
    return;
  }

  let observer;
  try {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14 });
    elements.forEach((element) => observer.observe(element));
    document.documentElement.classList.add('reveal-ready');
  } catch {
    if (typeof observer?.disconnect === 'function') observer.disconnect();
    document.documentElement.classList.remove('reveal-ready');
    showAll();
  }
}

async function initSystemMapSafely() {
  try {
    const canvas = document.querySelector('#system-map');
    if (!canvas) return;

    const { initSystemMap } = await import('./system-map.js');
    await initSystemMap(canvas);
  } catch {
    // The canvas remains an optional enhancement until its module is available.
  }
}

function runSafely(initializer) {
  try {
    const result = initializer();
    if (result && typeof result.then === 'function') {
      Promise.resolve(result).catch(() => undefined);
    }
  } catch {}
}

runSafely(initProjects);
runSafely(initFooterYear);
runSafely(initNavigation);
runSafely(initCaseStudyDialog);
runSafely(initReveals);
runSafely(initSystemMapSafely);
