'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  X,
  Send,
  HelpCircle,
  RotateCcw,
  Bot,
  User,
  ChevronDown,
} from 'lucide-react'
import { SUGGESTED_SPECIALIST_PROMPTS } from '@/lib/specialist-bot-knowledge'

export type ChatMessage = {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  relatedPrompts?: string[]
}

const INITIAL_GREETING: ChatMessage = {
  id: 'init-1',
  sender: 'assistant',
  text: `### 👋 Amenity Op's Field Assistant

I'm your on-site operational guide. Tap a suggested topic below or ask me any question about your audit SOPs, photo requirements, GPS geofencing, or offline drafts:`,
  timestamp: 'Just now',
  relatedPrompts: SUGGESTED_SPECIALIST_PROMPTS,
}

export function SpecialistChatbot({
  specialistName,
}: {
  specialistName?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING])
  const [inputQuery, setInputQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [unreadPrompt, setUnreadPrompt] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setUnreadPrompt(false)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  async function handleSendMessage(queryToSend?: string) {
    const text = (queryToSend ?? inputQuery).trim()
    if (!text || loading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    if (!queryToSend) setInputQuery('')
    setLoading(true)

    // Prepare history payload for multi-turn conversational context
    const historyPayload = messages
      .filter((m) => m.id !== 'init-1')
      .slice(-6)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }))

    try {
      const res = await fetch('/api/specialist-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, history: historyPayload }),
      })

      const data = await res.json()

      if (data.success && data.answer) {
        const botResponse: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          relatedPrompts: data.relatedPrompts ?? [],
        }
        setMessages((prev) => [...prev, botResponse])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-err-${Date.now()}`,
            sender: 'assistant',
            text: "I'm having trouble retrieving that SOP right now. Please check your network connection or tap a suggested topic below.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            relatedPrompts: SUGGESTED_SPECIALIST_PROMPTS.slice(0, 3),
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-network-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Network connection issue. All checklist items are safely saved locally on your device.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleResetChat() {
    setMessages([INITIAL_GREETING])
  }

  // Format simple markdown into clean HTML elements
  function renderFormattedMessage(text: string) {
    const lines = text.split('\n')
    return (
      <div className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim()
          if (!trimmed) return <div key={idx} className="h-1" />

          // Headers
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-headline font-bold text-sm text-primary pt-1 pb-0.5">
                {trimmed.replace('### ', '')}
              </h4>
            )
          }

          // Bullet points
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const content = trimmed.substring(2)
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 text-on-surface">
                <span className="text-primary font-bold select-none">•</span>
                <span>{renderInlineStyles(content)}</span>
              </div>
            )
          }

          // Numbered lists
          const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
          if (numberedMatch) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 text-on-surface">
                <span className="font-semibold text-primary select-none">{numberedMatch[1]}.</span>
                <span>{renderInlineStyles(numberedMatch[2])}</span>
              </div>
            )
          }

          return <p key={idx} className="text-on-surface">{renderInlineStyles(trimmed)}</p>
        })}
      </div>
    )
  }

  // Helper for bold and inline code formatting
  function renderInlineStyles(text: string) {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-on-surface">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="rounded bg-surface-container-highest px-1 py-0.5 font-mono text-[11px] text-primary">{part.slice(1, -1)}</code>
      }
      return part
    })
  }

  return (
    <>
      {/* Floating Action Button (Trigger) */}
      {!isOpen && (
        <div className="fixed bottom-20 right-4 z-40 lg:bottom-6 lg:right-6">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open Field Specialist Assistant"
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Sparkles size={24} className="animate-pulse" />
            
            {/* Pulsing indicator badge */}
            {unreadPrompt && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
              </span>
            )}

            {/* Tooltip on desktop */}
            <span className="absolute right-16 hidden whitespace-nowrap rounded-lg bg-surface-container-highest px-3 py-1.5 text-xs font-semibold text-on-surface shadow-md lg:group-hover:block transition">
              Field Assistant
            </span>
          </button>
        </div>
      )}

      {/* Slide-over / Modal Chat Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none lg:justify-end lg:items-end lg:p-6">
          {/* Mobile backdrop for tap-out-to-dismiss */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs pointer-events-auto lg:hidden"
          />

          {/* Chat Container Card */}
          <div className="relative flex flex-col w-full h-[85vh] max-h-[620px] bg-surface rounded-t-2xl lg:rounded-2xl border border-outline-variant shadow-2xl overflow-hidden pointer-events-auto lg:w-[420px] lg:h-[580px] animate-in slide-in-from-bottom-6 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-container-low">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                  <Bot size={20} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-headline text-sm font-bold text-on-surface">
                      Field Assistant
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-700">
                      Live SOP
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant">
                    {specialistName ? `Assisting ${specialistName}` : '24/7 On-Site Operational Guide'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset conversation"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Assistant"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-start gap-2 max-w-[88%]">
                    {msg.sender === 'assistant' && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container/60 text-primary mt-0.5">
                        <Sparkles size={12} />
                      </div>
                    )}

                    <div
                      className={`rounded-2xl px-3.5 py-2.5 shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-primary text-on-primary rounded-br-xs'
                          : 'bg-surface-container-low border border-outline-variant/60 text-on-surface rounded-bl-xs'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        <p className="text-xs sm:text-[13px] leading-relaxed font-medium">{msg.text}</p>
                      ) : (
                        renderFormattedMessage(msg.text)
                      )}
                    </div>

                    {msg.sender === 'user' && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-on-surface-variant mt-0.5">
                        <User size={12} />
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-on-surface-variant/60 px-8 pt-0.5">
                    {msg.timestamp}
                  </span>

                  {/* Suggestion Chips */}
                  {msg.relatedPrompts && msg.relatedPrompts.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5 pl-8">
                      {msg.relatedPrompts.map((prompt, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          disabled={loading}
                          className="rounded-full border border-primary/30 bg-primary-container/20 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary-container hover:text-on-primary-container transition active:scale-95 disabled:opacity-50"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex items-center gap-2 pl-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-container/60 text-primary">
                    <Sparkles size={12} className="animate-spin" />
                  </div>
                  <div className="rounded-2xl rounded-bl-xs bg-surface-container-low border border-outline-variant/60 px-3.5 py-2 text-xs text-on-surface-variant flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></span>
                    <span className="text-[11px] font-medium text-on-surface-variant pl-1">Consulting SOPs…</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Bar */}
            <div className="px-3 py-1.5 border-t border-outline-variant/50 bg-surface-container-lowest overflow-x-auto flex items-center gap-1.5 no-scrollbar">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant shrink-0 flex items-center gap-1">
                <HelpCircle size={10} /> SOPs:
              </span>
              {SUGGESTED_SPECIALIST_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading}
                  className="shrink-0 rounded-md bg-surface border border-outline-variant/60 px-2 py-0.5 text-[10px] font-medium text-on-surface hover:border-primary hover:text-primary transition disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2 p-3 border-t border-outline-variant bg-surface"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about photo rules, locked gates, GPS..."
                disabled={loading}
                className="flex-1 min-h-10 rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 text-xs sm:text-sm text-on-surface focus:border-primary focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || loading}
                aria-label="Send query"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary hover:brightness-95 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
