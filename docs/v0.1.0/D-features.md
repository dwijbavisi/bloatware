# bloatware v0.1.0 - Feature Specification

## 1. Document control

| Field                  | Value                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Document               | Feature specification / software requirements specification                              |
| Project                | bloatware                                                                                |
| Release                | v0.1.0                                                                                   |
| Status                 | Proposed                                                                                 |
| Source documents       | [A-idea.md](A-idea.md), [B-design.md](B-design.md), [C-feasibility.md](C-feasibility.md) |
| Primary implementation | TypeScript, React, Vite, Node.js filesystem APIs                                         |
| Delivery model         | Static HTML generated at build time                                                      |
| Dependency policy      | No new external libraries or dependencies                                                |

## 2. Purpose

This document defines the functional and non-functional requirements for the
v0.1.0 refactor of project bloatware. It converts the project idea, design
decisions, and feasibility limits into implementable requirements and acceptance
criteria.

The release is a reliability-focused refactor. It must preserve the behavior
and content of the contemporary site while replacing opaque implementation with
modular, typed, tested, documented and maintainable code. This document does
not authorize unrelated features, a new runtime platform, a new Markdown
library or full CommonMark/GitHub-Flavored Markdown compatibility.

## 3. Scope

### 3.1 In scope

The release contains three primary features:

1. A custom Markdown parser with an explicitly defined project-specific syntax
   subset.
2. Modular website templates that render the existing site content and routes.
3. A static build script that discovers content, computes links, renders pages,
   copies assets and produces deployable output.

The release also includes cross-cutting requirements for:

- typed module boundaries;
- parser, template, loader and build tests;
- structured logging during static build and at runtime;
- path and output hardening;
- an accessibility and compliance baseline;
- average build-time-per-page statistics;
- documentation and troubleshooting information.

### 3.2 Out of scope

The following are explicitly excluded from v0.1.0:

- adding new user-facing product features unrelated to feature parity;
- adding external runtime or development dependencies;
- replacing the custom parser with an external parser;
- implementing all CommonMark, GFM or Markdown extensions;
- a public plugin marketplace or user-installable theme system;
- server-side rendering at deployment time;
- client-side routing, hydration or runtime content loading;
- a database, CMS, authentication, comments, search or editing interface;
- formal, legal or compliance certification;
- syntax highlighting or mathematical typesetting libraries;
- incremental or watch-mode static regeneration.

## 4. Product context and system overview

bloatware is a content website. Markdown source files are stored under the
repository `content/` directory. Articles are organized by year and month;
pages are organized hierarchically by topic and subtopic. The static build
loads and parses this content, resolves route-aware links, renders React
components to HTML and writes one `index.html` file per route.

The production artifact is static. A visitor receives HTML, CSS and a small
JavaScript interaction bundle. Markdown parsing, content loading, table of
contents generation, React rendering and route generation occur during the
build rather than in the visitor's browser.

The expected route families are:

- `/` - site introduction and latest articles;
- `/articles/` - article index;
- `/articles/<slug>/` - article detail;
- `/pages/` - hierarchical page index;
- `/pages/<slug>/` - page detail.

Directory-style routes are written as `index.html` files. Links between these
routes and links to assets are computed at build time as relative links.

## 5. Users and stakeholders

| Stakeholder               | Need                                                                      |
| ------------------------- | ------------------------------------------------------------------------- |
| Site visitor              | Read content through stable, accessible static pages.                     |
| Content author            | Write supported Markdown without learning implementation details.         |
| Project owner             | Understand, test and safely modify the code.                              |
| Build/deployment operator | Run a deterministic build and diagnose failures from logs.                |
| Future maintainer         | Extend parser, templates and content layout through typed contracts.      |
| Reviewer                  | Verify feature parity, security controls and release acceptance criteria. |

## 6. Definitions and conventions

- **Article:** Content discovered below `content/articles/`.
- **Page:** Content discovered below `content/pages/`.
- **Content item:** A normalized article or page record containing source,
  metadata, route, parsed nodes and hierarchy information.
