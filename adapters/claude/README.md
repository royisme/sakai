# Claude Adapter

Sakai's canonical agent skill lives at:

```text
.agents/skills/sakai-job-search/SKILL.md
```

Claude Code should load it through the repo symlink:

```text
.claude/skills -> ../.agents/skills
```

Do not create a separate Claude copy of the skill. If Claude needs a new durable
rule, add it to `AGENTS.md`, `core/workflows/`, or
`.agents/skills/sakai-job-search/SKILL.md` first.
