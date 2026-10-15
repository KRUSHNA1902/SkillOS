import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
];

const MODE_PROMPTS = {
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

const SKILLOS_SYSTEM_PROMPT = MODE_PROMPTS.learning;

/**
 * Call Gemini API with automatic fallback across models
 */
async function callGemini(contents, systemInstruction = SKILLOS_SYSTEM_PROMPT, requestedModel = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }

  const modelOrder = requestedModel
    ? [requestedModel, ...GEMINI_MODELS.filter(m => m !== requestedModel)]
    : GEMINI_MODELS;

  let lastError = null;

  for (const model of modelOrder) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        // If model unavailable or not found, try next model in fallback list
        if (status === 503 || status === 404 || status === 429 || (status === 400 && errorData?.error?.message?.toLowerCase()?.includes('model'))) {
          lastError = new Error(`Model ${model} returned ${status}: ${errorData?.error?.message || response.statusText}`);
          continue;
        }
        throw new Error(errorData?.error?.message || `Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Empty response received from Gemini');
      }

      return {
        text,
        model,
        usage: data?.usageMetadata || null
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate content with available Gemini models');
}

/**
 * GET /api/ai/status
 * Health check for AI integration
 */
router.get('/status', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      configured: false,
      message: 'GEMINI_API_KEY is not configured',
      activeModel: null,
    });
  }

  return res.status(200).json({
    configured: true,
    message: 'Gemini AI configured and ready',
    supportedModels: GEMINI_MODELS,
    primaryModel: GEMINI_MODELS[0],
  });
});

/**
 * POST /api/ai/chat
 * Interactive chat with Gemini AI Copilot
 */
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { message, history = [], context = {}, mode = 'learning', model: requestedModel } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Valid message string is required' });
    }

    // Format chat contents
    const contents = [];

    // Add prior conversation turns if provided
    if (Array.isArray(history)) {
      for (const turn of history.slice(-6)) {
        if (turn.role && turn.text) {
          contents.push({
            role: turn.role === 'user' ? 'user' : 'model',
            parts: [{ text: turn.text }]
          });
        }
      }
    }

    // Add current user prompt (including context if provided)
    let userPrompt = message;
    if (context && Object.keys(context).length > 0) {
      userPrompt = `[Context: Active mode: ${mode}, Focus: ${context.focusArea || 'Data Engineering & Analytics'}]\n\n${message}`;
    }

    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    const systemPrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.learning;
    const result = await callGemini(contents, systemPrompt, requestedModel);

    res.json({
      reply: result.text,
      model: result.model,
      mode,
      usage: result.usage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI Chat Error]:', error);
    res.status(500).json({
      error: error.message || 'Internal AI processing error',
      modelFallbackAttempted: true
    });
  }
});

/**
 * POST /api/ai/chat-stream
 * Server-Sent Events (SSE) streaming chat endpoint for sub-second TTFT
 */
router.post('/chat-stream', requireAuth, async (req, res) => {
  try {
    const { message, history = [], context = {}, mode = 'learning', model: requestedModel } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Valid message string is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    }

    // Configure Server-Sent Events response headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering if deployed behind reverse proxy
    if (res.flushHeaders) {
      res.flushHeaders();
    }

    const abortController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    const contents = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-6)) {
        if (turn.role && turn.text) {
          contents.push({
            role: turn.role === 'user' ? 'user' : 'model',
            parts: [{ text: turn.text }]
          });
        }
      }
    }

    let userPrompt = message;
    if (context && Object.keys(context).length > 0) {
      userPrompt = `[Context: Active mode: ${mode}, Focus: ${context.focusArea || 'Data Engineering & Analytics'}]\n\n${message}`;
    }
    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    const systemPrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.learning;
    const modelOrder = requestedModel
      ? [requestedModel, ...GEMINI_MODELS.filter(m => m !== requestedModel)]
      : GEMINI_MODELS;

    let streamSuccess = false;

    for (const model of modelOrder) {
      if (abortController.signal.aborted) break;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
        const payload = {
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        };

        const upstreamRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: abortController.signal
        });

        if (!upstreamRes.ok) {
          const errorData = await upstreamRes.json().catch(() => ({}));
          const status = upstreamRes.status;
          if (status === 503 || status === 404 || status === 429 || (status === 400 && errorData?.error?.message?.toLowerCase()?.includes('model'))) {
            console.warn(`[AI Stream] Model ${model} returned ${status}, trying next fallback model...`);
            continue;
          }
          throw new Error(errorData?.error?.message || `Gemini API error: ${upstreamRes.statusText}`);
        }

        const reader = upstreamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  res.write(`data: ${JSON.stringify({ text, model })}\n\n`);
                }
              } catch {
                // ignore partial JSON chunk
              }
            }
          }
        }

        // Send completion metadata event
        res.write(`data: ${JSON.stringify({ done: true, model, mode })}\n\n`);
        res.end();
        streamSuccess = true;
        break;
      } catch (err) {
        if (abortController.signal.aborted) {
          break;
        }
        console.warn(`[AI Stream Error with model ${model}]:`, err.message);
      }
    }

    if (!streamSuccess && !res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'Failed to generate AI response with available models' })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('[AI Stream Route Error]:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal AI streaming error' });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Internal streaming error' })}\n\n`);
      res.end();
    }
  }
});

/**
 * POST /api/ai/evaluate-answer
 * Evaluates user's answer to a practice challenge
 */
