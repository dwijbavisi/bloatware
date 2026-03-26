# bloatware-pub
Publishing Strategy for Static-Site Deployment to GitHub Pages


## Abstract
This plan outlines the automated deployment pipeline for publishing bloatware-site
to GitHub Pages using GitHub Actions. The workflow builds the static site on every
push to main and publishes to GitHub Pages instantly.

Current scope is intentionally limited to continuous deployment on `gh-pages`.
Tag-based release packaging is deferred until release requirements are finalized.


## 1. Publishing Objectives

### 1.1 Primary: Continuous GitHub Pages Deployment
Every commit to the main branch triggers an automated build and deployment to
GitHub Pages. The live site reflects the latest content within minutes.

### 1.2 Deferred: Versioned Release Assets
Tag-based release assets are out of current scope. This will be revisited after
release strategy, cadence, and asset format are finalized.

### 1.3 Frequency Strategy
- GitHub Pages: Updated on every main commit (daily if posts are published daily).
- Release Assets: Deferred to future scope.


## 2. Workflow Architecture

### 2.1 Two-Job Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) contains two
sequential jobs:

1. **build** (always runs)
   - Installs npm dependencies in `site/` directory.
   - Executes `npm run build` to generate static output in `site/dist/`.
   - Uploads `site/dist/` as a workflow artifact for downstream jobs.

2. **deploy-pages** (always runs, depends on build)
   - Downloads the `site/dist/` artifact.
   - Deploys to GitHub Pages by pushing to the `gh-pages` branch.
   - Live site updates typically within 2 minutes.

### 2.2 Job Triggers

| Job | Trigger | Frequency | Output |
| --- | --- | --- | --- |
| build | Always | Every commit | Artifact: site/dist/ |
| deploy-pages | Always | Every commit | GitHub Pages update |


## 3. Release Strategy (Deferred)

Tag-based release packaging and downloadable distribution assets are intentionally
deferred. The current publishing plan supports only continuous deployment to
GitHub Pages from main.

When revisited, this section should define:

1. Tag naming convention
2. Release cadence (monthly/manual)
3. Asset format (`.zip`, `.tar.gz`, or both)
4. Release notes model


## 4. Release Asset Structure (Deferred)

### 4.1 .zip Contents

This section is retained for future planning only and is not part of current
implementation.

If enabled later, the .zip archive would contain the complete output of
`site/dist/` after successful build:

- **index.html** — Root entry point (home page)
- **styles.css** — Global stylesheet
- **Route directories** — Each content route (articles, pages, etc.) as a folder with its own `index.html`
- **Static assets** — CSS, images, or other media from `www/` (if present)
- **route-manifest.json** — Metadata file listing all available routes

**Archive naming:** `bloatware-site-v<version>.zip` or `bloatware-site-v<version>-<YYYY>-<MM>.zip`

**Structure is portable:** Extract anywhere and open `index.html` in a browser to view the complete site offline.

### 4.2 Release Notes Template (Deferred)

Placeholder for future release-note format once release workflow is enabled.


## 5. GitHub Pages Configuration

### 5.1 One-Time Setup

1. Navigate to Repository Settings -> Pages.
2. Set Source to `gh-pages` branch, root folder.
3. Save. GitHub Pages is now enabled.
4. Site will be live at `https://<username>.github.io/<repo>/` (or custom domain if configured).

### 5.2 Workflow Auto-Management

The GitHub Actions workflow automatically manages the `gh-pages` branch. No manual
intervention is needed after initial setup.


## 6. Implementation Plan

### 6.1 Files to Create

1. `.github/workflows/deploy.yml` — Main workflow definition.
2. `site/deployment.md` — Local deployment guide and troubleshooting.

### 6.2 Files to Update

1. `content/pages/plans/bloatware/bloatware-site.md` — Add publishing section.
2. `site/readMe.md` — Link to deployment.md.

### 6.3 Verification Steps

1. **Create workflow on feature branch** (no deploy yet).
2. **Push to origin** and verify build succeeds in Actions tab.
3. **Merge to main** and confirm live site updates.


## 7. Key Decisions Finalized

### 7.1 Publish Cadence
Continuous deploy on every main commit.

### 7.2 Release Cadence
Deferred: Tag/release cadence will be decided later.

### 7.3 Asset Format
Deferred: Asset format will be decided when release pipeline is enabled.

### 7.4 Pages Setup
Project site hosted at `https://<username>.github.io/bloatware/` (`gh-pages` branch).


## 8. Workflow Execution Timeline

| Step | Trigger | Duration | Output |
| --- | --- | --- | --- |
| 1. build | Push to main | ~2 min | site/dist/ artifact |
| 2. deploy-pages | build completes | ~3 min | GitHub Pages live |

Total from commit to live: ~5 minutes.


## 9. Conclusion

This publishing strategy prioritizes a single reliable path: continuous deployment
to GitHub Pages on every main commit. The workflow is self-contained, requires no
external services, and leverages GitHub's native capabilities. Release packaging
is explicitly deferred to reduce current complexity.


---

- **Author**: Dwij Bavisi <<dwij.bavisi@crabwire.net>>
- **Published**: March 27, 2026, Project bloatware
- **Revised**: v0.1.1, March 27, 2026

## Change Log

```
v0.0.0
+-- v1.0.0
|   +-- [log] Initial publishing strategy with GitHub Pages + monthly releases
+-- v1.0.1
    +-- [log] Refocused current scope to gh-pages only; deferred tag-based release assets
```
