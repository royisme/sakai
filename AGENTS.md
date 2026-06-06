# Sakai Agent Contract

This file is the shared operating contract for every coding agent working in this repository. Agent-specific files such as `CLAUDE.md` must import or point back to this file instead of duplicating rules.

## Project Role

Sakai is an agent-agnostic personal job search system. It is not a generic resume generator, job scraper, auto-apply bot, or SaaS app.

The first runnable scope is:

- Bun CLI scaffold
- workspace initialization
- profile and evidence validation
- resume-system profile import
- baseline workflow protocol
- agent-readable workflows
- Codex, Claude, and generic adapter surfaces

## Source Of Truth

- `core/workflows/` defines the agent-readable workflow protocol.
- `core/contracts/` defines non-negotiable policies such as evidence and privacy rules.
- `schemas/` and `src/lib/schemas.ts` define machine-readable data contracts.
- `src/tools/` owns deterministic file writes, validation, and state changes.
- `adapters/` translate core workflows for specific agents. Adapters must not become the source of truth.
- `workspace.example/` contains safe demo data.
- `workspace/` contains real user data and must stay gitignored.

## Current Commands

```bash
bun install
bun test
bun run build
bun run lint
bun run dev --help
bun run dev init
bun run dev profile import --from resume-system --file ../resume-system/data/profile.json
bun run dev profile lint
bun run dev job ingest --file fixtures/jobs/recruitcrm-corgta-senior-fullstack-python.md
bun run dev resume draft --job corgta-senior-fullstack-python-developer-8331
bun run dev review resume --job corgta-senior-fullstack-python-developer-8331
bun run dev resume render --job corgta-senior-fullstack-python-developer-8331 --format docx
```

Use `--json` or `--no-interactive` for agent/script execution:

```bash
bun run dev profile import --from resume-system --file ../resume-system/data/profile.json --json
bun run dev profile lint --json
bun run dev job ingest --file fixtures/jobs/recruitcrm-corgta-senior-fullstack-python.md --json
bun run dev resume draft --job corgta-senior-fullstack-python-developer-8331 --json
bun run dev review resume --job corgta-senior-fullstack-python-developer-8331 --json
bun run dev resume render --job corgta-senior-fullstack-python-developer-8331 --format docx --json
bun run dev init --no-interactive
```

## Engineering Rules

- Keep the project single-package until the core protocol stabilizes.
- Use Bun as the runtime and package manager.
- Keep business logic out of Ink screens. Ink displays results; tools and libraries perform work.
- Prefer deterministic tools for schema validation, workspace writes, state transitions, evidence checks, and rendering.
- Agents may draft, evaluate, summarize, and propose patches, but tools must validate and write state.
- Do not add LLM provider SDKs or API key handling to the core CLI.
- Do not introduce a database, web UI, browser extension, job board crawler, or auto-apply flow for the MVP.

## Evidence And Privacy Rules

- Profile facts live in `workspace/profile/profile.json`.
- Claim strength and allowed usage live in `workspace/profile/evidence.json`.
- Imported real baseline snapshots live in `workspace/profile/import-source.resume-system.json`.
- Missing proof must not be written as completed experience.
- Generated resumes, cover letters, job records, and reports are user-owned workspace content.
- Never commit `workspace/`, secrets, real resumes, cover letters, job records, or private application reports.
- Browser or computer-use fallback may read a job page only after explicit user approval. It must not submit applications or fill forms automatically.

## Workflow Gates

- `apply` must require an existing evaluation unless the user explicitly forces the action.
- Job-specific application materials should derive from reviewed baseline material plus evaluation strategy.
- Weak or missing evidence must be surfaced before drafting.
- `review resume` must check evidence integrity, job targeting, overclaiming, artifact quality, and consistency before rendering.
- `resume render` must require `review resume` status `ready` unless the user explicitly uses `--force`.
- `ready` is not the same as `submitted`; final submission is always a human action.

## Verification

Sakai uses BDD-shaped acceptance tests for workflow behavior and focused unit tests for deterministic tools.

- `features/*.feature` describes product behavior in user-readable terms.
- `src/__bdd__/` contains executable behavior tests for implemented scenarios.
- `src/__tests__/` contains lower-level tool tests.
- Future workflow work should add or update a `.feature` scenario before implementation.

Before reporting runnable changes, run the narrowest relevant checks. For current CLI work, use:

```bash
bun test
bun run build
bun run lint
bun run dev profile lint --json
bun run dev review resume --job corgta-senior-fullstack-python-developer-8331 --json
```

Report any skipped checks explicitly.
