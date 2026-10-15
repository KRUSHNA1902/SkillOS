/**
 * AI Service for SkillOS
 * Connects to the SkillOS backend AI endpoints (/api/ai)
 * with graceful client-side direct fallback to Gemini API if the server is offline.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const CLIENT_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const getAIHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined' && localStorage.getItem('skillos_dev_user')) {
    headers['x-dev-user'] = 'dev-user-001';
  }
  return headers;
};

export type AIMode = 'learning' | 'planning' | 'notes';

export interface AIChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AIChatResponse {
  reply: string;
  model: string;
  mode?: AIMode;
  latencyMs?: number;
  thought?: string;
  usage?: {
    totalTokenCount?: number;
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  timestamp?: string;
  source: 'backend' | 'client-direct';
}

export interface AIEvaluationResponse {
  isCorrect: boolean;
  status: 'correct' | 'partial' | 'incorrect';
  score: number;
  verdictTitle: string;
  feedback: string;
  errorsIdentified?: string[];
  optimalSolution: string;
  explanation: string;
  model?: string;
  source?: 'backend' | 'client-direct';
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

export const FAST_PRIMARY_MODEL = 'gemini-3.5-flash-lite';
export const DEEP_REASONING_MODEL = 'gemini-3.8-flash';

const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
];

export const CLIENT_MODE_PROMPTS: Record<AIMode, string> = {
  learning: `You are the SkillOS Learning Copilot — an expert pedagogical tutor and problem-solving mentor.
Your mission is to help the user master technical topics (SQL, Python, Power BI, Finance, AI, etc.) through deep, clear explanations and interactive practice.
When explaining any concept or solving any problem:
1. Provide an intuitive, step-by-step conceptual breakdown.
2. Provide clean, well-commented code/query examples.
3. Highlight key rules, common mistakes, and edge cases.
4. End your response with a structured practice challenge formatted clearly as:
---
### 🎯 Practice Challenge: [Challenge Title]
**Problem Statement:** [Clear description of what query, function, or calculation to write]
**Sample Input / Schema:**
\`\`\`sql
[Schema or sample records]
\`\`\`
**Expected Output:** [Expected result table or return value]
**Constraint:** [e.g. Must use window function, no subqueries]
**Hint:** [Subtle hint to guide the learner]
---`,

  planning: `You are the SkillOS Curriculum & Workflow Architect.
Your mission is to design actionable, chronologically sequenced learning workflows and study execution roadmaps.
When asked about learning a skill, transitioning careers, or preparing for projects:
1. Provide a high-level Workflow Strategy & Architecture.
2. Break it down into structured Chronological Phases (e.g. Phase 1: Foundation, Phase 2: Core Patterns, Phase 3: Advanced Optimization & Capstone).
3. For each Phase provide:
   - Specific Topics to master (aligned with SkillOS's 7-state topic progression: Not Started, In Progress, Practised, Completed, Mastered).
   - Estimated daily/weekly study hours.
   - Milestone Practice Exercises or Artifacts.
   - Verification Checkpoint (criteria to verify mastery).
4. Provide a Daily Study Routine (e.g., 45m Theory, 45m Hands-on Coding/Drills, 15m Log & Reflection).
Format with clear markdown tables, bullet points, and milestone badges.`,

  notes: `You are the SkillOS Knowledge Synthesizer & Note Architect.
Your mission is to synthesize learning and planning into comprehensive, high-yield study notes with an explicit chronological timeline.
Format every note with:
1. **Executive Summary**: Core definition and purpose in 2-3 sentences.
2. **⏳ Chronological Concept Timeline**: Ordered progression of how this topic is mastered (from foundational prerequisites -> core syntax -> intermediate logic -> advanced optimizations -> production readiness).
3. **⚡ Syntax & Formulas Cheatsheet**: Clean, copy-pasteable code blocks, query templates, or mathematical formulas.
4. **⚠️ Common Pitfalls & Anti-Patterns**: What errors learners frequently make and the correct patterns.
5. **🧠 Spaced Repetition Recall Questions**: 3-4 key questions to test memory later.
Format with clean GitHub-flavored markdown, callouts, and code blocks.`
};

/**
 * Direct client-side Gemini fallback caller in case the backend is temporarily stopped
 */