router.post('/evaluate-answer', requireAuth, async (req, res) => {
  try {
    const { question, userAnswer, context = {}, model: requestedModel } = req.body;

    if (!question || !userAnswer) {
      return res.status(400).json({ error: 'question and userAnswer are required' });
    }

    const evaluationPrompt = `You are the SkillOS Practice Evaluator and Technical Mentor.
A learner was given this practice challenge or problem:
\"\"\"
${question}
\"\"\"

The learner submitted this answer or code:
\"\"\"
${userAnswer}
\"\"\"

Please evaluate the answer accurately, fairly, and constructively.
Return your evaluation in STRICT RAW JSON format with NO markdown wrapper, NO \`\`\`json code fence, and NO preamble, using exactly this JSON structure:
{
  "isCorrect": true,
  "status": "correct",
  "score": 100,
  "verdictTitle": "Short praise or concise title",
  "feedback": "Concise, encouraging explanation of whether the solution works and why.",
  "errorsIdentified": [],
  "optimalSolution": "The cleanest, optimal query or code snippet demonstrating industry best practices.",
  "explanation": "Why this solution is optimal, noting edge cases, time/space complexity, or performance."
}

Rules:
- If completely right: "isCorrect": true, "status": "correct", "score": 90-100, "errorsIdentified": []
- If partially right or misses edge cases: "isCorrect": false, "status": "partial", "score": 50-85, list specific errors in "errorsIdentified"
- If wrong or syntax error: "isCorrect": false, "status": "incorrect", "score": 0-45, list specific errors in "errorsIdentified"
- Ensure "optimalSolution" is valid code/query syntax.
- Raw JSON only.`;

    const contents = [{
      role: 'user',
      parts: [{ text: evaluationPrompt }]
    }];

    const result = await callGemini(contents, 'You are an accurate, strict, but encouraging technical coding and analytics evaluator. Respond with raw JSON only.', requestedModel);

    let parsed;
    try {
      const cleanJson = result.text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      const isLikelyCorrect = result.text.toLowerCase().includes('correct') && !result.text.toLowerCase().includes('incorrect');
      parsed = {
        isCorrect: isLikelyCorrect,
        status: isLikelyCorrect ? 'correct' : 'partial',
        score: isLikelyCorrect ? 100 : 70,
        verdictTitle: isLikelyCorrect ? 'Solution Verified!' : 'Solution Needs Adjustment',
        feedback: result.text,
        errorsIdentified: [],
        optimalSolution: '-- Optimal solution provided in feedback',
        explanation: 'Review feedback for detailed conceptual breakdown.'
      };
    }

    res.json({
      ...parsed,
      model: result.model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI Evaluation Error]:', error);
    res.status(500).json({
      error: error.message || 'Failed to evaluate answer'
    });
  }
});

/**
 * POST /api/ai/summarize-project
 * Generate overall data project synthesis and curriculum breakdown
 */
router.post('/summarize-project', requireAuth, async (req, res) => {
  try {
    const { focusArea, detailed = true } = req.body || {};

    const prompt = `Please provide a comprehensive and structured executive summary of the SkillOS Data Project curriculum and learning system.

Specifically cover:
1. **Overall Data Architecture & Pillars**: How planned roadmaps, daily dated study sessions, and 7-stage topic mastery work together.
2. **Core Data Tracks Breakdown**:
   - SQL & Databases (Queries, Joins, Window Functions, CTEs)
   - Python & Data Analytics (Pandas, NumPy, EDA, Data Cleaning)
   - Power BI & Business Intelligence (DAX, Star Schema, Visualizations)
   - Financial Analysis & Markets (Financial statements, Valuation, Ratios)
   - AI & Cloud Foundations (Prompt Engineering, LLMs, Automation)
   - End-to-End Portfolio Projects
3. **Data Schema & Tracking Model**:
   - The 8 core PostgreSQL/Supabase tables (\`skillos_learning_areas\`, \`skillos_learning_paths\`, \`skillos_modules\`, \`skillos_topics\`, \`skillos_study_sessions\`, \`skillos_practice_attempts\`, \`skillos_goals\`, \`skillos_knowledge_notes\`)
   - How immutable daily logs prevent conflating reading with mastery.
4. **Actionable Study Recommendations**: Next milestone focus for the learner to accelerate hands-on progress.

Format with clear headers, bullet points, and high readability.${focusArea ? ` Pay extra focus to the track: ${focusArea}.` : ''}`;

    const contents = [{
      role: 'user',
      parts: [{ text: prompt }]
    }];

    const result = await callGemini(contents);

    res.json({
      summary: result.text,
      model: result.model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI Project Summary Error]:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate project summary'
    });
  }
});

/**
 * POST /api/ai/generate-roadmap
 * Generate a structured topic tree for any skill
 */
router.post('/generate-roadmap', requireAuth, async (req, res) => {
  try {
    const { skillName, weeks = 4 } = req.body;
    if (!skillName) {
      return res.status(400).json({ error: 'skillName is required' });
    }

    const prompt = `Generate a rigorous, hands-on ${weeks}-week learning roadmap for "${skillName}" suited for the SkillOS platform.
Structure it into:
- Week-by-week Modules
- Specific actionable Topics per module
- Estimated study hours
- Recommended practice exercises / assessment checkpoints
- Outcome verification criteria (how to verify topic has moved from 'In Progress' to 'Mastered')`;

    const contents = [{
      role: 'user',
      parts: [{ text: prompt }]
    }];

    const result = await callGemini(contents);

    res.json({
      roadmap: result.text,
      skillName,
      model: result.model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI Roadmap Error]:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate roadmap'
    });
  }
});

export default router;
