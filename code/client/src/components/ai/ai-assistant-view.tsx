import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Database,
  Code2,
  BarChart3,
  TrendingUp,
  Cpu,
  Send,
  RefreshCw,
  Copy,
  Check,
  BookOpen,
  Layers,
  Bot,
  User,
  Zap,
  FolderGit2,
  Target,
  ListOrdered,
  FileText,
} from "lucide-react";
import {
  sendAIChat,
  summarizeDataProject,
  generateAIRoadmap,
  checkAIStatus,
  AIChatMessage,
} from "@/lib/ai-service";

interface AIAssistantViewProps {
  userName?: string;
  initialTab?: "summary" | "chat" | "roadmap";
}

const DATA_TRACKS = [
  {
    id: "sql",
    name: "SQL & Relational Databases",
    icon: Database,
    color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400",
    badge: "Core Foundation",
    topics: ["Complex Joins", "Aggregations & HAVING", "Subqueries & CTEs", "Window Functions (LEAD/LAG)", "Query Optimization"],
    description: "Master high-throughput querying, window analytics, and relational data modeling in PostgreSQL.",
  },
  {
    id: "python",
    name: "Python & Data Analytics",
    icon: Code2,
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
    badge: "Programming",
    topics: ["Python Fundamentals", "Pandas DataFrames", "NumPy Vectorization", "Data Cleaning & Imputation", "EDA & Seaborn"],
    description: "Transform messy raw datasets into actionable insights with programmatic data manipulation.",
  },
  {
    id: "powerbi",
    name: "Power BI & Semantic Modeling",
    icon: BarChart3,
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400",
    badge: "BI & Reporting",
    topics: ["Star Schema Design", "Power Query (M)", "DAX Measures vs Columns", "Time Intelligence", "Interactive Visuals"],
    description: "Design executive dashboards and enterprise semantic layers with bulletproof DAX calculations.",
  },
  {
    id: "finance",
    name: "Finance & Financial Markets",
    icon: TrendingUp,
    color: "from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400",
    badge: "Domain Analysis",
    topics: ["Financial Statements (P&L/BS/CF)", "Ratio & Liquidity Analysis", "DCF Valuation Modeling", "Equity & Debt Analysis"],
    description: "Bridge quantitative data analytics with fundamental financial analysis and valuation frameworks.",
  },
  {
    id: "ai",
    name: "AI & Cloud Architecture",
    icon: Cpu,
    color: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400",
    badge: "Emerging Tech",
    topics: ["Gemini 3.5 & Multimodal AI", "Prompt Engineering", "LLM Pipelines & Agents", "Cloud Data Pipelines"],
    description: "Harness generative AI and automated agentic workflows to multiply engineering velocity.",
  },
  {
    id: "projects",
    name: "End-to-End Portfolio Projects",
    icon: FolderGit2,
    color: "from-indigo-500/20 to-violet-500/10 border-indigo-500/30 text-indigo-400",
    badge: "Synthesis",
    topics: ["ETL Pipelines", "Public GitHub Repositories", "Production Dashboards", "Verifiable Artifacts"],
    description: "Combine all pillars into tangible, production-grade applications and public portfolio showcases.",
  },
];

const PRESET_SUMMARY = `# SkillOS Data Project & Curriculum Synthesis

### The Three Pillars of SkillOS
SkillOS overcomes traditional to-do lists by connecting:
1. **Plan (Top-Down)**: Areas → Paths → Modules → Topics
2. **Study (Bottom-Up)**: Immutable dated logs with exact minutes and qualitative outcomes
3. **Complete (Progression)**: 7-State lifecycle (*Not Started*, *In Progress*, *Practised*, *Completed*, *Needs Revision*, *Mastered*, *Blocked*)

---

### Core Data Tracks Breakdown
- **SQL & Databases**: Relational modeling, complex joins, CTEs, Window functions (\`ROW_NUMBER\`, \`LEAD/LAG\`, \`DENSE_RANK\`), indexing.
- **Python & Data Analytics**: Vectorized Pandas operations, data imputation, EDA, statistical analysis, automated scripting.
- **Power BI & Business Intelligence**: Star Schema architecture (Facts & Dimensions), Power Query M transformations, advanced DAX time-intelligence (\`TOTALYTD\`, \`SAMEPERIODLASTYEAR\`).
- **Finance & Financial Markets**: Three-statement financial models, profitability & solvency ratios, DCF valuations.
- **AI & Cloud Architecture**: Gemini multimodal APIs, agentic reasoning, pipeline automation.
- **Portfolio Projects**: Production ETL pipelines, verifiable GitHub codebases, public executive dashboards.

---

### Relational Schema (PostgreSQL / Supabase)
Powered by 8 relational tables:
- \`skillos_learning_areas\` — High-level domains (SQL, Python, Power BI, Finance, AI)
- \`skillos_learning_paths\` — Structured roadmaps within each area
- \`skillos_modules\` — Thematic milestones within paths
- \`skillos_topics\` — Granular atomic learning units with the 7-state enum
- \`skillos_study_sessions\` — Immutable ledger of dated daily study sessions
- \`skillos_practice_attempts\` — Hands-on coding exercises, errors, and solution logs
- \`skillos_goals\` — Target vs Actual study time and completion checkpoints
- \`skillos_knowledge_notes\` — Markdown notes, code snippets, and cheatsheets`;