export async function callGeminiDirectly(
  prompt: string,
  history: AIChatMessage[] = [],
  mode: AIMode = 'learning',
  customInstruction?: string,
  signal?: AbortSignal
): Promise<{ text: string; model: string }> {
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

  const systemInstructionText = customInstruction || CLIENT_MODE_PROMPTS[mode] || CLIENT_MODE_PROMPTS.learning;
  let lastError: Error | null = null;

  for (const model of FALLBACK_MODELS) {
    try {
      if (signal?.aborted) {
        throw new DOMException('Aborted by user', 'AbortError');
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CLIENT_GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{
                text: systemInstructionText
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
      if (signal?.aborted || (err instanceof Error && err.name === 'AbortError')) {
        throw err;
      }
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
        model: data.primaryModel || FAST_PRIMARY_MODEL,
        message: data.message
      };
    }
  } catch {
    // If backend isn't up, check client key
  }

  if (CLIENT_GEMINI_KEY) {
    return {
      configured: true,
      model: FAST_PRIMARY_MODEL,
      message: 'Direct Gemini API client connection ready'
    };
  }

  return {
    configured: false,
    message: 'Gemini API key not configured'
  };
}

export interface AIStreamCallbacks {
  onChunk: (chunk: string) => void;
  signal?: AbortSignal;
}

/**
 * Stream chat message to SkillOS AI with SSE streaming and direct client fallback
 * Delivers sub-second Time-To-First-Token (TTFT)
 */
export async function streamAIChat(
  message: string,
  history: AIChatMessage[] = [],
  context: Record<string, unknown> = {},
  mode: AIMode = 'learning',
  model: string = FAST_PRIMARY_MODEL,
  callbacks: AIStreamCallbacks
): Promise<AIChatResponse> {
  const startTime = performance.now();
  const { onChunk, signal } = callbacks;

  // 1. Try Backend SSE Endpoint
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/chat-stream`, {
      method: 'POST',
      headers: getAIHeaders(),
      body: JSON.stringify({ message, history, context, mode, model }),
      credentials: 'include',
      signal
    });

    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedReply = '';
      let resolvedModel = model;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const data = JSON.parse(jsonStr);
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.text) {
                accumulatedReply += data.text;
                onChunk(data.text);
              }
              if (data.model) {
                resolvedModel = data.model;
              }
            } catch {
              // ignore partial line parsing
            }
          }
        }
      }

      if (accumulatedReply.trim().length > 0) {
        const latencyMs = Math.round(performance.now() - startTime);
        return {
          reply: accumulatedReply,
          model: resolvedModel,
          mode,
          latencyMs,
          thought: `Streamed response via ${resolvedModel} (${mode} mode) in ${(latencyMs / 1000).toFixed(1)}s`,
          source: 'backend',
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (err: unknown) {
    if (signal?.aborted || (err instanceof Error && err.name === 'AbortError')) {
      throw err;
    }
    console.warn('[AI Service] Backend stream unreachable or failed, falling back to direct client stream');
  }

  // 2. Direct Fallback: Client-side direct SSE stream to Gemini API
  if (CLIENT_GEMINI_KEY) {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const msg of history.slice(-6)) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }

    let userPrompt = message;
    if (context && Object.keys(context).length > 0) {
      userPrompt = `[Context: Active mode: ${mode}, Focus: ${context.focusArea || 'Data Engineering & Analytics'}]\n\n${message}`;
    }
    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    const systemInstructionText = CLIENT_MODE_PROMPTS[mode] || CLIENT_MODE_PROMPTS.learning;
    const modelOrder = model
      ? [model, ...FALLBACK_MODELS.filter(m => m !== model)]
      : FALLBACK_MODELS;

    for (const targetModel of modelOrder) {
      try {
        if (signal?.aborted) throw new DOMException('Aborted by user', 'AbortError');

        const streamRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?alt=sse&key=${CLIENT_GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal,
            body: JSON.stringify({
              contents,
              systemInstruction: {
                parts: [{ text: systemInstructionText }]
              },
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
              }
            })
          }
        );

        if (!streamRes.ok || !streamRes.body) {
          continue;
        }

        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedReply = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  accumulatedReply += text;
                  onChunk(text);
                }
              } catch {
                // ignore partial JSON chunk
              }
            }
          }
        }

        if (accumulatedReply.trim().length > 0) {
          const latencyMs = Math.round(performance.now() - startTime);
          return {
            reply: accumulatedReply,
            model: targetModel,
            mode,
            latencyMs,
            thought: `Streamed directly from Gemini API via ${targetModel} in ${(latencyMs / 1000).toFixed(1)}s`,
            source: 'client-direct',
            timestamp: new Date().toISOString()
          };
        }
      } catch (err) {
        if (signal?.aborted || (err instanceof Error && err.name === 'AbortError')) {
          throw err;
        }
      }
    }
  }

  // 3. Last fallback: non-streaming sendAIChat
  const fallbackRes = await sendAIChat(message, history, context, mode, model, signal);
  onChunk(fallbackRes.reply);
  return fallbackRes;
}

/**
 * Send chat message to SkillOS AI with mode and model support
 */
export async function sendAIChat(
  message: string,
  history: AIChatMessage[] = [],
  context: Record<string, unknown> = {},
  mode: AIMode = 'learning',
  model: string = FAST_PRIMARY_MODEL,
  signal?: AbortSignal
): Promise<AIChatResponse> {
  const startTime = performance.now();
  // 1. Try Backend
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: getAIHeaders(),
      body: JSON.stringify({ message, history, context, mode, model }),
      credentials: 'include',
      signal
    });

    if (res.ok) {
      const data = await res.json();
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        reply: data.reply,
        model: data.model,
        mode: data.mode || mode,
        latencyMs,
        thought: `Synthesized curriculum context and formed ${mode} plan via ${data.model} in ${(latencyMs / 1000).toFixed(1)}s`,
        usage: data.usage,
        timestamp: data.timestamp,
        source: 'backend'
      };
    }
  } catch (err: unknown) {
    if (signal?.aborted || (err instanceof Error && err.name === 'AbortError')) {
      throw err;
    }
    console.warn('[AI Service] Backend unreachable, falling back to direct client call');
  }

  // 2. Direct Fallback
  const direct = await callGeminiDirectly(message, history, mode, undefined, signal);
  const latencyMs = Math.round(performance.now() - startTime);
  return {
    reply: direct.text,
    model: direct.model,
    mode,
    latencyMs,
    thought: `Connected directly to Google Gemini API via ${direct.model} (${mode} mode) in ${(latencyMs / 1000).toFixed(1)}s`,
    source: 'client-direct',
    timestamp: new Date().toISOString()
  };
}

/**
 * Evaluate user's answer against a practice challenge
 */
export async function evaluateUserAnswer(
  question: string,
  userAnswer: string,
  context: Record<string, unknown> = {}
): Promise<AIEvaluationResponse> {
  // 1. Try Backend
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/evaluate-answer`, {
      method: 'POST',
      headers: getAIHeaders(),
      body: JSON.stringify({ question, userAnswer, context }),
      credentials: 'include'
    });

    if (res.ok) {
      const data = await res.json();
      return {
        isCorrect: data.isCorrect,
        status: data.status || (data.isCorrect ? 'correct' : 'partial'),
        score: data.score ?? (data.isCorrect ? 100 : 70),
        verdictTitle: data.verdictTitle || (data.isCorrect ? 'Solution Verified!' : 'Needs Adjustment'),
        feedback: data.feedback,
        errorsIdentified: data.errorsIdentified || [],
        optimalSolution: data.optimalSolution || '-- Optimal code solution',
        explanation: data.explanation || '',
        model: data.model,
        source: 'backend'
      };
    }
  } catch {
    console.warn('[AI Service] Backend unreachable for evaluation, falling back to direct client call');
  }

  // 2. Direct Fallback
  const evalPrompt = `You are the SkillOS Practice Evaluator and Technical Mentor.
A learner was given this practice challenge:
"""
${question}
"""

The learner submitted this answer or code:
"""
${userAnswer}
"""

Evaluate the answer. Return STRICT RAW JSON format with NO markdown wrapping, NO \`\`\`json code fence:
{
  "isCorrect": true,
  "status": "correct",
  "score": 100,
  "verdictTitle": "Short verdict title",
  "feedback": "Concise, constructive explanation of whether the solution works and why.",
  "errorsIdentified": [],
  "optimalSolution": "The cleanest, optimal query or code snippet demonstrating industry best practices.",
  "explanation": "Why this solution is optimal, noting edge cases or performance."
}`;

  const direct = await callGeminiDirectly(evalPrompt, [], 'learning', 'You are an accurate, strict, but encouraging technical coding evaluator. Respond with raw JSON only.');
  
  try {
    const cleanJson = direct.text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      isCorrect: Boolean(parsed.isCorrect),
      status: parsed.status || (parsed.isCorrect ? 'correct' : 'partial'),
      score: parsed.score ?? (parsed.isCorrect ? 100 : 70),
      verdictTitle: parsed.verdictTitle || (parsed.isCorrect ? 'Solution Verified!' : 'Needs Adjustment'),
      feedback: parsed.feedback || direct.text,
      errorsIdentified: parsed.errorsIdentified || [],
      optimalSolution: parsed.optimalSolution || '-- Optimal solution',
      explanation: parsed.explanation || '',
      model: direct.model,
      source: 'client-direct'
    };
  } catch {
    const isLikelyCorrect = direct.text.toLowerCase().includes('correct') && !direct.text.toLowerCase().includes('incorrect');
    return {
      isCorrect: isLikelyCorrect,
      status: isLikelyCorrect ? 'correct' : 'partial',
      score: isLikelyCorrect ? 100 : 70,
      verdictTitle: isLikelyCorrect ? 'Solution Verified!' : 'Needs Revision',
      feedback: direct.text,
      errorsIdentified: [],
      optimalSolution: '-- Optimal solution provided in feedback',
      explanation: 'See feedback for full breakdown.',
      model: direct.model,
      source: 'client-direct'
    };
  }
}

