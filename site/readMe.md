# bloatware-site

Minimal static-first React/TSX + Vite setup for Project bloatware.

## Scope
- Static generation is the current objective.
- No production server code.
- SSR remains future scope for development workflows.

## Content Sources
- `../content/articles`
- `../content/pages`

## Commands
- `npm install`
- `npm run build` (same as `npm run build:static`)
- `npm run dev` (Vite dev shell for implementation work)

## Deployment
- GitHub Pages deployment is automated on every push to `main`.
- Workflow: `.github/workflows/deploy.yml`
- Guide: `site/deployment.md`

## Output
- Static site is generated to `site/dist`.
- Route list is written to `site/dist/route-manifest.json`.

## Templates
- Index: `/`
- Articles list: `/articles/`
- Pages list: `/pages/`
- Article detail: `/articles/:slug/`
- Page detail: `/pages/:slug/`
