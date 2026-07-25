# bloatware v0.1.0 - Feasibility

## Preface

This document evaluates whether the v0.1.0 objectives described in the idea and
design documents can be completed within a deliberately limited scope. The
purpose of the feasibility study is not to design every implementation detail.
It is to identify viable options, expose risks early, define mitigations and
make explicit Go / No-Go decisions before implementation begins.

The central constraint is that v0.1.0 is a refactor, not a product expansion.
The result should preserve feature parity with the original or contemporary
site wherever that behavior is intentional. Existing content, routes, rendered
meaning and deployment expectations should remain usable unless a change is
required to make the system reliable, secure, typed, tested or maintainable.

The Markdown parser will remain custom code written entirely for this project.
No new external libraries or runtime or development dependencies will be added.
Existing platform capabilities, TypeScript, React, the current build tooling,
and handwritten tests are therefore the primary implementation options.


## Intended audience

This document is intended for:

- The project owner, who will make scope and Go / No-Go decisions.
- The implementer, who needs clear boundaries before rewriting code.
- Future maintainers, who need to understand why particular implementation
  choices were accepted or rejected.
- Reviewers of the v0.1.0 refactor, who need a practical basis for checking
  whether the stated objectives were achievable and achieved.


## How to read the following sections

Each feasibility query is an independent question about an objective, a known
technical-debt item or a cross-cutting constraint. Read the **options / opinions**
subsection to understand the alternatives and the selected direction.
Read **complexity / risk assessment** to understand what may prevent success,
and **mitigations** to see how the risk will be controlled. The final
**Go / No-Go decision** is the scope decision for v0.1.0, not a claim that the
work is already complete.

A **Go** means the work is feasible within this release when the stated limits
and mitigations are followed. It does not mean that every desirable future
improvement belongs in v0.1.0. A **No-Go** means that an option is outside the
release scope or is not sufficiently safe to adopt without a separate decision.


## Feasibility queries

### Can the existing site be refactored without adding features or dependencies?

**Feasibility query**

Can v0.1.0 replace the current implementation with modular, typed, tested and
documented code while preserving feature parity and adding no new external
libraries or dependencies?

**Options / opinions**

- **Option A - incremental refactor:** keep the current application boundary,
  replace one responsibility at a time and preserve working behavior after
  each step. This is the preferred option.
- **Option B - complete rewrite:** discard the current implementation and
  recreate all behavior from the documents and current output. This gives more
  freedom but makes parity difficult to prove.
- **Option C - feature expansion during refactor:** improve the product while
  rewriting it. This is explicitly rejected because it increases scope and
  makes regressions harder to identify.

The project can proceed with Option A. The implementation should treat the
current site and content as the behavioral baseline, while the design and
feature documents define what must remain true.

**Complexity / risk assessment**

The overall complexity is **medium**. The principal risks are accidental
behavior changes, incomplete understanding of the generated code and scope
expansion disguised as cleanup. A no-dependency constraint also means that
parsing, validation, testing helpers and security controls must be implemented
and maintained in-house.

**Mitigations**

- Record the contemporary behavior before changing implementation details.
- Separate refactor commits and decisions from intentional behavior changes.
- Define feature parity as routes, supported content constructs, rendering
  behavior and build output rather than as source-code similarity.
- Keep the existing toolchain unless a documented constraint makes it unusable.
- Add tests before or alongside changes, prioritizing externally observable
  behavior.
- Defer enhancements that do not directly support reliability or parity.

**Go / No-Go decision**

**Go**, provided that feature parity is the acceptance boundary and the
no-dependency rule is enforced throughout the release.

### Can the codebase become modular and typed?

**Feasibility query**

Can the responsibilities currently mixed across the website, parser, renderer,
content loading, templates and scripts be separated into understandable
modules with explicit TypeScript types?

**Options / opinions**

- **Option A - responsibility-based modules:** define small boundaries for
  content loading, Markdown parsing, Markdown rendering, page composition,
  path handling and build orchestration. This is preferred.
- **Option B - shared utility layer without boundaries:** move functions into a
  common utilities module. This may reduce file size but preserves coupling and
  is not sufficient.
- **Option C - introduce a new framework or architecture:** rejected because it
  adds migration cost, dependencies and feature-parity risk without being
  required by the objectives.

The existing TypeScript and React foundation is sufficient. Modularity should
be achieved through explicit data contracts and one-way dependencies, not by
introducing another abstraction framework.

**Complexity / risk assessment**

The complexity is **medium**. The main risks are designing abstractions before
understanding actual behavior, creating circular dependencies and using broad
or implicit types that merely hide uncertainty. A module split can also make
small changes appear larger than they are.

**Mitigations**

