const COLORS = {
  ai: '#08705e',
  data: '#c49a2f',
  human: '#59635f',
  platform: '#15191b',
};

const LINE_COLOR = 'rgba(8, 112, 94, 0.18)';
const TAU = Math.PI * 2;

export function shouldAnimate({ reducedMotion, visible }) {
  return !reducedMotion && visible;
}

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSphereParticles(canvasWidth = 480) {
  const width = Math.max(0, finiteOr(Number(canvasWidth), 480));
  const count = clamp(Math.round(140 + (width * 0.36)), 140, 320);
  const random = seededRandom(0x51f15e);
  const radii = [1, 0.81, 0.61];
  const kinds = ['ai', 'platform', 'data', 'human'];
  const particles = [];

  for (let index = 0; index < count; index += 1) {
    const layerIndex = index % radii.length;
    const layer = radii[layerIndex];
    const layerPosition = Math.floor(index / radii.length);
    const layerCount = Math.ceil((count - layerIndex) / radii.length);
    const y = 1 - (2 * (layerPosition + 0.5) / layerCount);
    const radial = Math.sqrt(Math.max(0, 1 - (y * y)));
    const theta = (layerPosition * 2.399963229728653) + (layerIndex * 0.83) + (random() * 0.08);
    particles.push({
      x: Math.cos(theta) * radial * layer,
      y: y * layer,
      z: Math.sin(theta) * radial * layer,
      kind: kinds[index % kinds.length],
      layer,
      phase: random() * TAU,
      size: 0.7 + (random() * 0.75) + (index % 29 === 0 ? 0.8 : 0),
    });
  }

  return particles;
}

export function buildSphereConnections(particles) {
  const connections = [];
  const count = Array.isArray(particles) ? particles.length : 0;
  for (let index = 0; index < count; index += 1) {
    const particle = particles[index];
    let nearestIndex = -1;
    let nearestDistance = Number.POSITIVE_INFINITY;
    let crossLayerIndex = -1;
    let crossLayerDistance = Number.POSITIVE_INFINITY;

    for (let candidateIndex = index + 1; candidateIndex < count; candidateIndex += 1) {
      const candidate = particles[candidateIndex];
      const distance = ((particle.x - candidate.x) ** 2)
        + ((particle.y - candidate.y) ** 2)
        + ((particle.z - candidate.z) ** 2);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = candidateIndex;
      }
      if (candidate.layer !== particle.layer && distance < crossLayerDistance) {
        crossLayerDistance = distance;
        crossLayerIndex = candidateIndex;
      }
    }

    if (nearestIndex >= 0) connections.push([index, nearestIndex]);
    if (index % 3 === 0
      && crossLayerIndex >= 0
      && crossLayerIndex !== nearestIndex
      && crossLayerDistance < 0.7) {
      connections.push([index, crossLayerIndex]);
    }
  }
  return connections;
}

function noOpCleanup() {
  let cleaned = false;
  return () => {
    if (cleaned) return;
    cleaned = true;
  };
}

