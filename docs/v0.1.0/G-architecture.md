# bloatware v0.1.0 - System Architecture

## 1. Executive Summary

This document defines the system architecture for the bloatware v0.1.0
release. It synthesizes all vision, feasibility limits, feature specifications,
security rules and compliance baselines established in previous design
documents (A-idea through F-compliance) into a clean, modular, typed and
testable blueprint.

This architecture replaces un-typed, coupled patterns with a decoupled static
generator pipeline. It guarantees 100% feature parity while maintaining a
zero-dependency constraint and strict TypeScript safety.


## 2. Intended Audience

- Project owner and lead implementer.
- Software reviewers validating architectural compliance and feature parity.
- Future maintainers extending layout templates or parser syntax.


## 3. Scope & Design Philosophy

The architecture governs the static site build pipeline, custom Markdown
parser, content scanner, link resolution engine, React template layouts and
file generation system.

### Core Architectural Principles
- **Decoupled Responsibilities**: Parsing, content scanning, link transformation,
  UI rendering and file output are isolated into independent modules.
- **Strict TypeScript Boundaries**: All data passed between modules relies on
  discriminated union types with zero explicit or implicit `any` usage.
- **Zero New Dependencies**: The system relies strictly on standard Node.js APIs,
  TypeScript, React and Vite (referencing C-feasibility Section Feasibility
  queries: Can the existing site be refactored without adding features or
  dependencies?).
- **Static First & Page-Relative**: Output contains no mandatory runtime JS and
  all links are relative, allowing hosting on any static environment.


## 4. Document Cross-Reference & Traceability

This architecture directly materializes requirements from prior design phases:

| Architectural Component | Feature Spec | Security / Compliance Section |
| :--- | :--- | :--- |
| **Two-Pass Markdown Parser** | D-features Section 8.1 Feature F1 - custom Markdown parser | E-security Section 4 What is included, F-compliance Section 5.1 Markdown Parser Compliance |
| **Content & Metadata Engine** | D-features Section 8.1.4 Metadata schema, D-features Section 8.3.1 Content discovery | F-compliance Section 5.1 Markdown Parser Compliance |
| **Route Generation Mapper** | D-features Section 8.3.2 Directory-style routes, D-features Section 8.3.3 Static HTML rendering | F-compliance Section 5.2 Accessibility (a11y) Baseline |
| **Page-Relative Link Engine** | D-features Section 8.3.4 Link rewriting and path calculation | E-security Section 4 What is included, F-compliance Section 5.2 Accessibility (a11y) Baseline |
| **React AST Layout Renderer** | D-features Section 8.2 Feature F2 - modular website templates | F-compliance Section 5.2 Accessibility (a11y) Baseline |
| **Static Build Orchestrator** | D-features Section 8.3.3 Static HTML rendering, D-features Section 8.3.5 Structured logging and route manifest | E-security Section 4 What is included, F-compliance Section 5.4 Engineering & Safety Rules |


## 5. Core Architecture & Component Decomposition

The system is organized into a linear, unidirectional data pipeline:

```
[Markdown Source Files]
        |
        v
[1. Content Scanner & Metadata Engine]
        |
        v
[2. Two-Pass Custom Markdown Parser]
        |
        v
[3. Page-Relative Link Resolver]
        |
        v
[4. Decoupled React AST Layout Renderer]
        |
        v
[5. Static Build Orchestrator]
        |
        v
[dist/ HTML Output & Manifest]
```

### 5.1 Component 1: Handwritten Two-Pass Markdown Parser (F1)
- **Scope & Description**: Parses UTF-8 Markdown text into clean, typed AST
  nodes without importing React or filesystem APIs.
- **Input**: Raw UTF-8 Markdown document string.
- **Output**: `ParseResult` object containing `ast: BlockNode[]`, `metadata:
  DocumentMetadata` and `diagnostics: DiagnosticLog[]`.
- **Processing Rules**:
  - **Pass 1 (Block Tokenizer)**: Scans lines to build Block AST nodes
    (Heading levels H1 to H4, Paragraphs, Code Blocks, Math Blocks, Blockquotes,
    Unordered/Ordered Lists, Horizontal Rules, Metadata).
  - **Pass 2 (Inline Tokenizer)**: Scans text inside block children using a
    delimiter stack to build Inline AST nodes (Text, Bold, Italic, Inline Code,
    Inline Math, Links, Super/Subscript, Forced Breaks).
  - **Error Recovery Policy**: Unmatched delimiters fall back to plain text nodes.
    Unclosed code or math blocks automatically terminate at EOF with a logged
    warning. Raw HTML tags are escaped into text nodes (`&lt;` and `&gt;`),
    preventing script execution (referencing E-security Section 4 What is
    included).

### 5.2 Component 2: Content Discovery & Metadata Engine (F3.1, F1.4)
- **Scope & Description**: Discovers Markdown files in workspace directories,
  extracts trailing metadata and normalizes item records.
