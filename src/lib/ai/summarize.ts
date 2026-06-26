import Anthropic from '@anthropic-ai/sdk'
import { SummaryContent } from '@/types'
import { DEFAULT_SUMMARY_PROMPT, buildSummaryPrompt } from '@/lib/ai/prompt'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function summarizeMeeting(
  transcript: string,
  customFields: string[],
  instruction?: string | null
): Promise<SummaryContent> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      { role: 'user', content: buildSummaryPrompt(instruction?.trim() || DEFAULT_SUMMARY_PROMPT, customFields, transcript) },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  // Strip markdown code fences if present, then extract the JSON object
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude did not return valid JSON')

  const parsed = JSON.parse(jsonMatch[0])
  if (!Array.isArray(parsed.topics) || !Array.isArray(parsed.decisions) || !Array.isArray(parsed.action_items)) {
    throw new Error('Claude returned incomplete summary structure')
  }

  return parsed as SummaryContent
}