- **AST:** Typed abstract syntax tree returned by the custom Markdown parser.
- **Block node:** A document-level Markdown structure such as a heading or
  paragraph.
- **Inline node:** A structure inside a block, such as bold text or a link.
- **Route:** A directory-style URL ending in `/`.
- **Relative link:** A link computed from the current route to another route or
  asset, rather than a root-relative link.
- **Feature parity:** Preservation of current intentional routes, content
  constructs, navigation, layout meaning, metadata behavior and static output.
- **Structured log:** A log event with a level, timestamp, namespace/event,
  message and machine-readable context fields.
- **Build page:** Any HTML route rendered during static generation.

The words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** express
requirement priority.

## 7. Assumptions and constraints

1. The project remains TypeScript/React and continues to compile through the
   existing Vite-oriented toolchain.
2. The static build is run from the `site/` project directory.
3. Content is UTF-8 Markdown text.
4. The current repository content and generated contemporary site are the
   behavioral baseline for parity testing.
5. The custom parser is handwritten for this project and no new dependency is
   permitted.
6. Only the documented Markdown subset is guaranteed to be supported.
7. The output directory can be deleted and regenerated during a clean build.
8. Static hosting serves directory routes containing `index.html`.
9. Existing dependencies may be used, but the refactor MUST NOT introduce new
   packages.
10. Security and compliance claims are limited to controls and checks actually
    implemented and verified.

## 8. Functional requirements

### 8.1 Feature F1 - custom Markdown parser

#### F1.1 Parser contract

The parser MUST expose a typed function that accepts a UTF-8 Markdown string
and returns a parse result containing:

- an ordered list of block AST nodes;
- optional post metadata;
- parser diagnostics or a documented logging outcome.

The parser MUST NOT import React, filesystem APIs, route logic or template
components. Parsing and rendering MUST remain independently testable.

The parser MUST preserve source order. It MUST coalesce ordinary adjacent text
where this does not change semantics and MUST preserve code and math content as
raw text.

#### F1.2 Supported block syntax

The following block syntax is the complete v0.1.0 baseline. Syntax not listed
here is unsupported and MUST NOT be silently interpreted as another structure.

