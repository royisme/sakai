# Draft Resume Workflow

Create resume Markdown from profile, preset, job, evaluation, and evidence data. The renderer turns Markdown into DOCX.

## Implemented MVP

```bash
sakai resume draft --job <job-id>
sakai resume draft --job <job-id> --json
```

The deterministic tool:

- reads `workspace/jobs/<job-id>/job.json`
- reads `workspace/profile/profile.json`
- reads `workspace/profile/evidence.json`
- writes `workspace/outputs/<job-id>/resume.md`
- includes matched profile skills for the target job
- includes only `strong` or `transferable` claims allowed for `resume`
- reports unmatched job keywords as review gaps

This is a reviewable Markdown draft, not a final submitted resume. DOCX and LaTeX rendering are template-pack work after the evidence gates stabilize.

## Rendering Gate

```bash
sakai review resume --job <job-id>
sakai resume render --job <job-id> --format docx
```

The implemented renderer only produces DOCX after `review resume` reports `ready`. Use `--force` only for explicit manual inspection of a draft that has not passed review.

LaTeX is still deferred to a template pack.