export function initSystemMap(canvas) {
  const context = canvas?.getContext?.('2d');
  if (!context) return noOpCleanup();

  let runtimeWindow = globalThis;
  let runtimeDocument = null;
  let hero = null;
  let particles = [];
  let connections = [];
  let projected = [];
  let depthOrder = [];
  const pointer = { x: 0, y: 0 };
  let canvasHeight = 0;
  let canvasWidth = 0;
  let sphereCenterX = 0;
  let sphereCenterY = 0;
  let sphereRadius = 0;
  let cleaned = false;
  let frameId = null;
  let intersectionObserver = null;
  let intersectionTracked = false;
  let heroVisible = true;
  let resizeObserver = null;
  let resizeListenerAttempted = false;
  let pointerListenerAttempted = false;
  let visibilityListenerAttempted = false;
  let motionListenerMode = null;
  let reducedMotion = false;
  let motionQuery = null;
  let pageVisible = true;
  let requestFrame = null;
  let cancelScheduledFrame = null;

  function safely(teardown) {
    try {
      teardown();
    } catch {
      // One failed browser teardown must not strand the remaining resources.
    }
  }

  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    if (frameId !== null && cancelScheduledFrame) {
      const scheduledFrame = frameId;
      frameId = null;
      safely(() => cancelScheduledFrame(scheduledFrame));
    }
    if (intersectionObserver) safely(() => intersectionObserver.disconnect());
    if (resizeObserver) safely(() => resizeObserver.disconnect());
    if (resizeListenerAttempted) safely(() => runtimeWindow.removeEventListener('resize', handleResize));
    if (pointerListenerAttempted && hero) safely(() => hero.removeEventListener('pointermove', handlePointerMove));
    if (motionListenerMode === 'modern') safely(() => motionQuery.removeEventListener('change', handleMotionChange));
    else if (motionListenerMode === 'legacy') safely(() => motionQuery.removeListener(handleMotionChange));
    if (visibilityListenerAttempted && runtimeDocument) {
      safely(() => runtimeDocument.removeEventListener('visibilitychange', handleVisibilityChange));
    }
  }

  function currentTime() {
    try {
      const value = globalThis.performance?.now?.();
      if (Number.isFinite(value)) return value;
    } catch {
      // Date.now remains available when a partial performance API fails.
    }
    return Date.now();
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect?.() ?? {};
    canvasWidth = Math.max(0, finiteOr(Number(rect.width), 0));
    canvasHeight = Math.max(0, finiteOr(Number(rect.height), 0));
    const rawDpr = Number(runtimeWindow.devicePixelRatio);
    const dpr = Math.min(rawDpr > 0 && Number.isFinite(rawDpr) ? rawDpr : 1, 2);
    canvas.width = Math.max(1, Math.round(canvasWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvasHeight * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = buildSphereParticles(canvasWidth);
    connections = buildSphereConnections(particles);
    projected = particles.map(() => ({ x: 0, y: 0, z: 0, scale: 1 }));
    depthOrder = particles.map((_, index) => index);
  }

  function projectParticles(timestamp) {
    sphereCenterX = canvasWidth / 2;
    sphereCenterY = canvasHeight / 2;
    sphereRadius = Math.max(0, Math.min(canvasWidth, canvasHeight) * 0.37);
    const orbit = reducedMotion ? 0.42 : (timestamp * 0.000055) + 0.42;
    const yaw = orbit + (pointer.x * 0.18);
    const pitch = -0.12 + (pointer.y * 0.14);
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);

    for (let index = 0; index < particles.length; index += 1) {
      const particle = particles[index];
      const rotatedX = (particle.x * cosYaw) - (particle.z * sinYaw);
      const yawZ = (particle.x * sinYaw) + (particle.z * cosYaw);
      const rotatedY = (particle.y * cosPitch) - (yawZ * sinPitch);
      const rotatedZ = (particle.y * sinPitch) + (yawZ * cosPitch);
      const perspective = 1 + (rotatedZ * 0.11);
      const point = projected[index];
      point.x = finiteOr(sphereCenterX + (rotatedX * sphereRadius * perspective), sphereCenterX);
      point.y = finiteOr(sphereCenterY + (rotatedY * sphereRadius * perspective), sphereCenterY);
      point.z = finiteOr(rotatedZ, 0);
      point.scale = clamp(0.72 + ((rotatedZ + 1) * 0.28), 0.72, 1.28);
    }
    depthOrder.sort((a, b) => projected[a].z - projected[b].z);
  }

  function draw(timestamp) {
    const time = finiteOr(timestamp, currentTime());
    projectParticles(time);
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.globalAlpha = 1;
    context.lineWidth = 1;
    context.strokeStyle = 'rgba(8, 112, 94, 0.3)';
    context.beginPath();
    context.arc(sphereCenterX, sphereCenterY, sphereRadius * 1.04, 0, TAU);
    context.stroke();

    context.lineWidth = 0.7;
    context.strokeStyle = LINE_COLOR;
    context.beginPath();
    for (const [fromIndex, toIndex] of connections) {
      const from = projected[fromIndex];
      const to = projected[toIndex];
      if (Math.abs(from.z - to.z) > 0.75) continue;
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
    }
    context.stroke();

    for (const index of depthOrder) {
      const particle = particles[index];
      const point = projected[index];
      context.fillStyle = COLORS[particle.kind];
      context.globalAlpha = clamp(0.26 + ((point.z + 1) * 0.31), 0.22, 0.88);
      context.beginPath();
      const layerScale = particle.layer === 1 ? 1.45 : 1.15;
      context.arc(point.x, point.y, layerScale * particle.size * point.scale, 0, TAU);
      context.fill();
    }
    context.globalAlpha = 1;
  }

  function cancelFrame() {
    if (frameId === null || !cancelScheduledFrame) return;
    cancelScheduledFrame(frameId);
    frameId = null;
  }

  function tick(timestamp) {
    frameId = null;
    if (cleaned) return;
    draw(timestamp);
    if (requestFrame && shouldAnimate({ reducedMotion, visible: intersectionTracked && heroVisible && pageVisible })) {
      frameId = requestFrame(tick);
    }
  }

  function sync() {
    if (cleaned) return;
    cancelFrame();
    if (requestFrame && shouldAnimate({ reducedMotion, visible: intersectionTracked && heroVisible && pageVisible })) {
      frameId = requestFrame(tick);
      return;
    }
    draw(currentTime());
  }

  function handleResize() {
    resizeCanvas();
    sync();
  }

  function normalizedPointer(clientValue, start, size) {
    if (!Number.isFinite(clientValue) || !Number.isFinite(start) || !(size > 0)) return 0;
    return clamp((((clientValue - start) / size) * 2) - 1, -1, 1);
  }

  function handlePointerMove(event) {
    if (reducedMotion) return;
    const rect = hero.getBoundingClientRect?.() ?? {};
    pointer.x = normalizedPointer(Number(event?.clientX), finiteOr(Number(rect.left), 0), finiteOr(Number(rect.width), 0));
    pointer.y = normalizedPointer(Number(event?.clientY), finiteOr(Number(rect.top), 0), finiteOr(Number(rect.height), 0));
    if (!requestFrame || !shouldAnimate({ reducedMotion, visible: intersectionTracked && heroVisible && pageVisible })) draw(currentTime());
  }

  function handleMotionChange(event) {
    reducedMotion = Boolean(event?.matches ?? motionQuery?.matches);
    if (reducedMotion) {
      pointer.x = 0;
      pointer.y = 0;
    }
    sync();
  }

  function handleVisibilityChange() {
    pageVisible = runtimeDocument?.visibilityState !== 'hidden';
    sync();
  }

  try {
    runtimeWindow = globalThis.window ?? globalThis;
    runtimeDocument = globalThis.document ?? runtimeWindow.document ?? null;
    hero = canvas.closest?.('.hero') ?? canvas;
    if (typeof runtimeWindow.matchMedia === 'function') {
      motionQuery = runtimeWindow.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotion = Boolean(motionQuery?.matches);
    }
    pageVisible = runtimeDocument?.visibilityState !== 'hidden';
    const requestFrameCandidate = globalThis.requestAnimationFrame ?? runtimeWindow.requestAnimationFrame;
    const cancelFrameCandidate = globalThis.cancelAnimationFrame ?? runtimeWindow.cancelAnimationFrame;
    requestFrame = typeof requestFrameCandidate === 'function' && typeof cancelFrameCandidate === 'function'
      ? requestFrameCandidate.bind(runtimeWindow) : null;
    cancelScheduledFrame = requestFrame ? cancelFrameCandidate.bind(runtimeWindow) : null;

    const IntersectionObserverClass = globalThis.IntersectionObserver ?? runtimeWindow.IntersectionObserver;
    if (typeof IntersectionObserverClass === 'function') {
      intersectionObserver = new IntersectionObserverClass((entries) => {
        const entry = entries.find((candidate) => candidate.target === hero) ?? entries[0];
        heroVisible = entry ? Boolean(entry.isIntersecting && entry.intersectionRatio > 0) : heroVisible;
        sync();
      }, { threshold: 0.01 });
      intersectionObserver.observe(hero);
      intersectionTracked = true;
    }

    const ResizeObserverClass = globalThis.ResizeObserver ?? runtimeWindow.ResizeObserver;
    if (typeof ResizeObserverClass === 'function') {
      resizeObserver = new ResizeObserverClass(handleResize);
      resizeObserver.observe(canvas);
    }
    if (!resizeObserver && typeof runtimeWindow.addEventListener === 'function' && typeof runtimeWindow.removeEventListener === 'function') {
      resizeListenerAttempted = true;
      runtimeWindow.addEventListener('resize', handleResize);
    }
    if (typeof hero.addEventListener === 'function' && typeof hero.removeEventListener === 'function') {
      pointerListenerAttempted = true;
      hero.addEventListener('pointermove', handlePointerMove, { passive: true });
    }
    if (motionQuery && typeof motionQuery.addEventListener === 'function' && typeof motionQuery.removeEventListener === 'function') {
      motionListenerMode = 'modern';
      motionQuery.addEventListener('change', handleMotionChange);
    } else if (motionQuery && typeof motionQuery.addListener === 'function' && typeof motionQuery.removeListener === 'function') {
      motionListenerMode = 'legacy';
      motionQuery.addListener(handleMotionChange);
    }
    if (runtimeDocument && typeof runtimeDocument.addEventListener === 'function' && typeof runtimeDocument.removeEventListener === 'function') {
      visibilityListenerAttempted = true;
      runtimeDocument.addEventListener('visibilitychange', handleVisibilityChange);
    }
    resizeCanvas();
    sync();
  } catch (error) {
    cleanup();
    throw error;
  }

  return cleanup;
}
