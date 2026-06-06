# Review Workflow

Review evidence integrity, job targeting, artifact quality, and consistency before an application can be marked ready.

## Implemented MVP

```bash
sakai review resume --job <job-id>
sakai review resume --job <job-id> --json
```

The deterministic resume review gate reads:

- `workspace/jobs/<job-id>/job.json`
- `workspace/profile/evidence.json`
- `workspace/outputs/<job-id>/resume.md`

It writes:

- `workspace/reports/<job-id>/resume-review.json`
- `workspace/reports/<job-id>/resume-review.md`

## Statuses

- `ready`: deterministic checks passed; artifact can move to rendering or human final review.
- `needs_revision`: no evidence-integrity blocker, but targeting, quality, or consistency needs work.
- `blocked`: the draft contains unsupported evidence, weak claims, or another error that must be fixed before rendering.

## Checks

- Evidence integrity: every evidence-backed claim bullet must exist in `evidence.json`, be `strong` or `transferable`, be allowed for `resume`, and have at least one source.
- Job targeting: ingested job keywords must appear before the review gaps section, not only inside a gap note.
- Overclaiming: claims marked `missing` or `needs_review` must not appear in the resume draft.
- Resume quality: required sections, basic length, placeholder wording, and AI-flavored phrases are checked.
- Consistency: the resume target line must match the ingested job title and company.

`blocked` review results should produce a non-zero CLI exit code. `ready` is not the same as submitted.
