# Fluid Intelligence Sphere

## Goal

Replace the sparse hero node diagram with a richer intelligent-platform visual inspired by the supplied particle sphere, while keeping the portfolio fast, professional, responsive, and accessible.

## Visual Direction

The canvas will render a circular field made from layered particles and restrained network connections. Particles will use the existing teal, gold, charcoal, and soft neutral palette. Subtle orbital motion and pointer response will create depth without distracting from the portfolio copy.

The visual will remain text-free so the sphere reads as a clean supporting image rather than competing with the hero message. It will not copy the reference image or introduce a purple-dominated palette.

## Fluid Layout

The hero content shell will become a responsive two-column grid. Copy and canvas will participate in normal document flow, with no absolute positioning for the canvas. The visual column will use intrinsic sizing and a square aspect ratio, while canvas drawing coordinates remain normalized to its current container dimensions.

At narrower breakpoints, the grid will stack. The sphere will resize within the available width, retain safe separation from the copy, and simplify labels or particle density when space is constrained. No fixed pixel coordinates will determine the layout.

## Rendering And Motion

The existing dependency-free canvas module will remain the rendering engine. A deterministic seeded particle generator will make tests and static frames repeatable. Animation will pause when offscreen or when the page is hidden. Reduced-motion users will receive a stable, complete frame without orbital or pointer movement.

## Accessibility And Resilience

The canvas remains decorative with `aria-hidden="true"`; the four positioning ideas are already reflected by nearby portfolio language and do not become required reading. If canvas or browser enhancement APIs are unavailable, the semantic hero content remains fully usable.

## Verification

Tests will cover deterministic particle generation, normalized geometry, responsive density, stable reduced-motion rendering, cleanup behavior, and fluid CSS layout. Playwright checks will validate nonblank canvas pixels, no overlap or horizontal overflow, and correct framing across desktop, tablet, and mobile viewports.