- Start with domain boundaries already visible in the repository structure.
- Define types for source documents, parsed nodes, rendered content, routes,
  and build results before connecting modules.
- Keep parsing independent from React and keep rendering independent from file
  system details.
- Prefer simple data structures and pure functions where practical.
- Use strict compiler checks and remove avoidable `any` values.
- Review dependency direction after each major extraction.

**Go / No-Go decision**

**Go**. The desired modularity and typing can be reached within the current
stack without adding dependencies.

### Can the custom Markdown parser be made reliable without an external library?

**Feasibility query**

Can the handwritten Markdown parser be refactored, documented and tested
without replacing it with an established parser package?

**Options / opinions**

- **Option A - retain and simplify the custom parser:** define the supported
  Markdown subset, parse it into typed intermediate nodes and improve the
  implementation incrementally. This is required by the project constraint
  and is preferred.
- **Option B - replace it with an external parser:** technically attractive in
  isolation, but rejected because no new dependencies may be added and the
  parser is part of the learning and ownership goal.
- **Option C - support full CommonMark or GitHub-Flavored Markdown:** rejected
  for v0.1.0. Feature parity does not require implementing every Markdown
  feature.

The feasible target is a clearly documented project-specific Markdown subset
that covers the constructs used by contemporary content. Unsupported syntax
must have defined behavior rather than silently producing misleading output.

**Complexity / risk assessment**

The complexity is **high relative to the rest of the refactor**. Parsing is
stateful and edge cases can change the meaning or structure of content. Risks
include malformed input, ambiguous block boundaries, unsafe inline content,
regressions in existing articles and an accidental expansion toward a full
Markdown specification.

**Mitigations**

- Inventory the Markdown constructs present in `content/` before redesigning
  the parser.
- Specify block and inline node types and parser invariants.
- Test normal, empty, nested, malformed and boundary inputs.
- Use fixture-based tests for representative existing articles.
- Keep parsing and rendering separate so parser failures are diagnosable.
- Reject or safely represent unsupported constructs; do not execute raw input.
- Treat full Markdown compliance as future scope unless parity demonstrates a
  concrete need.

**Go / No-Go decision**

**Go**, with the explicit limitation that v0.1.0 supports the documented
content subset rather than all Markdown. **No-Go** for full Markdown
compatibility or dependency replacement in this release.

### Can parsing and rendering be decoupled?

**Feasibility query**

Can the custom Markdown parser produce a stable intermediate representation
that is rendered without embedding parsing rules inside React components?

**Options / opinions**

- **Option A - typed intermediate representation:** parse source text into
  block and inline nodes, then pass those nodes to renderer components. This is
  preferred.
- **Option B - parser returns React elements:** rejected because it tightly
  couples parsing to the UI and makes unit testing and alternative output more
  difficult.
- **Option C - render directly from source lines:** rejected because it
  combines tokenization, structure and presentation in one path.

The intermediate representation does not need to be elaborate. It needs to be
explicit, serializable enough for tests and stable enough that a renderer can
be changed without rewriting parsing logic.

**Complexity / risk assessment**

The complexity is **medium to high**. The representation must preserve enough
information for current rendering, while avoiding UI-specific details. An
incorrect model can create duplicated logic or force parser changes whenever a
visual detail changes.

**Mitigations**

- Model semantic content rather than HTML or React implementation details.
- Keep source positions or useful error context where they aid diagnostics.
- Test parser output independently from rendered output.
- Add renderer tests for every supported node type.
- Document which layer owns validation, escaping and presentation decisions.

**Go / No-Go decision**

**Go**. Decoupling is achievable and directly reduces the identified parser and
renderer maintenance risks.

### Can the hardcoded website templates become extensible without changing features?

**Feasibility query**

Can the tightly coupled templates be replaced with an extensible content layout
while preserving current routes, page types, navigation and visual behavior?

**Options / opinions**

- **Option A - typed layout model and composable templates:** separate layout
  selection, shared layout, content rendering and page-specific composition.
  This is preferred.
- **Option B - configuration-driven theme system:** potentially useful later,
  but only a minimal internal configuration boundary should be considered in
  v0.1.0.
- **Option C - add a plugin or theme package system:** rejected as unnecessary
  feature work and incompatible with the no-new-dependency constraint.

Extensible means that a maintainer can change or add a layout through a known
internal contract. It does not require user-installable themes or a public
plugin API in this release.

**Complexity / risk assessment**

The complexity is **medium**. Template changes can cause subtle visual,
accessibility and route regressions. There is also a risk of replacing simple
coupling with an overly generic component system that is harder to understand.

**Mitigations**

- Preserve current page categories and route generation as the baseline.
- Define a small typed layout contract rather than a general-purpose plugin API.
- Keep content data separate from layout and styling decisions.
- Compare representative article and page output before and after the change.
- Make accessibility semantics part of layout acceptance criteria.
- Keep theme configuration internal and minimal; defer public extensibility.

