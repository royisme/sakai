# Sakai

**Agent-agnostic personal job search system.**

Sakai turns your career evidence into evaluated applications, reviewable materials, and skill-growth feedback loops. It is designed for people who use coding agents such as Codex, Claude Code, or other file-aware assistants to run serious personal workflows.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Runtime: Bun](https://img.shields.io/badge/runtime-Bun-black.svg)](https://bun.sh)
[![Status](https://img.shields.io/badge/status-runnable%20scaffold-f59e0b.svg)]()

> Current status: runnable MVP scaffold. `init`, `profile import`, `profile lint`, `job ingest`, `resume draft`, `review resume`, and DOCX resume rendering work; evaluation, cover-letter drafting, tracking, and upskill workflows are next.

---

## What This Is

Sakai is a file-based job search workspace for agent-assisted candidates. It separates career facts, evidence, job records, generated materials, review reports, and skill-gap feedback into a system that agents can operate without turning your job search into a pile of prompts.

Most AI resume tools start by generating text. Sakai starts by asking whether a role is worth applying to, which claims are supported by evidence, and what needs to be reviewed before anything is ready to submit.

---

## Why Sakai

Personal job search work gets messy quickly:

- resumes and cover letters drift away from the source profile
- weak or missing proof gets overstated under pressure
- applications are forgotten after submission
- repeated skill gaps stay anecdotal instead of becoming a learning plan
- agent workflows become one-off conversations instead of reusable systems

Sakai treats the job search as a small operating system: structured data, agent-readable workflows, deterministic tools, and review gates.

---

## Core Loop

```text
setup -> ingest -> evaluate -> apply -> review -> track -> upskill
```

Sakai's first release focuses on six workflows:

| Workflow | Purpose |
| --- | --- |
| `setup` | initialize the workspace, validate profile data, and propose profile/evidence patches |
| `baseline` | build a reviewed reusable resume baseline before job-specific tailoring |
| `evaluate` | score a role before drafting and separate strong, transferable, and missing proof |
| `apply` | draft resume and cover letter artifacts from a job, preset, evaluation, and evidence registry |
| `review` | block overclaiming, weak targeting, generic writing, and cross-artifact inconsistencies |
| `upskill` | summarize recurring gaps from evaluations and application outcomes |

Sakai does not auto-submit applications. Human review stays in the loop.

---

## Project Shape

```text
sakai/
  .agents/skills/    canonical agent skills distributed with Sakai
  .claude/skills     symlink to .agents/skills for Claude Code
  .codex/skills      symlink to .agents/skills for Codex-style installs
  AGENTS.md          shared operating contract for coding agents
  CLAUDE.md          Claude Code adapter entrypoint; imports AGENTS.md
  core/
    workflows/        agent-readable workflow contracts
    contracts/        evidence, privacy, and verification policies
  schemas/            machine-readable data contracts
  fixtures/           stable public fixtures used by BDD tests
  features/           BDD acceptance scenarios
  src/                Bun CLI, validators, renderers, and deterministic tools
  adapters/
    codex/            Codex install and routing notes
    claude/           Claude install and routing notes
    generic/          Markdown workflows for other agents
  templates/
    markdown/         resume, cover letter, review, and report templates
    docx/             DOCX rendering templates
  workspace.example/  safe example workspace with fake data
```

Real user data lives in a gitignored `workspace/` directory, not in the framework itself.

---

## Workspace Model

```text
  workspace/
  profile/
    profile.json
    preferences.json
    evidence.json
    writing-style.md
    interview-stories.md
  presets/
    backend-engineer.json
    ai-agent-engineer.json
  jobs/
  applications/
  outputs/
  reports/
  baseline/
  sakai.config.json
```

The profile is the source of facts. The evidence registry controls what can be claimed. The baseline is the reviewed reusable resume layer. Applications and reports record what happened, what was reviewed, and what should improve next.

---

## Quick Start

Sakai targets Bun:

```bash
bun install
bun test
bun run dev --help
```

Initialize a local workspace:

```bash
bun run dev init
bun run dev profile import --from resume-system --file ../resume-system/data/profile.json
bun run dev profile lint
```

This creates a gitignored `workspace/` directory with profile, preferences, evidence, preset, job, application, output, and report folders. The import command converts the existing `resume-system` baseline into Sakai profile and evidence files inside `workspace/`.

Ingest the public RecruitCRM target JD fixture and draft a Markdown resume:

```bash
bun run dev job ingest --file fixtures/jobs/recruitcrm-corgta-senior-fullstack-python.md
bun run dev resume draft --job corgta-senior-fullstack-python-developer-8331
bun run dev review resume --job corgta-senior-fullstack-python-developer-8331
bun run dev resume render --job corgta-senior-fullstack-python-developer-8331 --format docx
```

Human terminals can use an Ink interface. Agent and script environments can use deterministic output:

```bash
bun run dev profile import --from resume-system --file ../resume-system/data/profile.json --json
bun run dev job ingest --file fixtures/jobs/recruitcrm-corgta-senior-fullstack-python.md --json
bun run dev resume draft --job corgta-senior-fullstack-python-developer-8331 --json
bun run dev review resume --job corgta-senior-fullstack-python-developer-8331 --json
bun run dev resume render --job corgta-senior-fullstack-python-developer-8331 --format docx --json
```

Planned command shape beyond the current scaffold:

```bash
sakai evaluate --job job_abc123
sakai apply --job job_abc123 --preset ai-agent-engineer
sakai track --application app_abc123 --status submitted
sakai upskill
```

---

## Evidence First

Sakai keeps a lightweight evidence registry:

```json
{
  "claims": [
    {
      "id": "claim_backend_distributed_systems",
      "claim": "Built and operated large-scale distributed backend systems",
      "strength": "strong",
      "sources": [{ "type": "experience", "ref": "exp_meili" }],
      "allowed_uses": ["resume", "cover_letter", "interview"]
    }
  ]
}
```

Generated materials are checked against this registry before they become ready. Missing proof can be discussed, but it cannot quietly become a strong claim.

---

## Agent Adapters

Sakai is not tied to one coding agent.

- Canonical skill: `.agents/skills/sakai-job-search/SKILL.md`
- Codex adapter: install and routing notes for using the canonical skill
- Claude adapter: `.claude/skills` symlink and Claude Code routing notes
- Generic adapter: Markdown workflows usable by other file-aware agents

The core protocol stays in `core/` and `schemas/`. Adapters translate the same system into each agent's format; they do not become the source of truth.

---

## Non-Goals

Sakai does not aim to be:

- an auto-apply bot
- a job board scraper
- a SaaS application
- a browser extension
- a generic resume generator
- a tool that promises offers, ATS success, or hiring outcomes

The goal is a trustworthy personal job search system: evaluate carefully, write from evidence, review before submission, and learn from repeated patterns.

---

## Current MVP

The current implementation supports this local workflow:

```text
profile import -> profile lint -> job ingest -> resume draft -> review resume -> resume render
```

Implemented:

- Bun CLI with Ink human output and `--json` machine output
- gitignored private workspace initialization
- import from an existing `resume-system/data/profile.json`
- profile, evidence, job, and resume review schemas
- deterministic job ingest from saved Markdown job descriptions
- Markdown resume drafting from profile, evidence, and job data
- resume review gate for evidence integrity, targeting, overclaiming, quality, and consistency
- DOCX resume rendering after a `ready` review
- BDD-shaped acceptance coverage for implemented workflow behavior
- Codex, Claude, and generic adapter surfaces

## Roadmap

Next work should deepen the application workflow:

- baseline builder and baseline review
- evaluation reports before application drafting
- application state machine
- cover-letter drafting and review
- tracking and upskill reports
- adapter drift checks against core workflows and contracts

LaTeX support is deferred to an optional template pack. Current rendering support is DOCX only.

---

## License

MIT. See [LICENSE](./LICENSE).
