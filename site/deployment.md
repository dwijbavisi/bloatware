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

## Notes

- Current scope deploys to GitHub Pages only.
- Tag-based release assets are intentionally deferred.
