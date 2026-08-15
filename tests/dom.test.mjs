import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const { caseStudies } = await import(
  new URL('../assets/js/content.js', import.meta.url)
);
const linkCheckerPath = fileURLToPath(
  new URL('../scripts/check-local-links.mjs', import.meta.url),
);
const forbiddenPublicText = [
  'thermofisher.atlassian.net', 'jira', 'confluence', 'revenera', 'flexera',
  'workflow forge', 'dfp', 'signed url', 'bucket',
];

function normalizedVisibleText(source) {
  return source
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&copy;/g, '©')
    .replace(/\s+/g, ' ')
    .trim();
}

function attributeValue(openingTag, name) {
  return openingTag.match(
    new RegExp(`(?:^|\\s)${name}\\s*=\\s*["']([^"']*)["']`, 'i'),
  )?.[1];
}

function hasAttribute(openingTag, name) {
  return new RegExp(`(?:^|\\s)${name}(?=\\s|=|>|$)`, 'i').test(openingTag);
}

function hasClass(openingTag, className) {
  return (attributeValue(openingTag, 'class') ?? '').split(/\s+/).includes(className);
}

function openingTags(source, tag) {
  return [...source.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))].map(
    (match) => match[0],
  );
}

function allOpeningTags(source) {
  return [...source.matchAll(/<[a-z][a-z0-9-]*\b[^>]*>/gi)].map((match) => match[0]);
}

function elementBlocks(source, { className, id, tag }) {
  return [...source.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))]
    .filter(([openingTag]) => {
      return (
        (id === undefined || attributeValue(openingTag, 'id') === id) &&
        (className === undefined || hasClass(openingTag, className))
      );
    })
    .map((match) => {
      const closingTag = `</${tag}>`;
      const closingIndex = source.indexOf(closingTag, match.index + match[0].length);
      assert.notEqual(closingIndex, -1, `${tag} block must have a closing tag`);
      return source.slice(match.index, closingIndex + closingTag.length);
    });
}

function elementBlock(selector, message, source = html) {
  const blocks = elementBlocks(source, selector);
  assert.ok(blocks.length > 0, message);
  return blocks[0];
}

function findOpeningTag(source, tag, attributes, message) {
  const openingTag = openingTags(source, tag).find((candidate) =>
    Object.entries(attributes).every(
      ([name, value]) => attributeValue(candidate, name) === value,
    ),
  );
  assert.ok(openingTag, message);
  return openingTag;
}

function metadataContent(identifier, value) {
  const tag = findOpeningTag(
    html,
    'meta',
    { [identifier]: value },
    `metadata ${identifier}="${value}" must be present`,
  );
  return attributeValue(tag, 'content');
}

function hasLink(source, { classes = [], download = false, href, rel = [], target }) {
  return elementBlocks(source, { tag: 'a' }).some((link) => {
    const openingTag = openingTags(link, 'a')[0];
    const classNames = (attributeValue(openingTag, 'class') ?? '').split(/\s+/);
    const relValues = (attributeValue(openingTag, 'rel') ?? '').split(/\s+/);

    return (
      attributeValue(openingTag, 'href') === href &&
      (target === undefined || attributeValue(openingTag, 'target') === target) &&
      (!download || hasAttribute(openingTag, 'download')) &&
      classes.every((className) => classNames.includes(className)) &&
      rel.every((relValue) => relValues.includes(relValue))
    );
  });
}

