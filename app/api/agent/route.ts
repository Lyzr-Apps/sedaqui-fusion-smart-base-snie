import { NextRequest, NextResponse } from 'next/server'
import parseLLMJson from '@/lib/jsonParser'

const LYZR_TASK_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/task'
const LYZR_API_KEY = process.env.LYZR_API_KEY || ''
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Types
interface ArtifactFile {
  file_url: string
  name: string
  format_type: string
}

interface ModuleOutputs {
  artifact_files?: ArtifactFile[]
  [key: string]: any
}

interface NormalizedAgentResponse {
  status: 'success' | 'error'
  result: Record<string, any>
  message?: string
  metadata?: {
    agent_name?: string
    timestamp?: string
    [key: string]: any
  }
}

// ── OpenRouter Agent Configs (mirrors the Lyzr agent definitions) ──
const AGENT_CONFIGS: Record<string, { name: string; systemPrompt: string; temperature: number }> = {
  '699f3284491a682589955950': {
    name: 'Digital Product Content Agent',
    temperature: 0.7,
    systemPrompt: `You are an expert digital product content writer and SEO specialist for the SEDAQUI Digital Hub storefront, a premium AI-powered digital commerce platform.

Your goal: Generate compelling, SEO-optimized product descriptions, titles, feature lists, and marketing copy for digital products including e-books, courses, and SaaS tools.

Instructions: You receive a product name, category (e-book, course, SaaS tool, app), and any brief notes from the platform owner. Generate:
1) An SEO-optimized product title
2) A compelling product description (150-250 words) highlighting key benefits and features
3) A list of 5-7 key features/highlights
4) A short tagline for the product card
5) Suggested pricing tier (budget/standard/premium with reasoning)
6) 3 SEO keywords

Write in a premium, professional tone that matches the SEDAQUI luxury brand. Focus on value proposition and transformation the product delivers.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no extra text. Use this exact structure:
{"product_title":"...","description":"...","features":["...","...","...","...","..."],"tagline":"...","pricing_tier":"...","pricing_reasoning":"...","seo_keywords":["...","...","..."]}`,
  },
  '699f3284f13aaac966413d92': {
    name: 'Smart Shop Product Agent',
    temperature: 0.6,
    systemPrompt: `You are an expert e-commerce product optimizer and pricing strategist for the SEDAQUI Smart Shop storefront, a premium AI-powered digital commerce platform.

Your goal: Generate SEO-optimized product descriptions, competitive pricing recommendations, and profit margin analysis for physical products.

Instructions: You receive a product name, category, supplier cost (if available), and any product details. Generate:
1) An SEO-optimized product title
2) A compelling product description (100-200 words) focused on benefits and quality
3) A list of 5 key product features/specifications
4) Recommended retail price with profit margin analysis
5) A short marketing tagline
6) Suggested product category tags
7) Shipping estimate note

Write in an engaging, trustworthy e-commerce tone. Focus on product quality and value. Never mention dropshipping.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no extra text. Use this exact structure:
{"product_title":"...","description":"...","features":["...","...","...","...","..."],"recommended_price":"...","profit_analysis":"...","tagline":"...","category_tags":["...","..."],"shipping_note":"..."}`,
  },
  '699f3285baa7d9b4a230cbe2': {
    name: 'AI Agent Storefront Agent',
    temperature: 0.7,
    systemPrompt: `You are an expert AI product marketer specializing in consumer AI agent products for the SEDAQUI AI Agent Store, a premium AI-powered digital commerce platform.

Your goal: Generate compelling product page copy, detailed feature lists, pricing justification, and upsell recommendations for affordable personal AI agents.

Instructions: You receive an AI agent name, category (fitness, language, cooking, business, study, productivity), and brief capability notes. Generate:
1) A catchy product title for the AI agent
2) A compelling description (100-200 words) explaining what the AI agent does and its benefits
3) A list of 5-7 key capabilities/features
4) Suggested price point ($5-$25 range with justification)
5) An upsell recommendation (what premium tier or companion agent to suggest)
6) A short tagline for the product card
7) Use case examples (3 scenarios)

Write in an exciting, accessible tone that makes AI feel approachable and valuable.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no extra text. Use this exact structure:
{"agent_title":"...","description":"...","capabilities":["...","...","...","...","..."],"suggested_price":"...","price_justification":"...","upsell_recommendation":"...","tagline":"...","use_cases":["...","...","..."]}`,
  },
  '699f32a1baa7d9b4a230cbe8': {
    name: 'Customer Support Agent',
    temperature: 0.3,
    systemPrompt: `You are the SEDAQUI customer support specialist, a friendly and knowledgeable assistant for the SEDAQUI digital commerce platform.

SEDAQUI has three storefronts:
- Digital Hub: e-books, courses, SaaS tools, apps (instant digital delivery via email)
- Smart Shop: physical products - electronics, fashion, home, fitness (ships in 3-5 business days, free shipping over $50)
- AI Agent Store: personal AI agents priced $5-$25 (instant access after purchase)

Policies:
- 30-day refund policy for all products
- Digital products: refund if less than 25% consumed
- Physical products: return in original condition, buyer pays return shipping unless defective, refund processed in 5-10 business days
- AI agents: 7-day refund window, case-by-case after 7 days
- Contact: sedaqui@gmail.com
- Support response time: within 24 hours
- All payments are secure and encrypted

Guidelines:
1) Always be friendly, professional, and helpful
2) Answer questions about products, orders, shipping, refunds, and policies
3) For order-specific queries, ask for the order number
4) If you don't know something, say so honestly and suggest contacting sedaqui@gmail.com
5) Never make up information about orders or products
6) Keep responses concise but thorough

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no extra text. Use this exact structure:
{"answer":"...","follow_up_question":"...","category":"..."}
The category should be one of: general, orders, shipping, refunds, products, policies, account`,
  },
  '699f32b4d19ec1f1c4d3e7fe': {
    name: 'Order Fulfillment Agent',
    temperature: 0.3,
    systemPrompt: `You are the SEDAQUI order fulfillment specialist responsible for composing professional post-purchase emails for the SEDAQUI digital commerce platform.

You receive order details including: customer name, email, product(s) purchased, order number, and order type (digital/physical/ai-agent). Generate an appropriate email:
1) For digital products: confirmation with immediate download/access links
2) For physical products: confirmation with estimated shipping timeline (3-5 business days) and tracking info placeholder
3) For AI agents: confirmation with access credentials and getting started guide link

All emails should:
- Use a professional, warm tone
- Include the SEDAQUI branding
- Have a clear subject line
- Include order summary
- Provide support contact (sedaqui@gmail.com)
- Suggest related products as upsell
- Format email body as clean, readable text

Note: In fallback mode, the email content is generated for preview. The admin can use it to send manually or copy into their email client.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no extra text. Use this exact structure:
{"email_subject":"...","email_body_preview":"...","status":"generated","upsell_products":["...","...","..."]}`,
  },
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function normalizeResponse(parsed: any): NormalizedAgentResponse {
  if (!parsed) {
    return { status: 'error', result: {}, message: 'Empty response from agent' }
  }

  if (typeof parsed === 'string') {
    return { status: 'success', result: { text: parsed }, message: parsed }
  }

  if (typeof parsed !== 'object') {
    return { status: 'success', result: { value: parsed }, message: String(parsed) }
  }

  if ('status' in parsed && 'result' in parsed) {
    return {
      status: parsed.status === 'error' ? 'error' : 'success',
      result: parsed.result || {},
      message: parsed.message,
      metadata: parsed.metadata,
    }
  }

  if ('status' in parsed) {
    const { status, message, metadata, ...rest } = parsed
    return {
      status: status === 'error' ? 'error' : 'success',
      result: Object.keys(rest).length > 0 ? rest : {},
      message,
      metadata,
    }
  }

  if ('result' in parsed) {
    const r = parsed.result
    const msg = parsed.message
      ?? (typeof r === 'string' ? r : null)
      ?? (r && typeof r === 'object'
          ? (r.text ?? r.message ?? r.response ?? r.answer ?? r.summary ?? r.content)
          : null)
    return {
      status: 'success',
      result: typeof r === 'string' ? { text: r } : (r || {}),
      message: typeof msg === 'string' ? msg : undefined,
      metadata: parsed.metadata,
    }
  }

  if ('message' in parsed && typeof parsed.message === 'string') {
    return { status: 'success', result: { text: parsed.message }, message: parsed.message }
  }

  if ('response' in parsed) {
    return normalizeResponse(parsed.response)
  }

  return { status: 'success', result: parsed, message: undefined, metadata: undefined }
}

/**
 * Call OpenRouter as fallback when Lyzr credits are exhausted.
 * Uses a free model (google/gemini-2.0-flash-exp:free) with the same
 * system prompts and response schemas as the original Lyzr agents.
 */
async function callOpenRouter(message: string, agent_id: string): Promise<NextResponse> {
  const config = AGENT_CONFIGS[agent_id]
  if (!config) {
    return NextResponse.json({
      success: false,
      response: { status: 'error', result: {}, message: `Unknown agent_id for fallback: ${agent_id}` },
      error: `Unknown agent_id for fallback: ${agent_id}`,
    }, { status: 400 })
  }

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({
      success: false,
      response: { status: 'error', result: {}, message: 'OPENROUTER_API_KEY not configured' },
      error: 'OPENROUTER_API_KEY not configured',
    }, { status: 500 })
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://sedaqui.com',
        'X-Title': 'SEDAQUI Platform',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: config.temperature,
        top_p: 0.95,
        max_tokens: 2048,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      let errorDetail = `OpenRouter request failed with status ${res.status}`
      try {
        const errJson = JSON.parse(errorText)
        errorDetail = errJson?.error?.message || errJson?.error || errorDetail
      } catch {}
      return NextResponse.json({
        success: false,
        response: { status: 'error', result: {}, message: errorDetail },
        error: errorDetail,
      }, { status: res.status })
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content || ''

    // Parse the JSON response from OpenRouter
    let parsed: any = null
    try {
      parsed = JSON.parse(content)
    } catch {
      parsed = parseLLMJson(content)
    }

    if (!parsed || typeof parsed !== 'object') {
      parsed = { text: content }
    }

    const normalized = normalizeResponse({ result: parsed })

    return NextResponse.json({
      success: true,
      status: 'completed',
      response: normalized,
      timestamp: new Date().toISOString(),
      provider: 'openrouter',
      model: 'google/gemini-2.0-flash-exp:free',
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'OpenRouter request failed'
    return NextResponse.json({
      success: false,
      response: { status: 'error', result: {}, message: errorMsg },
      error: errorMsg,
    }, { status: 500 })
  }
}

/**
 * POST /api/agent
 *
 * Flow:
 *   1. If body has { task_id } -> poll Lyzr for result
 *   2. If body has { message, agent_id } -> try Lyzr first, fallback to OpenRouter if credits exhausted
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // ── Poll mode: body has task_id ──
    if (body.task_id) {
      const pollResult = await pollTask(body.task_id)
      const pollData = await pollResult.json()

      // If poll fails with credits exhausted, tell client to retry
      const errorStr = (pollData.error || '').toLowerCase()
      if (!pollData.success && (errorStr.includes('credits exhausted') || errorStr.includes('credits'))) {
        return NextResponse.json({
          success: false,
          status: 'failed',
          response: { status: 'error', result: {}, message: 'Credits exhausted. Please retry — the system will use fallback.' },
          error: 'credits_exhausted_poll',
          retry_with_fallback: true,
        }, { status: 402 })
      }

      return NextResponse.json(pollData)
    }

    // ── Submit mode: body has message + agent_id ──
    const { message, agent_id } = body

    if (!message || !agent_id) {
      return NextResponse.json({
        success: false,
        response: { status: 'error', result: {}, message: 'message and agent_id are required' },
        error: 'message and agent_id are required',
      }, { status: 400 })
    }

    // Try Lyzr first (if API key exists)
    if (LYZR_API_KEY) {
      const lyzrResult = await submitTask(body)
      const lyzrData = await lyzrResult.json()

      // Check if Lyzr returned credits exhausted
      const lyzrError = (lyzrData?.error || lyzrData?.response?.message || '').toLowerCase()
      const isCreditsExhausted = lyzrError.includes('credits exhausted') || lyzrError.includes('credits')

      if (!isCreditsExhausted && (lyzrData.task_id || lyzrData.success)) {
        // Lyzr accepted the task — return task_id for polling
        return NextResponse.json(lyzrData)
      }

      // Lyzr failed or credits exhausted — fall through to OpenRouter
    }

    // ── Fallback to OpenRouter (synchronous, no polling needed) ──
    return callOpenRouter(message, agent_id)

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({
      success: false,
      response: { status: 'error', result: {}, message: errorMsg },
      error: errorMsg,
    }, { status: 500 })
  }
}

/**
 * Submit a new async task to Lyzr
 */
async function submitTask(body: any) {
  const { message, agent_id, user_id, session_id, assets } = body

  if (!message || !agent_id) {
    return NextResponse.json(
      {
        success: false,
        response: { status: 'error', result: {}, message: 'message and agent_id are required' },
        error: 'message and agent_id are required',
      },
      { status: 400 }
    )
  }

  const finalUserId = user_id || `user-${generateUUID()}`
  const finalSessionId = session_id || `${agent_id}-${generateUUID().substring(0, 12)}`

  const payload: Record<string, any> = {
    message,
    agent_id,
    user_id: finalUserId,
    session_id: finalSessionId,
  }

  if (assets && assets.length > 0) {
    payload.assets = assets
  }

  const submitRes = await fetch(LYZR_TASK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': LYZR_API_KEY,
    },
    body: JSON.stringify(payload),
  })

  if (!submitRes.ok) {
    const submitText = await submitRes.text()
    let errorMsg = `Task submit failed with status ${submitRes.status}`
    try {
      const errorData = JSON.parse(submitText)
      errorMsg = errorData?.detail || errorData?.error || errorData?.message || errorMsg
    } catch {
      try {
        const errorData = parseLLMJson(submitText)
        errorMsg = errorData?.error || errorData?.message || errorMsg
      } catch {}
    }
    return NextResponse.json(
      {
        success: false,
        response: { status: 'error', result: {}, message: errorMsg },
        error: errorMsg,
        raw_response: submitText,
      },
      { status: submitRes.status }
    )
  }

  const data = await submitRes.json()

  return NextResponse.json({
    task_id: data.task_id,
    agent_id,
    user_id: finalUserId,
    session_id: finalSessionId,
  })
}

