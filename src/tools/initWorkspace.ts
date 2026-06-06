import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type InitWorkspaceOptions = {
  cwd: string;
  workspacePath: string;
};

export type InitWorkspaceResult = {
  workspace: string;
  created: string[];
  existing: string[];
  updated: string[];
  nextSteps: string[];
};

const profileJson = {
  version: "0.1",
  identity: {
    name: "",
    headline: "",
    location: "",
    links: [],
  },
  summary: "",
  experience: [],
  projects: [],
  education: [],
  skills: [],
};

const preferencesJson = {
  target_roles: [],
  target_locations: [],
  remote: "unspecified",
  deal_breakers: [],
  notes: "",
};

const evidenceJson = {
  version: "0.1",
  claims: [],
};

const backendPreset = {
  id: "backend-engineer",
  label: "Backend Engineer",
  target_titles: ["Backend Engineer", "Senior Software Engineer"],
  preferred_claims: [],
  experience_refs: [],
  project_refs: [],
  skill_groups: [],
};

const aiAgentPreset = {
  id: "ai-agent-engineer",
  label: "AI Agent Engineer",
  target_titles: ["AI Engineer", "Senior Software Engineer - AI Agents"],
  preferred_claims: [],
  experience_refs: [],
  project_refs: [],
  skill_groups: [],
};

function resolveWorkspace(cwd: string, workspacePath: string): string {
  return path.isAbsolute(workspacePath)
    ? workspacePath
    : path.resolve(cwd, workspacePath);
}

function toRelative(cwd: string, filePath: string): string {
  return path.relative(cwd, filePath) || ".";
}

async function writeJsonIfMissing(
  cwd: string,
  filePath: string,
  value: unknown,
  result: InitWorkspaceResult
) {
  if (existsSync(filePath)) {
    result.existing.push(toRelative(cwd, filePath));
    return;
  }

  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  result.created.push(toRelative(cwd, filePath));
}

async function writeTextIfMissing(
  cwd: string,
  filePath: string,
  content: string,
  result: InitWorkspaceResult
) {
  if (existsSync(filePath)) {
    result.existing.push(toRelative(cwd, filePath));
    return;
  }

  await writeFile(filePath, content, "utf8");
  result.created.push(toRelative(cwd, filePath));
}

async function ensureGitignore(cwd: string, result: InitWorkspaceResult) {
  const gitignorePath = path.join(cwd, ".gitignore");
  const requiredRules = ["workspace/", "node_modules/", "dist/", ".DS_Store"];

  if (!existsSync(gitignorePath)) {
    await writeFile(gitignorePath, `${requiredRules.join("\n")}\n`, "utf8");
    result.created.push(".gitignore");
    return;
  }

  const current = await readFile(gitignorePath, "utf8");
  const currentRules = current
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const missingRules = requiredRules.filter((rule) => !currentRules.includes(rule));

  if (missingRules.length > 0) {
    const separator = current.endsWith("\n") || current.length === 0 ? "" : "\n";
    await writeFile(gitignorePath, `${current}${separator}${missingRules.join("\n")}\n`, "utf8");
    result.updated.push(".gitignore");
  } else {
    result.existing.push(".gitignore");
  }
}

export async function initWorkspace(options: InitWorkspaceOptions): Promise<InitWorkspaceResult> {
  const workspace = resolveWorkspace(options.cwd, options.workspacePath);
  const result: InitWorkspaceResult = {
    workspace,
    created: [],
    existing: [],
    updated: [],
    nextSteps: [
      "sakai profile lint",
      "Add real profile data or import from an existing resume-system profile.",
      "Use sakai job ingest once a job description is ready.",
      "Use sakai resume draft after the job has been ingested.",
    ],
  };

  const directories = [
    "profile",
    "presets",
    "jobs",
    "applications",
    "outputs",
    "reports",
  ];

  await mkdir(workspace, { recursive: true });
  for (const directory of directories) {
    await mkdir(path.join(workspace, directory), { recursive: true });
  }

  await writeJsonIfMissing(options.cwd, path.join(workspace, "profile", "profile.json"), profileJson, result);
  await writeJsonIfMissing(options.cwd, path.join(workspace, "profile", "preferences.json"), preferencesJson, result);
  await writeJsonIfMissing(options.cwd, path.join(workspace, "profile", "evidence.json"), evidenceJson, result);
  await writeTextIfMissing(
    options.cwd,
    path.join(workspace, "profile", "writing-style.md"),
    "# Writing Style\n\nAdd voice, tone, and phrases to avoid.\n",
    result
  );
  await writeTextIfMissing(
    options.cwd,
    path.join(workspace, "profile", "interview-stories.md"),
    "# Interview Stories\n\nAdd STAR story material grounded in real experience.\n",
    result
  );
  await writeJsonIfMissing(options.cwd, path.join(workspace, "presets", "backend-engineer.json"), backendPreset, result);
  await writeJsonIfMissing(options.cwd, path.join(workspace, "presets", "ai-agent-engineer.json"), aiAgentPreset, result);
  await writeJsonIfMissing(
    options.cwd,
    path.join(workspace, "sakai.config.json"),
    {
      workspace: "workspace",
      default_profile: "profile/profile.json",
      default_preferences: "profile/preferences.json",
      default_evidence: "profile/evidence.json",
      default_output_format: ["markdown", "docx"],
      interactive: "auto",
      adapters: {
        codex: true,
        claude: true,
      },
    },
    result
  );

  for (const directory of ["jobs", "applications", "outputs", "reports"]) {
    await writeTextIfMissing(options.cwd, path.join(workspace, directory, ".gitkeep"), "", result);
  }

  await ensureGitignore(options.cwd, result);

  return result;
}
