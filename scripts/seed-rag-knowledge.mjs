// Seeds the Specialist AI Knowledge Base into Supabase with OpenAI Vector Embeddings
// Usage: node scripts/seed-rag-knowledge.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in (.env.local).
// Optional: OPENAI_API_KEY to generate 1536-dim pgvector embeddings.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  try {
    const contents = readFileSync(envPath, 'utf8')
    for (const line of contents.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // no .env.local, rely on real env vars
  }
}

loadEnvLocal()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiApiKey = process.env.OPENAI_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null

export const KNOWLEDGE_ITEMS = [
  {
    category: 'System Identity & Role',
    question: 'What is Amenity Ops and what does the platform do?',
    keywords: ['amenity ops', 'platform', 'about', 'overview', 'company'],
    content: 'Amenity Op\'s is an enterprise property inspection and quality assurance platform for residential high-rises, 55+ active adult communities, and commercial multi-tenant real estate. It enables property managers and HOAs to verify operational readiness, asset compliance, and safety standards through forensic audit reports.',
  },
  {
    category: 'System Identity & Role',
    question: 'What is an OCS (Operational Continuity Specialist)?',
    keywords: ['ocs', 'specialist', 'role', 'inspector', 'job description'],
    content: 'An Operational Continuity Specialist (OCS) is a field inspector responsible for evaluating on-site amenities, verifying physical asset conditions, identifying defects/hazards, capturing photographic evidence, and submitting audit reports. In the database system, their role is designated as "inspector".',
  },
  {
    category: 'Pre-Audit & Scheduling',
    question: 'How do I see assigned open and completed audits?',
    keywords: ['assigned', 'open audits', 'inspections list', 'my audits', 'dashboard'],
    content: 'Log in to your specialist portal at /inspector. Your dashboard lists all active audits under "Open Inspections" (sorted by urgency: Overdue, Due Today, Due in X Days, and Unscheduled). You can review your past submitted reports under the "Completed" tab.',
  },
  {
    category: 'Pre-Audit & Scheduling',
    question: 'Can I start an inspection before its scheduled date and time?',
    keywords: ['scheduled time', 'start early', 'time gate', 'locked audit', 'countdown'],
    content: 'No. If an administrator set a designated future scheduled time (e.g., Today at 2:00 PM), the inspection is time-gated. Reaching the audit early displays a countdown screen showing property address, manager phone, and the exact unlock time. Unscheduled audits can be started anytime.',
  },
  {
    category: 'Pre-Audit & Scheduling',
    question: 'What should I verify before arriving at an assigned property?',
    keywords: ['preparation', 'arrival', 'access code', 'gate code', 'pre-audit check'],
    content: 'Before arriving: 1) Review open assignments in /inspector. 2) Check property address, access codes, lockbox numbers, and manager notes on the audit header. 3) Ensure your phone has sufficient battery and browser camera/location permissions enabled.',
  },
  {
    category: 'Checklist Rules & SOPs',
    question: 'What are the three checklist status options (Pass, Fail, N/A)?',
    keywords: ['pass', 'fail', 'na', 'statuses', 'checklist options'],
    content: 'Every item requires one of three statuses: Pass (Green) - Asset meets all cleanliness, safety, and operational standards. Fail (Red) - Asset has defects, hazards, damage, or cleanliness failures. N/A (Gray) - Asset does not physically exist on this property.',
  },
  {
    category: 'Checklist Rules & SOPs',
    question: 'What are the photo evidence rules for an inspection?',
    keywords: ['photo rules', 'mandatory photo', 'camera', 'pictures required', 'evidence'],
    content: 'A clear photo is strictly required on every item marked Pass or Fail. Only items marked N/A are exempt. Amenity Op\'s client reports are forensic compliance records requiring visual documentation for property managers and insurance audits.',
  },
  {
    category: 'Checklist Rules & SOPs',
    question: 'What are the mandatory requirements when marking an item as Fail?',
    keywords: ['fail requirements', 'failed item', 'comment required', 'defect', 'hazard'],
    content: 'When an item fails: 1) Select Fail. 2) Enter a mandatory explanatory comment detailing the defect (e.g., "Pool gate latch broken, does not latch automatically - safety hazard"). 3) Capture a clear photo of the issue. The system blocks submission until both comment and photo are provided.',
  },
  {
    category: 'Checklist Rules & SOPs',
    question: 'When should I use N/A (Not Applicable)?',
    keywords: ['na guidelines', 'not applicable', 'skip item', 'missing asset'],
    content: 'Select N/A only when the property does not possess that amenity (e.g., checklist includes "Sauna Check" but property has no sauna). Do NOT use N/A for locked or inaccessible areas; those must be marked Fail.',
  },
  {
    category: 'Checklist Rules & SOPs',
    question: 'How do I replace or retake a photo on a checklist item?',
    keywords: ['replace photo', 'retake photo', 'update photo', 'change picture'],
    content: 'To update or retake a photo, tap the "Replace Photo" button directly on the checklist item card. Uploading a new image immediately replaces the previous photo in secure storage.',
  },
  {
    category: 'On-Site Obstructions',
    question: 'What should I do if a gate, door, or amenity area is locked?',
    keywords: ['locked gate', 'locked door', 'inaccessible', 'key code', 'cannot enter'],
    content: '1) Check property notes in the header for access codes or manager notes. 2) Tap the clickable phone number to contact on-site staff. 3) If still inaccessible: Mark as Fail (do NOT mark N/A), add comment: "Area Inaccessible: Gate/door locked; code failed at [Time]", and photograph the locked door/gate as evidence.',
  },
  {
    category: 'On-Site Obstructions',
    question: 'What should I do if on-site security or a resident refuses entry?',
    keywords: ['refused entry', 'security refusal', 'blocked access', 'access denied'],
    content: 'Identify yourself as an Amenity Op\'s Operational Continuity Specialist conducting an authorized audit. If access is still refused, call the on-site property manager. If unresolved, mark items as Fail with a note explaining the security refusal, photograph the entrance/gatehouse, and notify dispatch.',
  },
  {
    category: 'GPS Tracking & Geofencing',
    question: 'How does GPS tracking and virtual geofencing work?',
    keywords: ['gps geofencing', 'perimeter', 'location tracking', 'telemetry', 'on-site banner'],
    content: 'The active checklist displays a live GPS presence banner: Green (On-Site & Verified) - Inside property boundary, arrival logged. Amber (Outside Perimeter) - Outside boundary, distance in meters displayed. White (GPS Exempt) - Property does not track GPS. Arrival and departure times are recorded for audit dwell duration.',
  },
  {
    category: 'GPS Tracking & Geofencing',
    question: 'How is dwell time (time on-site) calculated?',
    keywords: ['dwell time', 'time on site', 'duration', 'arrival departure'],
    content: 'Dwell time measures total on-site time. It is calculated automatically from the moment your device entered the geofence (Arrived At) until the audit is completed (Departed At). This duration is printed on the final executive report.',
  },
  {
    category: 'GPS Tracking & Geofencing',
    question: 'What should I do if GPS shows Outside Perimeter while I am at the property?',
    keywords: ['gps troubleshooting', 'outside perimeter error', 'location error', 'weak signal'],
    content: '1) Ensure device GPS/Location Services is enabled. 2) Ensure browser location permissions for portal.amenityops.app are set to "Allow". 3) If inside heavy concrete/metal structures, step near a window or exterior area briefly to establish satellite fix.',
  },
  {
    category: 'Autosave & Drafts',
    question: 'Does my checklist progress save automatically?',
    keywords: ['autosave', 'saving', 'progress saved', 'realtime save'],
    content: 'Yes. Every Pass/Fail/NA toggle and every comment keystroke automatically saves to the server immediately in real time.',
  },
  {
    category: 'Autosave & Drafts',
    question: 'What happens if my phone battery dies or the browser crashes?',
    keywords: ['battery crash', 'phone died', 'restore draft', 'lost work', 'offline recovery'],
    content: 'Your answers are continuously mirrored in device storage. If your phone powers off or reloads, opening the checklist displays a "Restore Draft" banner to instantly recover your in-progress answers and comments. Photos upload directly to cloud storage on capture and are never lost.',
  },
  {
    category: 'Submission Pipeline',
    question: 'What happens when I tap Submit Inspection?',
    keywords: ['submit inspection', 'finish audit', 'pdf generation', 'email dispatch'],
    content: '1) Full validation check on all items, photos, and fail comments. 2) Branded Operations, Asset and Logistics PDF report is rendered on the server. 3) PDF is automatically emailed to property management and CC\'d to dispatch. 4) Audit is permanently sealed. 5) Automatic payout record is logged in your earnings ledger.',
  },
  {
    category: 'Submission Pipeline',
    question: 'Can I edit an inspection after submitting it?',
    keywords: ['edit completed', 'modify submitted', 'change report after submit'],
    content: 'No. Completed inspections are permanently frozen to ensure legal compliance and report immutability. You can view your submitted audit in read-only mode under the Completed tab.',
  },
  {
    category: 'Submission Pipeline',
    question: 'Why is the Submit button blocked or showing an error banner?',
    keywords: ['submit blocked', 'validation error', 'cannot submit', 'missing items'],
    content: 'If submission is blocked, a red banner at the bottom of the checklist will display the exact list of blocking issues (e.g. missing photos on non-N/A items, empty comments on Fails, or unselected statuses) with direct jump links to fix each one.',
  },
  {
    category: 'Earnings & Payouts',
    question: 'How is specialist compensation calculated (3x3 Matrix)?',
    keywords: ['payout rates', 'compensation calculation', '3x3 matrix', 'earnings tier'],
    content: 'Payouts are calculated from the organization\'s 3x3 Property Category x Service Tier Matrix: Categories: Luxury Condominium, 55+ Active Adult Community, Commercial Multi-Tenant. Tiers: Tier 1 (Baseline), Tier 2 (Premier), Tier 3 (Sovereign). Properties can also have custom flat rate overrides.',
  },
  {
    category: 'Earnings & Payouts',
    question: 'How do I track earnings and payout disbursement status?',
    keywords: ['earnings tab', 'payout status', 'pending approved paid', 'track money'],
    content: 'Go to the Earnings tab (/inspector/payouts). Statuses: Pending (Audit completed, awaiting manager review), Approved (Verified by management for disbursement), Paid (Disbursed with payment reference number like ACH or Direct Deposit).',
  },
  {
    category: 'Performance Scorecard',
    question: 'What metrics are tracked on the Specialist Scorecard?',
    keywords: ['scorecard', 'metrics', 'punctuality', 'velocity', 'discovery rate'],
    content: 'Under the Performance tab (/inspector/metrics): 1) Punctuality Rate (% on-time starts). 2) Audit Velocity (average completion duration). 3) Issue Discovery Rate (% items marked with defects). 4) Photo Compliance Rate (% visual documentation adherence).',
  },
  {
    category: 'Performance Scorecard',
    question: 'What are the Specialist Recognition Tiers (Senior / Elite)?',
    keywords: ['recognition tiers', 'senior specialist', 'elite specialist', 'rank'],
    content: 'Specialists can earn Senior Specialist or Elite Specialist recognition badges on their profile and scorecard based on audit volume, high punctuality, thorough defect discovery, and 100% photo compliance.',
  },
  {
    category: 'Profile & Credentials',
    question: 'What is my Specialist Human ID (OCS-####)?',
    keywords: ['human id', 'ocs code', 'specialist id', 'badge number'],
    content: 'Every specialist is assigned a unique permanent identifier formatted as OCS-#### (e.g., OCS-1042). This code appears on your profile and on all inspection reports you complete.',
  },
  {
    category: 'Profile & Credentials',
    question: 'How do I upload my Driver\'s License or State ID?',
    keywords: ['upload license', 'id verification', 'documents', 'front back license'],
    content: 'Go to the Profile tab (/inspector/profile). Under "Photo of Identification", upload clear photos of the Front and Back of your government ID or driver\'s license and tap Save Profile. Files are stored in private encrypted storage.',
  },
  {
    category: 'Profile & Credentials',
    question: 'Why is it important to keep my address and county updated in my profile?',
    keywords: ['coverage area', 'address', 'county', 'proximity assignment'],
    content: 'Amenity Op\'s uses proximity-based routing (Same ZIP -> Same County -> Same State). Keeping your street address and county updated ensures administrators assign audits located conveniently near your home territory.',
  },
  {
    category: 'Security & Auth',
    question: 'What should I do if prompted to change my password on first login?',
    keywords: ['first login', 'temporary password', 'force password change', 'password setup'],
    content: 'New accounts must complete mandatory password setup at /force-password-change. Enter your temporary password provided by your administrator, then enter your new permanent password (minimum 8 characters).',
  },
  {
    category: 'Security & Auth',
    question: 'What should I do if I forgot my password?',
    keywords: ['forgot password', 'reset password', 'account recovery'],
    content: 'On the login page (/login), tap "Forgot Password?", enter your registered email address, and follow the secure password reset link sent to your inbox.',
  },
]

