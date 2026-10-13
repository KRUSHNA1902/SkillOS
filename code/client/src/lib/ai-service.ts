/**
 * AI Service for SkillOS
 * Connects to the SkillOS backend AI endpoints (/api/ai)
 * with graceful client-side direct fallback to Gemini API if the server is offline.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const CLIENT_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface AIChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AIChatResponse {
  reply: string;
  model: string;
  usage?: {
    totalTokenCount?: number;
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  timestamp?: string;
  source: 'backend' | 'client-direct';
}

export interface AIProjectSummaryResponse {
  summary: string;
  model: string;
  timestamp?: string;
  source: 'backend' | 'client-direct';
}

export interface AIRoadmapResponse {
  roadmap: string;
  skillName: string;
  model: string;
  timestamp?: string;
  source: 'backend' | 'client-direct';
}

const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-flash'];

/**
 * Direct client-side Gemini fallback caller in case the backend is temporarily stopped
 */
async function callGeminiDirectly(prompt: string, history: AIChatMessage[] = []): Promise<{ text: string; model: string }> {
  if (!CLIENT_GEMINI_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const msg of history.slice(-6)) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  let lastError: Error | null = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CLIENT_GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{
                text: 'You are SkillOS AI Assistant — an intelligent learning copilot and curriculum strategist built into SkillOS. Formulate helpful, markdown-formatted responses with clear bullet points and code blocks.'
              }]
            }
          })
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 503 || res.status === 404) {
          lastError = new Error(err?.error?.message || `Model ${model} unavailable`);
          continue;
        }
        throw new Error(err?.error?.message || `Gemini API error: ${res.statusText}`);
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return { text, model };
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Failed to query Gemini API');
}

/**
 * Check AI status
 */
export async function checkAIStatus(): Promise<{ configured: boolean; model?: string; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/status`);
    if (res.ok) {
      const data = await res.json();
      return {
        configured: data.configured,
        model: data.primaryModel || 'gemini-3.5-flash-lite',
        message: data.message
      };
    }
  } catch {
    // If backend isn't up, check client key
  }

  if (CLIENT_GEMINI_KEY) {
    return {
      configured: true,
      model: 'gemini-3.5-flash-lite',
      message: 'Direct Gemini API client connection ready'
    };
  }

  return {
    configured: false,
    message: 'Gemini API key not configured'
  };
}

/**
 * Send chat message to SkillOS AI
 */
export async function sendAIChat(
  message: string,
  history: AIChatMessage[] = [],
  context: Record<string, unknown> = {}
): Promise<AIChatResponse> {
  // 1. Try Backend
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, context })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        reply: data.reply,
        model: data.model,
        usage: data.usage,
        timestamp: data.timestamp,
        source: 'backend'
      };
    }
  } catch {
    console.warn('[AI Service] Backend unreachable, falling back to direct client call');
  }

  // 2. Direct Fallback
  const direct = await callGeminiDirectly(message, history);
  return {
    reply: direct.text,
    model: direct.model,
    source: 'client-direct',
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate comprehensive Data Project Summary
 */
export async function summarizeDataProject(focusArea?: string): Promise<AIProjectSummaryResponse> {
  // 1. Try Backend
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/summarize-project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ focusArea, detailed: true })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        summary: data.summary,
        model: data.model,
        timestamp: data.timestamp,
        source: 'backend'
      };
    }
  } catch {
    console.warn('[AI Service] Backend unreachable for project summary, falling back to direct client call');
  }

  // 2. Direct Fallback
  const prompt = `Please provide a comprehensive and structured executive summary of the SkillOS Data Project curriculum and learning system. Cover the three pillars (Plan, Study, Complete), the 6 data tracks (SQL, Python & Data Analytics, Power BI, Finance, AI & Cloud, Projects), the PostgreSQL/Supabase schema with 8 tables, and actionable next steps.${focusArea ? ` Focus on ${focusArea}.` : ''}`;
  const direct = await callGeminiDirectly(prompt);
  return {
    summary: direct.text,
    model: direct.model,
    source: 'client-direct',
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate custom learning roadmap
 */
export async function generateAIRoadmap(skillName: string, weeks: number = 4): Promise<AIRoadmapResponse> {
  // 1. Try Backend
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/generate-roadmap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillName, weeks })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        roadmap: data.roadmap,
        skillName: data.skillName,
        model: data.model,
        timestamp: data.timestamp,
        source: 'backend'
      };
    }
  } catch {
    console.warn('[AI Service] Backend unreachable for roadmap, falling back to direct client call');
  }

  // 2. Direct Fallback
  const prompt = `Generate a rigorous, hands-on ${weeks}-week learning roadmap for "${skillName}" suited for the SkillOS platform with modules, topics, study hours, exercises, and mastery criteria.`;
  const direct = await callGeminiDirectly(prompt);
  return {
    roadmap: direct.text,
    skillName,
    model: direct.model,
    source: 'client-direct',
    timestamp: new Date().toISOString()
  };
}
