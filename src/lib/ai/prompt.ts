// Shared between the server-side summarizer and the settings UI (no SDK import here,
// so it's safe to pull into the client bundle).

export const DEFAULT_SUMMARY_PROMPT =
  'You are a meeting summarizer. Extract structured information from this meeting transcript. Be concise and faithful to what was actually said. Reply in the same language as the transcript.'

// The JSON skeleton stays fixed so the output always parses; the head edits the
// instruction (tone / what to extract) and the custom fields (extra sections).
// ponytail: fixed skeleton is the ceiling — fully free-form output would mean
// reworking SummaryContent, the editor, and the PDF too.
export function buildSummaryPrompt(instruction: string, customFields: string[], transcript: string): string {
  const customFieldsText = customFields.length > 0
    ? `\n\nAlso extract these additional sections: ${customFields.join(', ')}`
    : ''
  const customShape = customFields.length > 0
    ? customFields.map(f => `"${f}": "summary text"`).join(', ')
    : ''

  return `${instruction.trim()}${customFieldsText}

Return ONLY valid JSON with this exact structure:
{
  "topics": ["topic 1", "topic 2"],
  "decisions": ["decision 1", "decision 2"],
  "action_items": [{"who": "name", "what": "task", "due": "date or null"}],
  "custom": {${customShape}}
}

Transcript:
${transcript}`
}