- **Input**: Workspace content directory root paths (`content/articles/`,
  `content/pages/`).
- **Output**: Array of normalized `ContentRecord` objects.
- **Processing Rules**:
  - **Scanner**: Recursively searches `content/articles/` and `content/pages/` for
    `.md` files, ignoring hidden files, scratch drafts and non-markdown assets.
  - **Metadata Extractor**: Inspects trailing list elements for `Author`,
    `Published` and `Conceived` fields. Converts long English or ISO dates into
    sortable `YYYY-MM-DD` strings. If `Published` is absent, falls back to the
    `YYYY/MM` parent directory timestamp.
  - **AST Cleanup**: Strips trailing metadata lists from body AST so metadata
    renders exclusively in dedicated template positions.

### 5.3 Component 3: Route Generation & Directory Mapper (F3.2, F3.3)
- **Scope & Description**: Maps relative source file paths to directory-style
  static URL routes and output file destinations.
- **Input**: `sourcePath` string under content root.
- **Output**: `route` string (e.g. `/articles/2026/03/refactor-plan/`) and
  `outputPath` string (e.g. `dist/articles/2026/03/refactor-plan/index.html`).
- **Processing Rules**:
  - **Directory Routes**: Maps source relative paths to directory-style URL
    routes ending in `/`, rendered to `index.html`:
    - `content/articles/2026/03/refactor-plan.md` -> `/articles/2026/03/refactor-plan/`
    - `content/pages/about/bio.md` -> `/pages/about/bio/`
  - **Top-Level Routes**: Generates `/` (Home), `/articles/` (Article Index) and
    `/pages/` (Page Hierarchy Index).
  - **Route Collision Guard**: Validates that no two source files resolve to the
    same route. A collision halts the build with a diagnostic error.

### 5.4 Component 4: Page-Relative Link Resolver (F3.4)
- **Scope & Description**: Resolves relative Markdown links and assets into
  page-relative static HTML paths.
- **Input**: AST `LinkInlineNode` target string, current `fromRoute` string,
  and `ContentRecord[]` registry.
- **Output**: Page-relative static href string (e.g. `../../01/intro/index.html`
  or `../../../styles.css`).
- **Processing Rules**:
  - **Link Categorization**: External URLs (`https://`, `mailto:`) and anchors
    (`#`) are passed through. Relative `.md` links are resolved against the
    current file's route.
  - **Relative Path Algorithm (`relativeRouteHref`)**: Splits `fromRoute` and
    `toRoute` into path segments, calculates common prefix length, computes `../`
    upward steps and appends remaining target segments and `index.html`.
  - **Asset Relative Algorithm (`relativeAssetHref`)**: Computes route depth D and
    prepends D levels of `../` to locate root assets (`styles.css`,
    `interaction.js`).
  - **Dead Link Guard**: Validates relative `.md` targets against known content
    records. Missing targets trigger a build warning log.

### 5.5 Component 5: Decoupled React AST Renderer & Layout System (F2.1, F2.2)
- **Scope & Description**: Renders pure AST nodes and metadata into static HTML5
  layout documents.
- **Input**: `BlockNode[]`, `InlineNode[]`, `DocumentMetadata` and
  `RouteDescriptor`.
- **Output**: HTML5 document markup string.
- **Processing Rules**:
  - **AstRenderer**: Pure React component mapping Block and Inline AST nodes to
    HTML elements (`<h1>` to `<h4>`, `<p>`, `<pre><code>`, `<blockquote>`,
    `<ul>`, `<ol>`, `<strong>`, `<em>`, `<a>`, `<sup>`, `<sub>`, `<br />`).
  - **Root Layout (`Layout.tsx`)**: Renders HTML5 shell (`<!doctype html>`,
    `<html lang="en">`, `<head>`, `<header>`, `<nav>`, `<main>`, `<footer>`).
  - **Template Layouts**:
    - `ArticleDetailTemplate`: Title, metadata panel, TOC sidebar, AST body.
    - `PageDetailTemplate`: Title, breadcrumbs, AST body, child page grid.
    - `IndexTemplate`: `readMe.md` intro AST + latest 6 articles grid.
    - `ArticlesTemplate` & `PagesTemplate`: Grouped index listing pages.

### 5.6 Component 6: Static Build Orchestrator (F3.3, F3.5)
- **Scope & Description**: Coordinates content discovery, link resolution,
  static HTML rendering, asset copying and manifest generation.
- **Input**: Workspace content directories, static assets (`styles.css`,
  `interaction.ts`), `readMe.md`.
- **Output**: Compiled `dist/` static website directory and
  `dist/route-manifest.json`.
- **Processing Rules**:
  1. Clean `dist/` directory.
  2. Copy `styles.css` and bundle `src/interaction.ts` to `dist/interaction.js`.
  3. Scan and parse all content files into normalized `ContentRecord` objects.
  4. Parse `readMe.md` for home page intro AST.
  5. Run `LinkResolver` across all ASTs to rewrite links to page-relative paths.
  6. Render static HTML for all routes via `ReactDOMServer.renderToStaticMarkup`.
  7. Write `dist/route-manifest.json` containing generation timestamp and routes.
  8. Output structured execution logs with page counts and build duration in ms.


