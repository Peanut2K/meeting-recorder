// Standalone PDF renderer — run as its own node process so @react-pdf/renderer
// reconciles with plain node_modules React. Rendering inside Next fails with
// "Cannot read properties of null (reading 'props')" because Next's vendored
// React and the external react-pdf get two different React instances.
//
// Reads JSON { title, date, teamName, content } on stdin, writes the PDF to stdout.
import { join } from 'node:path'
import { createElement as h } from 'react'
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

const fontsDir = join(process.cwd(), 'src/lib/pdf/fonts')
Font.register({
  family: 'Sarabun',
  fonts: [
    { src: join(fontsDir, 'Sarabun-Regular.ttf') },
    { src: join(fontsDir, 'Sarabun-Bold.ttf'), fontWeight: 'bold' },
  ],
})

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, color: '#111', fontFamily: 'Sarabun' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  meta: { fontSize: 9, color: '#666', marginBottom: 24 },
  section: { marginBottom: 16 },
  heading: { fontSize: 13, fontWeight: 'bold', marginBottom: 6, borderBottom: '1 solid #eee', paddingBottom: 2 },
  item: { marginBottom: 3, paddingLeft: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 3 },
  cell: { flex: 1 },
  label: { fontWeight: 'bold', fontSize: 9, color: '#555' },
})

function MeetingPdf({ title, date, teamName, content }) {
  const topics = content.topics || []
  const decisions = content.decisions || []
  const actionItems = content.action_items || []
  const custom = content.custom || {}

  return h(Document, null,
    h(Page, { size: 'A4', style: styles.page },
      h(Text, { style: styles.title }, title),
      h(Text, { style: styles.meta }, `${teamName} · ${date}`),

      h(View, { style: styles.section },
        h(Text, { style: styles.heading }, 'Topics'),
        ...topics.map((t, i) => h(Text, { key: i, style: styles.item }, `• ${t}`)),
      ),
      h(View, { style: styles.section },
        h(Text, { style: styles.heading }, 'Decisions'),
        ...decisions.map((d, i) => h(Text, { key: i, style: styles.item }, `• ${d}`)),
      ),
      h(View, { style: styles.section },
        h(Text, { style: styles.heading }, 'Action Items'),
        ...actionItems.map((a, i) => h(View, { key: i, style: styles.row },
          h(View, { style: styles.cell }, h(Text, { style: styles.label }, 'WHO'), h(Text, null, a.who || '')),
          h(View, { style: [styles.cell, { flex: 2 }] }, h(Text, { style: styles.label }, 'WHAT'), h(Text, null, a.what || '')),
          h(View, { style: styles.cell }, h(Text, { style: styles.label }, 'DUE'), h(Text, null, a.due || '—')),
        )),
      ),
      ...Object.entries(custom).map(([key, value]) => h(View, { key, style: styles.section },
        h(Text, { style: styles.heading }, key),
        h(Text, { style: styles.item }, String(value ?? '')),
      )),
    ),
  )
}

async function main() {
  const chunks = []
  for await (const c of process.stdin) chunks.push(c)
  const props = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  const buffer = await renderToBuffer(h(MeetingPdf, props))
  process.stdout.write(buffer)
}

main().catch(e => { console.error(e?.message ?? e); process.exit(1) })
