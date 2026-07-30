# bloatware v0.1.0 - Documentation

## Preface

The documentation for v0.1.0 is intentionally minimal. The design documents in
this directory (A-idea through H-testing) were created ad-hoc during planning to
keep the project on track rather than following a formal documentation system.

For this release, I am avoiding the trap of writing an enterprise documentation
portal. This document provides a developer quickstart guide, project module
overview, and content authoring notes to build and maintain the site, deferring
formal user guides and layout standardization to future releases.


## Intended audience

- Me, the site author and developer.
- Anyone building or running the project locally.


## Developer Quickstart & Module Guide

### 1. Project Directory Structure
Content, core modules, and build scripts are organized as follows:

```
bloatware/
|-- content/
|   |-- articles/         # Articles organized by YYYY/MM/
|   \-- pages/            # Hierarchical pages by topic/subtopic/
|
|-- site/
|   |-- modules/          # Reusable core modules
|   |   |-- logger.ts     # Structured logging & build profiler
|   |   |-- md-parser/    # Two-pass custom Markdown parser
|   |   \-- md-render/    # Decoupled React AST renderer
|   |
|   |-- scripts/          # Build orchestration scripts
|   |   \-- build-static.ts
|   |
|   |-- src/              # Layout templates, CSS, and interaction JS
|   \-- dist/             # Generated static HTML website output
|
\-- readMe.md             # Home page introduction content
```

### 2. Core Modules Summary (`site/modules/`)
- `site/modules/md-parser/`: Handwritten two-pass Markdown parser and AST node
  definitions (Block and Inline discriminated unions).
- `site/modules/md-render/`: Decoupled React AST renderer mapping AST nodes
  directly to HTML elements without filesystem dependencies.
- `site/modules/logger.ts`: Structured JSON logging and execution profiler
  tracking build events, warnings, and average build-time-per-page.

### 3. Running the Build
To generate the static website:

1. Navigate to the `site/` directory:
   `cd site`
2. Install dependencies (first time only):
   `npm install`
3. Run the static build orchestrator:
   `npm run build`

The build script compiles static HTML files, copies `styles.css` and
`interaction.js`, logs performance statistics, and outputs all routes into
`site/dist/`.


## Content Authoring Guide

### 1. Adding Articles
Create a Markdown file under `content/articles/YYYY/MM/[article-title].md`.
For example: `content/articles/2026/03/my-first-post.md`.

### 2. Adding Pages
Create a Markdown file under `content/pages/[topic]/[subtopic]/[page-title].md`.
For example: `content/pages/about/bio.md`.

### 3. Trailing Metadata Format
Articles and pages may include optional metadata at the end of the file:

```markdown
# Article Title

Body paragraph content...

---

- **Author**: Dwij Bavisi <dwij.bavisi@crabwire.net>
- **Published**: March 26, 2026, Project bloatware
- **Conceived**: March 26, 2026, I need to sleep...
```


## Troubleshooting & Diagnostics

If the build script fails or content does not appear:

1. **Check Structured Build Logs**: Review terminal output from `logger.ts` for
   dead link warnings, unclosed block warnings, or path traversal errors.
2. **Inspect Route Manifest**: Open `site/dist/route-manifest.json` to verify
   that your article or page route was discovered and registered.
3. **Verify File Extensions**: Ensure all content source files end in `.md` (case
   insensitive).


## Deferred Work (v0.1.1+)

The following documentation items are explicitly deferred to v0.1.1 or later:

- Standardized documentation layout system for project design docs.
- Role-based guides for distinct stakeholders (developers, maintainers, authors,
  and site viewers).
- Full API reference documentation for internal TypeScript modules.
- Any additional documentation deliverables originally mentioned in design
  documents.
