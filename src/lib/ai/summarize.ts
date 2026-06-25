import Anthropic from '@anthropic-ai/sdk'
import { SummaryContent } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function summarizeMeeting(
  transcript: string,
  customFields: string[]
): Promise<SummaryContent> {
  const customFieldsText = customFields.length > 0
    ? `\n\nAlso extract these additional sections: ${customFields.join(', ')}`
    : ''

  const customShape = customFields.length > 0
    ? customFields.map(f => `"${f}": "summary text"`).join(', ')
    : ''

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are a meeting summarizer. Extract structured information from this meeting transcript.${customFieldsText}

Return ONLY valid JSON with this exact structure:
{
  "topics": ["topic 1", "topic 2"],
  "decisions": ["decision 1", "decision 2"],
  "action_items": [{"who": "name", "what": "task", "due": "date or null"}],
  "custom": {${customShape}}
}

Transcript:
${transcript}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude did not return valid JSON')

  const parsed = JSON.parse(jsonMatch[0])
  if (!Array.isArray(parsed.topics) || !Array.isArray(parsed.decisions) || !Array.isArray(parsed.action_items)) {
    throw new Error('Claude returned incomplete summary structure')
  }

  return parsed as SummaryContent
}
