# Cinematic Portfolio Redesign

## Summary

Redesign Debi Prasad Pradhan's existing single-page portfolio as a bold, futuristic, dark experience inspired by the presentation rhythm of `drtusharnayak.com`. The redesign must preserve Debi's original identity, engineering content, project data, and Staff-level positioning while making the page more visually compelling and rewarding to explore from top to bottom.

## Page Status

| Field | Value |
|---|---|
| Owner | Debi Prasad Pradhan |
| Status | Approved design direction |
| Last Updated | 2026-10-08 |
| Audience | Recruiters, hiring managers, engineering leaders, and architects |
| Reference | `https://www.drtusharnayak.com/` |

## Scope

| In Scope | Out of Scope |
|---|---|
| Complete visual redesign of the existing portfolio | Copying the reference site's identity, text, or medical content |
| Responsive desktop and mobile presentation | New backend or content-management system |
| Existing enterprise systems, experience, capabilities, projects, FAQs, and contact content | Changing factual claims without evidence |
| Replaceable professional photography slots | Requiring final professional photographs before implementation |
| Restrained scroll, hover, metric, and system-map motion | Heavy animation that delays or blocks content |
| Existing JSON-driven applied projects | Embedding third-party projects in iframes |

## Design Direction

The approved direction is **Cinematic Dark**.

- Deep midnight navy is the primary canvas.
- Electric cyan and teal provide focus, state, and restrained illumination.
- Large white typography creates clear hierarchy.
- Fine network lines, architectural grids, and system diagrams reinforce the engineering theme.
- Glass-like surfaces may be used for interactive system cards, but nesting decorative cards is prohibited.
- Images remain clear and inspectable rather than dark, blurred, or atmospheric.
- Motion supports reading flow and never hides essential content.

The result should feel bold and futuristic while remaining credible for Staff Software Engineer, AI platform, distributed-systems, and technical-architecture roles.

## Information Architecture

The page follows one continuous professional story.

1. **Navigation**: identity, core sections, LinkedIn, GitHub, and a prominent conversation action.
2. **Hero**: professional portrait, role, value proposition, summary, resume actions, and immediate proof.
3. **Impact**: connected metrics showing experience, delivery, technical leadership, and platform scale.
4. **Enterprise Systems**: four visual system stories with architecture, technology, leadership, and measured outcomes.
5. **Experience**: compact progression from implementation to Staff-level technical leadership.
6. **Engineering Capability**: grouped, recruiter-friendly capability matrix.
7. **Applied Engineering Solutions**: JSON-driven project rows or cards with real screenshots, source links, and live links.
8. **FAQs**: concise answers to common recruiter and engineering-leader questions.
9. **Contact**: professional image, direct invitation, email, LinkedIn, GitHub, and resume.

## Component Design

### Navigation

- Sticky translucent navy surface with a crisp cyan lower rule.
- Name or compact DP identity at the left.
- Section links remain visible on desktop and move into an accessible menu on small screens.
- `Start a conversation` receives the strongest filled treatment.

### Hero

- Full-width, near-viewport-height composition with a hint of the next section visible.
- A vertical professional portrait occupies the left visual column.
- The right column contains role, name, headline, summary, proof metrics, and resume actions.
- The headline uses one cyan-highlighted phrase, not a gradient.
- The current portrait is the temporary asset and must be replaceable without layout changes.

### Impact Network

- The existing particle-system concept remains, recolored for the dark theme.
- Metrics appear around or alongside the visualization without overlapping it.
- Values animate once when visible and render immediately when reduced motion is enabled.
- Claims remain: 11+ years, 67% development-effort reduction, 3X delivery acceleration, 20+ engineers led, and 1TB web uploads.

### Enterprise Systems

- Use a two-column visual grid on wide screens and one column on narrow screens.
- Each system receives a distinct technical visual, concise value statement, two proof points, and an `Inspect the system` action.
- The existing accessible dialog remains the detailed case-study surface.
- Dialog content continues to include challenge, architecture and leadership, capabilities, measured impact, and technology ecosystem.

### Experience And Capability

- Experience uses a compact chronological rail with strong company and role hierarchy.
- Thermo Fisher remains the most detailed role.
- Engineering Capability uses grouped technical domains with progressive disclosure on small screens if required.
- Keyword density must remain readable; the design must not become a logo wall.

### Applied Engineering Solutions