/**
 * Poll a task by ID
 */
async function pollTask(task_id: string) {
  const pollRes = await fetch(`${LYZR_TASK_URL}/${task_id}`, {
    headers: {
      'accept': 'application/json',
      'x-api-key': LYZR_API_KEY,
    },
  })

  if (!pollRes.ok) {
    const pollText = await pollRes.text()
    let msg = pollRes.status === 404
      ? 'Task expired or not found'
      : `Poll failed with status ${pollRes.status}`
    try {
      const errData = JSON.parse(pollText)
      msg = errData?.detail || errData?.error || msg
    } catch {}
    return NextResponse.json(
      {
        success: false,
        status: 'failed',
        error: msg,
        raw_response: pollText,
      },
      { status: pollRes.status }
    )
  }

  const task = await pollRes.json()

  if (task.status === 'processing') {
    return NextResponse.json({ status: 'processing' })
  }

  if (task.status === 'failed') {
    return NextResponse.json(
      {
        success: false,
        status: 'failed',
        response: { status: 'error', result: {}, message: task.error || 'Agent task failed' },
        error: task.error || 'Agent task failed',
      },
      { status: 500 }
    )
  }

  // Task completed
  const rawText = JSON.stringify(task.response)
  let moduleOutputs: ModuleOutputs | undefined
  let agentResponseRaw: any = rawText

  try {
    const envelope = JSON.parse(rawText)
    if (envelope && typeof envelope === 'object' && 'response' in envelope) {
      moduleOutputs = envelope.module_outputs
      agentResponseRaw = envelope.response
    }
  } catch {
    // Not standard JSON envelope
  }

  const parsed = parseLLMJson(agentResponseRaw)

  const toNormalize =
    parsed && typeof parsed === 'object' && parsed.success === false && parsed.data === null
      ? agentResponseRaw
      : parsed

  const normalized = normalizeResponse(toNormalize)

  return NextResponse.json({
    success: true,
    status: 'completed',
    response: normalized,
    module_outputs: moduleOutputs,
    timestamp: new Date().toISOString(),
    raw_response: rawText,
  })
}
