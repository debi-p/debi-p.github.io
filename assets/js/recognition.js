(() => {
  const gallery = document.querySelector('[data-recognition-url]');
  if (!gallery) return;
  const status = document.getElementById('recognition-status');
  const dialog = document.querySelector('.recognition-preview');
  const preview = dialog.querySelector('img');
  const previewFrame = document.createElement('div');
  previewFrame.className = 'recognition-frame recognition-modal-frame';
  preview.before(previewFrame);
  const previewCaption = document.createElement('span');
  previewCaption.className = 'recognition-caption';
  previewFrame.append(preview, previewCaption);
  const label = document.getElementById('recognition-preview-label');
  const previous = dialog.querySelector('[data-recognition-prev]');
  const next = dialog.querySelector('[data-recognition-next]');
  let items = [];
  let current = 0;
  let visibleCount = 6;
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'button recognition-more';
  more.textContent = 'Show More';
  more.hidden = true;
  gallery.after(more);
  more.addEventListener('click', () => {
    if (visibleCount >= items.length) {
      visibleCount = 6;
      [...gallery.children].forEach((card, index) => { card.hidden = index >= visibleCount; });
      more.textContent = 'Show More';
      gallery.closest('section')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      });
      return;
    }
    const firstNew = gallery.children[visibleCount];
    visibleCount += 6;
    [...gallery.children].forEach((card, index) => { card.hidden = index >= visibleCount; });
    more.textContent = visibleCount >= items.length ? 'Show Less' : 'Show More';
    firstNew?.focus({ preventScroll: true });
  });
  const show = (index) => {
    current = (index + items.length) % items.length;
    preview.src = items[current].url;
    preview.alt = items[current].label;
    previewFrame.classList.toggle('recognition-frame--existing', items[current].framed === true);
    previewCaption.textContent = items[current].label;
    label.textContent = items[current].label;
    previous.hidden = next.hidden = items.length < 2;
  };
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  dialog.querySelector('[data-recognition-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  const load = async () => {
    try {
      const response = await fetch(gallery.dataset.recognitionUrl);
      if (!response.ok) throw new Error('Recognition request failed');
      const data = await response.json();
      if (!Array.isArray(data.items)) throw new Error('Invalid recognition data');
      items = data.items.filter((item) => item && typeof item.label === 'string' && typeof item.image === 'string').sort((a, b) => {
        const dateA = Date.parse(a.sortDate || a.date) || 0;
        const dateB = Date.parse(b.sortDate || b.date) || 0;
        return dateB - dateA || (Number(a.order) || 0) - (Number(b.order) || 0);
      }).flatMap((item) => {
        try {
          const url = new URL(item.image, document.baseURI);
          return ['https:', 'http:'].includes(url.protocol) ? [{ ...item, url: url.href }] : [];
        } catch { return []; }
      });
      gallery.replaceChildren(...items.map((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'recognition-image';
        button.hidden = index >= visibleCount;
        button.setAttribute('aria-label', `View ${item.label}`);
        button.setAttribute('aria-haspopup', 'dialog');
        const image = document.createElement('img');
        image.src = item.url;
        image.alt = item.label;
        image.loading = 'lazy';
        image.decoding = 'async';
        const frame = document.createElement('span');
        frame.className = 'recognition-frame';
        frame.classList.toggle('recognition-frame--existing', item.framed === true);
        frame.append(image);
        const caption = document.createElement('span');
        caption.className = 'recognition-caption';
        caption.textContent = item.label;
        frame.append(caption);
        button.append(frame);
        button.addEventListener('click', () => { show(index); dialog.showModal(); });
        return button;
      }));
      more.hidden = items.length <= visibleCount;
      status.hidden = items.length > 0;
      status.textContent = items.length ? '' : 'No recognition images available yet.';
    } catch {
      status.textContent = 'Unable to load recognition images. Please refresh to try again.';
    } finally { gallery.setAttribute('aria-busy', 'false'); }
  };
  load();
})();