- Continue loading projects from `public.json`.
- Show only records with `status: active` and sort by numeric `order`.
- Use the real cover image at its natural ratio without cropping.
- Keep separate `View Source` and `Explore Live` actions.
- Support any number of projects without manual HTML changes.

### FAQs And Contact

- FAQs remain native accessible disclosure elements.
- The contact section becomes a strong visual conclusion rather than a generic footer.
- A wide professional image can be introduced later without structural changes.
- Email, LinkedIn, GitHub, and resume actions remain explicit and easy to scan.

## Photography Plan

The layout supports three replaceable photographs.

| Placement | Format | Temporary Behavior |
|---|---|---|
| Hero | Vertical portrait, approximately 4:5 | Use the current profile photograph |
| Experience | Landscape or working/speaking image | Use a neutral technical visual until supplied |
| Contact | Wide professional image | Use the hero portrait in a different crop until supplied |

Images must use stable aspect ratios and responsive focal positioning. Replacing a file must not require CSS changes.

## Interaction And Motion

- Smooth section reveals use opacity and small vertical movement.
- Cards receive restrained border illumination and elevation on hover.
- Metrics count once when first visible.
- The system network may react subtly to pointer movement.
- Navigation indicates the current section without shifting layout.
- All motion respects `prefers-reduced-motion`.
- Content remains visible and usable if JavaScript or an observer API fails.

## Architecture And Data Flow

- Preserve the existing static HTML, CSS, and modular JavaScript architecture suitable for GitHub Pages.
- Keep project hydration isolated in `render-projects.js` and sourced from root `public.json`.
- Keep enterprise case-study content in the existing content module.
- Add visual behavior through small focused modules rather than one monolithic script.
- Treat animation as progressive enhancement; semantic HTML is the source of truth.
- Continue using relative local assets so the site can deploy to GitHub Pages or another static host.

## Responsive Behavior

- Desktop uses cinematic split compositions, two-column system layouts, and generous horizontal rhythm.
- Tablet reduces visual density while preserving portrait and headline prominence.
- Mobile stacks all content, uses compact navigation, removes nonessential decoration, and avoids horizontal scrolling.
- Hero text, metrics, controls, dialogs, project images, and capability names must fit without overlap at supported widths.

## Accessibility And Performance

- Maintain one `h1`, logical heading order, landmarks, skip navigation, labeled sections, and keyboard-operable controls.
- Preserve strong focus indicators and minimum control target sizes.
- Meet WCAG AA contrast for text and essential controls.
- Use optimized WebP or AVIF photographs with explicit dimensions.
- Avoid blocking font, image, or animation dependencies.
- Preserve usable fallback content for project loading and unsupported dialog behavior.

## Error Handling

- A failed `public.json` request must not affect navigation, case studies, the footer year, or other enhancements.
- A missing project image renders a styled fallback without changing row dimensions.
- Missing canvas, observer, animation, or motion-query APIs produce a stable static design.
- Invalid external project URLs are rejected by the existing safe rendering path.

## Verification

- Existing unit, DOM, content, link, runtime, and system-map tests must pass after updates.
- Add or update tests for new component contracts and progressive-enhancement behavior.
- Capture desktop and mobile screenshots for comparison against the approved Cinematic Dark mockup.
- Check layout at wide desktop, standard laptop, tablet, and mobile widths.
- Verify navigation, dialogs, disclosures, external links, resume actions, dynamic projects, and reduced motion.
- Run a final browser review for overlaps, cropping, blank canvases, broken assets, and console errors.

## Decisions

| Decision | Rationale | Consequence |
|---|---|---|
| Use Cinematic Dark | User selected the most immersive direction | All sections move to a coherent dark visual system |
| Keep original portfolio content | Technical credibility depends on specific systems and outcomes | Redesign changes presentation, not factual substance |
| Use three replaceable photo slots | User plans to add professional photographs | Implementation must work with temporary assets first |
| Preserve static hosting | GitHub Pages remains the deployment target | No server runtime or private data source is introduced |
| Prefer progressive enhancement | Reliability and accessibility remain first-class | Motion failure cannot block reading or interaction |

## References

- Current portfolio: `https://debi-p.github.io/`
- Visual reference: `https://www.drtusharnayak.com/`
- Existing portfolio design: `docs/superpowers/specs/2026-08-13-portfolio-design.md`