test('preserves exact normalized visible text snapshots', () => {
  const snapshots = [
    ['skip link', { tag: 'a', className: 'skip-link' }, 'Skip to content'],
    [
      'primary nav',
      { tag: 'nav', className: 'content-shell' },
      'DP Enterprise Systems Experience Skills Innovation Lab LinkedIn GitHub Start a conversation',
    ],
    [
      'hero',
      { tag: 'section', className: 'hero' },
      `
        Staff Software Engineer · AI Platforms & Distributed Systems
        Debi Prasad Pradhan
        I build intelligent platforms engineered for real-world scale.
        11+ years turning complex enterprise problems into secure, scalable platforms, while
        leading teams from architecture through production.
        Open resume Download resume
        67% Development Effort Reduction 3X Delivery Acceleration
        20+ Engineers Led 1TB Large-Scale Web Uploads
      `,
    ],
    [
      'systems',
      { tag: 'section', id: 'systems' },
      `
        Enterprise Systems at Scale
        AI Engineering Orchestration Mesh - Agentic Workflow
        A specification-driven agentic workflow platform coordinating planning,
        implementation, review, and end-to-end traceability.
        Inspect the system
        • 60% SDLC Effort Reduction • 3X Delivery Acceleration
        Scientific AI Governance PyIntelligence - Governed Multi-Agent Scientific Intelligence
        AI-powered article synthesis that transforms scientific publications into
        structured, model-ready inputs with provenance and expert review.
        Inspect the system
        • Article Synthesis in Minutes • Evidence-Linked Model Inputs
        Molecular Data Platform MolecularGraph - Analytical Data Intelligence
        An event-driven platform connecting compounds, ions, peaks, spectra, chromatograms,
        samples, and instrument data as searchable graph knowledge.
        Inspect the system
        • Molecular & Experimental Entities • Graph + Trace Data Unified
        Secure Release Platform ReleaseHub - Enterprise Software Distribution
        Secure publishing, governed discovery, and resilient web delivery for versioned
        enterprise software releases up to 1TB.
        Inspect the system
        • 1TB Web Upload Support • Secure Release Distribution
      `,
    ],
    [
      'projects',
      { tag: 'section', id: 'projects' },
      `
        Applied Engineering Solutions
        Learn, Play & Code with Code Blocks
        An interactive learning playground where kids explore coding, puzzles, math, and brain games through fun activities.
        View Source Explore Live
      `,
    ],
    [
      'expertise',
      { tag: 'section', id: 'expertise' },
      `
        Engineering Capability
        Algorithmic Problem Solving
        Algorithmic Problem Solving · Data Structures & Algorithms · Object-Oriented Design · SOLID Design Principles · Software Design Patterns · Concurrent Programming · Multithreaded Systems · System Design
        Modern Application Engineering
        Java · Python · SQL · JavaScript · TypeScript · React · Angular
        API & Service Engineering
        Spring Boot · Spring Cloud · Spring Framework · FastAPI · Hibernate · JDBC · RESTful API Design · Enterprise Integration Architecture · Microservices Architecture
        Enterprise Systems Architecture
        Enterprise Architecture · Solution Architecture · Platform Architecture · Cloud-Native Architecture · Distributed Systems Design · Event-Driven Architecture · Domain-Driven Design · High-Availability Systems · Horizontal Scalability · Resilient Systems Design
        Agentic AI Engineering
        Generative AI · Agentic AI · Multi-Agent Systems · Agent Orchestration · LLM Tool Integration · Prompt & Context Engineering · Agentic Workflow Automation
        Knowledge & Retrieval Systems
        Retrieval-Augmented Generation (RAG) · Semantic Retrieval · Embedding Models · SBERT · Knowledge Graph Engineering · Ontology Modeling · RDF · Scientific Data Modeling
        AI Platform Tooling
        Model Context Protocol (MCP) Server Engineering · LangGraph · LangChain · Langfuse · OpenAI · Claude · Gemini · Multi-Model LLM Integration · Model Routing · Reusable Agent Capabilities
        AI Reliability & Governance
        LLM & Agent Evaluation · Model-Based Evaluation (LLM-as-Judge) · AI Safety Guardrails · Response Reliability Controls · Prompt Injection Mitigation · Agent Tracing · LLM Observability · AI Auditability
        AWS Cloud Engineering
        Amazon EC2 · ECS · EKS · AWS Lambda · ECR · VPC · Route 53 · API Gateway · Application Load Balancer · CloudFront · Amazon S3 · Large Object Storage & Multipart Upload · Aurora PostgreSQL · Amazon RDS · DynamoDB · SQS · Amazon SNS / SMS · Amazon SES / SMTP · EventBridge · Step Functions · IAM · STS · KMS · Secrets Manager · AWS Cross-Account Access · Resource Policies · CloudWatch · CloudTrail · AWS X-Ray · Auto Scaling · CloudFormation · Cross-Account Data Sharing · Disaster Recovery Architecture
        Platform Reliability & Delivery
        Kubernetes · Docker · Temporal Workflow Orchestration · GitHub Actions · Continuous Integration & Delivery (CI/CD) · Platform Observability · Site Reliability Engineering · Performance Engineering · Cloud Modernization · Cloud Financial Operations (FinOps)
        Data & Event Platforms
        PostgreSQL · GraphDB · Neo4j · MongoDB · Apache NiFi · RabbitMQ · Apache Kafka · Asynchronous Processing · Event Streaming Architecture
        Engineering Quality & Automation
        JUnit · Selenium · Cucumber · Unit & Integration Testing · API Contract Testing · Automated Quality Engineering · Architecture Reviews · Code Reviews · Technical Debt Modernization
        Technical Strategy & Leadership
        Cross-Team Technical Leadership · Architecture Governance · Engineering Standards · Technical Strategy · Product Strategy · Technology Roadmaps · Cross-Functional Stakeholder Leadership · Engineering Mentorship · Production Reliability Leadership
      `,
    ],
    [
      'experience',
      { tag: 'section', id: 'experience' },
      `
        From Delivery to Technical Leadership
        2022 — Present Staff Software Engineer Thermo Fisher Scientific
        Lead technical execution across three engineering teams and 20+ engineers,
        translating enterprise architecture into production platforms.
        Architect enterprise AI, scientific-data, and AWS-native distributed platforms.
        Deliver secure, scalable products from concept through production, including
        1TB file workflows.
        Drive cloud modernization, performance, resilience, and cost optimization.
        Establish architecture governance, engineering standards, reusable frameworks,
        and mentoring across teams.
        2019 — 2022 Applications Engineer Oracle
        Modernized Oracle Fusion Procurement by migrating ADF/JSF experiences to Oracle JET.
        Designed REST APIs supporting enterprise Oracle Fusion ERP workflows.
        2017 — 2019 Software Engineer Xebia
        Designed RESTful microservices using Java and Spring Boot.
        Built automated testing frameworks with Selenium, Cucumber, and JUnit.
        2015 — 2017 Software Engineer HCL Technologies
        Developed enterprise applications using Java, Spring, REST, SOAP, JPA, and JDBC.
        Improved data-processing performance through multithreaded programming.
      `,
    ],
    ['footer', { tag: 'footer', className: 'site-footer' }, '© 2026 Debi Prasad Pradhan Back to top'],
    [
      'dialog shell',
      { tag: 'dialog', id: 'case-study-dialog' },
      '× Business challenge Architecture & delivery leadership Platform capabilities Measured impact Technology ecosystem',
    ],
  ];

  for (const [name, selector, text] of snapshots) {
    const source = elementBlock(selector, `${name} region must be present`);
    assert.equal(
      normalizedVisibleText(source),
      normalizedVisibleText(text),
      `${name} visible text must match the approved snapshot`,
    );
  }
});