## 6. TypeScript Data Contracts & Interfaces

To eliminate legacy un-typed patterns, all module interfaces use strict
discriminated unions:

```typescript
// --- AST Node Contracts ---
export type BlockNode =
  | HeadingBlockNode
  | ParagraphBlockNode
  | CodeBlockNode
  | MathBlockNode
  | BlockquoteBlockNode
  | ListBlockNode
  | HorizontalRuleBlockNode;

export interface HeadingBlockNode {
  kind: 'block-heading';
  level: 1 | 2 | 3 | 4;
  children: InlineNode[];
}

export interface ParagraphBlockNode {
  kind: 'block-paragraph';
  children: InlineNode[];
}

export interface CodeBlockNode {
  kind: 'block-code';
  language?: string;
  value: string;
}

export interface MathBlockNode {
  kind: 'block-math';
  value: string;
}

export interface BlockquoteBlockNode {
  kind: 'block-quote';
  children: BlockNode[];
}

export interface ListItemNode {
  kind: 'list-item';
  children: InlineNode[];
}

export interface ListBlockNode {
  kind: 'block-list';
  ordered: boolean;
  items: ListItemNode[];
}

export interface HorizontalRuleBlockNode {
  kind: 'block-hr';
}

export type InlineNode =
  | TextInlineNode
  | StrongInlineNode
  | EmphasisInlineNode
  | InlineCodeNode
  | InlineMathNode
  | LinkInlineNode
  | SuperScriptInlineNode
  | SubScriptInlineNode
  | ForcedBreakInlineNode;

export interface TextInlineNode {
  kind: 'inline-text';
  value: string;
}

export interface StrongInlineNode {
  kind: 'inline-strong';
  children: InlineNode[];
}

export interface EmphasisInlineNode {
  kind: 'inline-emphasis';
  children: InlineNode[];
}

export interface InlineCodeNode {
  kind: 'inline-code';
  value: string;
}

export interface InlineMathNode {
  kind: 'inline-math';
  value: string;
}

export interface LinkInlineNode {
  kind: 'inline-link';
  target: string;
  children: InlineNode[];
}

export interface SuperScriptInlineNode {
  kind: 'inline-super';
  children: InlineNode[];
}

export interface SubScriptInlineNode {
  kind: 'inline-sub';
  children: InlineNode[];
}

export interface ForcedBreakInlineNode {
  kind: 'inline-break';
}

// --- Content & Metadata Contracts ---
export type ContentKind = 'article' | 'page';

export interface DocumentMetadata {
  author?: string;
  published?: string;
  conceived?: string;
  sortDate?: string;
}

export interface ContentRecord {
  id: string;
  kind: ContentKind;
  sourcePath: string;
  slug: string;
  canonicalPath: string;
  route: string;
  outputPath: string;
  title: string;
  summary?: string;
  metadata: DocumentMetadata;
  ast: BlockNode[];
  children: ContentRecord[];
}

// --- Build Engine Contracts ---
export interface BuildManifest {
  generatedAt: string;
  totalArticles: number;
  totalPages: number;
  totalRoutes: number;
  executionMs: number;
  routes: string[];
}
```


## 7. Security & Compliance Enforcement

This architecture directly enforces security and compliance baselines:

- **Path Traversal Protection (E-security Section 4 What is included,
  F-compliance Section 5.4 Engineering & Safety Rules)**: All file reads and
  writes are validated using `path.relative()` to ensure they remain inside
  `content/`, `site/` and `dist/`.
- **HTML Escaping (F-compliance Section 5.1 Markdown Parser Compliance)**: Raw
  HTML tags in source Markdown are escaped into literal text nodes, preventing
  cross-site scripting.
- **Semantic HTML & Focus (F-compliance Section 5.2 Accessibility (a11y)
  Baseline)**: Templates emit `<main>`, `<article>`, `<header>`, `<nav>`, `<footer>`
  tags and rely on native browser `<a>` keyboard focus.
- **Zero-Dependency Rule (C-feasibility Section Feasibility queries: Can the
  existing site be refactored without adding features or dependencies?,
  F-compliance Section 5.4 Engineering & Safety Rules)**: No new npm packages
  are added to `package.json`.


## 8. Verification Strategy

The architecture will be validated in Phase 8 (Testing) through:
1. **Parser Unit Tests**: Testing two-pass parsing against normal, malformed,
   and edge-case Markdown inputs.
2. **Path & Link Resolution Tests**: Verifying `relativeRouteHref` outputs for
   shallow, deep and cross-directory routes.
3. **Build Integration Tests**: Running a clean static build and auditing
   `dist/` output files, `route-manifest.json` and build execution logs.
