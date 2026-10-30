'use client'

import React, { useState } from 'react'
import { Check, Copy, Code2, Table as TableIcon } from 'lucide-react'

interface ChatMarkdownRendererProps {
  content: string
}

type MarkdownBlock =
  | { type: 'code'; lang: string; code: string }
  | { type: 'table'; headers: string[]; alignments: ('left' | 'center' | 'right')[]; rows: string[][] }
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'numbered'; num: string; text: string }
  | { type: 'quote'; text: string }
  | { type: 'empty' }
  | { type: 'p'; text: string }

function parseMarkdownBlocks(text: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // 1. Fenced Code Block
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // Skip closing ```
      blocks.push({
        type: 'code',
        lang: lang || 'text',
        code: codeLines.join('\n'),
      })
      continue
    }

    // 2. Markdown Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      const tableLines: string[] = []
      while (
        i < lines.length &&
        lines[i].trim().startsWith('|') &&
        lines[i].trim().endsWith('|')
      ) {
        tableLines.push(lines[i].trim())
        i++
      }

      if (tableLines.length >= 2) {
        // Headers
        const headers = tableLines[0]
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim())

        // Separator / alignments
        const separatorCells = tableLines[1]
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim())

        const alignments = separatorCells.map((sep) => {
          if (sep.startsWith(':') && sep.endsWith(':')) return 'center'
          if (sep.endsWith(':')) return 'right'
          return 'left'
        }) as ('left' | 'center' | 'right')[]

        // Data rows
        const rows = tableLines.slice(2).map((rowStr) =>
          rowStr
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim())
        )

        blocks.push({
          type: 'table',
          headers,
          alignments,
          rows,
        })
        continue
      }
    }

    // 3. Headers
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4) })
      i++
      continue
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3) })
      i++
      continue
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', text: trimmed.slice(2) })
      i++
      continue
    }

    // 4. Blockquotes
    if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'quote', text: trimmed.slice(2) })
      i++
      continue
    }

    // 5. Bullet items
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      blocks.push({ type: 'bullet', text: trimmed.slice(2) })
      i++
      continue
    }

    // 6. Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (numMatch) {
      blocks.push({ type: 'numbered', num: numMatch[1], text: numMatch[2] })
      i++
      continue
    }

    // 7. Empty line
    if (!trimmed) {
      blocks.push({ type: 'empty' })
      i++
      continue
    }

    // 8. Regular text paragraph
    blocks.push({ type: 'p', text: trimmed })
    i++
  }

  return blocks
}

/**
 * Sanitizes input text, strips malicious HTML tags, and parses inline formatting:
 * **bold**, `code`, *italic*, <strong>, <code>, <em>, <span class="...">, <br>
 */