**Go / No-Go decision**

**Go** for modular internal layouts with feature parity. **No-Go** for a
public theme or plugin ecosystem in v0.1.0.

### Can the missing parser and application test suite be added within scope?

**Feasibility query**

Can the project gain a practical unit, integration and build-validation test
suite without adding a testing library or allowing tests to become a separate
product feature?

**Options / opinions**

- **Option A - use the existing toolchain and available test capabilities:**
  test pure TypeScript functions directly and add focused integration checks
  around loading, routing, rendering and static build output. This is
  preferred.
- **Option B - add a dedicated external test framework:** rejected by the
  dependency constraint.
- **Option C - rely on manual browser checks:** insufficient for parser edge
  cases and repeatable regression detection.

The first test target should be the custom parser, followed by content loading,
route/layout selection and the static build. Tests should validate behavior,
not implementation internals.

**Complexity / risk assessment**

The complexity is **medium**. Risks include limited existing test infrastructure,
flaky checks tied to the filesystem or environment, incomplete fixtures and
false confidence from testing only happy paths. Without a full external test
framework, test ergonomics may be less convenient.

**Mitigations**

- Establish a small, repeatable test command using tools already present.
- Prioritize deterministic pure-function tests for parser and path logic.
- Use checked-in fixtures and temporary isolated output for integration tests.
- Include malformed input, empty content, duplicate paths and missing files.
- Add parity checks for representative contemporary content.
- Define a minimum acceptance bar instead of pursuing a misleading coverage
  percentage.

**Go / No-Go decision**

**Go** for a focused handwritten or existing-toolchain test suite. **No-Go**
for adding a new test framework or promising complete end-to-end coverage in
this release.

### Can the undocumented or AI-generated implementation become maintainable?

**Feasibility query**

Can code that was not fully authored or understood by the project owner be
replaced or rewritten so that its behavior, assumptions and extension points
are understandable to a maintainer?

**Options / opinions**

- **Option A - rewrite around documented contracts:** retain useful behavior,
  but do not preserve opaque implementation patterns merely because they exist.
  This is preferred.
- **Option B - annotate the existing implementation in place:** useful for
  short-term understanding but insufficient where coupling and hidden behavior
  are fundamental.
- **Option C - accept generated code as a permanent implementation detail:**
  rejected because it does not meet the reliability and ownership objective.

The standard for maintainability is not that every line is original. It is that
responsibilities, assumptions, failure behavior and tests are clear enough to
change safely.

**Complexity / risk assessment**

The complexity is **medium**. Rewriting unfamiliar code can discard edge-case
behavior, while preserving it can retain defects. Documentation can also become
stale if it describes implementation rather than observable contracts.

**Mitigations**

- Explain decisions and invariants at module boundaries.
- Prefer tests and examples as executable documentation where possible.
- Keep public interfaces small and name failure behavior explicitly.
- Review rewritten code against current site output and content fixtures.
- Document intentional limitations and unresolved questions.
- Update documentation as part of the same change as the behavior it describes.

**Go / No-Go decision**

**Go**, if maintainability is measured by understandable contracts and safe
changeability rather than by rewriting every line at once.

### Can the security baseline be implemented without changing product behavior?

**Feasibility query**

Can v0.1.0 address the security gaps identified in the design document while
keeping the site a static content website and preserving its current behavior?

**Options / opinions**

- **Option A - build-time and output-focused hardening:** validate paths,
  constrain content access, escape rendered content, avoid unsafe HTML and
  script injection, pin or audit existing dependencies and secure deployment
  configuration. This is preferred.
- **Option B - add a runtime security service:** rejected because the project
  does not require a server-side runtime and this would expand architecture and
  operational scope.
- **Option C - treat static output as automatically safe:** rejected. Build
  tools, source content, generated HTML, dependencies and deployment settings
  still form an attack surface.

The feasible security baseline is proportional to a static site: safe parsing
and rendering, controlled file discovery, predictable output, dependency and
workflow hygiene and documented limitations.

**Complexity / risk assessment**

The complexity is **medium**. The highest risks are path traversal during
content loading or builds, unsafe raw HTML or URL handling, supply-chain risk
in existing tooling and security assumptions that are not tested. A static
site reduces runtime exposure but does not eliminate build-pipeline exposure.

**Mitigations**

- Restrict reads and writes to approved content and output roots.
- Normalize and validate paths before filesystem access.
- Escape text and attribute values and define a strict policy for raw HTML.
- Validate links and media references according to supported schemes.
- Keep secrets out of source, generated assets and CI logs.
- Review existing dependencies and lockfile changes without adding packages.
- Harden CI permissions and deployment settings where the current platform
  supports it.