| Syntax      | Meaning                            | AST requirement                                   |
| ----------- | ---------------------------------- | ------------------------------------------------- |
| `# text`    | Level-one heading                  | Heading with `level: 1`                           |
| `## text`   | Level-two heading                  | Heading with `level: 2`                           |
| `### text`  | Level-three heading                | Heading with `level: 3`                           |
| `#### text` | Level-four heading                 | Heading with `level: 4`                           |
| `text`      | Paragraph line(s)                  | Paragraph with inline children                    |
| ` ``` `     | Opening/closing fenced code block  | Code block with optional language and raw content |
| `$$`        | Opening/closing display-math block | Math block with raw content                       |
| `> text`    | Blockquote line                    | Blockquote containing recursively parsed blocks   |
| `---`       | Horizontal rule                    | Horizontal-rule node                              |
| `- text`    | Unordered list item                | Unordered list                                    |
| `+ text`    | Unordered list item                | Unordered list                                    |
| `* text`    | Unordered list item                | Unordered list                                    |
| `1. text`   | Ordered list item                  | Ordered list                                      |
| `2. text`   | Ordered list item                  | Ordered list                                      |

Requirements for the block grammar:

- Only H1, H2, H3 and H4 are valid heading levels. H5, H6 MUST be rejected or
  treated as unsupported text according to the documented recovery policy.
- A heading marker MUST be followed by one space. Leading/trailing whitespace
  handling MUST be defined and tested.
- Consecutive ordinary non-empty lines MUST form one paragraph, with the
  project's defined soft-line-break behavior.
- Consecutive list items of the same list kind MUST form one list.
- Ordered list markers MUST contain one or more decimal digits, a period and a
  space. The rendered numbering MAY be normalized sequentially.
- Nested lists are not part of the v0.1.0 schema.
- Blockquote lines MUST strip the `>` marker and optional following space, then
  parse the remaining content using the same supported block grammar.
- Blockquote severity is not a user-facing syntax requirement in v0.1.0. If a
  severity field is retained in the AST, the default value MUST be used.
- A fenced code block opening MUST use exactly three backticks, optionally
  followed by a language token. It MUST close on a line containing exactly
  three backticks.
- A display-math block MUST open and close on a line containing exactly `$$`.
- The parser MUST define a warning and recovery result for an unclosed code,
  math or blockquote structure; an editorial error MUST NOT crash the entire
  build unless the configured policy explicitly marks it fatal.
- Tables, images, raw HTML, YAML/TOML frontmatter, setext headings, indented
  code, task lists, definition lists, footnotes, autolinks, comments and GFM
  extensions are unsupported.

#### F1.3 Supported inline syntax

The parser MUST support each syntax below independently and in the permitted
nesting combinations:

| Syntax       | Example                      | Meaning                      |
| ------------ | ---------------------------- | ---------------------------- |
| Bold         | `**bold**`                   | Strong emphasis              |
| Italic       | `*italic*`                   | Emphasis                     |
| Inline code  | `` `code` ``                 | Raw monospace text           |
| Inline math  | `$x^2$`                      | Raw inline mathematical text |
| Link         | `[label](target)`            | Hyperlink with inline label  |
| Superscript  | `^text^`                     | Superscript inline content   |
| Subscript    | `~text~`                     | Subscript inline content     |
| Forced break | `first\` followed by newline | Hard line break              |
| Literal text | Any unmatched characters     | Text node                    |

Inline requirements:

- Bold, italic, links, superscript and subscript MUST support recursive inline
  content where the grammar permits it.
- Inline code and inline math MUST preserve their contents as raw text and
  MUST NOT recursively parse nested Markdown syntax.
- Adjacent literal text MUST be combined into one text node where possible.
- An unmatched delimiter MUST be retained as literal text, logged at warning
  level and MUST NOT abort the build.
- Link labels MUST be parsed as inline content. Link targets MUST be retained
  separately so the loader can rewrite relative Markdown links.
- Unsafe link schemes and malformed targets MUST be rejected, neutralized or
  handled by a documented allowlist. The parser MUST NOT create executable
  links from untrusted input.
- A forced break MUST be recognized before paragraph normalization removes the
  source newline. This specifically addresses existing content that uses a
  backslash at the end of a quoted line.
- Escape semantics are limited to those explicitly implemented and documented;
  the parser MUST NOT claim general Markdown escaping.

#### F1.4 Metadata schema

A post MAY end with a metadata list. Metadata is optional and MUST NOT be
required for a document to render.

The supported metadata fields are:

```md
---

