# Deployment

This project deploys automatically to GitHub Pages from the `main` branch.

## Workflow

The workflow is defined in `.github/workflows/deploy.yml` and runs two jobs:

1. `build`
- Installs dependencies in `site/`
- Runs `npm run build`
- Uploads `site/dist` as the Pages artifact

2. `deploy-pages`
- Deploys the artifact to GitHub Pages (`gh-pages`)

## Trigger

- Automatic: every push to `main`
- Manual: via `workflow_dispatch`

## One-Time Repository Setup

1. Open repository Settings -> Pages.
2. Ensure the Pages source is enabled for GitHub Actions.
3. Push to `main` and verify the workflow succeeds.

## Custom Domain & SEO

- Published URL: `https://bloatware.crabwire.net`
- Managed via GitHub Pages custom domain configuration with a `CNAME` record pointing to GitHub Pages.
- The build script (`site/scripts/build-static.ts`) automatically generates:
  - `site/dist/CNAME`: Maintains custom domain binding across deployments.
  - `site/dist/sitemap.xml`: Full XML sitemap conforming to sitemaps.org 0.9 with `lastmod`, `priority`, and `changefreq`.
  - `site/dist/robots.txt`: Directs search engine crawlers (Googlebot, etc.) to `https://bloatware.crabwire.net/sitemap.xml`.
  - Canonical link tags (`<link rel="canonical" href="..." />`) on every HTML page via `CoreLayout.tsx` to satisfy Search Console canonical declarations and prevent duplicate content (e.g. `/index.html` vs `/`).

## Notes

- Current scope deploys to GitHub Pages only.
- Tag-based release assets are intentionally deferred.
