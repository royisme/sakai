# Codex Adapter

Sakai's canonical agent skill lives at:

```text
.agents/skills/sakai-job-search/SKILL.md
```

For Codex-style environments, point the agent at that skill directory or use the
repo symlink:

```text
.codex/skills -> ../.agents/skills
```

Do not create a separate Codex copy of the skill. If the Sakai workflow changes,
update `.agents/skills/sakai-job-search/SKILL.md` and keep this adapter as a
routing note only.
