# Debi Prasad Portfolio

A static portfolio built with semantic HTML, CSS, and vanilla JavaScript. The live site is [https://debi-p.github.io/](https://debi-p.github.io/).

## Preview

```sh
npm install
npm run serve
```

Open [http://localhost:4173](http://localhost:4173).

## Verify


```sh
npm test
npm run check:links
```


`npm run test:visual` performs self-contained browser verification and starts and stops an ephemeral local server automatically. A normal `npm install` provides Playwright.

Approved desktop and mobile section screenshots for the hero, systems, projects, and FAQ/contact areas live in `tests/baselines`. After intentionally reviewing a visual change, regenerate them with `UPDATE_VISUAL_BASELINES=1 npm run test:visual`, then rerun the normal visual command to verify the comparison path.

## Deployment

This is the GitHub Pages user site repository `debi-p.github.io`. Publish the `main` branch from the repository root.

The same static directory can deploy to Cloudflare Pages, Netlify, or Vercel with no build command and the repository root as the output directory.

## Add A Project

Add a record to the root-level `public.json`. The site renders every record whose `status` is exactly `active`, sorted by numeric `order`.

## Applied Engineering Solutions Convention

Each record uses this compact structure:

```json
{
  "title": "Project title",
  "summary": "What the solution does and why it matters.",
  "sourceUrl": "https://github.com/debi-p/project",
  "liveUrl": "https://debi-p.github.io/project/",
  "coverImage": "assets/project-cover.webp",
  "order": 1,
  "status": "active"
}
```

`sourceUrl` powers the **View Source** link and `liveUrl` powers the **Explore Live** link. They may point to the same destination. Cover images can be local paths or public HTTP/HTTPS URLs. There is no fixed project limit, modal, iframe, or video requirement.
