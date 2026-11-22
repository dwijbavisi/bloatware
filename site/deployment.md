# Deployment Strategy

This document outlines the hosting environment, domain architecture, CI/CD pipeline, and automation routines for deploying `bloatware`.

## Infrastructure & Hosting

- **Hosting Provider**: GitHub Pages
- **Environment**: Static site hosted directly from build artifacts
- **Base URL / Path**: Custom root domain `https://bloatware.crabwire.net`

## CI/CD Pipeline (`.github/workflows/deploy.yml`)

The deployment process is automated using GitHub Actions.

- **Trigger Events**:
  - Push to `main` branch
  - Manual: via `workflow_dispatch`
  - Automated: via `repository_dispatch` (`content-updated`)

- **Incremental CI Caching**:
  - Caches `site/.cache` (Level 1 ASTs & Level 2 route metadata) and `site/dist` (pre-built assets and HTML).
  - Keyed on `bloatware-build-${{ runner.os }}-${{ github.sha }}-${{ steps.hf-sha.outputs.sha }}` with fallback restore keys.
  - Enables GitHub Actions to run differential builds (<300ms) on content updates and skip markdown re-parsing on UI changes.

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
  - `site/dist/search-index.json`: Precomputed full-content search index for the client-side command palette.
  - Canonical link tags (`<link rel="canonical" href="..." />`) on every HTML page via `CoreLayout.tsx` pointing to full paths including `index.html` (matching the full path URLs in `sitemap.xml`).

## Notes

- Current scope deploys to GitHub Pages only.
- Tag-based release assets are intentionally deferred.
