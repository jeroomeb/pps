'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronUp, ChevronDown as ChevronDownIcon } from 'lucide-react'
import { reorderTemplateItems } from '@/lib/actions/checklists'
import { DeleteItemButton } from '@/components/DeleteItemButton'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

type Item = {
  id: string
  service_category: string
  item_name: string
  description: string | null
}

type CategoryBlock = { category: string; items: Item[] }

function groupIntoBlocks(items: Item[]): CategoryBlock[] {
  const order: string[] = []
  const map = new Map<string, Item[]>()
  for (const item of items) {
    if (!map.has(item.service_category)) {
      map.set(item.service_category, [])
      order.push(item.service_category)
    }
    map.get(item.service_category)!.push(item)
  }
  return order.map((category) => ({ category, items: map.get(category)! }))
}

function flattenIds(blocks: CategoryBlock[]): string[] {
  return blocks.flatMap((block) => block.items.map((item) => item.id))
}

function swap<T>(arr: T[], i: number, j: number): T[] {
  const next = arr.slice()
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

/**
 * Reorderable checklist item admin UI (session 12). Item order is used by
 * new inspections' `inspection_items.sort_order`; existing inspections
 * already snapshotted their own order at creation, so reordering the
 * template never touches in-flight or completed inspections.
 */
export function ChecklistItemReorder({
  templateId,
  items,
}: {
  templateId: string
  items: Item[]
}) {
  const showToast = useToast()
  const [pending, startTransition] = useTransition()
  const [blocks, setBlocks] = useState<CategoryBlock[]>(() => groupIntoBlocks(items))

  function persist(next: CategoryBlock[]) {
    const previous = blocks
    setBlocks(next)
    startTransition(async () => {
      const result = await reorderTemplateItems(templateId, flattenIds(next))
      if (result?.error) {
        setBlocks(previous)
        showToast('error', result.error)
      }
    })
  }

  function moveItem(categoryIndex: number, itemIndex: number, direction: -1 | 1) {
    const target = itemIndex + direction
    const block = blocks[categoryIndex]
    if (target < 0 || target >= block.items.length) return
    const nextBlocks = blocks.slice()
    nextBlocks[categoryIndex] = { ...block, items: swap(block.items, itemIndex, target) }
    persist(nextBlocks)
  }

  function moveCategory(categoryIndex: number, direction: -1 | 1) {
    const target = categoryIndex + direction
    if (target < 0 || target >= blocks.length) return
    persist(swap(blocks, categoryIndex, target))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-on-surface-variant">
        Reorder items and categories below. This only changes the order for{' '}
        <strong>new</strong> inspections — inspections already in progress or completed keep the
        order they were created with.
      </p>
      {blocks.map((block, categoryIndex) => (
        <details key={block.category} className="group" open={blocks.length <= 3}>
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3">
            <span className="label-tracked">
              {block.category} ({block.items.length})
            </span>
            <span className="flex items-center gap-1">
              <button
                type="button"
                disabled={pending || categoryIndex === 0}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  moveCategory(categoryIndex, -1)
                }}
                aria-label={`Move ${block.category} category up`}
                title="Move category up"
                className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                disabled={pending || categoryIndex === blocks.length - 1}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  moveCategory(categoryIndex, 1)
                }}
                aria-label={`Move ${block.category} category down`}
                title="Move category down"
                className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
              >
                <ChevronDownIcon size={16} />
              </button>
              <ChevronDown size={16} className="ml-1 transition group-open:rotate-180" />
            </span>
          </summary>
          <div className="flex flex-col gap-2 py-3">
            {block.items.map((item, itemIndex) => (
              <Card key={item.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{item.item_name}</p>
                  {item.description && (
                    <p className="text-sm text-on-surface-variant">{item.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={pending || itemIndex === 0}
                    onClick={() => moveItem(categoryIndex, itemIndex, -1)}
                    aria-label={`Move ${item.item_name} up`}
                    title="Move up"
                    className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={pending || itemIndex === block.items.length - 1}
                    onClick={() => moveItem(categoryIndex, itemIndex, 1)}
                    aria-label={`Move ${item.item_name} down`}
                    title="Move down"
                    className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                  >
                    <ChevronDownIcon size={16} />
                  </button>
                  <DeleteItemButton itemId={item.id} templateId={templateId} />
                </div>
              </Card>
            ))}
          </div>
        </details>
      ))}
      {!blocks.length && (
        <p className="text-sm text-on-surface-variant">No items yet — add the first one above.</p>
      )}
    </div>
  )
}
