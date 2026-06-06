#!/usr/bin/env bun
import React from "react";
import { render } from "ink";
import { Command } from "commander";
import { InitScreen } from "./cli/screens/InitScreen";
import { JobIngestScreen } from "./cli/screens/JobIngestScreen";
import { ProfileImportScreen } from "./cli/screens/ProfileImportScreen";
import { ProfileLintScreen } from "./cli/screens/ProfileLintScreen";
import { ResumeDraftScreen } from "./cli/screens/ResumeDraftScreen";
import { ResumeRenderScreen } from "./cli/screens/ResumeRenderScreen";
import { ResumeReviewScreen } from "./cli/screens/ResumeReviewScreen";
import { initWorkspace } from "./tools/initWorkspace";
import { ingestJob } from "./tools/jobIngest";
import { importResumeSystemProfile } from "./tools/profileImport";
import { lintProfileWorkspace } from "./tools/profileLint";
import { draftResume } from "./tools/resumeDraft";
import { renderResume } from "./tools/resumeRender";
import { reviewResume } from "./tools/resumeReview";

type CommonOptions = {
  json?: boolean;
  interactive?: boolean;
  workspace?: string;
};

function shouldUseInk(options: CommonOptions): boolean {
  if (options.json) return false;
  if (options.interactive === false) return false;
  if (process.env.SAKAI_OUTPUT === "json") return false;
  if (process.env.SAKAI_INTERACTIVE === "0") return false;
  if (process.env.CI) return false;
  return Boolean(process.stdout.isTTY);
}

async function renderOrJson(element: React.ReactElement, payload: unknown, options: CommonOptions) {
  if (!shouldUseInk(options)) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const instance = render(element);
  await instance.waitUntilExit();
}

const program = new Command();

program
  .name("sakai")
  .description("Agent-agnostic personal job search system")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize a Sakai workspace")
  .option("-w, --workspace <path>", "workspace directory", "workspace")
  .option("--json", "print machine-readable JSON")
  .option("--no-interactive", "disable Ink output")
  .action(async (options: CommonOptions) => {
    const result = await initWorkspace({
      cwd: process.cwd(),
      workspacePath: options.workspace ?? "workspace",
    });

    await renderOrJson(<InitScreen result={result} />, result, options);
  });

const profile = program.command("profile").description("Profile utilities");

profile
  .command("import")
  .description("Import an existing profile into the Sakai workspace")
  .requiredOption("--from <source>", "source profile format: resume-system")
  .requiredOption("-f, --file <path>", "source profile JSON file")
  .option("-w, --workspace <path>", "workspace directory", "workspace")
  .option("--json", "print machine-readable JSON")
  .option("--no-interactive", "disable Ink output")
  .action(async (options: CommonOptions & { from: string; file: string }) => {
    if (options.from !== "resume-system") {
      throw new Error(`Unsupported profile import source: ${options.from}`);
    }

    const result = await importResumeSystemProfile({
      cwd: process.cwd(),
      workspacePath: options.workspace ?? "workspace",
      sourceFile: options.file,
    });

    await renderOrJson(<ProfileImportScreen result={result} />, result, options);
  });

profile
  .command("lint")
  .description("Validate workspace profile files")
  .option("-w, --workspace <path>", "workspace directory", "workspace")
  .option("--json", "print machine-readable JSON")
  .option("--no-interactive", "disable Ink output")
  .action(async (options: CommonOptions) => {
    const result = await lintProfileWorkspace({
      cwd: process.cwd(),
      workspacePath: options.workspace ?? "workspace",
    });

    await renderOrJson(<ProfileLintScreen result={result} />, result, options);

    if (!result.ok) {
      process.exitCode = 1;
    }
  });

const job = program.command("job").description("Job utilities");

job
  .command("ingest")
  .description("Ingest a saved job description into the workspace")
  .requiredOption("-f, --file <path>", "saved job description Markdown file")
  .option("-w, --workspace <path>", "workspace directory", "workspace")
  .option("--url <url>", "original job posting URL")
  .option("--json", "print machine-readable JSON")
  .option("--no-interactive", "disable Ink output")
  .action(async (options: CommonOptions & { file: string; url?: string }) => {
    const result = await ingestJob({
      cwd: process.cwd(),
      workspacePath: options.workspace ?? "workspace",
      sourceFile: options.file,
      sourceUrl: options.url,
    });

    await renderOrJson(<JobIngestScreen result={result} />, result, options);
  });

const resume = program.command("resume").description("Resume utilities");

resume
  .command("draft")
  .description("Draft a job-targeted resume Markdown file")
  .requiredOption("-j, --job <job-id>", "ingested job id")
  .option("-w, --workspace <path>", "workspace directory", "workspace")
  .option("--json", "print machine-readable JSON")
  .option("--no-interactive", "disable Ink output")
  .action(async (options: CommonOptions & { job: string }) => {
    const result = await draftResume({
      cwd: process.cwd(),
      workspacePath: options.workspace ?? "workspace",
      jobId: options.job,
    });

    await renderOrJson(<ResumeDraftScreen result={result} />, result, options);
  });

resume
  .command("render")
  .description("Render a reviewed resume draft")
  .requiredOption("-j, --job <job-id>", "ingested job id")
  .option("-f, --format <format>", "output format: docx", "docx")
  .option("-w, --workspace <path>", "workspace directory", "workspace")
  .option("--force", "render even when review is not ready")
  .option("--json", "print machine-readable JSON")
  .option("--no-interactive", "disable Ink output")
  .action(async (options: CommonOptions & { job: string; format: string; force?: boolean }) => {
    if (options.format !== "docx") {
      throw new Error(`Unsupported resume render format: ${options.format}`);
    }

    const result = await renderResume({
      cwd: process.cwd(),
      workspacePath: options.workspace ?? "workspace",
      jobId: options.job,
      format: "docx",
      force: options.force,
    });

    await renderOrJson(<ResumeRenderScreen result={result} />, result, options);
  });

const review = program.command("review").description("Review utilities");

review
  .command("resume")
  .description("Review a job-targeted resume draft")
  .requiredOption("-j, --job <job-id>", "ingested job id")
  .option("-w, --workspace <path>", "workspace directory", "workspace")
  .option("--json", "print machine-readable JSON")
  .option("--no-interactive", "disable Ink output")
  .action(async (options: CommonOptions & { job: string }) => {
    const result = await reviewResume({
      cwd: process.cwd(),
      workspacePath: options.workspace ?? "workspace",
      jobId: options.job,
    });

    await renderOrJson(<ResumeReviewScreen result={result} />, result, options);

    if (result.status === "blocked") {
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`sakai: ${message}`);
  process.exit(1);
});
