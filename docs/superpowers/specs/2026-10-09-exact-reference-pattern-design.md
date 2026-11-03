# Exact Reference Pattern Portfolio Design

## Objective

Rebuild Debi Prasad Pradhan's portfolio using the visible page structure, visual rhythm, and responsive behavior of `https://www.drtusharnayak.com/` as the reference. Replace all medical branding, copy, links, and imagery with Debi's portfolio content and locally owned assets.

This is an independent frontend recreation. It must not copy or republish the reference site's proprietary source code, scripts, text, branding, or image assets.

## Visual Direction

Use the reference site's core palette and hierarchy:

- Midnight navy: `#0a1628`
- Deep blue: `#0a2f4d`
- Teal: `#1e9aa2`
- Cyan highlight: `#22d3ee`
- White: `#ffffff`
- Muted gray: `#6b7280`
- Font direction: Geist or the closest locally available/system sans-serif fallback

The site should feel like a polished expert profile rather than a technology dashboard. Use squared or subtly rounded surfaces, strong photo-led sections, high-contrast navy backgrounds, teal accents, compact uppercase labels, and generous vertical spacing.

## Page Structure

### Header

- Identity lockup: Debi Prasad Pradhan / Staff Software Engineer.
- Desktop links: Home, Enterprise Systems, Experience, Solutions.
- Primary action: Start a Conversation.
- Mobile navigation follows the reference's compact menu behavior.

### Hero

- Large framed image carousel region on the left. Use existing local images as temporary samples.
- Content column on the right:
  - Debi Prasad Pradhan
  - Staff Software Engineer · AI Platforms & Distributed Systems
  - Short professional introduction
  - Three compact proof columns: 11+ years, 20+ engineers led, 3X delivery acceleration
  - Signature capability links: Agentic Engineering, Scientific Intelligence, Data Platforms, Software Distribution
  - Open Resume and Download Resume actions
- Remove the system-map canvas, spider visualization, orbit metrics, and separate impact visualization.

### Enterprise Systems

- Match the reference service-card section structure.
- Four image-led cards in a two-column desktop grid and one-column mobile stack:
  - Mesh - Agentic Workflow
  - PyIntelligence - Governed Multi-Agent Scientific Intelligence
  - AnalyticalGraph - Scientific Data Intelligence
  - ReleaseHub - Enterprise Software Distribution
- Each card contains a sample image, concise description, two outcome bullets, and Inspect System action.
- Existing accessible case-study dialog remains, restyled to match the reference.

### Experience

- Use the reference's large editorial section pattern.
- One temporary professional/work image paired with career progression.
- Include Thermo Fisher Scientific, Xebia, Oracle, and earlier engineering roles.
- Present Engineering Capability beneath the timeline as compact grouped capabilities, not a dense matrix.

### Applied Engineering Solutions

- Follow the reference article-card rhythm.
- Continue loading active projects from `public.json`, sorted by `order`.
- Each project displays its local cover, title, summary, View Source, and Explore Live.
- Support any number of projects without a hard-coded item count.

### FAQ And Contact

- Two-column reference-style section.
- Left: four accessible accordion questions.
- Right: Start a Conversation panel with professional opportunity focus and links to LinkedIn, GitHub, and email.
- Do not add testimonials because no genuine testimonial data is available.

### Footer

- Reference-style dark footer with identity statement, quick links, contact/social links, and copyright.

## Content Rules

- Preserve the already approved enterprise-system facts and metrics.
- Do not invent employers, outcomes, testimonials, endorsements, or production claims.
- Dummy content is allowed only for temporary image captions or clearly replaceable visual placeholders.
- Temporary images must be local and have stable filenames so they can be replaced later without markup changes.

## Responsive Behavior

- Validate desktop at 1440px and mobile at 390px.
- Hero, cards, experience, FAQ/contact, and footer must stack in the same order as the reference.
- Text, controls, and media must remain contained without horizontal overflow.
- Maintain visible focus styles and minimum 44px control targets.
- Respect reduced-motion preferences.

## Technical Approach

- Keep the site static and GitHub Pages compatible.
- Reuse `index.html`, `assets/css/styles.css`, the JSON project loader, and the existing accessible dialog where practical.
- Delete or disconnect obsolete system-map and metric-animation code after tests prove it is unused.
- Use semantic HTML and progressive enhancement; primary content remains usable without JavaScript.
- Keep all assets local. Do not hotlink or import assets from the reference site.

## Verification

- Update DOM, content, style, runtime, and visual tests for the new reference structure.
- Verify local links and assets.
- Capture full desktop and mobile screenshots.
- Check navigation, project rendering, case-study dialog, FAQ accordion, no-JavaScript fallback, reduced motion, keyboard focus, and horizontal overflow.
- Record final design QA in `design-qa.md`; fix all P0-P2 findings before handoff.

## Acceptance Criteria

- The visible page sequence and visual proportions closely match the reference.
- The exact core navy/teal palette is used.
- No spider/network visualization remains.
- Debi's approved content replaces the reference content throughout.
- Temporary sample images can be replaced later without layout changes.
- Desktop and mobile visual suites pass.