test('preserves exact metadata, structured data, and public text safety', () => {
  assert.equal(
    normalizedVisibleText(elementBlock({ tag: 'title' }, 'title must be present')),
    'Debi Prasad Pradhan | Staff Software Engineer, AI Platforms',
  );
  findOpeningTag(html, 'meta', { charset: 'UTF-8' }, 'UTF-8 charset must be declared');
  const metadata = [
    ['name', 'viewport', 'width=device-width, initial-scale=1.0'],
    ['name', 'description', 'Staff Software Engineer with 11+ years building enterprise AI platforms, distributed systems, and cloud-native products.'],
    ['property', 'og:title', 'Debi Prasad Pradhan | Staff Software Engineer'],
    ['property', 'og:description', 'AI platforms, distributed systems, and engineering leadership grounded in measurable impact.'],
    ['property', 'og:type', 'website'],
    ['property', 'og:url', 'https://debi-p.github.io/'],
    ['property', 'og:image', 'https://debi-p.github.io/assets/images/social-preview.png'],
  ];
  for (const [identifier, name, expected] of metadata) {
    assert.equal(metadataContent(identifier, name), expected, `${name} must match`);
  }
  const headLinks = [
    ['canonical', 'https://debi-p.github.io/', undefined],
    ['icon', 'assets/images/favicon.svg', 'image/svg+xml'],
    ['stylesheet', 'assets/css/styles.css?v=20260815', undefined],
  ];
  for (const [rel, href, type] of headLinks) {
    const link = findOpeningTag(html, 'link', { rel }, `${rel} link must be present`);
    assert.equal(attributeValue(link, 'href'), href);
    if (type) assert.equal(attributeValue(link, 'type'), type);
  }

  const structuredData = elementBlocks(html, { tag: 'script' }).find((script) => {
    return attributeValue(openingTags(script, 'script')[0], 'type') === 'application/ld+json';
  });
  assert.ok(structuredData, 'Person JSON-LD script must be present');
  const payload = structuredData
    .replace(/^<script\b[^>]*>/i, '')
    .replace(/<\/script>$/i, '');
  assert.deepEqual(JSON.parse(payload), {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Debi Prasad Pradhan',
    jobTitle: 'Staff Software Engineer',
    address: { '@type': 'PostalAddress', addressLocality: 'Bengaluru', addressCountry: 'IN' },
    url: 'https://debi-p.github.io/',
    sameAs: ['https://github.com/debi-p', 'https://www.linkedin.com/in/debiprasadpradhan'],
  });

  const publicPage = html.toLowerCase();
  for (const forbiddenText of forbiddenPublicText) {
    assert.equal(
      publicPage.includes(forbiddenText),
      false,
      `forbidden public text found in index.html: ${forbiddenText}`,
    );
  }
});

