import express from 'express';

const router = express.Router();

const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
];

const SKILLOS_SYSTEM_PROMPT = `You are SkillOS AI Assistant — an intelligent learning copilot and curriculum strategist built into SkillOS.
SkillOS is a Personal Learning & Progress Management Platform connecting three pillars:
1. What you PLAN to learn: Hierarchical roadmaps (Areas -> Paths -> Modules -> Topics).
2. What you ACTUALLY study: Dated daily sessions with duration, category, and outcome logs.
3. What you COMPLETE: 7-state topic progression (Not Started, In Progress, Practised, Completed, Needs Revision, Mastered, Blocked).

The platform's primary learning areas include:
- SQL & Databases: Complex Queries, Joins, Aggregations, Subqueries, CTEs, Window Functions, Indexing.
- Python & Data Analytics: Fundamentals, Pandas, NumPy, Data Wrangling, Exploratory Data Analysis, Visualization.
- Power BI: Data Modeling, Star Schema, DAX Formulas, Power Query M, Interactive Dashboards.
- Finance & Financial Markets: Financial Statements, Ratios, DCF Valuation, Financial Modeling.
- AI & Cloud: Generative AI, Prompt Engineering, LLM integrations, Cloud Automation.
- Portfolio Projects: End-to-end data pipelines, ETL, real-world analytical dashboards.

Always format your responses with clean GitHub-flavored markdown, bullet points, and code blocks with syntax highlighting when providing code. Be structured, practical, and focused on helping the learner master concepts.`;

/**
 * Call Gemini API with automatic fallback across models
 */
async function callGemini(contents, systemInstruction = SKILLOS_SYSTEM_PROMPT) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }

  let lastError = null;

  for (const model of GEMINI_MODELS) {
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
        if (status === 503 || status === 404 || status === 429) {
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
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], context = {} } = req.body;

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
      userPrompt = `[Context: Active workspace tab: ${context.activeTab || 'General'}, Focus Area: ${context.focusArea || 'Data Engineering & Analytics'}]\n\n${message}`;
    }

    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    const result = await callGemini(contents);

    res.json({
      reply: result.text,
      model: result.model,
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
 * POST /api/ai/summarize-project
 * Generate overall data project synthesis and curriculum breakdown
 */
router.post('/summarize-project', async (req, res) => {
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
router.post('/generate-roadmap', async (req, res) => {
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
