import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  logo: { width: 40, height: 40 },
  title: { fontSize: 18, fontWeight: 700 },
  subtitle: { fontSize: 10, color: '#4d4635' },
  metaBox: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#f3f4f5',
    borderRadius: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: { width: '50%', marginBottom: 4 },
  metaLabel: { fontSize: 8, textTransform: 'uppercase', color: '#4d4635' },
  metaValue: { fontSize: 10, fontWeight: 700 },
  category: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 6,
    color: '#554300',
  },
  item: {
    borderWidth: 1,
    borderColor: '#d0c5af',
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  itemName: { fontWeight: 700 },
  status: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusPass: { backgroundColor: '#d9f2df', color: '#0b3d1a' },
  statusFail: { backgroundColor: '#ffdad6', color: '#93000a' },
  statusNa: { backgroundColor: '#e2e2e5', color: '#5d5e61' },
  comment: { fontSize: 9, color: '#333', marginTop: 2 },
  photo: { width: 160, height: 120, marginTop: 6, borderRadius: 4 },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, fontSize: 8, color: '#7f7663' },
})

type ReportItem = {
  service_category: string
  item_name: string
  description: string | null
  status: 'pass' | 'fail' | 'na' | null
  comment: string | null
  photoUrl: string | null
}

export function InspectionReport({
  logoUrl,
  propertyName,
  propertyAddress,
  checklistName,
  inspectorName,
  completedAt,
  items,
}: {
  logoUrl: string
  propertyName: string
  propertyAddress: string
  checklistName: string
  inspectorName: string
  completedAt: string
  items: ReportItem[]
}) {
  const grouped = new Map<string, ReportItem[]>()
  for (const item of items) {
    if (!grouped.has(item.service_category)) grouped.set(item.service_category, [])
    grouped.get(item.service_category)!.push(item)
  }

  const statusStyle = (status: ReportItem['status']) =>
    status === 'pass' ? styles.statusPass : status === 'fail' ? styles.statusFail : styles.statusNa

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={logoUrl} style={styles.logo} />
          <View>
            <Text style={styles.title}>Property Preservation Solutions LLC</Text>
            <Text style={styles.subtitle}>Inspection Report</Text>
          </View>
        </View>

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
            <Text style={styles.metaLabel}>Inspector</Text>
            <Text style={styles.metaValue}>{inspectorName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Completed</Text>
            <Text style={styles.metaValue}>{completedAt}</Text>
          </View>
        </View>

        {[...grouped.entries()].map(([category, categoryItems]) => (
          <View key={category} wrap>
            <Text style={styles.category}>{category}</Text>
            {categoryItems.map((item, index) => (
              <View key={index} style={styles.item} wrap={false}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.item_name}</Text>
                  <Text style={[styles.status, statusStyle(item.status)]}>
                    {item.status ?? 'N/A'}
                  </Text>
                </View>
                {item.comment && <Text style={styles.comment}>{item.comment}</Text>}
                {item.status === 'fail' && item.photoUrl && (
                  <Image src={item.photoUrl} style={styles.photo} />
                )}
              </View>
            ))}
          </View>
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}
