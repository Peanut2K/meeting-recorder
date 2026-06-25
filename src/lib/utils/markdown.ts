import { SummaryContent } from '@/types'

export function summaryToMarkdown(title: string, date: string, teamName: string, content: SummaryContent): string {
  const lines: string[] = [
    `# ${title}`,
    `**Team:** ${teamName} | **Date:** ${date}`,
    '',
    '## Topics',
    ...content.topics.map(t => `- ${t}`),
    '',
    '## Decisions',
    ...content.decisions.map(d => `- ${d}`),
    '',
    '## Action Items',
    ...content.action_items.map(a => `- **${a.who}**: ${a.what}${a.due ? ` _(due: ${a.due})_` : ''}`),
  ]

  for (const [key, value] of Object.entries(content.custom || {})) {
    lines.push('', `## ${key}`, value)
  }

  return lines.join('\n')
}
