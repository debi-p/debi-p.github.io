# Debi Prasad Portfolio Design

Date: 2026-08-13
Status: Approved for implementation planning

## Objective

Build a memorable, credible portfolio for Staff Software Engineer roles focused on AI platforms and distributed systems. The site must work for Indian product companies and global opportunities, load directly at `https://debi-p.github.io/`, and deploy as a static HTML, CSS, and JavaScript site on GitHub Pages.

The intended reaction is not only "this looks polished." A recruiter, hiring manager, or senior engineer should quickly conclude that Debi:

- builds production-grade AI platforms, not demos;
- designs and leads distributed enterprise systems;
- creates measurable business and engineering impact;
- influences standards and execution across teams;
- remains technically hands-on through personal projects and public code.

## Market Positioning

Primary positioning:

> Staff Software Engineer | AI Platforms & Distributed Systems

Supporting statement:

> 11+ years turning complex enterprise problems into secure, scalable platforms, while leading teams from architecture through production.

The market research supports this combined position. Current Staff-level platform roles emphasize AI-first architecture, distributed systems, cloud infrastructure, governance, hands-on implementation, and cross-team technical leadership. Skills-first recruiting also increases the value of showing decisions and outcomes instead of relying only on employer names or technology lists.

Research references:

- [LinkedIn Future of Recruiting 2025](https://www.linkedin.com/business/talent/blog/talent-acquisition/future-of-recruiting-2025)
- [World Economic Forum Future of Jobs Report 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/)
- [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/)
- [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/)

## Experience Principles

The selected direction is **Executive Systems Narrative**.

The experience should feel assured, technical, and editorial. It should avoid a generic resume template, an animated technology showcase, or a dense dashboard. Motion and technical visuals support the story but never compete with evidence.

Core principles:

1. Evidence before adjectives.
2. Business outcome before technology inventory.
3. Architecture decisions before implementation trivia.
4. Curated projects before an automatic repository feed.
5. Public-safe summaries before internal details.
6. Fast scanning first, optional depth second.

## Visual System

The design uses a warm off-white canvas, graphite text and surfaces, a restrained teal accent, and a muted gold secondary signal. The palette must remain balanced rather than becoming a single-color theme.

Typography uses a strong modern sans-serif display face with a highly readable body face. Display type is reserved for the hero and major section statements. Cards and compact controls use smaller, tighter type.

The visual language includes:

- thin rules and an editorial grid;
- square or lightly rounded controls, with radius no greater than 8px;
- full-width content bands instead of floating section cards;
- technical system diagrams made from simple lines, nodes, labels, and data flow;
- a subtle animated architecture map behind the hero message;
- restrained entrance transitions and hover feedback;
- no decorative gradient backgrounds, gradient orbs, or stock imagery.

The hero remains full width and unframed. It introduces Debi as the primary first-viewport signal and leaves a visible hint of the impact band below it on common mobile and desktop viewports.

## Information Architecture

The first version is a single-page portfolio with anchored navigation and optional case-study detail dialogs.

### 1. Navigation

- Debi Prasad Pradhan brand link
- Impact
- Systems
- Projects
- Experience
- Resume
- Contact action

The navigation becomes compact and sticky after the initial scroll. Mobile navigation uses an accessible menu button.

### 2. Hero

Identity:

> Debi Prasad Pradhan

Role:

> Staff Software Engineer | AI Platforms & Distributed Systems

Lead statement:

> I build intelligent systems that survive the real world.

Supporting text:

> 11+ years turning complex enterprise problems into secure, scalable platforms, while leading teams from architecture through production.

Primary actions:

- Explore selected systems
- Download AI Platform Resume
- LinkedIn and GitHub icon links

The hero background uses a lightweight JavaScript canvas architecture map. It must respond subtly to pointer movement, pause when outside the viewport, respect reduced-motion preferences, and never reduce text readability.

### 3. Impact Band

Show four immediately scannable outcomes:

- 67% less SDLC effort
- 3x delivery acceleration
- 20+ engineers across three teams
- 400 GB file distribution validated, with 1 TB support in progress

The 1 TB statement must always be presented as a target or work in progress, never as a completed production result.

### 4. Selected Enterprise Systems

Use four editorial rows rather than equal promotional cards. Each row presents a market-facing name, the system category, one outcome, and an action to inspect the story.

Version-one public names:

1. **SpecFlow AI**
   AI-native specification and delivery orchestration. Reduced SDLC effort by 67% and accelerated delivery by 3x.

2. **SciLens**
   Multi-agent scientific intelligence with human review, evidence provenance, and model observability. Reduced model-preparation work from weeks to hours.

3. **EvidenceGraph**
   Enterprise scientific knowledge platform connecting domain data, semantic search, graph relationships, and AI retrieval.

4. **ReleaseGrid**
   Secure enterprise software distribution with product and catalog management, entitlement-aware access, asynchronous processing, resilient multipart transfers, and search. File distribution has been validated up to 400 GB and is evolving toward 1 TB.

Each detail view follows the same narrative:

- context and problem;
- scale and constraints;
- Debi's role;
- architecture approach;
- critical decisions and safeguards;
- measurable result;
- selected technologies.

For ReleaseGrid, Debi's role is stated as:

> Co-designed the technical architecture with Solution Architects and led implementation across multiple engineering teams, translating the target architecture into production-ready services and engineering standards.

### 5. Independent Builds and GitHub

Place this section after enterprise systems. It proves hands-on curiosity without diluting Staff-level impact.

The section supports:

- one visually prominent personal project;
- two to four supporting projects;
- source-code and live-demo links when available;
- concise stack, status, and ownership labels;
- a link to the complete `debi-p` GitHub profile.

Only original, portfolio-ready work appears. Forked course repositories remain on GitHub but are not presented as authored projects. Empty or weak repositories are omitted. No empty project cards or "coming soon" entries appear in production.

Initial eligible project:

- **Brainy Blocks / Kids Puzzle**: interactive coding, logic, language, and visual activities built in JavaScript. The final live-demo URL must be confirmed before it is shown.

Future projects are added through one structured JavaScript data list. A project record contains title, summary, problem, contribution, stack, status, source URL, optional live URL, visual theme, and featured flag.

The public `spec_stack` repository is excluded because its naming suggests work-related specifications. It must not be linked from the portfolio unless its contents are confirmed safe for public distribution.

### 6. Expertise

Present four capability groups with concise supporting evidence:

- AI Platform Engineering
- Distributed Systems and Platform Architecture
- Cloud Engineering and Reliability
- Technical Leadership and Engineering Governance

Technology names support these capability groups instead of appearing as an undifferentiated tag cloud.

### 7. Career Narrative

Use a compact vertical timeline:

- Thermo Fisher Scientific, Staff Software Engineer / Technical Architect, April 2022 to present
- Oracle, Applications Engineer, 2019 to 2022
- ComakeIT, Software Engineer, 2017 to 2019
- HCL Technologies, Software Engineer, 2015 to 2017

Thermo Fisher receives the most detail because it demonstrates Staff-level scope. Earlier roles show the progression from implementation to architecture and organizational influence.

### 8. Resume

Include both supplied PDF resumes:

- Primary: `Debi_Prasad.pdf`, labeled **AI Platform Resume**
- Secondary: `debi_prasad_resume.pdf`, labeled **Architecture Resume**

Both files open in a new browser tab and have explicit download actions. The AI Platform Resume is the primary navigation and hero action.

### 9. Contact

Close with:

> Let's build systems worth depending on.

Include email, LinkedIn, GitHub, Bengaluru location, and availability for Indian and global opportunities. The site does not include a backend contact form in version one.

## Public-Safety Rules

The portfolio is public. Enterprise case studies must never include:

- internal Confluence or Jira links;
- confidential screenshots or diagrams;
- proprietary source code or API payloads;
- internal repository names, service names, account identifiers, or environment details;
- customer, employee, or partner personal data;
- credentials, signed URLs, bucket names, or infrastructure identifiers;
- claims that cannot be supported or accurately qualified.

Case-study diagrams must be recreated as generalized conceptual diagrams. Company product names are replaced with the approved public names above unless explicit publication approval exists.

## Technical Architecture

The portfolio remains static and deployable without a build step.

Proposed structure:

```text
index.html
assets/
  css/
    styles.css
  js/
    content.js
    main.js
    system-map.js
  images/
    social-preview.png
  resume/
    Debi_Prasad.pdf
    debi_prasad_resume.pdf
README.md
```

Responsibilities:

- `index.html`: semantic page structure, metadata, and accessible dialog shells.
- `styles.css`: design tokens, layout, components, responsive rules, and motion preferences.
- `content.js`: structured personal-project and case-study content.
- `main.js`: navigation, dialogs, reveal behavior, and progressive enhancement.
- `system-map.js`: isolated hero canvas rendering and animation lifecycle.

No framework, package manager, API server, or runtime dependency is required. The page must remain usable when JavaScript is disabled; JavaScript enhances case-study presentation and animation.

## Interaction and Error Handling

- Anchored navigation uses native links and works without JavaScript.
- Case-study details use accessible dialogs when JavaScript is available and inline fallback links/content otherwise.
- External links use clear labels and safe new-tab attributes.
- Missing optional live-demo URLs hide the live-demo action rather than showing disabled controls.
- Canvas initialization failure leaves a clean static hero with no error message or layout shift.
- Resume links are ordinary static file links and remain functional independently of scripts.
- Reduced-motion users receive no continuous animation or scroll-reveal movement.

## Responsive and Accessibility Requirements

- Support 360px mobile through wide desktop layouts.
- Maintain stable dimensions for navigation controls, metrics, project previews, and dialogs.
- Prevent text overlap and horizontal scrolling at all target widths.
- Use semantic headings, landmarks, descriptive link text, visible focus states, and keyboard-operable dialogs.
- Meet WCAG AA color contrast for body text and interactive controls.
- Preserve logical reading order when multi-column sections collapse.

## SEO and Sharing

- Descriptive title and meta description
- Canonical URL for `https://debi-p.github.io/`
- Open Graph and social preview metadata
- Person JSON-LD with role, location, LinkedIn, and GitHub
- Meaningful section IDs and heading hierarchy
- Favicon or monogram asset

## Verification

Before completion:

1. Validate HTML structure.
2. Run available JavaScript syntax checks.
3. Check all local links and asset paths.
4. Verify both resume downloads.
5. Test keyboard navigation and dialog focus behavior.
6. Test reduced-motion behavior.
7. Capture desktop and mobile screenshots with Playwright.
8. Inspect screenshots for clipping, overlap, unreadable text, blank visuals, and poor framing.
9. Check the hero canvas has non-background pixels and remains correctly framed.
10. Test the site through a local static server before publishing.

## Version-One Boundary

Version one includes the complete page, four enterprise case studies, the initial curated personal-project section, both resumes, responsive behavior, accessibility, SEO metadata, and production-ready GitHub Pages paths.

Version one excludes a blog, CMS, backend contact form, analytics, authentication, live GitHub API feed, theme switcher, and separate case-study pages. These can be evaluated later only if they strengthen the job-search goal.
