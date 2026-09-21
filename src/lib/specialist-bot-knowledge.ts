/**
 * Specialist Assistant Knowledge Base & Query Resolution Engine
 * Provides instant on-site SOP guidance, rules, troubleshooting, and platform help
 * for Operational Continuity Specialists (OCS / Field Inspectors).
 */

export interface KnowledgeTopic {
  id: string
  title: string
  shortLabel: string
  keywords: string[]
  summary: string
  response: string
}

export const SPECIALIST_KNOWLEDGE_BASE: KnowledgeTopic[] = [
  {
    id: 'photo_rules',
    title: 'Photo Evidence Requirements',
    shortLabel: 'Photo Rules',
    keywords: ['photo', 'photos', 'picture', 'camera', 'image', 'mandatory photo', 'photo required', 'take picture'],
    summary: 'Photos are strictly required on every checklist item except N/A.',
    response: `### 📸 Photo Evidence Requirements

* **Mandatory on All Active Items**: A clear photo is required for **every item marked Pass or Fail**.
* **N/A Exemption**: Only items marked **N/A** (Not Applicable) do not require a photo.
* **Why this matters**: Amenity Op's client reports are forensic-grade audit records. Property managers and HOAs rely on visual verification for compliance.
* **Replacing a Photo**: If you make a mistake or need a clearer shot, tap **"Replace Photo"** on the item card to upload a new one.`,
  },
  {
    id: 'fail_protocol',
    title: 'Marking an Item as Fail',
    shortLabel: 'Fail Requirements',
    keywords: ['fail', 'failed', 'failure', 'broken', 'issue', 'hazard', 'comment required', 'critical', 'defect'],
    summary: 'Fails require both a detailed explanatory comment and photo evidence.',
    response: `### ⚠️ Protocol for Failed Items

Whenever an asset, amenity, or area does not meet operational standards:

1. **Tap "Fail"**: Select the red Fail button on the item card.
2. **Mandatory Comment**: You **must** provide a specific comment explaining the defect (e.g., *"Pool gate latch broken, does not self-close - immediate safety hazard"*).
3. **Mandatory Photo**: Capture high-resolution photo evidence showing the exact issue.
4. **Submission Block**: The system will prevent submitting the inspection until all failed items have both a comment and photo attached.`,
  },
  {
    id: 'na_guidelines',
    title: 'When to Use N/A (Not Applicable)',
    shortLabel: 'N/A Guidelines',
    keywords: ['na', 'n/a', 'not applicable', 'skip', 'missing amenity', 'does not exist', 'no pool'],
    summary: 'Use N/A only when the amenity or feature does not exist at the property.',
    response: `### 🔘 N/A (Not Applicable) Guidelines

* **When to select N/A**: Only when the property does not possess that specific feature (e.g., the checklist includes *"Sauna Temperature Check"* but the building has no sauna).
* **Do NOT use N/A for blocked access**: If an amenity exists but is locked or blocked, mark it **Fail** and note *"Inaccessible / Locked"* in the comment.
* **No Photo Needed**: N/A items are exempt from photo requirements.`,
  },
  {
    id: 'gps_geofencing',
    title: 'GPS Perimeter & Geofence Telemetry',
    shortLabel: 'GPS Geofencing',
    keywords: ['gps', 'geofence', 'geofencing', 'location', 'perimeter', 'on-site', 'outside', 'coordinates', 'tracking', 'telemetry'],
    summary: 'GPS verifies physical presence on-site within the designated perimeter.',
    response: `### 📍 GPS Tracking & Virtual Geofencing

* **Real-Time Banner**: At the top of your checklist, a live status badge shows your physical proximity to the property:
  * 🟢 **On-Site & Verified**: You are inside the property's virtual geofence perimeter. Arrival time is logged.
  * 🟡 **Outside Perimeter**: You are currently outside the designated boundary. Proximity in meters is displayed.
  * ⚪ **GPS Exempt**: The property does not require perimeter verification.
* **Dwell Time**: Your arrival and departure timestamps are automatically recorded on submission to calculate total on-site audit duration.
* **Troubleshooting GPS**: Ensure Location Services are enabled on your mobile browser and device settings.`,
  },
  {
    id: 'locked_access',
    title: 'Locked Gates & Inaccessible Areas',
    shortLabel: 'Locked Access SOP',
    keywords: ['locked', 'gate', 'key', 'code', 'access', 'blocked', 'cannot enter', 'door locked', 'fob'],
    summary: 'How to handle locked or inaccessible areas during an audit.',
    response: `### 🔒 Inaccessible Area / Locked Gate SOP

If an amenity or area is inaccessible due to locked doors, missing keys, or faulty keypads:

1. **Check Property Notes**: Review the property details at the top of your checklist for access codes or manager contact numbers.
2. **Call On-Site Contact**: Tap the clickable property phone number to contact property management.
3. **If Still Inaccessible**:
   * Mark the relevant item(s) as **Fail**.
   * Note in the comment: *"Area inaccessible - Gate/door locked, access code [XYZ] not working at time of audit."*
   * Take a photo of the locked door/gate as evidence.`,
  },
  {
    id: 'autosave_drafts',
    title: 'Autosave & Offline Crash Protection',
    shortLabel: 'Autosave & Drafts',
    keywords: ['autosave', 'save', 'draft', 'offline', 'battery', 'crash', 'restore', 'lost data', 'network'],
    summary: 'All answers autosave instantly; drafts protect against battery or browser crashes.',
    response: `### 💾 Autosave & Crash Protection

* **Instant Server Autosave**: Every time you tap Pass/Fail/NA or type a comment, your progress is immediately saved to the server.
* **Local Draft Mirror**: Your answers are also mirrored in secure device storage in real-time.
* **Crash Recovery**: If your phone battery dies or the browser closes unexpectedly, reopening the checklist will display a **"Restore Draft"** banner so you never lose your work.
* **Photo Uploads**: Photos upload straight to encrypted cloud storage as soon as you select them.`,
  },
  {
    id: 'scheduled_gate',
    title: 'Scheduled Inspection Start Times',
    shortLabel: 'Scheduled Time Gate',
    keywords: ['schedule', 'scheduled', 'start time', 'time gate', 'early', 'cannot start', 'locked audit', 'start inspection'],
    summary: 'Inspections with scheduled times cannot be started before the assigned time.',
    response: `### ⏰ Scheduled Start Time Gate

* **Time-Gated Audits**: If an administrator scheduled an inspection for a future date/time (e.g., *Today at 2:00 PM*), you cannot start filling out the checklist early.
* **Countdown Screen**: The app will display a friendly countdown showing the property address, phone number, and exactly when the audit unlocks.
* **Unscheduled Audits**: Inspections without a designated start time can be started immediately.`,
  },
  {
    id: 'payouts_compensation',
    title: 'Specialist Earnings & Audit Compensation',
    shortLabel: 'Earnings & Payouts',
    keywords: ['payout', 'payouts', 'compensation', 'earnings', 'money', 'pay', 'rate', 'disbursement', 'tier rate'],
    summary: 'How audit payouts are calculated, approved, and disbursed.',
    response: `### 💵 Earnings & Payouts

* **Automatic Ledger Entry**: When your organization has payouts enabled, completing an inspection automatically logs an earnings entry in your **Earnings** tab.
* **3-Tier Property Rates**: Compensation is calculated based on the property's assigned tier:
  * **Tier 1 (Baseline)**: Standard properties & residential assets.
  * **Tier 2 (Premier)**: Mid-size complexes & commercial properties.
  * **Tier 3 (Sovereign)**: Luxury high-rises & premium amenity facilities.
* **Payout Workflow**:
  1. *Pending*: Created automatically on audit completion.
  2. *Approved*: Reviewed and confirmed by management.
  3. *Paid*: Disbursed with payment reference number (e.g. ACH, Direct Deposit, Check).`,
  },
  {
    id: 'submission_pipeline',
    title: 'Submitting Completed Inspections',
    shortLabel: 'Submit Inspection',
    keywords: ['submit', 'finish', 'complete', 'pdf', 'email', 'report', 'send report', 'generate pdf'],
    summary: 'Submitting validates all items, generates a PDF, and emails property management.',
    response: `### 🚀 Inspection Submission Process

When you tap **"Submit Inspection"**:

1. **Validation Check**: The app verifies every single item has a status, required photos are present, and all Fails have explanatory comments.
2. **Instant PDF Generation**: A branded Operations, Asset & Logistics PDF report is rendered with all embedded photos and telemetry data.
3. **Automated Delivery**: The report is emailed immediately to the property's on-file email address, CC'd to admin dispatch.
4. **Audit Freeze**: Once submitted, the audit is permanently sealed as a forensic record. You can view your read-only report anytime under **Completed Inspections**.`,
  },
  {
    id: 'scorecard_metrics',
    title: 'Specialist Performance Scorecard',
    shortLabel: 'Performance Scorecard',
    keywords: ['scorecard', 'metrics', 'performance', 'punctuality', 'velocity', 'discovery rate', 'tier status', 'elite'],
    summary: 'Understand your punctuality, speed, and audit performance metrics.',
    response: `### 📊 Specialist Performance Scorecard

Access your personal scorecard anytime via the **Performance** tab:

* **Punctuality Rate**: Percentage of scheduled audits started on time.
* **Average Audit Velocity**: Average time spent conducting on-site audits.
* **Issue Discovery Rate**: Percentage of inspected items where defects/hazards were caught.
* **Photo Compliance Rate**: Visual documentation adherence score.
* **Specialist Tier**: Earn **Senior** or **Elite Specialist** recognition based on consistency and audit volume.`,
  },
  {
    id: 'profile_id_upload',
    title: 'Specialist Profile & Driver License ID',
    shortLabel: 'ID & Profile',
    keywords: ['profile', 'id', 'driver license', 'license', 'id photo', 'documents', 'address', 'phone'],
    summary: 'Manage your contact information and upload required photo ID documentation.',
    response: `### 🪪 Specialist Profile & Photo ID Verification

Under the **Profile** tab (/inspector/profile):

* **Human-Readable ID**: Your permanent specialist code (e.g. OCS-1042).
* **Coverage Area**: Keep your Street, City, State, ZIP, and County updated to receive nearby property assignments.
* **Driver's License / ID Upload**: Securely upload front and back photos of your government ID or driver's license for compliance verification.`,
  },
]

