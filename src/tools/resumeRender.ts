import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { jobSchema, profileSchema, type JobRecord, type Profile } from "../lib/schemas";
import { type ResumeReviewResult, type ResumeReviewStatus } from "./resumeReview";

export type ResumeRenderOptions = {
  cwd: string;
  workspacePath: string;
  jobId: string;
  format: "docx";
  force?: boolean;
};

export type ResumeRenderResult = {
  ok: boolean;
  workspace: string;
  jobId: string;
  format: "docx";
  reviewStatus: ResumeReviewStatus;
  outputPath: string;
  sourcePath: string;
};

type MarkdownSection = {
  heading: string;
  lines: string[];
};

const font = "Aptos";
const colorInk = "18181B";
const colorMuted = "52525B";
const colorRule = "D4D4D8";
const colorAccent = "0F766E";

function resolveWorkspace(cwd: string, workspacePath: string): string {
  return path.isAbsolute(workspacePath)
    ? workspacePath
    : path.resolve(cwd, workspacePath);
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as unknown;
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 180, after: 52 },
    border: {
      bottom: { color: colorRule, size: 6, style: BorderStyle.SINGLE, space: 3 },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 18,
        font,
        color: colorAccent,
        allCaps: true,
      }),
    ],
  });
}

function body(text: string, options: { bold?: boolean; italics?: boolean; color?: string; size?: number } = {}) {
  return new Paragraph({
    spacing: { before: 0, after: 42, line: 260 },
    children: [
      new TextRun({
        text,
        bold: options.bold ?? false,
        italics: options.italics ?? false,
        size: options.size ?? 18,
        font,
        color: options.color ?? colorInk,
      }),
    ],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 8, after: 8, line: 252 },
    indent: { left: 280, hanging: 160 },
    children: [
      new TextRun({ text: "•", size: 12, font, color: colorAccent }),
      new TextRun({ text: "  ", size: 18, font, color: colorInk }),
      new TextRun({ text, size: 18, font, color: colorInk }),
    ],
  });
}

function parseMarkdown(markdown: string): { title: string; subtitle?: string; sections: MarkdownSection[] } {
  const lines = markdown.split(/\r?\n/);
  const title = lines.find((line) => line.startsWith("# "))?.replace(/^#\s+/, "").trim() ?? "Resume";
  const titleIndex = lines.findIndex((line) => line.startsWith("# "));
  const afterTitle = titleIndex >= 0 ? lines.slice(titleIndex + 1) : lines;
  const subtitle = afterTitle.find((line) => line.trim().length > 0 && !line.startsWith("## "))?.trim();
  const sections: MarkdownSection[] = [];
  let current: MarkdownSection | undefined;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      current = { heading: line.replace(/^##\s+/, "").trim(), lines: [] };
      sections.push(current);
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  return { title, subtitle, sections };
}

function renderSection(section: MarkdownSection): Paragraph[] {
  const paragraphs = [sectionHeading(section.heading)];

  for (const rawLine of section.lines) {
    const line = rawLine.trim();
    if (line.length === 0) continue;

    if (line.startsWith("- ")) {
      paragraphs.push(bullet(line.slice(2)));
    } else {
      paragraphs.push(body(line));
    }
  }

  return paragraphs;
}

function header(profile: Profile, job: JobRecord): Paragraph[] {
  const contact = [profile.identity.location, ...profile.identity.links].filter(Boolean).join("  ·  ");

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 24 },
      children: [
        new TextRun({
          text: profile.identity.name || "Unnamed Candidate",
          bold: true,
          size: 36,
          font,
          color: colorInk,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 28 },
      children: [
        new TextRun({
          text: profile.identity.headline || job.title,
          size: 17,
          font,
          color: colorAccent,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 70 },
      children: [new TextRun({ text: contact, size: 16, font, color: colorMuted })],
    }),
  ];
}

function renderDocx(markdown: string, profile: Profile, job: JobRecord): Document {
  const parsed = parseMarkdown(markdown);
  const children = [
    ...header(profile, job),
    body(`Target: ${job.title} at ${job.company}`, { italics: true, color: colorMuted, size: 16 }),
    ...parsed.sections.flatMap(renderSection),
  ];

  if (children.length === 0) {
    children.push(body(parsed.title));
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 576,
              bottom: 576,
              left: 720,
              right: 720,
            },
          },
        },
        children,
      },
    ],
  });
}

function assertReadyForRender(review: ResumeReviewResult, force: boolean | undefined) {
  if (review.status === "ready" || force) return;
  throw new Error(`Resume review status is ${review.status}; rerun review or pass force to render anyway.`);
}

export async function renderResume(options: ResumeRenderOptions): Promise<ResumeRenderResult> {
  const workspace = resolveWorkspace(options.cwd, options.workspacePath);
  const resumePath = path.join(workspace, "outputs", options.jobId, "resume.md");
  const reviewPath = path.join(workspace, "reports", options.jobId, "resume-review.json");
  const profilePath = path.join(workspace, "profile", "profile.json");
  const jobPath = path.join(workspace, "jobs", options.jobId, "job.json");
  const outputPath = path.join(workspace, "outputs", options.jobId, "resume.docx");
  const review = (await readJsonFile(reviewPath)) as ResumeReviewResult;

  assertReadyForRender(review, options.force);

  const profile = profileSchema.parse(await readJsonFile(profilePath));
  const job = jobSchema.parse(await readJsonFile(jobPath));
  const markdown = await readFile(resumePath, "utf8");
  const document = renderDocx(markdown, profile, job);
  const buffer = await Packer.toBuffer(document);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buffer);

  return {
    ok: true,
    workspace,
    jobId: options.jobId,
    format: options.format,
    reviewStatus: review.status,
    outputPath,
    sourcePath: resumePath,
  };
}