test('preserves semantic structure and link contracts', () => {
  assert.equal(openingTags(html, 'h1').length, 1, 'page must contain exactly one h1');
  assert.equal(attributeValue(openingTags(html, 'h1')[0], 'id'), 'hero-title');
  for (const landmark of ['header', 'nav', 'main', 'footer']) {
    assert.ok(openingTags(html, landmark).length > 0, `page must contain a ${landmark} landmark`);
  }
  const ids = new Set(
    allOpeningTags(html).map((tag) => attributeValue(tag, 'id')).filter(Boolean),
  );
  const requiredIds = [
    'top', 'main-content', 'impact', 'systems', 'projects', 'expertise',
    'experience',
  ];
  for (const requiredId of requiredIds) {
    assert.ok(ids.has(requiredId), `page must contain id ${requiredId}`);
  }
  const hrefs = openingTags(html, 'a').map((tag) => attributeValue(tag, 'href'));
  for (const href of hrefs.filter((value) => value?.startsWith('#'))) {
    assert.ok(ids.has(href.slice(1)), `${href} must point to an existing id`);
  }
  const nav = elementBlock({ tag: 'nav', className: 'content-shell' }, 'nav must be present');
  assert.deepEqual(
    openingTags(nav, 'a').map((tag) => attributeValue(tag, 'href')),
    [
      '#top',
      '#systems',
      '#experience',
      '#expertise',
      '#projects',
      'https://www.linkedin.com/in/debiprasadpradhan',
      'https://github.com/debi-p',
      'mailto:dpp2017@gmail.com',
    ],
  );

  assert.ok(hasLink(nav, {
    href: 'https://www.linkedin.com/in/debiprasadpradhan',
    target: '_blank',
    rel: ['noreferrer'],
  }));
  assert.ok(hasLink(nav, {
    href: 'https://github.com/debi-p',
    target: '_blank',
    rel: ['noreferrer'],
  }));
  assert.ok(hasLink(nav, {
    href: 'mailto:dpp2017@gmail.com',
    classes: ['nav-contact'],
  }));

  const hero = elementBlock({ tag: 'section', className: 'hero' }, 'hero must be present');
  const systems = elementBlock({ tag: 'section', id: 'systems' }, 'systems must be present');
  const projects = elementBlock({ tag: 'section', id: 'projects' }, 'projects must be present');
  assert.ok(
    openingTags(projects, 'div').some(
      (tag) => hasClass(tag, 'section-heading') && hasClass(tag, 'section-heading--solo'),
    ),
    'project title must use the full-width solo heading layout',
  );
  assert.match(
    projects,
    /<div\b(?=[^>]*\bid=["']project-list["'])[^>]*>\s*<noscript\b/i,
    'project list must contain a noscript fallback',
  );
  const projectFallback = elementBlock(
    { tag: 'noscript' },
    'project list must contain a noscript fallback',
    projects,
  );
  const fallbackArticle = elementBlock(
    { tag: 'article', className: 'project' },
    'noscript fallback must contain a project article',
    projectFallback,
  );
  const fallbackArticleTag = openingTags(fallbackArticle, 'article')[0];
  assert.equal(hasAttribute(fallbackArticleTag, 'data-reveal'), false);
  assert.equal(
    normalizedVisibleText(elementBlock(
      { tag: 'h3' },
      'noscript fallback must contain a title',
      fallbackArticle,
    )),
    'Learn, Play & Code with Code Blocks',
  );
  const fallbackLinks = openingTags(fallbackArticle, 'a');
  const fallbackSource = fallbackLinks[0];
  assert.equal(attributeValue(fallbackSource, 'href'), 'https://github.com/debi-p/codeblockplay');
  assert.equal(attributeValue(fallbackSource, 'target'), undefined);
  assert.equal(attributeValue(fallbackLinks[1], 'href'), 'https://codeblockplay.github.io/');
  assert.match(normalizedVisibleText(projectFallback), /View Source Explore Live/);
  const linkContracts = [
    ['hero resume open', hero, { href: 'assets/resume/Debi_Prasad.pdf', classes: ['button', 'button-primary'], target: '_blank', rel: ['noreferrer'] }],
    ['hero resume download', hero, { href: 'assets/resume/Debi_Prasad.pdf', classes: ['button', 'button-secondary'], download: true }],
  ];
  for (const [name, source, contract] of linkContracts) {
    assert.ok(hasLink(source, contract), `${name} link contract must be preserved`);
  }

  const systemRows = elementBlocks(systems, { tag: 'article', className: 'system-row' });
  assert.equal(systemRows.length, 4, 'systems must contain four rows');
  const systemRowContract =
    /^\s*<p\b(?=[^>]*\bclass=["'][^"']*\bsystem-index\b[^"']*["'])[^>]*>[\s\S]*?<\/p>\s*<div>\s*<h3\b[^>]*>[\s\S]*?<\/h3>\s*<p\b[^>]*>[\s\S]*?<\/p>\s*<button\b[^>]*>[\s\S]*?<\/button>\s*<\/div>\s*<strong\b[^>]*>[\s\S]*?<\/strong>\s*$/i;
  for (const row of systemRows) {
    const openingTag = openingTags(row, 'article')[0];
    assert.ok(hasAttribute(openingTag, 'data-reveal'));
    const inner = row.slice(openingTag.length, -'</article>'.length);
    assert.match(inner, systemRowContract, 'system row must preserve its direct child contract');
  }

  const caseStudyControls = systemRows.flatMap((row) => {
    return elementBlocks(row, { tag: 'button' }).filter((button) => {
      return hasAttribute(openingTags(button, 'button')[0], 'data-case-study');
    });
  });
  const controlIds = caseStudyControls.map((button) => {
    return attributeValue(openingTags(button, 'button')[0], 'data-case-study');
  });
  assert.equal(caseStudyControls.length, 4, 'systems must expose four case-study controls');
  assert.equal(new Set(controlIds).size, 4, 'case-study control ids must be unique');
  assert.deepEqual(
    controlIds,
    ['specflow-ai', 'scilens', 'evidencegraph', 'releasegrid'],
    'case-study controls must follow the approved system order',
  );
  const publicCaseStudyIds = new Set(caseStudies.map(({ id }) => id));
  const expectedControlLabels = new Map([
    ['specflow-ai', 'Inspect Mesh Agentic Workflow system'],
    ['scilens', 'Inspect PyIntelligence system'],
    ['evidencegraph', 'Inspect MolecularGraph system'],
    ['releasegrid', 'Inspect ReleaseHub system'],
  ]);
  for (const [index, button] of caseStudyControls.entries()) {
    const openingTag = openingTags(button, 'button')[0];
    const id = controlIds[index];
    assert.equal(attributeValue(openingTag, 'type'), 'button');
    assert.ok(hasClass(openingTag, 'system-action'));
    assert.equal(attributeValue(openingTag, 'aria-haspopup'), 'dialog');
    assert.equal(attributeValue(openingTag, 'aria-label'), expectedControlLabels.get(id));
    assert.ok(hasAttribute(openingTag, 'hidden'), `${id} must be hidden before enhancement`);
    assert.equal(normalizedVisibleText(button), 'Inspect the system');
    assert.ok(publicCaseStudyIds.has(id), `${id} must exist in public caseStudies`);

  }
  const expertise = elementBlock({ tag: 'section', id: 'expertise' }, 'expertise must be present');
  assert.equal(elementBlocks(expertise, { tag: 'article', className: 'capability-group' }).length, 13);
  assert.equal(openingTags(expertise, 'strong').length, 0);
  assert.equal(
    allOpeningTags(expertise).filter((tag) => hasClass(tag, 'expertise-number')).length,
    0,
  );
  const experience = elementBlock({ tag: 'section', id: 'experience' }, 'experience must be present');
  assert.ok(
    html.indexOf('id="experience"') < html.indexOf('id="expertise"')
      && html.indexOf('id="expertise"') < html.indexOf('id="projects"'),
    'Engineering Capability must appear between Experience and Innovation Lab',
  );
  assert.ok(
    openingTags(experience, 'div').some(
      (tag) => hasClass(tag, 'content-shell') && hasClass(tag, 'experience-layout'),
    ),
  );
  const timelineItems = openingTags(experience, 'li')
    .filter((tag) => hasAttribute(tag, 'data-reveal'));
  assert.equal(timelineItems.length, 4);
  assert.equal(
    openingTags(experience, 'ul').filter((tag) => hasClass(tag, 'experience-points')).length,
    4,
  );
});

test('preserves accessibility and progressive control contracts', () => {
  const skip = elementBlock({ tag: 'a', className: 'skip-link' }, 'skip link must be present');
  assert.equal(attributeValue(openingTags(skip, 'a')[0], 'href'), '#main-content');
  const nav = elementBlock({ tag: 'nav', className: 'content-shell' }, 'nav must be present');
  assert.equal(attributeValue(openingTags(nav, 'nav')[0], 'aria-label'), 'Primary navigation');
  const navToggle = openingTags(nav, 'button').find((tag) => hasClass(tag, 'nav-toggle'));
  assert.ok(navToggle, 'navigation toggle must be present');
  assert.deepEqual(
    Object.fromEntries(['type', 'aria-expanded', 'aria-controls', 'aria-label'].map(
      (name) => [name, attributeValue(navToggle, name)],
    )),
    { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'site-navigation', 'aria-label': 'Open navigation' },
  );
  assert.ok(hasAttribute(navToggle, 'hidden'));
  const navLinks = findOpeningTag(nav, 'div', { id: 'site-navigation' }, 'nav links must exist');
  assert.ok(hasClass(navLinks, 'nav-links'));
  assert.equal(hasAttribute(navLinks, 'hidden'), false, 'navigation links must remain visible');

  const hero = elementBlock({ tag: 'section', className: 'hero' }, 'hero must be present');
  assert.equal(attributeValue(openingTags(hero, 'section')[0], 'aria-labelledby'), 'hero-title');
  const canvas = findOpeningTag(hero, 'canvas', { id: 'system-map' }, 'system map must exist');
  assert.equal(attributeValue(canvas, 'aria-hidden'), 'true');
  const heroContent = findOpeningTag(hero, 'div', {}, 'hero content must exist');
  assert.ok(hasClass(heroContent, 'content-shell'));
  assert.ok(hasClass(heroContent, 'hero-content'));
  const heroProfile = findOpeningTag(
    hero,
    'img',
    { class: 'hero-profile' },
    'hero profile image must exist',
  );
  assert.equal(attributeValue(heroProfile, 'src'), 'assets/images/debi-prasad-profile.webp');
  assert.equal(attributeValue(heroProfile, 'alt'), '');
  assert.equal(attributeValue(heroProfile, 'width'), '960');
  assert.equal(attributeValue(heroProfile, 'height'), '1279');
  assert.match(
    hero,
    /<div\b(?=[^>]*\bclass=["'][^"']*\bhero-copy\b[^"']*["'])[^>]*>[\s\S]*?<h1\b[^>]*\bid=["']hero-title["'][^>]*>[\s\S]*?<\/h1>[\s\S]*?<\/div>\s*<div\b(?=[^>]*\bclass=["'][^"']*\bsystem-visual\b[^"']*["'])[^>]*>\s*<canvas\b[^>]*\bid=["']system-map["'][^>]*><\/canvas>[\s\S]*?<\/div>/i,
    'hero copy must precede the system visualization inside hero-content',
  );
  assert.equal(
    openingTags(hero, 'div').some((tag) => hasClass(tag, 'social-links')),
    false,
    'hero must not duplicate professional profile links from the navigation',
  );

  for (const [id, labelledBy] of [
    ['systems', 'systems-title'],
    ['projects', 'projects-title'],
    ['expertise', 'expertise-title'],
    ['experience', 'experience-title'],
  ]) {
    const block = elementBlock({ tag: 'section', id }, `${id} section must be present`);
    const section = openingTags(block, 'section')[0];
    assert.equal(attributeValue(section, 'aria-labelledby'), labelledBy);
  }
  const impact = findOpeningTag(hero, 'ul', { id: 'impact' }, 'achievements must be present');
  assert.ok(hasClass(impact, 'achievement-orbit'));
  assert.equal(attributeValue(impact, 'aria-label'), 'Selected achievements');
  assert.equal(elementBlocks(hero, { tag: 'li', className: 'achievement' }).length, 4);
  const projectList = findOpeningTag(html, 'div', { id: 'project-list' }, 'project list must exist');
  assert.equal(attributeValue(projectList, 'aria-live'), 'polite');

  const dialog = elementBlock({ tag: 'dialog', id: 'case-study-dialog' }, 'dialog must exist');
  assert.equal(attributeValue(openingTags(dialog, 'dialog')[0], 'aria-labelledby'), 'case-study-title');
  const closeButton = openingTags(dialog, 'button').find((tag) => hasClass(tag, 'dialog-close'));
  assert.deepEqual(
    [attributeValue(closeButton, 'type'), attributeValue(closeButton, 'aria-label')],
    ['button', 'Close case study'],
  );
  const dialogIds = new Set(allOpeningTags(dialog).map((tag) => attributeValue(tag, 'id')));
  const requiredDialogIds = [
    'case-study-category',
    'case-study-title',
    'case-study-metric',
    'case-study-problem',
    'case-study-role',
    'case-study-approach',
    'case-study-outcomes',
    'case-study-technologies',
  ];
  for (const id of requiredDialogIds) {
    assert.ok(dialogIds.has(id), `dialog must contain id ${id}`);
  }
  const technologies = findOpeningTag(dialog, 'ul', { id: 'case-study-technologies' }, 'technologies must exist');
  assert.equal(attributeValue(technologies, 'aria-label'), 'Technologies');
});

test('checks local links with browser-safe URL, attribute, and path handling', () => {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'portfolio-link-check-'));
  const siteRoot = path.join(fixtureRoot, 'site');
  mkdirSync(siteRoot);

  const runChecker = (markup) => {
    writeFileSync(path.join(siteRoot, 'index.html'), markup);
    const result = spawnSync(process.execPath, [linkCheckerPath], {
      cwd: siteRoot,
      encoding: 'utf8',
    });
    return { output: `${result.stdout}${result.stderr}`, status: result.status };
  };

  try {
    writeFileSync(path.join(siteRoot, 'present.txt'), 'present');
    mkdirSync(path.join(siteRoot, 'assets'));
    writeFileSync(path.join(siteRoot, 'assets', 'site.css'), 'body {}');

    const successfulCases = [
      ['double-quoted href', '<a href="present.txt">Double</a>', 1],
      ['single-quoted src', "<img src='present.txt' alt='Single'>", 1],
      [
        'unquoted href and src',
        '<a href=present.txt>Unquoted</a><img src=assets/site.css alt=Asset>',
        2,
      ],
      [
        'uppercase HREF and SRC',
        '<a HREF="present.txt">Upper</a><img SRC="assets/site.css" alt="Upper">',
        2,
      ],
      ['protocol-relative external URL', '<script src="//cdn.example.com/library.js"></script>', 0],
      ['root-relative query and hash', '<link href="/assets/site.css?v=1#theme" rel="stylesheet">', 1],
      [
        'data, aria, and text lookalikes',
        '<div data-href="missing-page.html" data-src="missing-image.png" aria-src="missing-aria.png">href="missing-text.html"</div>',
        0,
      ],
    ];

    for (const [name, markup, checked] of successfulCases) {
      const result = runChecker(markup);
      assert.equal(result.status, 0, `${name}: ${result.output}`);
      assert.match(
        result.output,
        new RegExp(`Checked ${checked} local asset${checked === 1 ? '' : 's'}\\.`),
        `${name}: checked count must match`,
      );
    }

    const malformed = runChecker(
      '<a href="bad%ZZ.pdf">Bad</a><a href="present.txt">Present</a>',
    );
    assert.notEqual(malformed.status, 0);
    assert.match(malformed.output, /Invalid local references:/i);
    assert.match(malformed.output, /bad%ZZ\.pdf: malformed percent-encoding/i);
    assert.match(malformed.output, /Checked 1 local asset\./i);
    assert.match(
      malformed.output,
      /Link check failed: 1 invalid reference, 0 missing local assets\./i,
    );
    assert.doesNotMatch(malformed.output, /URIError|at .*check-local-links\.mjs/i);

    writeFileSync(path.join(fixtureRoot, 'outside-secret.txt'), 'outside');
    const traversalReference = '%2e%2e%2Foutside-secret.txt';
    const traversal = runChecker(`<a href="${traversalReference}">Outside</a>`);
    assert.notEqual(traversal.status, 0);
    assert.ok(traversal.output.includes(traversalReference));
    assert.match(traversal.output, /outside site root/i);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
