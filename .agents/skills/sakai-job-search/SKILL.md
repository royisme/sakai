---
name: sakai-job-search
version: 0.1.0
description: >
  Use this skill when the user wants an AI coding agent to operate Sakai, a
  file-based personal job search system. Trigger for Sakai setup, profile
  import or linting, job description ingest, resume drafting, resume review,
  DOCX rendering, evidence checks, job application workflow support, or when
  the user asks how Claude, Codex, or another file-aware agent should use the
  Sakai CLI and workspace.
context: fork
allowed-tools: >
  Read, Glob, Grep, Edit, Write,
  Bash(bun install), Bash(bun test), Bash(bun run build), Bash(bun run lint),
  Bash(bun run dev *), Bash(git status --short --branch -uall)
---

# Sakai Job Search Skill

Sakai is an agent-agnostic personal job search system. It is not an auto-apply
bot, job scraper, SaaS app, or generic resume generator. Use the deterministic
CLI for workspace writes and validation; use the agent for judgment, drafting
strategy, review explanations, and safe orchestration.

## Read Order

Read only what is needed for the user request:

1. `AGENTS.md` for the repository contract, current commands, and safety rules.
2. The relevant workflow under `core/workflows/`.
3. `core/contracts/evidence-policy.md` before drafting or reviewing claims.
4. The relevant schema in `schemas/` or `src/lib/schemas.ts` only when changing
   data shape or debugging validation.

Do not treat this skill as the source of truth. The core protocol lives in
`AGENTS.md`, `core/`, `schemas/`, and the CLI implementation.

## Current Runnable Loop

The implemented MVP supports:

```text
profile import -> profile lint -> job ingest -> resume draft -> review resume -> resume render
```

Use JSON output for agent execution:

```bash
bun run dev init --no-interactive --json
bun run dev profile import --from resume-system --file ../resume-system/data/profile.json --json
bun run dev profile lint --json
bun run dev job ingest --file <saved-job.md> --json
bun run dev resume draft --job <job-id> --json
bun run dev review resume --job <job-id> --json
bun run dev resume render --job <job-id> --format docx --json
```

## Workflow: Initialize Or Validate A Workspace

1. Run `git status --short --branch -uall` and avoid touching unrelated files.
2. Run `bun install` if dependencies are missing.
3. Run `bun run dev init --no-interactive --json`.
4. If the user has an existing resume-system profile, import it:

   ```bash
   bun run dev profile import --from resume-system --file ../resume-system/data/profile.json --json
   ```

5. Run `bun run dev profile lint --json`.
6. Report profile/evidence gaps without inventing missing claims.

## Workflow: Ingest A Job And Draft A Resume

1. If the job posting is pasted text, save it under the gitignored workspace,
   for example `workspace/inbox/<company-role>.md`.
2. If the job posting is a URL, fetch it only when the user explicitly asked you
   to fetch it or approved browser/web access. Never submit forms or fill
   application fields.
3. Ingest the saved Markdown:

   ```bash
   bun run dev job ingest --file workspace/inbox/<company-role>.md --json
   ```

4. Read the returned `jobId`, then draft:

   ```bash
   bun run dev resume draft --job <job-id> --json
   ```

5. Review before rendering:

   ```bash
   bun run dev review resume --job <job-id> --json
   ```

6. Render DOCX only when review status is `ready`:

   ```bash
   bun run dev resume render --job <job-id> --format docx --json
   ```

If review returns `needs_revision` or `blocked`, explain the blockers and fix
the source profile, evidence, job record, or draft before rendering. Use
`--force` only when the user explicitly wants a non-ready artifact for manual
inspection.

## Evidence And Privacy Rules

- Real user data lives in `workspace/`, which must remain gitignored.
- Do not commit real resumes, cover letters, profile data, job records, reports,
  or private application outputs.
- Every strong resume claim must be supported by `workspace/profile/evidence.json`.
- Claims marked `missing` or `needs_review` must not become completed experience.
- The human submits applications. Sakai can prepare and review local artifacts,
  but it must not auto-submit.

## Output Shape

When reporting results, include:

- commands run
- files written under `workspace/`
- review status: `ready`, `needs_revision`, or `blocked`
- evidence gaps or unsupported claims
- next human action

Keep explanations factual and short. Prefer CLI evidence over assumptions.
