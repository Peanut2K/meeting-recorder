'use client'
import { useState, useRef, useLayoutEffect } from 'react'
import { SummaryContent, ActionItem } from '@/types'
import { Button } from '@/components/ui/Button'

// Auto-growing textarea: height follows content so long sentences wrap and stay
// fully visible instead of overflowing a single-line input.
function AutoTextarea({ className = '', value, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return <textarea ref={ref} rows={1} value={value} className={`resize-none overflow-hidden ${className}`} {...props} />
}

interface SummaryEditorProps {
  content: SummaryContent
  customFields: string[]
  onSave: (content: SummaryContent) => Promise<void>
  readOnly?: boolean
}

export function SummaryEditor({ content: initial, customFields, onSave, readOnly = false }: SummaryEditorProps) {
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

  function removeActionItem(index: number) {
    setContent({ ...content, action_items: content.action_items.filter((_, i) => i !== index) })
  }

  async function handleSave() {
    setSaving(true)
    await onSave(content)
    setSaving(false)
  }

  const inputCls = 'w-full border border-line rounded-lg px-3 py-2 text-sm focus:border-brand outline-none read-only:bg-bg read-only:text-muted'
  // Borderless variant for single-field cards (Topics/Decisions) — the card is the frame.
  const bareCls = 'w-full bg-transparent text-sm outline-none read-only:text-muted'

  return (
    <div className="space-y-8">
      {readOnly && <p className="text-sm text-muted">Read-only — only the team head can edit this summary.</p>}

      {(['topics', 'decisions'] as const).map(key => (
        <section key={key}>
          <h2 className="text-lg font-semibold capitalize mb-3">{key}</h2>
          <div className="space-y-2.5">
            {content[key].map((item, i) => (
              <div key={i}
                className={`group relative flex items-start gap-2 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors duration-200
                  ${readOnly ? '' : 'hover:border-muted/40 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15'}`}>
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/50" aria-hidden />
                <AutoTextarea value={item} readOnly={readOnly} onChange={e => updateList(key, i, e.target.value)}
                  className={`${bareCls} leading-relaxed ${!readOnly ? 'pr-7' : ''}`} />
                {!readOnly && (
                  <button onClick={() => removeItem(key, i)} aria-label="Remove"
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg text-muted opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-500 focus:opacity-100 group-hover:opacity-100">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {!readOnly && <Button variant="secondary" className="mt-2 text-xs" onClick={() => addItem(key)}>+ Add</Button>}
        </section>
      ))}

      <section>
        <h2 className="text-lg font-semibold mb-3">Action Items</h2>
        <div className="space-y-3">
          {content.action_items.map((item, i) => (
            <div key={i} className="relative rounded-xl border border-line bg-surface p-3 space-y-2">
              {!readOnly && (
                <button onClick={() => removeActionItem(i)} aria-label="Remove action item"
                  className="absolute top-1.5 right-1.5 text-muted hover:text-red-500 text-lg leading-none px-1.5 rounded z-10">×</button>
              )}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${!readOnly ? 'pr-6' : ''}`}>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Who</label>
                  <AutoTextarea placeholder="Who" value={item.who} readOnly={readOnly} onChange={e => updateActionItem(i, 'who', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Due date</label>
                  <input placeholder="—" value={item.due || ''} readOnly={readOnly} onChange={e => updateActionItem(i, 'due', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">What</label>
                <AutoTextarea placeholder="What" value={item.what} readOnly={readOnly} onChange={e => updateActionItem(i, 'what', e.target.value)} className={inputCls} />
              </div>
            </div>
          ))}
        </div>
        {!readOnly && (
          <Button variant="secondary" className="mt-2 text-xs"
            onClick={() => setContent({ ...content, action_items: [...content.action_items, { who: '', what: '', due: null }] })}>
            + Add Action Item
          </Button>
        )}
      </section>

      {customFields.map(field => (
        <section key={field}>
          <h2 className="text-lg font-semibold mb-3">{field}</h2>
          <textarea value={content.custom?.[field] || ''} readOnly={readOnly}
            onChange={e => setContent({ ...content, custom: { ...content.custom, [field]: e.target.value } })}
            rows={3}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:border-brand outline-none resize-none read-only:bg-bg read-only:text-muted" />
        </section>
      ))}

      {!readOnly && <Button onClick={handleSave} loading={saving}>Save Changes</Button>}
    </div>
  )
}