async function seedKnowledgeBase() {
  console.log(`Starting knowledge base seeding (${KNOWLEDGE_ITEMS.length} entries)...`)
  console.log(`OpenAI API Key: ${openai ? 'PRESENT (Generating 1536-dim vector embeddings)' : 'NOT PRESENT (Inserting text records without vectors)'}`)

  let successCount = 0

  for (let i = 0; i < KNOWLEDGE_ITEMS.length; i++) {
    const item = KNOWLEDGE_ITEMS[i]
    let embedding = null

    if (openai) {
      try {
        const textToEmbed = `Category: ${item.category}\nQuestion: ${item.question}\nKeywords: ${item.keywords.join(', ')}\nContent: ${item.content}`
        const embRes = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: textToEmbed,
        })
        embedding = embRes.data[0]?.embedding ?? null
      } catch (embErr) {
        console.warn(`Warning: Failed to generate embedding for item ${i + 1} (${item.question}):`, embErr.message)
      }
    }

    const { error } = await supabase
      .from('specialist_knowledge_base')
      .upsert(
        {
          category: item.category,
          question: item.question,
          content: item.content,
          keywords: item.keywords,
          embedding: embedding,
        },
        { onConflict: 'question' }
      )

    if (error) {
      // If table does not exist or vector extension missing
      console.error(`Error inserting item "${item.question}":`, error.message)
    } else {
      successCount++
      process.stdout.write(`\rSeeded ${successCount}/${KNOWLEDGE_ITEMS.length} knowledge items...`)
    }
  }

  console.log(`\n\nKnowledge base seeding finished: ${successCount}/${KNOWLEDGE_ITEMS.length} successfully saved to Supabase!`)
}

seedKnowledgeBase().catch((err) => {
  console.error('Seeding fatal error:', err)
  process.exit(1)
})
