# bloatware v0.1.0 - Security

## Preface
This is not a technical document. The security chapter exists only because it is
mentioned in the project plan.

## Intended audience

- Me, the perfectionist.
- Future me.

## What this means for v0.1.0

- There will be no formal threat model.
- There will be no serious attack surface analysis.
- There will be no deep dependency audit beyond "do not add new packages".
- This release will not try to be certified, compliant or even vaguely
  enterprise-ready.

## What is included

The only thing this chapter will claim is a little hygiene around the existing
static build and content model. That is not security in the hard sense, but it
is something:

- Keep file reads and writes under the known `content/`, `site/` and `dist/` roots.
- Avoid raw HTML injection by not supporting raw HTML in Markdown.
- Keep runtime JS tiny and optional.
- Not to add a server, authentication or a deployment surface that I do
  not already understand.

Those are the sorts of basic constraints that make the site less silly, but they
are not a security strategy.

## What is deferred

Here is the list of actual security work I am deferring to the future:

- threat modeling
- attack surface analysis
- dependency and supply-chain auditing beyond existing locked packages
- vulnerability scanning
- secrets handling and secret storage policies
- CI/CD pipeline hardening
- secure deployment
- penetration testing
- incident response planning
- any legal/regulatory compliance claims

## Future scope and guardrails

When the security project starts, call it v0.2.0 or later, it should start with
the things I am choosing not to do now:

- Review the build and deployment pipeline as a security ecosystem.
- Audit the current dependencies and verify the lockfile.
- Define what "secure static site" means for project bloatware.
- Add tests and diagnostics for content path safety, link validation and
  parser boundaries.
- Decide whether the Markdown parser should reject unsupported constructs or
  only warn.
- Consider a new security document that is not written as a joke.
