# bloatware v0.1.0 - Testing Strategy

## Preface

I have big plans for testing. In an ideal world, I would write a comprehensive
testing suite with 100% code coverage, edge-case parser fixtures, and
automated static HTML diffing.

However, pursuing a perfect test suite right now is a trap. I have spent days
in the design phase, and starting a massive testing effort now will cause more
delays. 

To avoid perfectionist paralysis and actually ship v0.1.0, I am intentionally
taking technical debt here. This document records a minimal, pragmatic testing
baseline for this release, while deferring formal automated testing to v0.1.1
or later.


## Intended audience

- Me, trying to ship v0.1.0 before getting stuck in planning forever.
- Future me, who will eventually write the comprehensive test suite in v0.1.1.


## The v0.1.0 Testing Strategy: Build & Visual Smoke Testing

Instead of automated unit test runners, the release acceptance bar for v0.1.0
relies on simple visual and execution smoke checks:

1. **Clean Static Build Execution**:
   - The build script must run from start to finish without throwing uncaught
     exceptions or failing path assertions.
   - `dist/route-manifest.json` must be generated containing all expected
     routes.

2. **Visual Content & Layout Inspection**:
   - Generated pages under `dist/` must open cleanly in a browser.
   - Articles and pages must render with proper HTML formatting (headings, code
     blocks, blockquotes, and lists displayed correctly).
   - Theme styles (`styles.css`) and basic interaction scripts (`interaction.js`)
     must load without browser console errors.

3. **Basic Navigation Verification**:
   - Relative links between pages and index lists must navigate correctly without
     404 errors or broken relative paths.


## Deferred Testing Work (v0.1.1+)

The following test items are explicitly deferred to v0.1.1 or later releases:

- Comprehensive unit tests for Pass 1 (block) and Pass 2 (inline) parser logic.
- Automated test suites for `relativeRouteHref` and path calculation edge cases.
- Fixture-based HTML output regression tests for legacy articles.
- Code coverage tracking and automated test runner integration in CI.


## Summary

For bloatware v0.1.0, testing means: if the build script finishes, the pages
look properly formatted in the browser, and the links work, the refactor is a
success. Formal automated testing is a goal for v0.1.1.
