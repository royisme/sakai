import React from "react";
import { Box, Text } from "ink";
import type { ResumeReviewResult } from "../../tools/resumeReview";

function statusColor(status: ResumeReviewResult["status"]): "green" | "yellow" | "red" {
  if (status === "ready") return "green";
  if (status === "needs_revision") return "yellow";
  return "red";
}

export function ResumeReviewScreen({ result }: { result: ResumeReviewResult }) {
  return (
    <Box flexDirection="column">
      <Text bold color={statusColor(result.status)}>
        Resume review: {result.status}
      </Text>
      <Text>Workspace: {result.workspace}</Text>
      <Text>Job: {result.jobId}</Text>
      <Text>Covered keywords: {result.metrics.coveredKeywords.length}</Text>
      <Text>Missing keywords: {result.metrics.missingKeywords.length}</Text>
      <Text>Issues: {result.issues.length}</Text>
      <Text>Report: {result.reportMarkdownPath}</Text>
    </Box>
  );
}
