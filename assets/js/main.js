(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');

  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav?.classList.toggle('is-open', !open);
  });

  nav?.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    nav.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
  });

  const slides = [...document.querySelectorAll('.portrait-slide')];
  const dots = [...document.querySelectorAll('.carousel-dots button')];
  const carousel = document.querySelector('.portrait-carousel');
  const portraitWindow = document.querySelector('.portrait-window');
  let current = 0;
  let timer;
  let touchStartX = 0;
  let dragStartX = 0;
  let dragStartOffset = 0;
  let draggedSlide;
  let pointerIsDown = false;

  const showSlide = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide) => slide.classList.remove('is-active'));
    const activeSlide = slides[current];
    if (activeSlide) {
      void activeSlide.offsetWidth;
      activeSlide.classList.add('is-active');
    }
    dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === current));
  };

  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const createPauseControl = (container, name, onChange) => {
    let paused = false;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'slideshow-pause';
    button.setAttribute('aria-pressed', 'false');
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    button.append(icon);
    const update = () => {
      button.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} ${name} slideshow`);
      button.title = button.getAttribute('aria-label');
      button.setAttribute('aria-pressed', String(paused));
      icon.textContent = paused ? '\u25b6' : '\u2161';
      container.classList.toggle('slideshow-paused', paused);
    };
    button.addEventListener('click', () => { paused = !paused; update(); onChange(paused); });
    update();
    container.append(button);
    return button;
  };
  let portraitPaused = false;
  const stopCarousel = () => window.clearTimeout(timer);
  const startCarousel = () => {
    stopCarousel();
    if (!portraitPaused && slides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const duration = Number(slides[current]?.dataset.duration) || 3000;
      timer = window.setTimeout(() => {
        showSlide(current + 1);
        startCarousel();
      }, duration);
    }
  };

  dots.forEach((dot, index) => dot.addEventListener('click', () => {
    showSlide(index);
    startCarousel();
  }));
  portraitWindow?.addEventListener('mouseenter', () => {
    if (supportsHover.matches) stopCarousel();
  });
  portraitWindow?.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') return;
    const slide = slides[current];
    if (!slide) return;
    const windowRect = portraitWindow.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    draggedSlide = slide;
    pointerIsDown = true;
    dragStartX = event.clientX;
    dragStartOffset = slideRect.left - windowRect.left - 9;
    slide.style.setProperty('--drag-x', `${dragStartOffset}px`);
    slide.classList.add('is-dragging');
    portraitWindow.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  portraitWindow?.addEventListener('pointermove', (event) => {
    if (!draggedSlide || !pointerIsDown || event.pointerType !== 'mouse') return;
    const innerWidth = portraitWindow.clientWidth - 18;
    const minOffset = Math.min(0, innerWidth - draggedSlide.offsetWidth);
    const nextOffset = Math.max(minOffset, Math.min(0, dragStartOffset + event.clientX - dragStartX));
    draggedSlide.style.setProperty('--drag-x', `${nextOffset}px`);
    const bounds = portraitWindow.getBoundingClientRect();
    const position = Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100));
    draggedSlide.style.setProperty('--portrait-position', `${position}%`);
  });
  portraitWindow?.addEventListener('pointerup', (event) => {
    if (!draggedSlide || event.pointerType !== 'mouse') return;
    pointerIsDown = false;
    portraitWindow.releasePointerCapture(event.pointerId);
  });
  portraitWindow?.addEventListener('pointerleave', () => {
    if (draggedSlide) {
      draggedSlide.classList.remove('is-dragging');
      draggedSlide.style.removeProperty('--drag-x');
      draggedSlide.style.removeProperty('--portrait-position');
      draggedSlide = undefined;
    }
    pointerIsDown = false;
    startCarousel();
  });
  portraitWindow?.addEventListener('dragstart', (event) => event.preventDefault());
  carousel?.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
    stopCarousel();
  }, { passive: true });
  carousel?.addEventListener('touchend', (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 45) showSlide(current + (distance < 0 ? 1 : -1));
    startCarousel();
  }, { passive: true });
  carousel?.addEventListener('touchcancel', startCarousel, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopCarousel();
    else startCarousel();
  });
  if (carousel && slides.length > 1) createPauseControl(carousel, 'profile', (paused) => {
    portraitPaused = paused;
    if (paused) stopCarousel();
    else startCarousel();
  });
  startCarousel();

  const initServiceCarousel = (serviceCarousel) => {
    const serviceSlides = [...serviceCarousel.querySelectorAll('.service-slide')];
    const controls = serviceCarousel.querySelector('.service-slide-controls');
    const selectors = [...controls.querySelectorAll('[data-service-slide]')];
    if (serviceSlides.length < 2) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let active = 0;
    let visible = false;
    let hovered = false;
    let touchStart = 0;
    let serviceTimer;
    let manuallyPaused = false;

    const stop = () => window.clearTimeout(serviceTimer);
    const show = (index) => {
      active = (index + serviceSlides.length) % serviceSlides.length;
      serviceSlides.forEach((slide, slideIndex) => {
        const selected = slideIndex === active;
        slide.classList.toggle('is-active', selected);
        if (selected) slide.removeAttribute('aria-hidden');
        else slide.setAttribute('aria-hidden', 'true');
      });
      selectors.forEach((selector, selectorIndex) => selector.setAttribute('aria-pressed', String(selectorIndex === active)));
    };
    const schedule = () => {
      stop();
      if (manuallyPaused || reducedMotion.matches || !visible || hovered || document.hidden || serviceCarousel.querySelector(':focus-visible')) return;
      serviceTimer = window.setTimeout(() => {
        show(active + 1);
        schedule();
      }, 4000);
    };

    controls.hidden = false;
    createPauseControl(serviceCarousel, serviceCarousel.getAttribute('aria-label')?.replace(/(?:conceptual )?visual tour/i, '').trim() || 'project', (paused) => {
      manuallyPaused = paused;
      schedule();
    });
    selectors.forEach((selector, index) => selector.addEventListener('click', () => {
      show(index);
      schedule();
    }));
    serviceCarousel.addEventListener('mouseenter', () => {
      if (supportsHover.matches) { hovered = true; stop(); }
    });
    serviceCarousel.addEventListener('mouseleave', () => { hovered = false; schedule(); });
    serviceCarousel.addEventListener('focusin', stop);
    serviceCarousel.addEventListener('focusout', () => window.setTimeout(schedule, 0));
    serviceCarousel.addEventListener('touchstart', (event) => {
      touchStart = event.changedTouches[0].clientX;
      stop();
    }, { passive: true });
    serviceCarousel.addEventListener('touchend', (event) => {
      const distance = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(distance) > 45) show(active + (distance < 0 ? 1 : -1));
      schedule();
    }, { passive: true });
    document.addEventListener('visibilitychange', schedule);
    reducedMotion.addEventListener('change', schedule);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    }, { threshold: 0.25 }).observe(serviceCarousel);
  };
  document.querySelectorAll('[data-service-carousel]').forEach(initServiceCarousel);

  const year = document.querySelector('#year');
  document.querySelectorAll('[data-open-system]').forEach((systemTrigger) => {
    const systemId = systemTrigger.dataset.openSystem;
    let systemDialog = document.getElementById(`${systemId}-dialog`);
    if (!systemDialog) {
      const card = systemTrigger.closest('.card-body');
      const template = document.querySelector('#system-summary-template');
      if (!card || !template) return;
      systemDialog = template.content.querySelector('dialog').cloneNode(true);
      systemDialog.id = `${systemId}-dialog`;
      systemDialog.setAttribute('aria-labelledby', `${systemId}-title`);
      const title = systemDialog.querySelector('h2');
      title.id = `${systemId}-title`;
      title.textContent = systemTrigger.textContent;
      systemDialog.querySelector('.system-lead').textContent = card.querySelector('p').textContent;
      systemDialog.querySelector('ul').replaceChildren(...[...card.querySelectorAll('li')].map((item) => item.cloneNode(true)));
      document.body.append(systemDialog);
    }
    if (!systemDialog) return;
    const systemTabs = [...systemDialog.querySelectorAll('[role="tab"]')];
    const selectSystemTab = (tab) => {
      systemTabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(item.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
      systemDialog.querySelector('.system-dialog-body').scrollTop = 0;
    };
    systemTrigger.addEventListener('click', () => {
      if (systemTabs.length) selectSystemTab(systemTabs[0]);
      systemDialog.showModal();
    });
    systemDialog.querySelector('.system-close')?.addEventListener('click', () => systemDialog.close());
    systemDialog.addEventListener('click', (event) => {
      const bounds = systemDialog.getBoundingClientRect();
      if (event.target === systemDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) systemDialog.close();
    });
    systemDialog.addEventListener('close', () => {
      if (document.activeElement === document.body) systemTrigger.focus();
    });
    systemTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectSystemTab(tab));
      tab.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % systemTabs.length;
        if (event.key === 'ArrowLeft') next = (index + systemTabs.length - 1) % systemTabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = systemTabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        selectSystemTab(systemTabs[next]);
        systemTabs[next].focus();
      });
    });
  });
  const solutionsGrid = document.querySelector('[data-solutions-url]');
  if (solutionsGrid) {
    const status = document.getElementById('solutions-status');
    const loadSolutions = async () => {
      try {
        const response = await fetch(solutionsGrid.dataset.solutionsUrl);
        if (!response.ok) throw new Error('Solutions request failed');
        const data = await response.json();
        if (!Array.isArray(data.items)) throw new Error('Invalid solutions data');
        const cards = data.items
          .filter((item) => item && item.status === 'active' && typeof item.title === 'string' && item.title.trim() && typeof item.summary === 'string' && typeof item.url === 'string')
          .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
          .flatMap((item) => {
            let url;
            try { url = new URL(item.url); } catch { return []; }
            if (!['https:', 'http:'].includes(url.protocol)) return [];
            const card = document.createElement('article');
            card.className = 'article-card';
            card.dataset.featured = String(item.featured === true);
            card.dataset.category = typeof item.category === 'string' && item.category.trim() ? item.category.trim() : 'Other';
            card.dataset.search = `${item.title} ${item.summary}`.toLowerCase();
            const image = document.createElement('img');
            image.className = 'solution-image';
            image.alt = `Illustrative preview for ${item.title}`;
            image.loading = 'lazy';
            image.decoding = 'async';
            image.width = 640;
            image.height = 360;
            const fallbackImage = new URL('assets/images/reference/architecture-workshop.png', document.baseURI).href;
            let imageUrl = fallbackImage;
            if (typeof item.image === 'string' && item.image.trim()) {
              try {
                const candidate = new URL(item.image, document.baseURI);
                if (['https:', 'http:'].includes(candidate.protocol)) imageUrl = candidate.href;
              } catch { /* Use the local placeholder for invalid image URLs. */ }
            }
            image.src = imageUrl;
            image.addEventListener('error', () => {
              if (image.src !== fallbackImage) image.src = fallbackImage;
            });
            const heading = document.createElement('h3');
            const summary = document.createElement('p');
            summary.textContent = item.summary;
            const link = document.createElement('a');
            link.className = 'solution-link';
            link.href = url.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute('aria-label', `Open ${item.title} (opens in a new tab)`);
            link.title = `Open ${item.title}`;
            link.textContent = item.title;
            heading.append(link);
            card.append(image, heading, summary);
            return [card];
          });
        const featured = solutionsGrid.hasAttribute('data-featured-solutions');
        const more = document.getElementById('solutions-more');
        let visibleCount = 3;
        const featuredCards = cards.filter((card) => card.dataset.featured === 'true');
        const initialCards = (featuredCards.length ? featuredCards : cards).slice(0, 3);
        const homeCards = [...initialCards, ...cards.filter((card) => !initialCards.includes(card))];
        const search = document.getElementById('solutions-search');
        const category = document.getElementById('solutions-category');
        const pagination = document.getElementById('solutions-pagination');
        const previous = document.querySelector('[data-solutions-prev]');
        const next = document.querySelector('[data-solutions-next]');
        const pageLabel = document.getElementById('solutions-page');
        const count = document.getElementById('solutions-count');
        let page = 1;
        const pageSize = 9;
        if (category) {
          [...new Set(cards.map((card) => card.dataset.category))].sort().forEach((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            category.append(option);
          });
        }
        const renderSolutions = () => {
          const matching = featured ? homeCards : cards.filter((card) => card.dataset.search.includes((search?.value || '').trim().toLowerCase()) && (!category?.value || card.dataset.category === category.value));
          const pages = Math.max(1, Math.ceil(matching.length / pageSize));
          page = Math.min(page, pages);
          solutionsGrid.replaceChildren(...(featured ? matching.slice(0, visibleCount) : matching.slice((page - 1) * pageSize, page * pageSize)));
          if (more) {
            more.hidden = matching.length <= 3;
            more.textContent = visibleCount >= matching.length ? 'Show Less' : visibleCount > 3 ? 'Explore More' : 'Explore All Solutions';
          }
          if (count) count.textContent = `${matching.length} solution${matching.length === 1 ? '' : 's'}`;
          if (pagination) pagination.hidden = pages <= 1;
          if (previous) previous.disabled = page === 1;
          if (next) next.disabled = page === pages;
          if (pageLabel) pageLabel.textContent = `Page ${page} of ${pages}`;
          if (status) {
            status.textContent = matching.length ? '' : 'No solutions found.';
            status.hidden = matching.length > 0;
          }
        };
        search?.addEventListener('input', () => { page = 1; renderSolutions(); });
        category?.addEventListener('change', () => { page = 1; renderSolutions(); });
        more?.addEventListener('click', () => {
          if (visibleCount >= homeCards.length) {
            visibleCount = 3;
            renderSolutions();
            solutionsGrid.closest('section')?.scrollIntoView({
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
              block: 'start',
            });
            return;
          }
          const firstNew = visibleCount;
          visibleCount += 3;
          renderSolutions();
          solutionsGrid.querySelectorAll('.solution-link')[firstNew]?.focus({ preventScroll: true });
        });
        previous?.addEventListener('click', () => { page--; renderSolutions(); solutionsGrid.scrollIntoView({ block: 'start' }); });
        next?.addEventListener('click', () => { page++; renderSolutions(); solutionsGrid.scrollIntoView({ block: 'start' }); });
        renderSolutions();
      } catch {
        if (status) status.textContent = 'Unable to load solutions. Please refresh to try again.';
      } finally {
        solutionsGrid.setAttribute('aria-busy', 'false');
      }
    };
    loadSolutions();
  }
  if (year) year.textContent = String(new Date().getFullYear());
})();
