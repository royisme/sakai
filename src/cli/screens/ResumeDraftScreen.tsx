import React from "react";
import { Box, Text } from "ink";
import type { ResumeDraftResult } from "../../tools/resumeDraft";

export function ResumeDraftScreen({ result }: { result: ResumeDraftResult }) {
  return (
    <Box flexDirection="column">
      <Text bold color="green">
        Resume draft written
      </Text>
      <Text>Workspace: {result.workspace}</Text>
      <Text>Job: {result.jobId}</Text>
      <Text>Output: {result.outputPath}</Text>
      <Text>Matched keywords: {result.matchedKeywords.length}</Text>
      <Text>Review gaps: {result.missingKeywords.length}</Text>
    </Box>
  );
}
