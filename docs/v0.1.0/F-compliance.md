# bloatware v0.1.0 - Compliance

## Preface

This document defines the compliance baseline for the v0.1.0 refactor. Its
purpose is to establish clear quality, accessibility, and syntax safety
benchmarks that are proportional to a static content site, while avoiding
unnecessary enterprise overhead.


## Intended audience

- Project owner and implementer.
- Future maintainers and reviewers of the v0.1.0 refactor.


## Enterprise Compliance Context

In enterprise software development, compliance typically encompasses:

- **Regulatory & Security Standards**: SOC 2, ISO 27001, HIPAA, GDPR, and formal
  privacy policies.
- **Accessibility Governance**: Full WCAG 2.1 AA/AAA compliance, formal audits,
  VPAT documentation, and screen-reader verification.
- **Quality Gates & Governance**: Mandatory 80%+ test coverage metrics,
  SonarQube quality gates, and automated dependency/SBoM vulnerability scans.
- **Service Level Agreements**: Availability monitoring, performance budgets,
  and automated CI/CD compliance checks.


## Scope & Relevance for v0.1.0

Project bloatware is a static content website with no user accounts, no
database, no authentication, and no analytics or tracking scripts.

Full enterprise compliance frameworks are explicitly out of scope. For v0.1.0,
compliance is restricted to personal engineering standards that ensure rendered
correctness, basic accessibility, zero-dependency enforcement, and parser
safety.


## Compliance Baseline & Benchmarks

### 1. Markdown Parser Compliance
- **Supported Subset**: The custom parser strictly supports the documented
  syntax subset (H1 to H4 headings, paragraphs, fenced code, display math,
  blockquote, lists, bold, italic, super/subscript, links, forced breaks, and
  metadata).
- **Tag Safety**: Unsupported syntax and malformed input must degrade safely to
  text nodes with logged warnings; raw HTML input must be escaped and never
  executed.

### 2. Accessibility (a11y) Baseline
- **Semantic Landmarks**: Rendered pages must use semantic HTML5 elements
  (`<main>`, `<article>`, `<header>`, `<nav>`, `<footer>`).
- **Heading Order**: Heading levels must follow a sequential structure (H1
  through H4) without skipped levels.
- **Keyboard Focus**: Navigation relies on native browser anchor link (`<a>`)
  keyboard focus handling without custom JavaScript listeners.
- **Document Baseline**: Every generated page must include `lang="en"`, UTF-8
  character encoding, responsive viewport metadata, and a unique title.

### 3. Performance & Footprint Benchmark
- **Static First**: 0 KB mandatory client-side JavaScript runtime required to
  read content.
- **Self-Contained**: No external CDN scripts, remote stylesheets, or external
  font calls.
- **Build Efficiency**: Static page generation must compile rapidly and record
  build-time statistics in logs.

### 4. Engineering & Safety Rules
- **Zero New Dependencies**: No new external npm packages may be added to
  `package.json`.
- **Strict TypeScript**: Core interfaces and modules must compile under strict
  TypeScript settings without any type evasions.
- **Path Containment**: File I/O operations must be constrained strictly within
  `content/`, `site/`, and `dist/` workspace directories.


## Deferred Work

The following compliance items are explicitly deferred from v0.1.0:

- Formal WCAG 2.1 AA/AAA certification or third-party accessibility audits.
- Automated compliance or linting scanners integrated into CI pipelines.
- Formal legal documents (privacy policy, terms of service).
- Full CommonMark or GFM compliance testing suites.