export const SUGGESTED_SPECIALIST_PROMPTS = [
  'Photo evidence rules',
  'What is required on a Fail?',
  'When should I use N/A?',
  'How does GPS geofencing work?',
  'Locked gate / access SOP',
  'How do audit payouts work?',
]

/**
 * Searches the knowledge base and generates an intelligent, formatted answer
 * for a specialist query.
 */
export function querySpecialistAssistant(query: string): {
  answer: string
  matchedTopic?: KnowledgeTopic
  relatedPrompts: string[]
} {
  const normalized = query.toLowerCase().trim()

  if (!normalized) {
    return {
      answer:
        "Hello! I'm your on-site Amenity Op's Field Assistant. How can I assist you with your audit or SOPs today?",
      relatedPrompts: SUGGESTED_SPECIALIST_PROMPTS.slice(0, 3),
    }
  }

  // Score each topic
  let bestTopic: KnowledgeTopic | null = null
  let highestScore = 0

  for (const topic of SPECIALIST_KNOWLEDGE_BASE) {
    let score = 0
    // Check keyword hits
    for (const kw of topic.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        score += 3
      }
    }
    // Check title hits
    if (normalized.includes(topic.title.toLowerCase()) || topic.title.toLowerCase().includes(normalized)) {
      score += 5
    }
    // Check short label
    if (normalized.includes(topic.shortLabel.toLowerCase())) {
      score += 4
    }

    if (score > highestScore) {
      highestScore = score
      bestTopic = topic
    }
  }

  if (bestTopic && highestScore >= 3) {
    // Collect 2 other topics as related prompts
    const otherPrompts = SPECIALIST_KNOWLEDGE_BASE
      .filter((t) => t.id !== bestTopic!.id)
      .slice(0, 3)
      .map((t) => t.shortLabel)

    return {
      answer: bestTopic.response,
      matchedTopic: bestTopic,
      relatedPrompts: otherPrompts,
    }
  }

  // Fallback intelligent summary if no exact match
  return {
    answer: `### 📋 Field Specialist Operational Help

I couldn't find an exact match for **"${query}"**, but here are the key on-site guidelines:

* **Photos**: Required on every item except N/A.
* **Failures**: Require both a descriptive comment and a photo before submission.
* **GPS Status**: Keep your browser location on so your geofence arrival is logged.
* **Locked Gates**: Mark as Fail with a comment noting locked access, and call on-site contact.
* **Drafts**: All items autosave instantly to prevent data loss.

*Select one of the suggested topics below or ask a more specific question:*`,
    relatedPrompts: SUGGESTED_SPECIALIST_PROMPTS.slice(0, 4),
  }
}
