# Render Workflow

Render reviewed application artifacts into final local files.

## Implemented MVP

```bash
sakai resume render --job <job-id> --format docx
sakai resume render --job <job-id> --format docx --json
```

The DOCX renderer reads:

- `workspace/outputs/<job-id>/resume.md`
- `workspace/reports/<job-id>/resume-review.json`
- `workspace/profile/profile.json`
- `workspace/jobs/<job-id>/job.json`

It writes:

- `workspace/outputs/<job-id>/resume.docx`

Rendering is blocked unless `resume-review.json` has status `ready`. The user can pass `--force` for manual inspection, but forced renders should not be treated as application-ready.

LaTeX is intentionally deferred to a separate template pack.
