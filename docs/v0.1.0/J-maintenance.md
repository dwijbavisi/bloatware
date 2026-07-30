# bloatware v0.1.0 - Maintenance

## Preface

This document outlines the maintenance policy and future roadmap for project
bloatware following the v0.1.0 release.

As a personal hobby project built for fun, there is no strict corporate release
schedule or SLA. Maintenance for v0.1.0 focuses on keeping code reliable, while
formally recording technical debt and deferred ideas for future releases as
personal learning progresses.


## Intended audience

- Project owner and maintainer.
- Future contributors and reviewers.


## Release Cadence & Workflow

- **Hobbyist Cadence**: There is no fixed release calendar. Updates are published
  ad-hoc whenever new requirements arise or personal interest inspires work.
- **Semantic Versioning**:
  - `v0.1.0`: The baseline reliability refactor (modular TypeScript architecture,
    two-pass Markdown parser, page-relative link engine, static generator).
  - `v0.1.x`: Small patch releases for parser edge cases, path fixes or CSS
    tweaks.
  - `v0.2.0+`: Future minor releases introducing new features as learning
    milestones are reached.


## Consolidated Deferred Scope Inventory

A review of prior design documents (A-idea through I-documentation) identifies
all scope items deferred from v0.1.0:

### 1. Testing & Quality (from H-testing)
- Automated unit test suites for Pass 1 (block) and Pass 2 (inline) parser logic.
- Automated path resolution unit tests (`relativeRouteHref`).
- Fixture-based static HTML regression diffing.

### 2. Security & Compliance (from E-security and F-compliance)
- Post-architecture Security & Compliance Audit Report (auditing code after build).
- Formal security threat modeling and attack surface analysis.
- Supply-chain Software Bill of Materials (SBoM) and dependency vulnerability
  audits.
- Formal WCAG accessibility audits and automated compliance scanning tools.

### 3. Documentation & Governance (from I-documentation)
- Standardized documentation layout system for design docs.
- Stakeholder-specific guides (separate manuals for developers, maintainers,
  authors and site viewers).
- Full API reference documentation for internal TypeScript modules.

### 4. Design & User Experience Gaps
- Formal User Experience (UX) research and layout wireframes.
- Extensible User Interface (UI) component design system and external theme files.
- Extended Markdown syntax support (tables, task lists and footnotes).


## Technical Debt & Post-Architecture Audit Needs

During the v0.1.0 lifecycle, security and testing were planned as design
phases, but full automated testing and deep security audits were deferred due to
timeline constraints.

This leaves intentional technical debt. To address this safely in future releases,
a new dedicated **Security & Compliance Audit Phase** will be added to v0.2.0 or
later to audit the written code after implementation completes.


## Future Maintenance & Open-Source Roadmap

Future releases will evolve maintenance from ad-hoc fixes to a structured
project model:

1. **Open-Source Contribution Guidelines**: Defining contribution standards,
   repository interaction rules and issue templates.
2. **SEO & Metadata Capabilities**: Adding Open-Graph meta tags, XML sitemap
   generation and automated SEO audit reporting.
3. **Research-Driven Upgrades**: Tackling security, compliance and UI design
   as personal learning and research progress.