export function AIAssistantView({ userName = "Learner", initialTab = "summary" }: AIAssistantViewProps) {
  const [tab, setTab] = useState<"summary" | "chat" | "roadmap">(initialTab);
  const [status, setStatus] = useState<{ configured: boolean; model?: string; message: string }>({
    configured: true,
    model: "gemini-3.5-flash-lite",
    message: "Connecting...",
  });

  // Summary State
  const [summaryText, setSummaryText] = useState(PRESET_SUMMARY);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Array<{ role: "user" | "model"; text: string; time: string }>>([
    {
      role: "model",
      text: `Hello ${userName}! I'm your Gemini-powered SkillOS AI Assistant. I can summarize the overall data project, break down your curriculum, explain complex SQL or Python concepts, or craft custom study roadmaps. How can I help you today?`,
      time: "Just now",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Roadmap State
  const [skillInput, setSkillInput] = useState("SQL Window Functions & CTEs");
  const [weeksInput, setWeeksInput] = useState(4);
  const [roadmapResult, setRoadmapResult] = useState<string | null>(null);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  useEffect(() => {
    checkAIStatus().then(setStatus);
  }, []);

  useEffect(() => {
    if (tab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, tab]);

  const handleGenerateSummary = async (trackName?: string) => {
    setLoadingSummary(true);
    try {
      const res = await summarizeDataProject(trackName);
      setSummaryText(res.summary);
      if (res.model) {
        setStatus((s) => ({ ...s, model: res.model }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSendChat = async (presetPrompt?: string) => {
    const textToSend = presetPrompt || inputMessage.trim();
    if (!textToSend || sendingChat) return;

    setInputMessage("");
    const newMsg = {
      role: "user" as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setSendingChat(true);

    try {
      const chatHistory: AIChatMessage[] = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));
      const res = await sendAIChat(textToSend, chatHistory, {
        activeTab: tab,
        focusArea: selectedTrack || "Data Engineering & Analytics",
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: res.reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      if (res.model) {
        setStatus((s) => ({ ...s, model: res.model }));
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to get response from AI";
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: `⚠️ **Error communicating with Gemini**: ${errorMsg}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setSendingChat(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!skillInput.trim() || generatingRoadmap) return;
    setGeneratingRoadmap(true);
    try {
      const res = await generateAIRoadmap(skillInput, weeksInput);
      setRoadmapResult(res.roadmap);
      if (res.model) {
        setStatus((s) => ({ ...s, model: res.model }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
      {/* Top Banner / AI Header */}
      <div className="border-b border-border/40 bg-card/40 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-primary/20 text-amber-400 border border-amber-500/30 shadow-inner">
              <Sparkles className="size-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  SkillOS AI Assistant
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {status.model || "Gemini 3.5 Active"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Powered by Google Gemini • Curriculum Strategy & Data Project Center
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setTab("summary")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                tab === "summary"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <FileText className="size-3.5" />
              <span>Data Project Summary</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("chat")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                tab === "chat"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Bot className="size-3.5" />
              <span>Interactive Copilot</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("roadmap")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                tab === "roadmap"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Target className="size-3.5" />
              <span>Roadmap Architect</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* TAB 1: DATA PROJECT SUMMARY */}
        {tab === "summary" && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Quick Answer Banner */}
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                    <BookOpen className="size-3.5" />
                    Overall Data Project & Architecture
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    SkillOS Curriculum & Technical System Summary
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-2xl">
                    Here is the centralized summary of the entire data learning project, covering the 6 data tracks,
                    the 7-stage topic mastery engine, and the 8 PostgreSQL/Supabase database tables.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateSummary(selectedTrack || undefined)}
                    disabled={loadingSummary}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className={`size-3.5 ${loadingSummary ? "animate-spin" : ""}`} />
                    <span>{loadingSummary ? "Synthesizing with Gemini..." : "Refresh AI Summary"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(summaryText)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                  >
                    {copiedSummary ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    <span>{copiedSummary ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Architecture Pillars Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Core Tracks</span>
                  <Database className="size-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold mt-1 text-foreground">6 Areas</div>
                <p className="text-[11px] text-muted-foreground mt-1">SQL, Python, Power BI, Finance, AI, Projects</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Progression States</span>
                  <Layers className="size-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold mt-1 text-foreground">7 States</div>
                <p className="text-[11px] text-muted-foreground mt-1">Not Started → In Progress → Mastered</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Database Schema</span>
                  <Code2 className="size-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold mt-1 text-foreground">8 Tables</div>
                <p className="text-[11px] text-muted-foreground mt-1">PostgreSQL + Supabase with RLS</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Tracking Rule</span>
                  <Zap className="size-4 text-rose-400" />
                </div>
                <div className="text-2xl font-bold mt-1 text-foreground">Immutable Logs</div>
                <p className="text-[11px] text-muted-foreground mt-1">Separate reading from actual coding</p>
              </div>
            </div>

            {/* 6 Specialized Learning Tracks Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ListOrdered className="size-4 text-primary" />
                  Specialized Learning Tracks
                </h3>
                <span className="text-xs text-muted-foreground">Click a track to focus AI synthesis</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DATA_TRACKS.map((track) => {
                  const Icon = track.icon;
                  const isSelected = selectedTrack === track.name;
                  return (
                    <div
                      key={track.id}
                      onClick={() => {
                        const newSelection = isSelected ? null : track.name;
                        setSelectedTrack(newSelection);
                        handleGenerateSummary(newSelection || undefined);
                      }}
                      className={`group rounded-2xl border p-4 transition-all cursor-pointer bg-card/40 hover:bg-card/70 ${
                        isSelected
                          ? "border-primary ring-1 ring-primary/40 shadow-lg shadow-primary/5"
                          : "border-border/60 hover:border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${track.color}`}>
                          <Icon className="size-4.5" />
                        </div>
                        <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-muted-foreground rounded-full border border-border/60 px-2 py-0.5 bg-muted/40">
                          {track.badge}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-foreground mt-3 group-hover:text-primary transition-colors">
                        {track.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {track.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {track.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="rounded-md border border-border/40 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono"
                          >
                            {topic}
                          </span>
                        ))}
                        {track.topics.length > 3 && (
                          <span className="text-[10px] text-muted-foreground px-1 py-0.5">
                            +{track.topics.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Executive AI Synthesis Text Container */}
            <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Comprehensive Executive Summary
                  </span>
                  {selectedTrack && (
                    <span className="text-xs rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-primary">
                      Focus: {selectedTrack}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Markdown View
                </span>
              </div>

              {loadingSummary ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <RefreshCw className="size-6 text-primary animate-spin" />
                  <p className="text-sm font-medium text-foreground">
                    Gemini AI is analyzing project architecture & curriculum...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Synthesizing roadmaps, database schemas, and recommended milestones
                  </p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/90 space-y-4">
                  {summaryText}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE AI COPILOT (CHAT) */}
        {tab === "chat" && (
          <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-14rem)] min-h-[500px]">
            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 shrink-0 no-scrollbar">
              <span className="text-[11px] font-medium text-muted-foreground shrink-0 flex items-center gap-1">
                <Zap className="size-3 text-amber-400" />
                Quick Prompts:
              </span>
              {[
                "Summarise the overall data project and related things",
                "Explain SQL Window Functions with practical examples",
                "How does SkillOS topic progression state work?",
                "Create a 4-week Python & Pandas study schedule",
                "Difference between Power BI DAX and Power Query M",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendChat(chip)}
                  disabled={sendingChat}
                  className="shrink-0 rounded-full border border-border/80 bg-card/60 px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer whitespace-nowrap"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Message Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`grid size-8 shrink-0 place-items-center rounded-xl text-xs font-semibold ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-primary/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/60 bg-card/70 text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{m.text}</div>
                    <div
                      className={`text-[10px] mt-2 font-mono ${
                        m.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              ))}

              {sendingChat && (
                <div className="flex items-start gap-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-muted/60 text-amber-400 border border-amber-500/30">
                    <Sparkles className="size-4 animate-spin" />
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card/70 p-4 text-xs text-muted-foreground flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                    Gemini AI is reasoning and composing response...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="mt-3 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Gemini about data tracks, study methods, SQL, Python, Power BI..."
                disabled={sendingChat}
                className="flex-1 rounded-xl border border-border/80 bg-card/60 px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || sendingChat}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
              >
                <Send className="size-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: ROADMAP ARCHITECT */}
        {tab === "roadmap" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Target className="size-5 text-primary" />
                Custom Learning Roadmap Generator
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Enter any skill or technology. Gemini will generate a rigorous module-by-module curriculum formatted for SkillOS.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-foreground">Skill / Domain</label>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="e.g. Pandas Data Wrangling, Financial Modeling, Power BI DAX"
                    className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Duration</label>
                  <select
                    value={weeksInput}
                    onChange={(e) => setWeeksInput(Number(e.target.value))}
                    className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value={2}>2 Weeks (Crash Sprint)</option>
                    <option value={4}>4 Weeks (Standard Mastery)</option>
                    <option value={8}>8 Weeks (Deep Dive)</option>
                    <option value={12}>12 Weeks (Full Track)</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateRoadmap}
                  disabled={generatingRoadmap || !skillInput.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                >
                  <Sparkles className={`size-3.5 ${generatingRoadmap ? "animate-spin" : ""}`} />
                  <span>{generatingRoadmap ? "Designing Curriculum..." : "Generate Roadmap"}</span>
                </button>
              </div>
            </div>

            {/* Roadmap Output */}
            {roadmapResult && (
              <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-4">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Curriculum: {skillInput} ({weeksInput} Weeks)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(roadmapResult)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="size-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/90">
                  {roadmapResult}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
