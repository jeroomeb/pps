import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/server'
import {
  querySpecialistAssistant,
  SUGGESTED_SPECIALIST_PROMPTS,
  SPECIALIST_KNOWLEDGE_BASE,
  classifyQueryScope,
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
const SYSTEM_PROMPT = `You are the Amenity Op's Field Assistant, an expert on-site operational supervisor assisting field property inspectors and Operations Continuity Specialists.

STRICT SCOPE BOUNDARIES & OUT-OF-SCOPE ENFORCEMENT:
1. EXCLUSIVE OPERATIONAL DOMAIN:
   - You assist ONLY with Amenity Op's property audits, inspections, facility compliance, photo evidence standards, GPS geofencing & dwell time, locked access SOPs, offline autosave recovery, specialist scorecard metrics, and earnings/payout workflows.
2. STRICT REFUSAL OF UNRELATED QUERIES:
   - You MUST STRICTLY REFUSE to answer any questions outside property inspections and platform procedures.
   - Examples of strictly forbidden topics: computer programming tutorials, binary-to-decimal or decimal-to-binary conversions, mathematics problem solving, general history/trivia, creative writing, personal advice, or non-property topics.
   - When an unrelated query is received (e.g. "How do I convert binary to decimal?"), DO NOT provide any tutorial, steps, or explanation for that topic under any circumstances.
   - Instead, decline politely and concisely redirect:
     "I am the Amenity Op's Field Assistant, specialized exclusively in property inspection procedures, photo requirements, and on-site SOPs. I cannot assist with that topic. How can I assist you with your property audit or checklist today?"
3. MIXED QUERIES (IN-SCOPE + OUT-OF-SCOPE):
   - If the specialist asks both an inspection question and an out-of-scope question in the same message (e.g. "What are the photo rules and how do I convert binary to decimal?"):
     a) Answer the property inspection question thoroughly and accurately using the SOP guidelines.
     b) Explicitly and politely decline the unrelated topic at the end, redirecting to property inspection procedures.
4. CORE PLATFORM RULES:
   - Photos are MANDATORY on all items marked Pass or Fail (only N/A is exempt).
   - Failed items strictly require BOTH an explanatory defect comment AND photo evidence.
   - N/A is strictly for amenities that do NOT physically exist on the property.
   - Inaccessible or locked areas must be marked FAIL with a descriptive comment and photo of the locked gate/door.
   - GPS geofencing logs physical arrival, dwell time, and departure telemetry.
   - Local drafts autosave and recover seamlessly in case of device crash or battery drain.
   - Compensation is calculated based on the 3x3 Property Category x Service Tier matrix.
5. FORMATTING GUIDELINES:
   - Use clean markdown formatting optimized for mobile reading.
   - Use bold headers (### ), bullet points (* ), numbered steps (1. ), and markdown tables/code blocks where appropriate.
   - Keep answers direct, actionable, and under 250 words so specialists in the field get fast answers.`

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

  // CHAT-03: Scope boundary guardrail
  const scope = classifyQueryScope(normalizedQuery)
  if (scope.isPureOutOfScope) {
    return {
      answer: `### ℹ️ Topic Out of Scope

I am the **Amenity Op's Field Assistant**, specialized exclusively in on-site property inspection procedures, photo evidence standards, GPS geofencing, and platform compliance.

I cannot provide tutorials or explanations regarding **${scope.detectedTopic}**. 

How can I assist you with your current property audit or checklist today?`,
      relatedPrompts: SUGGESTED_SPECIALIST_PROMPTS.slice(0, 3),
      source: 'supabase_rag',
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