/**
 * Generate comprehensive Data Project Summary
 */
export async function summarizeDataProject(focusArea?: string): Promise<AIProjectSummaryResponse> {
  // 1. Try Backend
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/summarize-project`, {
      method: 'POST',
      headers: getAIHeaders(),
      body: JSON.stringify({ focusArea, detailed: true }),
      credentials: 'include'
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
      headers: getAIHeaders(),
      body: JSON.stringify({ skillName, weeks }),
      credentials: 'include'
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

export interface SuggestedMilestone {
  title: string;
  description: string;
  deliverables: string[];
  suggestedDurationDays: number;
}

export interface AIProjectMilestonesResult {
  milestones: SuggestedMilestone[];
  architectureNotes: string;
  model: string;
}

/**
 * Generate project milestones and architecture notes with Gemini
 */
export async function generateProjectMilestones(
  projectTitle: string,
  track: string,
  tagline?: string,
  techStack?: string[]
): Promise<AIProjectMilestonesResult> {
  const stackStr = techStack && techStack.length > 0 ? techStack.join(', ') : 'modern industry-standard tools';
  const prompt = `You are a Principal Software Architect and Technical Lead.
Create a structured 4-phase project milestone breakdown and technical architecture notes for a high-impact engineering portfolio project:
Project Title: "${projectTitle}"
Domain / Track: "${track}"
${tagline ? `Tagline / Objective: "${tagline}"` : ''}
Tech Stack: ${stackStr}

Provide your response in EXACTLY the following JSON format without Markdown formatting or code fences:
{
  "milestones": [
    {
      "title": "Phase 1: Architecture & Data Ingestion Pipeline",
      "description": "Brief description of phase objectives",
      "deliverables": [
        "Deliverable 1 item",
        "Deliverable 2 item",
        "Deliverable 3 item"
      ],
      "suggestedDurationDays": 7
    },
    {
      "title": "Phase 2: Core Processing & Engine Implementation",
      "description": "Brief description of phase objectives",
      "deliverables": [
        "Deliverable 1 item",
        "Deliverable 2 item"
      ],
      "suggestedDurationDays": 10
    },
    {
      "title": "Phase 3: Integration, APIs & User Interface",
      "description": "Brief description of phase objectives",
      "deliverables": [
        "Deliverable 1 item",
        "Deliverable 2 item"
      ],
      "suggestedDurationDays": 8
    },
    {
      "title": "Phase 4: Testing, Performance Benchmarking & Portfolio Showcase",
      "description": "Brief description of phase objectives",
      "deliverables": [
        "Deliverable 1 item",
        "Deliverable 2 item",
        "Deliverable 3 item"
      ],
      "suggestedDurationDays": 5
    }
  ],
  "architectureNotes": "Markdown formatted summary covering system design, data flow, key engineering trade-offs, and portfolio showcase talking points."
}`;

  try {
    const direct = await callGeminiDirectly(prompt);
    let cleaned = direct.text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
      return {
        milestones: parsed.milestones,
        architectureNotes: parsed.architectureNotes || 'System architecture designed for high scalability and clean separation of concerns.',
        model: direct.model
      };
    }
  } catch (err) {
    console.warn('[AI Service] Failed to parse AI milestones JSON, using fallback template:', err);
  }

  // Graceful fallback if offline or parse error
  return {
    milestones: [
      {
        title: "Phase 1: Architecture Design & Data Modeling",
        description: `Define system architecture, schemas, and foundational ingestion workflows for ${projectTitle}.`,
        deliverables: [
          "Establish relational/lakehouse schema definitions and ER diagrams",
          "Configure local development environment and CI/CD linting",
          "Build initial data ingestion connectors and mock sample data"
        ],
        suggestedDurationDays: 7
      },
      {
        title: "Phase 2: Core Processing Engine & Business Logic",
        description: "Implement high-performance processing algorithms and analytical modules.",
        deliverables: [
          "Develop core ETL/processing pipelines with vectorized transformations",
          "Implement unit and integration tests with edge case coverage",
          "Optimize indexing and query performance benchmarks"
        ],
        suggestedDurationDays: 10
      },
      {
        title: "Phase 3: Interface, Visualizations & API Layer",
        description: "Build user-facing interactive interfaces and API endpoints.",
        deliverables: [
          "Expose high-throughput REST / WebSocket endpoints",
          "Construct interactive dashboard with responsive dark obsidian theme",
          "Implement robust error boundaries and state caching"
        ],
        suggestedDurationDays: 8
      },
      {
        title: "Phase 4: Deployment, Verification & Portfolio Showcase",
        description: "Deploy production build and author executive documentation.",
        deliverables: [
          "Deploy live application to cloud hosting with SSL and health checks",
          "Publish comprehensive GitHub README with architecture diagrams and badges",
          "Record interactive Loom demo showcasing key technical achievements"
        ],
        suggestedDurationDays: 5
      }
    ],
    architectureNotes: `### ${projectTitle} Architecture Spec\n- **Domain**: ${track}\n- **Stack**: ${stackStr}\n- **Design Pattern**: Modular service layers with strict data contracts and reproducible pipelines.\n- **Portfolio Highlight**: Demonstrates production-grade engineering, verifiable automated tests, and real-time observability.`,
    model: FAST_PRIMARY_MODEL
  };
}