- **Author**: Dwij Bavisi <<dwij.bavisi@crabwire.net>>
- **Published**: March 26, 2026, Project bloatware
- **Conceived**: March 26, 2026, I need to sleep...
```

The parser MUST recognize the field labels `Author`, `Published` and
`Conceived` case-sensitively or according to one documented normalization rule.
The value MUST be retained as authored text. The metadata list MAY contain one,
two or all three fields.

The parser MUST distinguish metadata from ordinary content using the documented
trailing-list rule. Metadata MUST NOT be accidentally swallowed by an
unterminated code or math block. Invalid or incomplete metadata MUST produce a
warning and leave unaffected content renderable.

The normalized content model MUST provide:

- `author`, when present;
- `published`, when present;
- `conceived`, when present;
- an inferred sortable date, when one can be derived.

Publication dates SHOULD support the existing long English date form and ISO
dates. If no valid publication date exists, the loader MAY fall back to the
`YYYY/MM` source directory for grouping, while preserving that the item is not
explicitly dated.

Templates MUST display available metadata consistently. At minimum, the
published date MUST be displayed when present; author and conceived date MUST
be displayed when present and MUST NOT be fabricated when absent.

#### F1.5 AST and diagnostics

The AST MUST use discriminated node types for all supported block and inline
nodes. It MUST include at least:

- text;
- bold;
- italic;
- link;
- inline code;
- inline math;
- superscript;
- subscript;
- line break;
- heading;
- paragraph;
- blockquote;
- list and list item;
- fenced code;
- display math;
- horizontal rule.

Diagnostics SHOULD include source line or character context, severity and a
human-readable explanation. Diagnostics MUST never contain secrets or emit raw
untrusted content in a way that can execute in a log viewer.

#### F1.6 Parser acceptance criteria

F1 is accepted when:

1. Every syntax row in sections F1.2 and F1.3 has unit tests for valid input.
2. Every delimiter-based construct has tests for empty, nested, malformed and
   unclosed input.
3. Representative existing articles and pages parse into the expected AST.
4. Existing metadata lists are extracted without losing article content.
5. H5, H6 and unsupported constructs follow the documented behavior.
6. The parser has no React or filesystem dependency.
7. Parser warnings are structured and do not cause a valid build to fail.
8. The rendered output preserves the intended meaning of contemporary content.

### 8.2 Feature F2 - website templates and runtime presentation

#### F2.1 Template architecture

Templates MUST be composed from typed, responsibility-based components. At a
minimum, the architecture MUST separate:

- document/layout shell;
- navigation and site header;
- table of contents;
- index page;
- article index and article detail;
- page index and page detail;
- Markdown AST rendering;
- metadata presentation.

Templates MUST receive normalized data and MUST NOT discover files or parse
Markdown. Layouts MUST be extensible through small internal typed contracts,
not necessarily a public plugin API.

#### F2.2 Shared document layout

Every generated document MUST contain:

- `<!doctype html>`;
- `lang="en"` unless a future language requirement is introduced;
- UTF-8 charset metadata;
- responsive viewport metadata;
- a page-specific title;
- route-relative links to `styles.css` and `interaction.js` when the assets
  are included;
- a site header and navigation;
- a semantic `main` region;
- content appropriate to the route.

The site header MUST provide a brand link to the index, an Articles link and a
Pages link. Navigation and assets MUST use computed relative links, never links
that assume the current page is at the root.

#### F2.3 Index page

The index page MUST render:

- the repository introduction from the root `readMe.md`;
- the configured latest-article subset, preserving the current six-item limit
  unless a later feature specification changes it;
- article titles;
- publication dates when available;
- relative links to article detail routes.

The index MUST remain a static page and MUST NOT fetch content in the browser.

#### F2.4 Article index and detail

The article index MUST:

- include every discovered article;
- sort dated articles by publication date descending;
- group articles by year;
- place undated articles in a defined `Undated` group;
- link each item to its generated detail route.

An article detail page MUST:

- render the parsed Markdown AST;
- render the article title and available metadata;
- render the table of contents when the ToC rule is satisfied;
- preserve visible content meaning and supported Markdown markers according to
  the selected presentation policy;
- include route-relative navigation and assets.

#### F2.5 Pages index and detail

The page index MUST construct a hierarchy from canonical page paths. It MUST
render nested page groups and links without requiring a flat page list.

A page detail page MUST:

- render the parsed page AST and available metadata;
- show direct child pages under a `Subpages` section when children exist;
- preserve the generated route based on the source path;
- include route-relative navigation and assets.

A terminal `readMe` page name and repeated final directory/file names MUST follow
the existing canonical-path rules for hierarchy construction.

#### F2.6 Table of contents

The ToC MUST be computed from the parsed AST at build time. It MUST:

- include top-level H1, H2, H3  and H4 headings;
- preserve heading order;
- use the same slug algorithm as heading anchors;
- link to the corresponding in-page IDs;
- be omitted when fewer than two qualifying headings exist;
- not require client-side React hydration.

Heading IDs MUST be deterministic. Duplicate headings MUST receive unique IDs
so every ToC entry points to one unambiguous location.

The ToC MUST be presented through an accessible native disclosure control or an
equivalent keyboard-accessible control. The runtime interaction MAY close an
open ToC when a click occurs outside it.

#### F2.7 Runtime behavior and structured logging

Runtime JavaScript MUST remain limited to progressive-enhancement behavior
required by the existing site. It MUST:

- initialize after DOM readiness;
- discover elements through a defined data attribute or equivalent contract;
- invoke only registered behaviors;
- fail safely when an optional behavior or element is absent;
- avoid client-side Markdown parsing, content loading and route generation.

Runtime logging MUST use the shared structured logging contract where runtime
logging is enabled. A runtime event MUST include at least timestamp, level,
namespace, event name and contextual fields. Logs MUST be quiet by default in
production unless a diagnostic mode is explicitly enabled. Debug logging MUST
NOT expose private metadata, secrets or unnecessary content.

#### F2.8 Presentation and accessibility requirements

Templates and generated output MUST provide a baseline of:

- semantic headings in document order;
- meaningful link text;
- keyboard-accessible navigation and ToC controls;
- visible focus indication;
- usable text alternatives when non-text content is eventually supported;
- readable contrast and responsive layout;
- document titles that identify the current page;
- no raw unescaped content that can execute as HTML or script.

The project MUST document what was checked. It MUST NOT claim formal
accessibility certification.

#### F2.9 Template acceptance criteria

F2 is accepted when:

1. Index, article index, page index, article detail and page detail routes are
   generated with feature parity.
2. Representative articles and pages render without lost blocks or metadata.
3. Navigation and asset links work from root, index, nested article and nested
   page routes.
4. The ToC is deterministic, correctly anchored and keyboard accessible.
5. Page hierarchy and direct child pages are preserved.
6. Templates contain no filesystem discovery or Markdown parsing logic.
7. Generated HTML passes the documented security and accessibility checks.
8. Runtime JavaScript remains optional progressive enhancement.

### 8.3 Feature F3 - static build script

#### F3.1 Build inputs and discovery

The build MUST discover Markdown files recursively under:

- `content/articles/`;
- `content/pages/`.

Discovery MUST be deterministic, include `.md` files case-insensitively and
exclude files outside approved content roots. The root `readMe.md` MUST be
available as the index introduction.

The build MUST normalize paths and reject path traversal or writes outside the
approved project and output directories.

#### F3.2 Build pipeline

A successful build MUST perform these logical stages:

1. Initialize configuration, logger and timing instrumentation.
2. Discover article and page source files.
3. Read and parse all source documents.
4. Extract and normalize metadata.
5. Compute routes, canonical paths, hierarchy and route-aware Markdown links.
6. Parse the root introduction.
7. Clear and recreate the output directory for a clean build.
8. Copy CSS and any approved static assets.
9. Bundle the existing runtime interaction script using the existing toolchain.
10. Render all required React templates to static HTML.
11. Write one `index.html` for every route.
12. Write a route manifest containing the generated routes and documented build
    statistics.
13. Emit a structured build summary and exit successfully.

A failed required stage MUST produce a structured error and a non-zero process
exit status. Optional assets such as the existing optional `www` directory MAY
be skipped with an informational structured event.

#### F3.3 Routes and output

The build MUST generate these route classes:

| Route               | Output                            |
| ------------------- | --------------------------------- |
| `/`                 | `dist/index.html`                 |
| `/articles/`        | `dist/articles/index.html`        |
| `/pages/`           | `dist/pages/index.html`           |
| `/articles/<slug>/` | `dist/articles/<slug>/index.html` |
| `/pages/<slug>/`    | `dist/pages/<slug>/index.html`    |

The route manifest MUST list every generated HTML route exactly once. Route
names MUST be normalized consistently and output paths MUST be deterministic,
except for explicitly documented timing or generation fields.

#### F3.4 Relative link computation

All internal route and asset links MUST be computed at build time relative to
the current directory-style route.

The link resolver MUST support:

- route-to-route links;
- route-to-asset links;
- root, index, article detail and nested page locations;
- relative Markdown `.md` links rewritten to generated HTML routes;
- fragment identifiers where the target route is known.

External `http`/`https` links, `mailto` links, fragment-only links, root-relative
links and non-Markdown links MUST follow a documented preservation
policy. Relative Markdown targets MUST be normalized and MUST NOT escape the
content root. Missing internal targets SHOULD produce a warning or build error
according to a single documented policy; they MUST NOT silently become an
incorrect link.

Link rewriting MUST traverse links inside paragraphs, headings, blockquotes,
lists and nested inline nodes, but MUST NOT rewrite text inside code or math
nodes.

#### F3.5 Structured build logging

The build MUST use the shared structured logger rather than unrelated ad-hoc
string log wrappers. Each event MUST include:

- ISO-8601 timestamp;
- level (`debug`, `info`, `warn`, `error` or `silent` behavior);
- namespace, such as `build`, `content-loader` or `md-parser`;
- stable event name;
- human-readable message;
- contextual fields where relevant, such as source path, route, page kind,
  duration, item count or error information.

At minimum, the build MUST emit events for:

- build start and configuration;
- content discovery and counts;
- source parse start, success, warning and failure;
- metadata extraction or validation warnings;
- link rewriting and unresolved-link warnings;
- asset copy and runtime bundle stages;
- route render start and completion;
- output write completion;
- build statistics;
- build success or failure.

Logs MUST be useful in CI and troubleshooting, but MUST NOT print secrets,
full private metadata or unbounded source content. The logger SHOULD support a
quiet/default level and a diagnostic level without changing build results.

#### F3.6 Performance measurement

The build MUST measure elapsed time using a monotonic timer where available.
It MUST record at least:

- total build duration;
- number of generated HTML pages;
- total and average render/write time per generated page;
- per-page duration for troubleshooting slow pages;
- counts for articles, pages, warnings and errors.

The average build time per page MUST be defined explicitly. The v0.1.0
baseline is:

$$
\text{average page time} =
\frac{\text{sum of measured page render/write durations}}
{\text{number of generated HTML pages}}
$$

Build initialization, dependency bundling, asset copying and content parsing
MAY be reported separately and MUST NOT be ambiguously included in the page
average. Statistics MUST be emitted as structured logs and SHOULD be included
in the route manifest or a separate build report. Performance statistics are
observability requirements, not a promise of a specific hardware-independent
latency target.

#### F3.7 Determinism and reproducibility

Given the same source, configuration and dependency lockfile, the build MUST:

- discover files in a stable order;
- generate the same route set;
- generate stable route and heading IDs;
- avoid dependence on local absolute paths in output;
- avoid nondeterministic content ordering.

A generation timestamp MAY be included in diagnostics, but it MUST NOT make
content comparison impossible. If a timestamp remains in the route manifest,
it MUST be clearly separated from deterministic route data.

#### F3.8 Build acceptance criteria

F3 is accepted when:

1. A clean build generates every expected route and required asset.
2. The build succeeds from a clean install using only existing dependencies.
3. The output contains no unresolved internal `.md` links for valid content.
4. Links work from all tested route depths.
5. The route manifest matches the generated HTML route set.
6. A malformed document produces actionable diagnostics and follows the defined
   failure policy.
7. Build and runtime logs use the structured logging schema.
8. Total and average page timing statistics are emitted.
9. Repeated builds produce the same route and content structure.
10. A required build failure returns a non-zero process status.

## 9. Data requirements

### 9.1 Source content model

Each source document MUST retain:

- content kind: article or page;
- repository-relative source path;
- source slug;
- canonical path, where applicable;
- parsed AST;
- optional metadata;
- inferred sortable date;
- generated route;
- child-page relationships for pages.

### 9.2 Route manifest

The route manifest MUST contain at least:

- schema/version identifier;
- generated route list;
- route kind or equivalent mapping where useful;
- build statistics required by F3.6;
- warning and error counts.

Absolute machine-specific paths, secrets and raw source content MUST NOT be
written to the public manifest.

### 9.3 Error and diagnostic data

Errors MUST identify the stage and, where available, source path, route, line,
column and remediation context. Diagnostics MUST distinguish warnings from
fatal errors. A warning MUST NOT be promoted to a fatal error accidentally by
string matching or console output parsing.

## 10. External and internal interfaces

### 10.1 Command-line interface

The existing package scripts MUST remain available:

- `npm run dev` for local Vite development support;
- `npm run build` for the production static build;
- `npm run build:static` for the explicit static build;
- `npm run preview` for previewing built output where supported.

The build MAY later expose documented log-level or report options, but no
additional dependency or interactive configuration is required for v0.1.0.

### 10.2 Filesystem interface

The build reads approved Markdown and asset inputs and writes only to the
approved `dist` output. It MUST use UTF-8 for text files and MUST handle missing,
empty, unreadable and malformed files through documented diagnostics.

### 10.3 Browser interface

The browser receives static HTML, CSS and an optional deferred interaction
bundle. No production browser API is required for Markdown parsing or content
loading. Runtime behavior MUST degrade to usable static HTML if JavaScript is
disabled.

## 11. Non-functional requirements

### 11.1 Maintainability

- Modules MUST have one primary responsibility.
- Public module interfaces MUST be typed.
- Parser and renderer dependencies MUST be one-way.
- Behavior and limitations MUST be documented near the relevant contract.
- Avoidable `any` values MUST NOT be used in new or rewritten code.

### 11.2 Reliability

- The build MUST fail clearly for required input or output failures.
- Editorial syntax errors SHOULD recover without losing unrelated content.
- Tests MUST cover valid, invalid, empty, boundary and representative inputs.
- No feature is accepted solely because a happy-path browser check passes.

### 11.3 Security

- Filesystem paths MUST be normalized and confined to approved roots.
- Text and attribute content MUST be escaped by the renderer.
- Raw HTML MUST be unsupported or processed through an explicitly safe policy.
- Link schemes MUST be validated or allowlisted.
- Secrets MUST not appear in source, public output, logs or manifests.
- Existing dependency and lockfile changes MUST be reviewed; no new package may
  be added.

### 11.4 Accessibility and compliance

Generated pages MUST use semantic structure, meaningful titles and links,
keyboard-accessible controls, visible focus, responsive layout and readable
contrast. The project MUST maintain a checklist of verified controls and
limitations. No formal certification claim is made.

### 11.5 Performance

The static site SHOULD keep runtime JavaScript minimal and MUST not parse
content in the browser. The build MUST report the measurements in F3.6. No
absolute build-time target is specified until a baseline is recorded on a
known environment.

### 11.6 Portability and reproducibility

The build MUST work on the supported Windows/Linux development environment and the
existing CI/deployment environment. It MUST avoid hardcoded developer paths and
must use repository-relative configuration.

## 12. Testing and verification strategy

### 12.1 Unit tests

Unit tests MUST cover:

- every block and inline parser syntax;
- malformed and unclosed delimiters;
- metadata extraction and date inference;
- heading slug and duplicate-ID handling;
- ToC extraction;
- route and relative-asset calculations;
- Markdown link rewriting;
- structured log event shape;
- average page-time calculation.

### 12.2 Integration tests

Integration tests MUST cover:

- loading all current articles and pages;
- building page hierarchy;
- rendering each template class;
- rewriting representative internal and external links;
- generating the route manifest;
- handling malformed and missing content according to policy.

### 12.3 End-to-end and manual checks

A clean build and static preview MUST be checked for:

- root, articles, pages, nested article and nested page routes;
- navigation and asset links at multiple route depths;
- ToC behavior and in-page anchors;
- metadata visibility;
- JavaScript-disabled usability;
- keyboard navigation and focus visibility;
- representative code, math, list, quote, link and forced-break content.

### 12.4 Feature-parity verification

Before refactoring each feature, representative contemporary output SHOULD be
captured or manually recorded. After refactoring, verification MUST compare:

- route inventory;
- rendered content meaning;
- metadata and date behavior;
- navigation and relative links;
- page hierarchy;
- ToC entries and anchors;
- generated asset presence.

## 13. Traceability matrix

| Objective or limitation           | Requirements                           |
| --------------------------------- | -------------------------------------- |
| Modular, typed code               | F1.1, F1.5, F2.1, 11.1                 |
| Tested and documented code        | F1.6, F2.9, F3.8, section 12           |
| Custom parser reliability         | F1.1-F1.6, 11.2                        |
| Parser/rendering decoupling       | F1.1, F1.5, F2.1                       |
| Extensible website layout         | F2.1-F2.9                              |
| Feature parity                    | sections 3, F1.2, F1.3, 8.2, 8.3, 12.4 |
| Security baseline                 | F1.3, F3.1, F3.4, 11.3                 |
| Compliance/accessibility baseline | F2.8, 11.4, 12.3                       |
| Structured build/runtime logging  | F2.7, F3.5, 9.3                        |
| SBoM/dependency awareness         | sections 3.2, 7, 11.3                  |
| Build performance visibility      | F3.6, 11.5, 12.1                       |
| Static deployment                 | sections 4, 8.3, 10.2, 10.3            |

## 14. Risks and mitigations

| Risk                                               | Impact                                    | Mitigation                                                                   |
| -------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| Parser grammar is underspecified                   | Content can change meaning during rewrite | Treat every syntax row as a tested contract and document unsupported syntax. |
| Existing content relies on accidental behavior     | Feature parity may be misjudged           | Inventory content and compare representative generated output.               |
| Metadata is consumed by an unclosed block          | Author/date information disappears        | Exact fence grammar, parser diagnostics and metadata fixtures.               |
| Relative link calculation is wrong at depth        | Navigation or content links break         | Test every route family at multiple depths.                                  |
| Duplicate headings create ambiguous anchors        | ToC links target the wrong section        | Deterministic unique-ID suffixing and anchor tests.                          |
| Logging exposes sensitive content or overwhelms CI | Security and troubleshooting degrade      | Structured fields, log levels, redaction and bounded messages.               |
| Performance measurements are incomparable          | Optimization decisions become misleading  | Use monotonic timing and document inclusion/exclusion rules.                 |
| Refactor expands into a feature rewrite            | Release becomes unfinishable              | Enforce the scope and explicit out-of-scope list.                            |
| No new test dependency limits convenience          | Regressions may be missed                 | Prefer pure functions, fixtures and existing toolchain capabilities.         |

## 15. Release acceptance checklist

v0.1.0 is ready for release only when all of the following are true:

- [ ] The three primary features are implemented within the stated scope.
- [ ] The custom parser supports and tests every syntax in this specification.
- [ ] Unsupported syntax and recovery behavior are documented.
- [ ] Existing articles and pages render with feature parity.
- [ ] Optional metadata is extracted and displayed when present.
- [ ] All route and asset links are computed as valid relative links.
- [ ] The ToC is build-time generated and correctly anchored.
- [ ] Static output is generated for every discovered content route.
- [ ] Structured build and runtime logging is implemented and tested.
- [ ] Average build time per generated page is reported.
- [ ] Security and accessibility baseline checks are recorded.
- [ ] No new external dependencies were added.
- [ ] Tests pass from a clean checkout/install.
- [ ] Build failures are actionable and return a non-zero status.
- [ ] Documentation, known limitations and deferred work are updated.

## 16. Deferred decisions

The following decisions are intentionally deferred unless feature-parity
verification proves they are required:

- whether to support additional Markdown block or inline syntax;
- whether to support images, tables, raw HTML or nested lists;
- whether to add a public theme configuration format;
- whether to add syntax highlighting or mathematical typesetting;
- whether to add incremental builds or parallel rendering;
- whether to add a dedicated test framework;
- whether to add formal accessibility tooling or certification activity;
- whether to change the six-item index article limit.

Any deferred item requires a new scope decision and MUST NOT enter the v0.1.0
implementation through incidental cleanup.
