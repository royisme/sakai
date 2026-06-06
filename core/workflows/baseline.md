# Baseline Workflow

Build a reusable resume baseline before job-specific applications.

The baseline is not a job application. It is the reviewed canonical resume material that later workflows can cut, reorder, and tailor.

## Inputs

- `workspace/profile/profile.json`
- `workspace/profile/preferences.json`
- `workspace/profile/evidence.json`
- optional `workspace/profile/import-source.resume-system.json`
- `workspace/profile/writing-style.md`
- `workspace/profile/interview-stories.md`

## Outputs

- `workspace/baseline/resume-baseline.json`
- `workspace/baseline/resume-baseline.md`
- `workspace/baseline/baseline-review.md`

## Rules

- The baseline must use only claims allowed by `evidence.json`.
- Imported resume-system highlights may seed evidence claims, but review still decides whether they are reusable baseline material.
- The baseline should include canonical experience order, reusable bullets, skills groups, projects, education, and cautious claims.
- The baseline should identify weak, missing, or risky claims before `apply` uses them.
- A job-specific resume should be derived from baseline material, not invented from scratch.
