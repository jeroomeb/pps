import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/server'
import {
  querySpecialistAssistant,
  SUGGESTED_SPECIALIST_PROMPTS,
  SPECIALIST_KNOWLEDGE_BASE,
} from '@/lib/specialist-bot-knowledge'

export interface RagResponseResult {
  answer: string
  relatedPrompts: string[]
  source: 'supabase_rag' | 'local_engine' | 'ai_fallback'
  matchedContexts?: {
    category: string
    question: string
    similarity: number
  }[]
}

/**
 * Initializes OpenAI client if API key is present in environment
 */
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.trim() === '') {
    return null
  }
  return new OpenAI({ apiKey })
}

/**
 * System prompt instructing OpenAI on how to behave as the Amenity Op's Field Assistant
 */
const SYSTEM_PROMPT = `You are the Amenity Op's OCS Field Assistant, an expert on-site operational supervisor assisting field property inspectors (Operational Continuity Specialists).

CORE RESPONSIBILITIES:
1. Answer the specialist's question clearly, concisely, and professionally using the retrieved Standard Operating Procedures (SOPs) provided in the context below.
2. Maintain strict adherence to Amenity Op's platform rules:
   - Photos are MANDATORY on all items marked Pass or Fail (only N/A is exempt).
   - Failed items strictly require BOTH an explanatory defect comment AND photo evidence.
   - N/A is strictly for amenities that do NOT physically exist on the property.
   - Inaccessible or locked areas must be marked FAIL with a descriptive comment and photo of the locked gate/door.
   - GPS geofencing logs physical arrival, dwell time, and departure telemetry.
   - Local drafts autosave and recover seamlessly in case of device crash or battery drain.
   - Compensation is calculated based on the 3x3 Property Category x Service Tier matrix.
3. FORMATTING GUIDELINES:
   - Use clean markdown formatting optimized for mobile reading.
   - Use bold headers (### ), bullet points (* ), and numbered steps (1. ).
   - Keep answers direct, actionable, and under 250 words so specialists in the field get fast answers.
4. If the retrieved context does not directly answer the specific edge case, provide safe general property audit guidance without making up fake contact numbers or unauthorized procedures.`

export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Executes a full Vector RAG query against Supabase pgvector and OpenAI with conversational memory
 */
export async function generateSpecialistRagResponse(
  userQuery: string,
  history: ChatHistoryMessage[] = []
): Promise<RagResponseResult> {
  const normalizedQuery = userQuery.trim()

  if (!normalizedQuery) {
    return {
      answer:
        "Hello! I'm your on-site Amenity Op's Field Assistant. How can I assist you with your inspection, photo requirements, or on-site SOPs today?",
      relatedPrompts: SUGGESTED_SPECIALIST_PROMPTS.slice(0, 4),
      source: 'local_engine',
    }
  }

  const openai = getOpenAIClient()

  // If OpenAI is not configured, fallback immediately to the high-performance local knowledge engine
  if (!openai) {
    const localResult = querySpecialistAssistant(normalizedQuery)
    return {
      answer: localResult.answer,
      relatedPrompts: localResult.relatedPrompts,
      source: 'local_engine',
    }
  }

  // Conversational greetings handler
  const lower = normalizedQuery.toLowerCase()
  if (
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|help|i need help|sup|yo)$/i.test(lower) ||
    lower === 'help me' ||
    lower === 'i have a question'
  ) {
    return {
      answer: `### 👋 Hello! How can I assist you today?

I am your 24/7 on-site Operational Continuity Assistant. Here are a few ways I can help you during your audit:

* **Photo & Fail Rules**: Ask about mandatory photo requirements and comment requirements.
* **Locked Access & Gates**: Guidance on how to document inaccessible areas and on-site contacts.
* **GPS & Geofencing**: Explaining on-site perimeter status and arrival dwell times.
* **Earnings & Payouts**: Questions about the 3x3 property compensation matrix.

*Type your question below or tap any suggested topic to get started!*`,
      relatedPrompts: SUGGESTED_SPECIALIST_PROMPTS.slice(0, 4),
      source: 'supabase_rag',
    }
  }

  try {
    // 1. Generate 1536-dimensional embedding using text-embedding-3-small
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: normalizedQuery,
    })

    const queryEmbedding = embeddingResponse.data[0]?.embedding

    if (!queryEmbedding) {
      throw new Error('Failed to generate query embedding')
    }

    // 2. Query Supabase vector similarity search via match_knowledge_base RPC
    const supabase = createAdminClient()
    const { data: matchedRecords, error: matchError } = await supabase.rpc(
      'match_knowledge_base',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.25,
        match_count: 4,
      }
    )

    // If Supabase vector search returns matching SOP contexts
    if (!matchError && matchedRecords && matchedRecords.length > 0) {
      const contextBlocks = matchedRecords.map(
        (rec: { category: string; question: string; content: string; similarity: number }, i: number) =>
          `[SOP CONTEXT ${i + 1}] Category: ${rec.category}\nQuestion: ${rec.question}\nGuidelines:\n${rec.content}`
      ).join('\n\n---\n\n')

      const recentHistory = history.slice(-4).map((h) => ({
        role: h.role,
        content: h.content,
      }))

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\nRETRIEVED SOP KNOWLEDGE BASE CONTEXT:\n${contextBlocks}` },
          ...recentHistory,
          { role: 'user', content: normalizedQuery },
        ],
      })

      const answerText = completion.choices[0]?.message?.content?.trim()

      if (answerText) {
        // Collect related prompts from unmatched categories
        const matchedCategories = new Set(matchedRecords.map((r: { category: string }) => r.category.toLowerCase()))
        const suggestedPrompts = SPECIALIST_KNOWLEDGE_BASE
          .filter((t) => !matchedCategories.has(t.shortLabel.toLowerCase()))
          .slice(0, 3)
          .map((t) => t.shortLabel)

        return {
          answer: answerText,
          relatedPrompts: suggestedPrompts.length > 0 ? suggestedPrompts : SUGGESTED_SPECIALIST_PROMPTS.slice(0, 3),
          source: 'supabase_rag',
          matchedContexts: matchedRecords.map((r: { category: string; question: string; similarity: number }) => ({
            category: r.category,
            question: r.question,
            similarity: Math.round(r.similarity * 100) / 100,
          })),
        }
      }
    }

    // Fallback direct generation with base knowledge if vector table has not yet been seeded
    const allTopicsSummary = SPECIALIST_KNOWLEDGE_BASE.map(
      (t) => `* ${t.title}: ${t.summary} (${t.response})`
    ).join('\n\n')

    const directCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\n\nBASE AMENITY OPS KNOWLEDGE:\n${allTopicsSummary}` },
        { role: 'user', content: normalizedQuery },
      ],
    })

    const directAnswer = directCompletion.choices[0]?.message?.content?.trim()

    if (directAnswer) {
      return {
        answer: directAnswer,
        relatedPrompts: SUGGESTED_SPECIALIST_PROMPTS.slice(0, 3),
        source: 'ai_fallback',
      }
    }
  } catch (err) {
    console.warn('[RAG Assistant] OpenAI / Supabase vector search error, falling back to local engine:', err)
  }

  // Graceful local engine fallback
  const localResult = querySpecialistAssistant(normalizedQuery)
  return {
    answer: localResult.answer,
    relatedPrompts: localResult.relatedPrompts,
    source: 'local_engine',
  }
}