function renderInlineContent(rawText: string): React.ReactNode {
  // 1. Strip dangerous tags
  let sanitized = rawText.replace(/<\/?(script|iframe|object|embed|applet)[^>]*>/gi, '')
  // Strip dangerous inline event handlers
  sanitized = sanitized.replace(/\son\w+="[^"]*"/gi, '')
  sanitized = sanitized.replace(/\son\w+='[^']*'/gi, '')

  // 2. Normalize HTML tags to markdown-equivalent delimiters
  sanitized = sanitized
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<br\s*\/?>/gi, '\n')

  // Remove other bare HTML tags while keeping contents
  sanitized = sanitized.replace(/<\/?(p|div|span)[^>]*>/gi, '')

  // 3. Tokenize inline markdown: code, bold, italic
  // Regex splits keeping tokens
  const tokens = sanitized.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)

  return tokens.map((token, index) => {
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      const codeVal = token.slice(1, -1)
      return (
        <code
          key={index}
          className="rounded bg-surface-container-highest px-1.5 py-0.5 font-mono text-[11px] text-primary font-medium"
        >
          {codeVal}
        </code>
      )
    }

    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      const boldVal = token.slice(2, -2)
      return (
        <strong key={index} className="font-semibold text-on-surface">
          {boldVal}
        </strong>
      )
    }

    if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      const italicVal = token.slice(1, -1)
      return (
        <em key={index} className="italic text-on-surface">
          {italicVal}
        </em>
      )
    }

    // Preserve newlines if any
    if (token.includes('\n')) {
      const lines = token.split('\n')
      return (
        <React.Fragment key={index}>
          {lines.map((l, lIdx) => (
            <React.Fragment key={lIdx}>
              {l}
              {lIdx < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </React.Fragment>
      )
    }

    return token
  })
}

function CodeBlockRenderer({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)

  let formattedCode = code
  const isJson = lang.toLowerCase() === 'json'
  const isRegex = lang.toLowerCase() === 'regex'

  if (isJson) {
    try {
      formattedCode = JSON.stringify(JSON.parse(code), null, 2)
    } catch {
      // Keep as-is if invalid JSON
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(formattedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-outline-variant bg-surface-container-low text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
        <span className="flex items-center gap-1.5 font-semibold text-primary">
          <Code2 size={12} />
          {lang ? lang.toUpperCase() : 'CODE'}
          {isRegex && <span className="text-[9px] font-sans text-secondary">(Pattern)</span>}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-surface-container-high transition text-on-surface select-none"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={11} className="text-emerald-500" />
              <span className="text-emerald-500 font-semibold lowercase">copied!</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span className="lowercase">copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs font-mono leading-relaxed text-on-surface bg-surface-container-lowest/80">
        <code>{formattedCode}</code>
      </pre>
    </div>
  )
}

function TableRenderer({
  headers,
  alignments,
  rows,
}: {
  headers: string[]
  alignments: ('left' | 'center' | 'right')[]
  rows: string[][]
}) {
  return (
    <div className="my-2.5 overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-lowest shadow-xs">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="border-b border-outline-variant bg-surface-container-low">
            {headers.map((h, idx) => (
              <th
                key={idx}
                className={`px-3 py-2 font-headline font-semibold text-on-surface text-[11px] uppercase tracking-wider ${
                  alignments[idx] === 'center'
                    ? 'text-center'
                    : alignments[idx] === 'right'
                      ? 'text-right'
                      : 'text-left'
                }`}
              >
                {renderInlineContent(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/60">
          {rows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className="hover:bg-surface-container-low/40 transition-colors"
            >
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className={`px-3 py-2 text-on-surface ${
                    alignments[cIdx] === 'center'
                      ? 'text-center'
                      : alignments[cIdx] === 'right'
                        ? 'text-right'
                        : 'text-left'
                  }`}
                >
                  {renderInlineContent(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ChatMarkdownRenderer({ content }: ChatMarkdownRendererProps) {
  const blocks = parseMarkdownBlocks(content)

  return (
    <div className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed break-words">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'code':
            return <CodeBlockRenderer key={idx} lang={block.lang} code={block.code} />

          case 'table':
            return (
              <TableRenderer
                key={idx}
                headers={block.headers}
                alignments={block.alignments}
                rows={block.rows}
              />
            )

          case 'h1':
            return (
              <h2 key={idx} className="font-headline font-bold text-base text-primary pt-2 pb-1">
                {renderInlineContent(block.text)}
              </h2>
            )

          case 'h2':
            return (
              <h3 key={idx} className="font-headline font-bold text-sm text-primary pt-1.5 pb-0.5">
                {renderInlineContent(block.text)}
              </h3>
            )

          case 'h3':
            return (
              <h4 key={idx} className="font-headline font-bold text-xs sm:text-[13px] text-primary pt-1 pb-0.5">
                {renderInlineContent(block.text)}
              </h4>
            )

          case 'bullet':
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 text-on-surface">
                <span className="text-primary font-bold select-none">•</span>
                <span>{renderInlineContent(block.text)}</span>
              </div>
            )

          case 'numbered':
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 text-on-surface">
                <span className="font-semibold text-primary select-none">{block.num}.</span>
                <span>{renderInlineContent(block.text)}</span>
              </div>
            )

          case 'quote':
            return (
              <div
                key={idx}
                className="my-1.5 border-l-2 border-primary/60 bg-surface-container-low px-2.5 py-1 text-xs text-on-surface-variant italic rounded-r"
              >
                {renderInlineContent(block.text)}
              </div>
            )

          case 'empty':
            return <div key={idx} className="h-1" />

          case 'p':
          default:
            return (
              <p key={idx} className="text-on-surface">
                {renderInlineContent(block.text)}
              </p>
            )
        }
      })}
    </div>
  )
}
