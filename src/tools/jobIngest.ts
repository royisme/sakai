import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { jobSchema, type JobRecord } from "../lib/schemas";

export type JobIngestOptions = {
  cwd: string;
  workspacePath: string;
  sourceFile: string;
  sourceUrl?: string;
  capturedAt?: string;
};

export type JobIngestResult = {
  ok: boolean;
  workspace: string;
  jobId: string;
  jobPath: string;
  sourcePath: string;
  written: string[];
  job: JobRecord;
};

type ParsedMarkdown = {
  metadata: Record<string, string>;
  body: string;
};

function resolveWorkspace(cwd: string, workspacePath: string): string {
  return path.isAbsolute(workspacePath)
    ? workspacePath
    : path.resolve(cwd, workspacePath);
}

function parseFrontmatter(raw: string): ParsedMarkdown {
  if (!raw.startsWith("---\n")) {
    return { metadata: {}, body: raw.trim() };
  }

  const end = raw.indexOf("\n---", 4);
  if (end === -1) {
    return { metadata: {}, body: raw.trim() };
  }

  const frontmatter = raw.slice(4, end);
  const body = raw.slice(end + 4).trim();
  const metadata: Record<string, string> = {};

  for (const line of frontmatter.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) continue;

    const [, key, value] = match;
    metadata[key] = value.trim().replace(/^"(.*)"$/, "$1");
  }

  return { metadata, body };
}

function readLineValue(body: string, label: string): string | undefined {
  const pattern = new RegExp(`^${label}:\\s*(.+)$`, "im");
  return body.match(pattern)?.[1]?.trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractKeywords(description: string): string[] {
  const candidates = [
    "Node.js",
    "TypeScript",
    "Python",
    "Django",
    "React",
    "Next.js",
    "AWS",
    "software architecture",
    "unit testing",
    "Agile",
  ];
  const lowerDescription = description.toLowerCase();

  return candidates.filter((candidate) => lowerDescription.includes(candidate.toLowerCase()));
}

function buildJobRecord(options: {
  cwd: string;
  sourceFile: string;
  sourceUrl?: string;
  capturedAt?: string;
  parsed: ParsedMarkdown;
}): JobRecord {
  const metadata = options.parsed.metadata;
  const title = metadata.title ?? readLineValue(options.parsed.body, "Role") ?? "Untitled job";
  const company = metadata.company ?? "Unknown company";
  const externalId = metadata.source_job_id;
  const idParts = [company, title, externalId].filter(Boolean);
  const id = slugify(idParts.join(" "));
  const capturedAt = options.capturedAt ?? metadata.captured_at ?? new Date().toISOString();
  const sourceUrl = options.sourceUrl ?? metadata.source_url;

  return jobSchema.parse({
    version: "0.1",
    id,
    title,
    company,
    location: metadata.location ?? readLineValue(options.parsed.body, "Location") ?? "",
    employment_type: metadata.employment_type ?? readLineValue(options.parsed.body, "Structure"),
    compensation: metadata.compensation ?? readLineValue(options.parsed.body, "Rates"),
    source: {
      type: sourceUrl ? "url" : "file",
      platform: metadata.source_platform,
      external_id: externalId,
      url: sourceUrl,
      file: path.relative(options.cwd, options.sourceFile),
      captured_at: capturedAt,
    },
    description_text: options.parsed.body,
    keywords: extractKeywords(options.parsed.body),
    status: "ingested",
  });
}

export async function ingestJob(options: JobIngestOptions): Promise<JobIngestResult> {
  const workspace = resolveWorkspace(options.cwd, options.workspacePath);
  const sourceFile = path.isAbsolute(options.sourceFile)
    ? options.sourceFile
    : path.resolve(options.cwd, options.sourceFile);
  const raw = await readFile(sourceFile, "utf8");
  const parsed = parseFrontmatter(raw);
  const job = buildJobRecord({
    cwd: options.cwd,
    sourceFile,
    sourceUrl: options.sourceUrl,
    capturedAt: options.capturedAt,
    parsed,
  });
  const jobDirectory = path.join(workspace, "jobs", job.id);
  const jobPath = path.join(jobDirectory, "job.json");
  const sourcePath = path.join(jobDirectory, "source.md");

  await mkdir(jobDirectory, { recursive: true });
  await writeFile(jobPath, `${JSON.stringify(job, null, 2)}\n`, "utf8");
  await writeFile(sourcePath, `${parsed.body}\n`, "utf8");

  return {
    ok: true,
    workspace,
    jobId: job.id,
    jobPath,
    sourcePath,
    written: [path.relative(options.cwd, jobPath), path.relative(options.cwd, sourcePath)],
    job,
  };
}
