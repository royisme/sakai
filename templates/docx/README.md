# DOCX Templates

Sakai's current DOCX renderer is implemented in `src/tools/resumeRender.ts`.

The renderer:

- reads `workspace/outputs/<job-id>/resume.md`
- requires `workspace/reports/<job-id>/resume-review.json` to be `ready` unless `--force` is passed
- writes `workspace/outputs/<job-id>/resume.docx`
- uses a restrained Aptos-based style adapted from the previous `resume-system` renderer

Future template packs can add additional DOCX layouts here.
