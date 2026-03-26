# bloatware-site
Static-first React/TSX/Vite implementation plan


## Abstract
This plan defines a minimal static-site architecture for Project bloatware,
implemented with React (TSX) and Vite. The first objective is static generation
only, with no server runtime in production. Content will be sourced from the
existing markdown hierarchy under `content/articles` and `content/pages`, while
frontend source code will live under `site/` and future global assets under
`www/`.

The system will provide three core templates - index, articles, and pages - and
generate deterministic routes at build time. SSR remains a future-compatible
development direction, not an immediate implementation target.


## 1. Scope and Constraints

### 1.1 Primary Scope
The initial build targets a static website output with a simple toolchain and
minimal boilerplate.

### 1.2 Content Source of Truth
All authored content remains in markdown files within:

1. `content/articles`
2. `content/pages`

### 1.3 Runtime Constraints

1. No production server code in this phase.
2. No SSR runtime requirement for launch.
3. SSR compatibility may be considered later for local development workflows.


## 2. Site Architecture

### 2.1 Directory Topology

1. `site/` contains Vite, React TSX source, routing, templates, and build logic.
2. `www/` is reserved for global static assets and future shared media.
3. `content/` remains content-only and framework-agnostic.

### 2.2 Rendering Strategy
The site uses build-time rendering from markdown to static HTML routes. Every
discoverable article/page slug is pre-rendered during build.

### 2.3 Boilerplate Policy
Only essential dependencies are included:

1. React + React DOM
2. Vite + TypeScript
3. Markdown/frontmatter utilities (for example, gray-matter + remark)


## 3. Template Model

### 3.1 Index Template
The index template acts as an entry view and should present:

1. Latest article summaries
2. Key standalone pages
3. Navigation into `/articles` and `/pages`

### 3.2 Articles Template
The articles template covers:

1. Listing route at `/articles`
2. Individual static routes at `/articles/:slug`
3. Sorting and metadata presentation (title/date/summary where available)

### 3.3 Pages Template
The pages template covers:

1. Listing route at `/pages`
2. Individual static routes at `/pages/:slug`
3. Clean rendering for evergreen or idea-style content


## 4. Build Pipeline

### 4.1 Content Ingestion
A content loader in `site/` scans markdown files under the two source trees,
parses frontmatter, derives slugs, and normalizes metadata.

### 4.2 Route Generation
Build logic enumerates all discovered content nodes and emits static routes for:

1. `/`
2. `/articles`
3. `/pages`
4. `/articles/:slug` for all article slugs
5. `/pages/:slug` for all page slugs

### 4.3 Output Verification
The build is considered valid when:

1. Static files exist for every expected route
2. Content from both source trees is visible in generated pages
3. No runtime server process is required to serve production output

### 4.4 Base Path and File-System Compatibility
Static HTML output must support direct opening via `site/dist/index.html` and
deployment under nested base paths.

1. Internal links must be generated as route-relative paths, not root-absolute
	paths.
2. Shared assets (for example `styles.css`) must be referenced relative to the
	current route depth.
3. Navigation behavior must remain correct whether hosted at domain root,
	sub-directory, or local file-system context.
4. Route links should resolve to explicit `index.html` targets so local
	`file://` browsing does not depend on directory-index inference.


## 5. Implementation Sequence

### 5.1 Foundation

1. Initialize Vite React TS project in `site/`
2. Add markdown parser/frontmatter dependencies
3. Define a shared content schema interface

### 5.2 Core Features

1. Implement markdown loader
2. Implement template components (index/articles/pages)
3. Wire static route generation

### 5.3 Stabilization

1. Add build/readme documentation in `site/readMe.md`
2. Run static build verification against existing content
3. Validate direct local browsing from `site/dist/index.html`
4. Ensure structure remains minimal and maintainable


## 6. Future SSR Path (Deferred)
SSR is intentionally deferred and not included in phase one delivery. Future
work may introduce development-time SSR without changing the content source model
or template contracts established by this plan.


## 7. Conclusion
This plan keeps bloatware-site focused on static reliability first: predictable
build output, markdown-driven content, and low operational complexity. The
architecture leaves room for future SSR evolution while avoiding premature server
coupling in the initial release.


---

- **Author**: Dwij Bavisi <<dwij.bavisi@crabwire.net>>
- **Published**: March 26, 2026, Project bloatware
- **Revised**: v0.2.1, March 26, 2026

## Change Log

```
v0.0.0
+-- v0.1.0
|   +-- [log] Initial plan
+-- v0.2.0
	+-- [log] Use links relative to base path
	+-- v0.2.1
		+-- [log] Route links target explicit `index.html` for local file browsing compatibility
```
