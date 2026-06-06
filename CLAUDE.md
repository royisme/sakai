# Claude Code Instructions

@AGENTS.md

Use the shared Sakai contract above as the source of truth. This file only adds Claude Code-specific routing notes.

Claude skills are loaded through `.claude/skills`, which is a symlink to the
canonical `.agents/skills` directory. Do not duplicate skill contents here.

## Claude-Specific Routing

- Start with `AGENTS.md`, then read only the directly relevant workflow or contract file.
- For setup work, read `core/workflows/setup.md` and use `bun run dev init` / `bun run dev profile lint`.
- For baseline work, read `core/workflows/baseline.md` and keep baseline outputs separate from job-specific applications.
- For evaluation work, read `core/workflows/evaluate.md` and `core/contracts/evidence-policy.md`.
- For application drafting, read `core/workflows/apply.md`, `core/workflows/draft-resume.md`, and `core/workflows/draft-cover-letter.md`.
- For review work, read `core/workflows/review.md` and check generated artifacts against `workspace/profile/evidence.json`.

## Claude-Specific Rules

- Do not duplicate or override the root `AGENTS.md` contract here.
- Do not write real user data into adapter files, command files, or skills.
- Use deterministic Sakai CLI commands for initialization and validation instead of hand-writing workspace files when possible.
- If a Claude command or skill needs a new rule, add the durable rule to `AGENTS.md` or `core/contracts/` first, then reference it here.
