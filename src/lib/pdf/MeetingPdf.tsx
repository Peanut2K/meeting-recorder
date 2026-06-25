import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { SummaryContent } from '@/types'

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, color: '#111' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  meta: { fontSize: 9, color: '#666', marginBottom: 24 },
  section: { marginBottom: 16 },
  heading: { fontSize: 13, fontWeight: 'bold', marginBottom: 6, borderBottom: '1 solid #eee', paddingBottom: 2 },
  item: { marginBottom: 3, paddingLeft: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 3 },
  cell: { flex: 1 },
  label: { fontWeight: 'bold', fontSize: 9, color: '#555' },
})

interface MeetingPdfProps {
  title: string
  date: string
  teamName: string
  content: SummaryContent
}

export function MeetingPdf({ title, date, teamName, content }: MeetingPdfProps) {
  const topics = content.topics || []
  const decisions = content.decisions || []
  const actionItems = content.action_items || []
  const custom = content.custom || {}

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{teamName} · {date}</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>Topics</Text>
          {topics.map((t, i) => <Text key={i} style={styles.item}>• {t}</Text>)}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Decisions</Text>
          {decisions.map((d, i) => <Text key={i} style={styles.item}>• {d}</Text>)}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Action Items</Text>
          {actionItems.map((a, i) => (
            <View key={i} style={styles.row}>
              <View style={styles.cell}><Text style={styles.label}>WHO</Text><Text>{a.who}</Text></View>
              <View style={[styles.cell, { flex: 2 }]}><Text style={styles.label}>WHAT</Text><Text>{a.what}</Text></View>
              <View style={styles.cell}><Text style={styles.label}>DUE</Text><Text>{a.due || '—'}</Text></View>
            </View>
          ))}
        </View>

        {Object.entries(custom).map(([key, value]) => (
          <View key={key} style={styles.section}>
            <Text style={styles.heading}>{key}</Text>
            <Text style={styles.item}>{value}</Text>
          </View>
        ))}
      </Page>
    </Document>
  )
}
