'use client'
import { useState } from 'react'
import { SummaryContent, ActionItem } from '@/types'
import { Button } from '@/components/ui/Button'

interface SummaryEditorProps {
  content: SummaryContent
  customFields: string[]
  onSave: (content: SummaryContent) => Promise<void>
}

export function SummaryEditor({ content: initial, customFields, onSave }: SummaryEditorProps) {
  const [content, setContent] = useState<SummaryContent>({
    topics: initial.topics || [],
    decisions: initial.decisions || [],
    action_items: initial.action_items || [],
    custom: initial.custom || {},
  })
  const [saving, setSaving] = useState(false)

  function updateList(key: 'topics' | 'decisions', index: number, value: string) {
    const arr = [...content[key]]
    arr[index] = value
    setContent({ ...content, [key]: arr })
  }

  function addItem(key: 'topics' | 'decisions') {
    setContent({ ...content, [key]: [...content[key], ''] })
  }

  function removeItem(key: 'topics' | 'decisions', index: number) {
    setContent({ ...content, [key]: content[key].filter((_, i) => i !== index) })
  }

  function updateActionItem(index: number, field: keyof ActionItem, value: string) {
    const items = [...content.action_items]
    items[index] = { ...items[index], [field]: value || null }
    setContent({ ...content, action_items: items })
  }

  async function handleSave() {
    setSaving(true)
    await onSave(content)
    setSaving(false)
  }

  return (
    <div className="space-y-8">
      {(['topics', 'decisions'] as const).map(key => (
        <section key={key}>
          <h2 className="text-lg font-semibold capitalize mb-3">{key}</h2>
          <div className="space-y-2">
            {content[key].map((item, i) => (
              <div key={i} className="flex gap-2">
                <input value={item} onChange={e => updateList(key, i, e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:border-black outline-none" />
                <Button variant="secondary" className="text-xs px-2" onClick={() => removeItem(key, i)}>×</Button>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-2 text-xs" onClick={() => addItem(key)}>+ Add</Button>
        </section>
      ))}

      <section>
        <h2 className="text-lg font-semibold mb-3">Action Items</h2>
        <div className="space-y-3">
          {content.action_items.map((item, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <input placeholder="Who" value={item.who} onChange={e => updateActionItem(i, 'who', e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:border-black outline-none" />
              <input placeholder="What" value={item.what} onChange={e => updateActionItem(i, 'what', e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:border-black outline-none" />
              <input placeholder="Due date" value={item.due || ''} onChange={e => updateActionItem(i, 'due', e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:border-black outline-none" />
            </div>
          ))}
        </div>
        <Button variant="secondary" className="mt-2 text-xs"
          onClick={() => setContent({ ...content, action_items: [...content.action_items, { who: '', what: '', due: null }] })}>
          + Add Action Item
        </Button>
      </section>

      {customFields.map(field => (
        <section key={field}>
          <h2 className="text-lg font-semibold mb-3">{field}</h2>
          <textarea value={content.custom?.[field] || ''}
            onChange={e => setContent({ ...content, custom: { ...content.custom, [field]: e.target.value } })}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:border-black outline-none resize-none" />
        </section>
      ))}

      <Button onClick={handleSave} loading={saving}>Save Changes</Button>
    </div>
  )
}
