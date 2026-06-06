# Ingest Workflow

Capture a job description from a file, pasted text, public URL, or explicitly approved browser fallback. Save source text before evaluation.

## Implemented MVP

```bash
sakai job ingest --file ./job-description.md
sakai job ingest --file ./job-description.md --json
```

The deterministic tool:

- reads a saved Markdown job description
- parses optional frontmatter metadata
- writes `workspace/jobs/<job-id>/job.json`
- writes `workspace/jobs/<job-id>/source.md`
- preserves source URL, platform, external ID, captured time, title, company, location, compensation, and extracted keywords when available

Public URL and browser/computer-use capture remain fallback paths. Browser or computer-use must not submit an application or fill a form.
