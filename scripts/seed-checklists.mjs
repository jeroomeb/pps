// Seeds the three checklist templates + their items from supabase/seed/checklists.csv
// Usage: node scripts/seed-checklists.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment (.env.local).

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

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

// Minimal RFC 4180 CSV parser (handles quoted fields containing commas/newlines).
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((v) => v !== '')) rows.push(row)
      row = []
    } else {
      field += char
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

async function main() {
  loadEnvLocal()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set them in .env.local)'
    )
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey)

  const csvPath = path.join(__dirname, '..', 'supabase', 'seed', 'checklists.csv')
  const csvText = readFileSync(csvPath, 'utf8')
  const rows = parseCsv(csvText)
  const [header, ...dataRows] = rows
  console.log('CSV header:', header)

  const byTemplate = new Map()
  for (const row of dataRows) {
    const [templateName, serviceCategory, itemName, hoverNote] = row
    if (!templateName) continue
    if (!byTemplate.has(templateName)) byTemplate.set(templateName, [])
    byTemplate.get(templateName).push({
      service_category: serviceCategory,
      item_name: itemName,
      description: hoverNote || null,
    })
  }

  for (const [templateName, items] of byTemplate) {
    console.log(`\nSeeding "${templateName}" (${items.length} items)`)

    const { data: template, error: templateError } = await supabase
      .from('checklist_templates')
      .upsert({ name: templateName }, { onConflict: 'name' })
      .select()
      .single()

    if (templateError) {
      console.error('  Failed to upsert template:', templateError.message)
      continue
    }

    // Replace items for this template so re-running the script is idempotent.
    const { error: deleteError } = await supabase
      .from('checklist_template_items')
      .delete()
      .eq('template_id', template.id)

    if (deleteError) {
      console.error('  Failed to clear existing items:', deleteError.message)
      continue
    }

    const rowsToInsert = items.map((item, index) => ({
      template_id: template.id,
      service_category: item.service_category,
      item_name: item.item_name,
      description: item.description,
      sort_order: index,
    }))

    const { error: insertError } = await supabase
      .from('checklist_template_items')
      .insert(rowsToInsert)

    if (insertError) {
      console.error('  Failed to insert items:', insertError.message)
    } else {
      console.log(`  Inserted ${rowsToInsert.length} items.`)
    }
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
