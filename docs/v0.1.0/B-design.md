# bloatware v0.1.0 - Design

## Project Overview
The project bloatware initially began as an experiment. The core idea was to
force myself to get a "good-enough" site up and running without diving deep into
technicalities of software development. The legacy version (as of July 18, 2026)
was entirely written using Monkey Prompting - a term I use for code generated
using (so called) AI coding tools.

The primary objective of v0.1.0 is to move from "make it work" to "make it reliable".


## Engieering Workflow
To ensure this refactor does not descend into my usual cycle of perfectionist
paralysis, I am adopting a *fixed* project lifecycle.

1. **Idea**: Defining the vision of project
2. **Design**: Mapping the big picture and architectural intent
3. **Feasibility**: Validating (and limiting) the scope of project
4. **Features**: Gathering technical specifications and constraints
5. **Security**: Identifying potential vulnerabilities and hardening the build pipeline
6. **Compliance**: Personal standards, benchmarks and best practices
7. **Architecture**: *Everything above...*
8. **Testing**: "make it reliable"
9. **Documentation**: So that one year later I can understand what I write today
10. **Maintenance**: ...


## Technical Dept Assessment
Before (re)writing new code, I made a list of what I currently have.

| Codebase path                                      | Responsibility                                         |
| -------------------------------------------------- | ------------------------------------------------------ |
| `content/`                                         | Pages, articles and any other raw content              |
| `content/articles/[yyyy]/[mm]/[article-title].md`  | Posts organized by year and month.                     |
| `content/pages/[topic]/[subtopic]/[page-title].md` | Pages organized by topic and subtopic(s).              |
| `site/`                                            | Website, built using tsx                               |
| `site/modules/`                                    | Reusable code goes here                                |
| `site/modules/md/`                                 | Custom markdown parser and rendering logic             |
| `site/scripts/`                                    | Reusable scripts, currently only contains build script |
| `site/src/`                                        | vite, react, tsx, templates, ...                       |
| `.github/workflows/deploy.yml`                     | CI/CD pipeline                                         |

Limitations of current codebase were identified as follows:
- It was not entirely written by me.
- Custom markdown parser is buggy, hard to extend and I do not understand internal logic.
- Missing tests for custom markdown parser.
- Website template is tightly coupled and it is not easy to modify.
- Website theme is not extensible via external configuration files.
- Software Bill of Materials (SBoM) is missing.
- Security aspect was not taken into consideration for inital release.
- Missing proper documentation.
- Missing proper testing suite.


## Project Objectives
The objectives for v0.1.0 are as follows:

- Replace the current codebase with modular, typed, tested and documented code.
- Decouple the Markdown parsing and rendering logic.
- Replace hardcoded templates with an extensible content layout.
- Implement a security and compliance baseline.


## Project Deliverables
To materialize the workflow, I have mapped the lifecycle phases to specific
deliverable and artifacts. Each phase has a defined output that prevents the
project from drifting away from the initially planned scope.

| Phase         | Purpose                    | Document          | Deliverable Details                                                                                  |
| ------------- | -------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| Idea          | Vision                     | idea.md           | Problem statement                                                                                    |
| Design        | Workflow and Planning      | design.md         | Workflow, inventory, technical debt, milestones                                                      |
| Feasibility   | Viability                  | feasibility.md    | Constraint checklist, implementation options, complexity/risk assessment, mitigations, Go/No-Go      |
| Feature       | Requirements Specification | features.md       | Functional/non-functional requirements, user stories, API/schema definitions                         |
| Security      | Hardening                  | security.md       | Threat model, attack surface analysis, mitigation controls, dependency audit, SBoM                   |
| Compliance    | Benchmarking               | compliance.md     | Policy mapping, standard adherence, gap analysis, remediation plan                                   |
| Architecture  | Final Blueprint            | architecture.md   | System components, data flow, deployment strategy, infrastructure requirements                       |
| Testing       | Validation                 | testing.md        | Unit/integration/E2E strategy, test coverage, QA targets, acceptance criteria                        |
| Documentation | Knowledge                  | documentation.md  | System architecture guide, API reference, troubleshooting/runbook                                    |
| Maintenance   | Lifecycle                  | maintenance.md    | Versioning/release policy, SBoM update cadence, patch strategy, performance monitoring, future scope |
