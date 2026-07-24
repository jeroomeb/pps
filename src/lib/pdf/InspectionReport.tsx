import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const GOLD = '#ee8a4b'
const GOLD_DARK = '#364750'
const CHARCOAL = '#191c1d'
const MUTED = '#5d5e61'
const BORDER = '#d0d5dd'
const PANEL = '#f4f6f8'

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 64,
    paddingHorizontal: 48,
    fontSize: 10.5,
    fontFamily: 'Helvetica',
    color: CHARCOAL,
    lineHeight: 1.5,
  },

  // Header band
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 42, height: 42 },
  company: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  reportKicker: { fontSize: 9, color: MUTED, letterSpacing: 1.5, textTransform: 'uppercase' },
  reportId: { fontSize: 9, color: MUTED, textAlign: 'right' },
  goldRule: { height: 3, backgroundColor: GOLD, marginBottom: 20 },

  // Meta panel
  metaBox: {
    marginBottom: 24,
    padding: 14,
    backgroundColor: PANEL,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: { width: '33.33%', marginBottom: 8, paddingRight: 10 },
  metaLabel: {
    fontSize: 7.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: MUTED,
    marginBottom: 2,
  },
  metaValue: { fontSize: 10.5, fontFamily: 'Helvetica-Bold' },

  // Section titles
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },
  sectionTitleCritical: { color: '#93000a' },
  category: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
    color: GOLD_DARK,
  },

  // Critical finding card
  failCard: {
    borderWidth: 1.5,
    borderColor: '#e3a5a0',
    backgroundColor: '#fdf3f2',
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
  },
  failHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  failName: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  failCategory: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  commentLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: MUTED,
    marginBottom: 2,
  },
  commentText: { fontSize: 10, marginBottom: 6 },

  // Standard item row — a light divider list rather than stacked boxes,
  // which reads much cleaner across a long checklist.
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 7,
    paddingHorizontal: 2,
  },
  categoryGroup: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingBottom: 2,
    marginBottom: 4,
  },
  itemBody: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 10.5, fontFamily: 'Helvetica-Bold' },
  itemComment: { fontSize: 9.5, color: '#3a3d3e', marginTop: 3 },

  // Status chips
  status: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPass: { backgroundColor: '#dcfce7', color: '#166534' },
  statusFail: { backgroundColor: '#ba1a1a', color: '#ffffff' },
  statusNa: { backgroundColor: '#e7e8e9', color: '#41454a' },

  photo: {
    width: 240,
    height: 180,
    marginTop: 8,
    borderRadius: 4,
    objectFit: 'cover',
  },
  photoSmall: {
    width: 180,
    height: 135,
    marginTop: 6,
    borderRadius: 4,
    objectFit: 'cover',
  },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: MUTED,
  },
})

type ReportItem = {
  service_category: string
  item_name: string
  description: string | null
  status: 'pass' | 'fail' | 'na' | null
  comment: string | null
  photoUrl: string | null
}

function statusChip(status: ReportItem['status']) {
  if (status === 'pass') return { style: styles.statusPass, label: 'PASS' }
  if (status === 'fail') return { style: styles.statusFail, label: 'FAIL' }
  return { style: styles.statusNa, label: 'N/A' }
}

export function InspectionReport({
  logoUrl,
  reportId,
  propertyName,
  propertyAddress,
  checklistName,
  inspectorName,
  completedAt,
  items,
}: {
  logoUrl: string
  reportId?: string
  propertyName: string
  propertyAddress: string
  checklistName: string
  inspectorName: string
  completedAt: string
  items: ReportItem[]
}) {
  const failures = items.filter((item) => item.status === 'fail')
  const rest = items.filter((item) => item.status !== 'fail')

  const grouped = new Map<string, ReportItem[]>()
  for (const item of rest) {
    if (!grouped.has(item.service_category)) grouped.set(item.service_category, [])
    grouped.get(item.service_category)!.push(item)
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Image src={logoUrl} style={styles.logo} />
            <View>
              <Text style={styles.company}>Amenity Op&apos;s</Text>
              <Text style={styles.reportKicker}>Operations, Asset and Logistics Report</Text>
            </View>
          </View>
          <View>
            {reportId ? <Text style={styles.reportId}>Report ID: #{reportId}</Text> : null}
            <Text style={styles.reportId}>{completedAt}</Text>
          </View>
        </View>
        <View style={styles.goldRule} fixed />

        <View style={styles.metaBox}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Property</Text>
            <Text style={styles.metaValue}>{propertyName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Address</Text>
            <Text style={styles.metaValue}>{propertyAddress}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Checklist</Text>
            <Text style={styles.metaValue}>{checklistName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Specialist</Text>
            <Text style={styles.metaValue}>{inspectorName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Completed</Text>
            <Text style={styles.metaValue}>{completedAt}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Result</Text>
            <Text style={styles.metaValue}>
              {failures.length
                ? `${failures.length} failure${failures.length === 1 ? '' : 's'}`
                : 'No failures'}
            </Text>
          </View>
        </View>

        {failures.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, styles.sectionTitleCritical]}>
              Failures ({failures.length})
            </Text>
            {failures.map((item, index) => (
              <View key={index} style={styles.failCard} wrap={false}>
                <View style={styles.failHeader}>
                  <Text style={styles.failName}>{item.item_name}</Text>
                  <Text style={[styles.status, styles.statusFail]}>FAIL</Text>
                </View>
                <Text style={styles.failCategory}>{item.service_category}</Text>
                <Text style={styles.commentLabel}>Specialist Comments</Text>
                <Text style={styles.commentText}>{item.comment?.trim() || '—'}</Text>
                {item.photoUrl && <Image src={item.photoUrl} style={styles.photo} />}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>
          {failures.length ? 'All Other Items' : 'Inspection Items'}
        </Text>
        {[...grouped.entries()].map(([category, categoryItems]) => (
          <View key={category} wrap>
            <Text style={styles.category}>{category}</Text>
            <View style={styles.categoryGroup}>
              {categoryItems.map((item, index) => {
                const chip = statusChip(item.status)
                const isLast = index === categoryItems.length - 1
                return (
                  <View
                    key={index}
                    style={[styles.itemRow, isLast ? { borderBottomWidth: 0 } : {}]}
                    wrap={false}
                  >
                    <View style={styles.itemBody}>
                      <Text style={styles.itemName}>{item.item_name}</Text>
                      {item.comment?.trim() ? (
                        <Text style={styles.itemComment}>Specialist comments: {item.comment}</Text>
                      ) : null}
                      {item.photoUrl && <Image src={item.photoUrl} style={styles.photoSmall} />}
                    </View>
                    <Text style={[styles.status, chip.style]}>{chip.label}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>
            Certified inspection report — Amenity Op&apos;s
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
