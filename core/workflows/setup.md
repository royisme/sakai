# Setup Workflow

Initialize a workspace, validate the profile files, and propose profile or evidence patches. Agents may suggest changes, but tools apply validated writes.

## Implemented MVP

```bash
sakai init
sakai profile import --from resume-system --file ../resume-system/data/profile.json
sakai profile lint
```

The import path converts the existing `resume-system` baseline into:

- `workspace/profile/profile.json`
- `workspace/profile/evidence.json`
- `workspace/profile/import-source.resume-system.json`

All imported real user data stays in the gitignored `workspace/` directory.