- Add security-focused tests for traversal, malformed input and injection
  attempts.

**Go / No-Go decision**

**Go** for a documented static-site security baseline using existing tools and
code. **No-Go** for claiming comprehensive security certification or adding a
new security platform as part of v0.1.0.

### Can compliance and accessibility improvements be addressed without scope creep?

**Feasibility query**

Can the project establish a practical compliance and accessibility baseline,
as suggested in the idea and design documents, without turning v0.1.0 into a
formal certification or feature-development effort?

**Options / opinions**

- **Option A - define personal benchmarks and verify them in templates and
  generated output:** preferred. This includes semantic structure, keyboard
  access, readable content, useful document titles and appropriate metadata.
- **Option B - pursue formal certification:** rejected as disproportionate to
  the project and unsupported by the current scope.
- **Option C - defer all compliance and accessibility work:** rejected because
  the shared layouts are the right place to prevent repeated defects.

The feasibility target is a documented baseline with repeatable checks, not a
claim of universal legal compliance. Accessibility requirements that affect
existing templates should be treated as reliability requirements, while new
user-facing capabilities remain out of scope.

**Complexity / risk assessment**

The complexity is **medium**. Accessibility is cross-cutting and visual
regressions can be missed by code-only review. Compliance expectations also
depend on jurisdiction and audience, so broad claims would be misleading.

**Mitigations**

- Define the applicable personal or project benchmarks before implementation.
- Review landmarks, heading order, link names, focus behavior, contrast and
  text alternatives in shared layouts.
- Test generated representative pages, not only isolated components.
- Document what was checked and what was not assessed.
- Avoid legal or certification claims unless independently verified.

**Go / No-Go decision**

**Go** for a documented accessibility and engineering-practice baseline.
**No-Go** for formal certification or a broad compliance program in v0.1.0.

### Is the project scope and delivery sequence feasible?

**Feasibility query**

Can the objectives, technical-debt work, tests, security baseline and
supporting documentation be completed as one controlled v0.1.0 lifecycle
without returning to perfectionist paralysis or uncontrolled expansion?

**Options / opinions**

- **Option A - fixed lifecycle with explicit gates:** complete feasibility,
  feature constraints, security, compliance, architecture, testing,
  documentation and maintenance decisions before or alongside implementation.
  This is preferred.
- **Option B - implement first and document afterward:** rejected because it
  recreates the uncertainty the lifecycle is intended to remove.
- **Option C - make every subsystem production-perfect:** rejected as
  incompatible with a good-enough, feature-parity refactor.

The release is feasible when each phase produces only the decision or artifact
needed to constrain the next phase. The implementation should be staged:
behavior inventory, contracts and parser tests, module refactor, layout
refactor, build/security hardening, parity verification and documentation.

**Complexity / risk assessment**

The complexity is **high at the programme level**, even though the website is
small. The main risks are perfectionism, scope drift, unclear acceptance
criteria and attempting too many rewrites simultaneously. Documentation,
testing, security and compliance can consume unlimited time if their release
boundaries are not explicit.

**Mitigations**

- Use the feature-parity boundary as the primary scope control.
- Maintain a list of explicitly deferred work, including full Markdown support,
  public theming, new dependencies and unrelated product features.
- Define acceptance criteria for each phase before implementation.
- Prefer vertical slices that leave the site buildable and reviewable.
- Stop when the agreed reliability baseline is met rather than when every
  possible improvement is complete.
- Record No-Go decisions so deferred ideas do not silently re-enter the work.

**Go / No-Go decision**

**Go**, with a staged implementation and explicit release boundaries. The
project is **No-Go** only if it requires new product features, new external
dependencies or a full Markdown implementation to be considered successful.

## Feasibility conclusion

The v0.1.0 refactor is feasible under the stated constraints. The strongest
condition is disciplined scope: retain the custom Markdown parser, add no new
dependencies, preserve contemporary behavior and improve reliability through
contracts, tests, modular boundaries, documentation and proportional security
and accessibility controls.

The largest technical risk is the custom Markdown parser. It should therefore
be treated as the first implementation risk to retire, not as a reason to
expand scope. The largest project risk is losing the refactor boundary by
adding features or pursuing completeness beyond feature parity.

The recommended overall decision is **Go** for v0.1.0, subject to the following
release constraints:

1. The current feature set and content behavior remain the compatibility
   baseline.
2. No new external libraries or dependencies are introduced.
3. The supported Markdown subset is documented and covered by tests.
4. Parser, renderer, templates, content loading and build logic have explicit
   boundaries.
5. Security, accessibility, testing and documentation claims remain
   proportional to what is actually verified.
6. Deferred work is recorded rather than implemented during the refactor.
