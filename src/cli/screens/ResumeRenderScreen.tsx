import React from "react";
import { Box, Text } from "ink";
import type { ResumeRenderResult } from "../../tools/resumeRender";

export function ResumeRenderScreen({ result }: { result: ResumeRenderResult }) {
  return (
    <Box flexDirection="column">
      <Text bold color="green">
        Resume rendered
      </Text>
      <Text>Workspace: {result.workspace}</Text>
      <Text>Job: {result.jobId}</Text>
      <Text>Format: {result.format}</Text>
      <Text>Review: {result.reviewStatus}</Text>
      <Text>Output: {result.outputPath}</Text>
    </Box>
  );
}
