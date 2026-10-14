import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Database,
  Code2,
  BarChart3,
  TrendingUp,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  BookOpen,
  Layers,
  Zap,
  FolderGit2,
  ListOrdered,
  FileText,
  MessageSquareText,
  FileBarChart,
  Route,
  ChevronDown,
  GraduationCap,
  Compass,
  Bookmark,
} from "lucide-react";
import {
  streamAIChat,
  FAST_PRIMARY_MODEL,
  summarizeDataProject,
  generateAIRoadmap,
  checkAIStatus,
  AIChatMessage,
  AIMode,
} from "@/lib/ai-service";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ChatMessageItem, ChatMessage } from "./chat-message-item";
import { ChatComposer } from "./chat-composer";
import { BounceDots } from "@/components/ui/bounce-dots";
import { useNotes } from "@/components/notes/note-context";
import { NoteTrack } from "@/components/notes/note-types";

interface AIAssistantViewProps {
  userName?: string;
  initialTab?: "chat" | "summary" | "roadmap";
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

const AI_NAV_TABS = [
  { value: "chat", label: "Interactive Chat", icon: MessageSquareText },
  { value: "summary", label: "Data Project Summary", icon: FileBarChart },
  { value: "roadmap", label: "Roadmap Architect", icon: Route },
] as const;

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

export function AIAssistantView({ userName = "Learner", initialTab = "chat" }: AIAssistantViewProps) {
  const { addNote } = useNotes();
  const [tab, setTab] = useState<"chat" | "summary" | "roadmap">(initialTab);
  const [status, setStatus] = useState<{ configured: boolean; model?: string; message: string }>({
    configured: true,
    model: FAST_PRIMARY_MODEL,
    message: "Connecting...",
  });
  const [selectedModel, setSelectedModel] = useState<string>(FAST_PRIMARY_MODEL);

  // Summary State
  const [summaryText, setSummaryText] = useState(PRESET_SUMMARY);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Chat State
  const [chatMode, setChatMode] = useState<AIMode>("learning");
  const [savedNotesToast, setSavedNotesToast] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const lastUserPromptRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Roadmap State
  const [skillInput, setSkillInput] = useState("SQL Window Functions & CTEs");
  const [weeksInput, setWeeksInput] = useState(4);
  const [roadmapResult, setRoadmapResult] = useState<string | null>(null);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  useEffect(() => {
    checkAIStatus().then(setStatus);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Track scroll position to show/hide "Scroll to bottom" button
  const handleScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollBottom(!isAtBottom);
  };

  const scrollToBottom = () => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (tab === "chat") {
      scrollToBottom();
    }
  }, [messages, sendingChat, tab]);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSendingChat(false);
  };

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

  const handleSendChat = async (presetPrompt?: string, overrideMode?: AIMode) => {
    const textToSend = presetPrompt || inputMessage.trim();
    if (!textToSend || sendingChat) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const activeMode = overrideMode || chatMode;
    lastUserPromptRef.current = textToSend;
    setInputMessage("");

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "model",
      text: "",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mode: activeMode,
      modelName: selectedModel,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setSendingChat(true);

    try {
      const chatHistory: AIChatMessage[] = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await streamAIChat(
        textToSend,
        chatHistory,
        {
          activeTab: tab,
          focusArea: selectedTrack || "Data Engineering & Analytics",
        },
        activeMode,
        selectedModel,
        {
          signal: controller.signal,
          onChunk: (chunk) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, text: m.text + chunk }
                  : m
              )
            );
          },
        }
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                text: res.reply,
                thought: res.thought,
                latencySeconds: res.latencyMs ? Number((res.latencyMs / 1000).toFixed(1)) : undefined,
                modelName: res.model,
                isStreaming: false,
              }
            : m
        )
      );
      if (res.model) {
        setStatus((s) => ({ ...s, model: res.model }));
      }
    } catch (err: unknown) {
      if (controller.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
        // User cancelled generation cleanly - preserve whatever was already streamed
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
        );
        return;
      }
      const errorMsg = err instanceof Error ? err.message : "Failed to get response from AI";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                text: `⚠️ **Unable to complete response**: ${errorMsg}\n\nPlease check your internet connection or verify the Gemini API key.`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setSendingChat(false);
      abortControllerRef.current = null;
    }
  };

  const handleSaveToNotes = (title: string, content: string) => {
    const trackMap: Record<string, NoteTrack> = {
      sql: "SQL & Databases",
      python: "Python & Analytics",
      powerbi: "Power BI & Semantic Modeling",
      finance: "Finance & Markets",
      ai: "AI & Cloud Architecture",
      projects: "Projects & Portfolio",
    };
    const targetTrack: NoteTrack = selectedTrack
      ? trackMap[selectedTrack] || "General"
      : "AI & Cloud Architecture";

    const codeBlockMatch = content.match(/```(\w+)?\n([\s\S]*?)```/);
    const codeSnippet = codeBlockMatch ? codeBlockMatch[2].trim() : undefined;

    addNote({
      title: title.slice(0, 80) || "AI Study Note",
      area: targetTrack,
      tags: ["AI-Generated", targetTrack.split(" ")[0]],
      contentMarkdown: content,
      codeSnippet,
      pinned: false,
    });

    setSavedNotesToast(`Saved "${title.slice(0, 30)}..." to Knowledge Notes!`);
    setTimeout(() => setSavedNotesToast(null), 3500);
  };

  const handleRegenerate = () => {
    if (lastUserPromptRef.current && !sendingChat) {
      handleSendChat(lastUserPromptRef.current);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
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
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background text-foreground overflow-hidden selection:bg-primary/20">
      {/* Top Banner / AI Header */}
      <div className="shrink-0 border-b border-border/60 bg-background/80 px-4 sm:px-6 py-3 backdrop-blur-md z-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-inner">
              <Sparkles className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                  SkillOS AI Assistant
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-mono text-amber-700 dark:text-amber-300">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {status.model || selectedModel} Active
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                ChatGPT & Gemini-Grade Conversational Intelligence & Curriculum Center
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Tabs-10 Style Animated Pill Bar) */}
          <Tabs
            value={tab}
            onValueChange={(val) => setTab(val as "chat" | "summary" | "roadmap")}
            className="flex items-center"
          >
            <TabsList className="h-auto! gap-1 rounded-full bg-muted/80 border border-border/80 p-1 flex items-center shadow-inner">
              {AI_NAV_TABS.map(({ value: itemValue, label, icon: Icon }) => {
                const isActive = tab === itemValue;
                return (
                  <TabsTrigger
                    key={itemValue}
                    value={itemValue}
                    title={label}
                    className={cn(
                      "rounded-full border-none py-1.5 text-xs font-medium cursor-pointer transition-all duration-300 flex items-center justify-center",
                      isActive
                        ? "px-3.5 bg-background text-foreground shadow-sm font-medium"
                        : "px-2.5 text-muted-foreground hover:text-foreground hover:bg-background/60",
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.span
                          initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                          animate={{ width: "auto", opacity: 1, marginLeft: 6 }}
                          exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden whitespace-nowrap text-xs font-medium inline-block"
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: FULLSCREEN CHAT EXPERIENCE (ChatGPT & Gemini Grade)
          ========================================================================= */}
      {tab === "chat" && (
        <div className="flex-1 flex flex-col h-full min-h-0 relative overflow-hidden bg-background">
          {/* Interactive Topic Quick-Selector Bar for Notes Mode */}
          {chatMode === "notes" && (
            <div className="shrink-0 bg-card border-b border-border/60 px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto z-10">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300 shrink-0 flex items-center gap-1">
                <Bookmark className="size-3 text-emerald-500" />
                Generate Notes for:
              </span>
              {[
                "SQL Window Functions",
                "Python Pandas Pipeline",
                "Power BI DAX Star Schema",
                "3-Statement Financial Model",
                "PostgreSQL Relational Schema",
                "Gemini Multimodal Pipelines",
              ].map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() =>
                    handleSendChat(
                      `Generate comprehensive timeline notes and syntax cheatsheet for "${topic}".`,
                      "notes"
                    )
                  }
                  className="shrink-0 text-xs rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors cursor-pointer"
                >
                  + {topic}
                </button>
              ))}
            </div>
          )}

          {/* Floating Saved Note Toast */}
          {savedNotesToast && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-card/95 px-4 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
              <Check className="size-3.5 text-emerald-500" />
              <span>{savedNotesToast}</span>
            </div>
          )}

          {/* Scrollable Message Viewport across 100% of the canvas */}
          <div
            ref={chatScrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-background"
          >
            <div className="max-w-3xl lg:max-w-4xl mx-auto w-full space-y-6 pb-6">
              {/* EMPTY STATE HERO: DYNAMIC PER MODE */}
              {messages.length === 0 ? (
                <div className="py-10 sm:py-16 flex flex-col items-center text-center space-y-6">
                  {/* Mode-Specific Hero Avatar */}
                  <div
                    className={`grid size-16 place-items-center rounded-3xl border shadow-xl ${
                      chatMode === "learning"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 shadow-blue-500/5"
                        : chatMode === "planning"
                        ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 shadow-cyan-500/5"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-emerald-500/5"
                    }`}
                  >
                    {chatMode === "learning" ? (
                      <GraduationCap className="size-8" />
                    ) : chatMode === "planning" ? (
                      <Compass className="size-8" />
                    ) : (
                      <FileText className="size-8" />
                    )}
                  </div>

                  <div className="space-y-2 max-w-xl">
                    <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                      {chatMode === "learning"
                        ? `Hello, ${userName} • Learning Copilot`
                        : chatMode === "planning"
                        ? `Hello, ${userName} • Workflow Architect`
                        : `Hello, ${userName} • Timeline Notes`}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {chatMode === "learning" &&
                        "Ask any question, request step-by-step problem explanations, and solve hands-on practice challenges with instant in-chat AI grading."}
                      {chatMode === "planning" &&
                        "Design structured, milestone-driven learning workflows, study timelines, weekly hour allocations, and project execution phases."}
                      {chatMode === "notes" &&
                        "Synthesize learning and planning into detailed study notes featuring a chronological concept timeline, cheatsheet syntax, and common pitfalls."}
                    </p>
                  </div>

                  {/* 4 Mode-Specific Starter Cards (2x2 Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left mt-4">
                    {chatMode === "learning" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleSendChat(
                              "Explain SQL Window Functions (ROW_NUMBER, RANK, DENSE_RANK, LEAD, LAG) and provide a hands-on practice challenge."
                            )
                          }
                          className="group rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-md text-foreground cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              <Database className="size-4" />
                            </div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                              SQL Window Functions & Practice
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Master ROW_NUMBER, RANK, LEAD, LAG and test your answer in the embedded workspace.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendChat(
                              "Explain how to build a clean vectorized data transformation pipeline using Python and Pandas, and give me a practice problem."
                            )
                          }
                          className="group rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-md text-foreground cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <Code2 className="size-4" />
                            </div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              Pandas Pipeline & Practice Drill
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Vectorized operations, data cleaning, and write code to be evaluated live.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendChat(
                              "Explain how CALCULATE modifies filter context in Power BI and provide a DAX practice challenge."
                            )
                          }
                          className="group rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-md text-foreground cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              <BarChart3 className="size-4" />
                            </div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              Power BI DAX Filter Context Drill
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Filter modification, context transition, and practical DAX measure challenge.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendChat(
                              "Walk me through building a 3-Statement Financial Model and DCF Valuation, and give me a valuation practice exercise."
                            )
                          }
                          className="group rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-md text-foreground cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400">
                              <TrendingUp className="size-4" />
                            </div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              Financial Modeling & DCF Drill
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Integrated financial statements, WACC calculation, and cash flow exercise.
                          </p>
                        </button>
                      </>
                    )}

                    {chatMode === "planning" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleSendChat(
                              "Design a 4-week step-by-step learning workflow to master SQL from complex joins to window functions and query optimization."
                            )
                          }
                          className="group rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-md text-foreground cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                              <Database className="size-4" />
                            </div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                              4-Week SQL Mastery Workflow
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Phase-by-phase timeline, daily hour budgets, and verifiable milestones.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendChat(
                              "Create a 6-week curriculum and study workflow to transition into Data Engineering with weekly milestone deliverables."
                            )
                          }
                          className="group rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-md text-foreground cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                              <Code2 className="size-4" />
                            </div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                              6-Week Data Engineering Roadmap
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Python, SQL pipelines, orchestration, and production portfolio projects.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendChat(
                              "Plan an end-to-end 3-week sprint workflow for building an executive sales analytics dashboard in Power BI."
                            )
                          }
                          className="group rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-md text-foreground cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                              <BarChart3 className="size-4" />
                            </div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                              Power BI Dashboard Project Sprint
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Star schema modeling, DAX measure creation, and visual storytelling.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendChat(
                              "Create a 30-day workflow roadmap for financial statement modeling, DCF valuation, and technical interview preparation."
                            )
                          }
                          className="group rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-md text-foreground cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                              <TrendingUp className="size-4" />
                            </div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                              30-Day Financial Analyst Plan
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Core accounting, three-statement linking, sensitivity tables, and valuation.
                          </p>
                        </button>
                      </>
                    )}

                    {chatMode === "notes" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleSendChat(
                              "Generate comprehensive timeline notes and syntax cheatsheet for SQL Window Functions (ROW_NUMBER, RANK, LEAD, LAG)."
                            )
                          }
                          className="group rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-md text-foreground cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <Database className="size-4" />
                            </div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              Timeline Notes: SQL Window Functions
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Chronological concept progression, syntax cheatsheet, and common join pitfalls.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendChat(
                              "Generate detailed timeline notes, method cheatsheet, and common pitfalls for Pandas data manipulation & cleaning."
                            )
                          }
                          className="group rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-md text-foreground cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <Code2 className="size-4" />
                            </div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              Timeline Notes: Python & Pandas
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Wrangling timeline, vectorized methods, memory tips, and recall checklist.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendChat(
                              "Generate structured timeline notes, relationship rules, and DAX cheatsheet for Power BI Star Schema design."
                            )
                          }
                          className="group rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-md text-foreground cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <BarChart3 className="size-4" />
                            </div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              Timeline Notes: Star Schema & DAX
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Fact vs Dimension rules, filter direction, time intelligence, and traps.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendChat(
                              "Generate timeline notes, linking formulas, and key financial ratios for 3-statement financial modeling and DCF."
                            )
                          }
                          className="group rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-md text-foreground cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <TrendingUp className="size-4" />
                            </div>
                            <span className="text-xs font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              Timeline Notes: Financial Valuation
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Chronological statement links, ratio cheat sheet, and DCF formulas.
                          </p>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* MESSAGE STREAM */
                messages.map((msg, index) => (
                  <ChatMessageItem
                    key={msg.id}
                    message={msg}
                    onRegenerate={handleRegenerate}
                    onSaveToNotes={handleSaveToNotes}
                    isLatestAssistant={
                      msg.role === "model" && index === messages.length - 1
                    }
                  />
                ))
              )}

              {/* Waiting / Thinking Indicator: only if no message is currently streaming tokens */}
              {sendingChat && !messages.some((m) => m.isStreaming) && (
                <div className="flex items-center gap-3.5 py-1">
                  <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="flex items-center px-1">
                    <BounceDots />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={scrollToBottom}
              className="absolute bottom-24 right-6 sm:right-12 z-20 grid size-9 place-items-center rounded-full border border-border/80 bg-card text-foreground shadow-xl backdrop-blur-md hover:bg-muted transition-all cursor-pointer"
              title="Scroll to bottom"
            >
              <ChevronDown className="size-4" />
            </button>
          )}

          {/* Docked Fixed Bottom Composer - Seamless single screen without dividing line */}
          <div className="shrink-0 z-10 bg-gradient-to-t from-background via-background/95 to-transparent pt-2 pb-5 px-4 sm:px-6">
            <div className="max-w-3xl lg:max-w-4xl mx-auto w-full">
              <ChatComposer
                input={inputMessage}
                onChange={setInputMessage}
                onSubmit={() => handleSendChat()}
                onStop={handleStopGeneration}
                onClear={handleClearChat}
                isGenerating={sendingChat}
                modelName={selectedModel}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                hasMessages={messages.length > 0}
                mode={chatMode}
                onModeChange={setChatMode}
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DATA PROJECT SUMMARY VIEW
          ========================================================================= */}
      {tab === "summary" && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Quick Answer Banner */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 backdrop-blur-sm shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
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
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className={`size-3.5 ${loadingSummary ? "animate-spin" : ""}`} />
                    <span>{loadingSummary ? "Synthesizing with Gemini..." : "Refresh AI Summary"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(summaryText)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    {copiedSummary ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    <span>{copiedSummary ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Architecture Pillars Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Core Tracks</span>
                  <Database className="size-4 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold mt-1 text-foreground">6 Areas</div>
                <p className="text-[11px] text-muted-foreground mt-1">SQL, Python, Power BI, Finance, AI, Projects</p>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Progression States</span>
                  <Layers className="size-4 text-amber-500 dark:text-amber-400" />
                </div>
                <div className="text-2xl font-bold mt-1 text-foreground">7 States</div>
                <p className="text-[11px] text-muted-foreground mt-1">Not Started → In Progress → Mastered</p>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Database Schema</span>
                  <Code2 className="size-4 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="text-2xl font-bold mt-1 text-foreground">8 Tables</div>
                <p className="text-[11px] text-muted-foreground mt-1">PostgreSQL + Supabase with RLS</p>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Tracking Rule</span>
                  <Zap className="size-4 text-rose-500 dark:text-rose-400" />
                </div>
                <div className="text-2xl font-bold mt-1 text-foreground">Immutable Logs</div>
                <p className="text-[11px] text-muted-foreground mt-1">Separate reading from actual coding</p>
              </div>
            </div>

            {/* 6 Specialized Learning Tracks Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ListOrdered className="size-4 text-cyan-600 dark:text-cyan-400" />
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
                      className={`group rounded-2xl border p-4 transition-all cursor-pointer bg-card hover:bg-muted/40 shadow-sm ${
                        isSelected
                          ? "border-cyan-500 ring-1 ring-cyan-500/40 shadow-md"
                          : "border-border/80 hover:border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${track.color}`}>
                          <Icon className="size-4.5" />
                        </div>
                        <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-muted-foreground rounded-full border border-border/80 px-2 py-0.5 bg-muted/60">
                          {track.badge}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-foreground mt-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {track.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {track.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {track.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="rounded-md border border-border/80 bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono"
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
            <div className="rounded-2xl border border-border/80 bg-card p-6 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-500 dark:text-amber-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Comprehensive Executive Summary
                  </span>
                  {selectedTrack && (
                    <span className="text-xs rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-cyan-600 dark:text-cyan-300">
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
                  <RefreshCw className="size-6 text-cyan-500 dark:text-cyan-400 animate-spin" />
                  <p className="text-sm font-medium text-foreground">
                    Gemini AI is analyzing project architecture & curriculum...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Synthesizing roadmaps, database schemas, and recommended milestones
                  </p>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground space-y-4">
                  {summaryText}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ROADMAP ARCHITECT VIEW
          ========================================================================= */}
      {tab === "roadmap" && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="rounded-2xl border border-border/80 bg-card p-6 backdrop-blur-sm shadow-sm">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Route className="size-5 text-cyan-600 dark:text-cyan-400" />
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
                    className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                >
                  <Sparkles className={`size-3.5 ${generatingRoadmap ? "animate-spin" : ""}`} />
                  <span>{generatingRoadmap ? "Designing Curriculum..." : "Generate Roadmap"}</span>
                </button>
              </div>
            </div>

            {/* Roadmap Output */}
            {roadmapResult && (
              <div className="rounded-2xl border border-border/80 bg-card p-6 backdrop-blur-sm shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-4">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Curriculum: {skillInput} ({weeksInput} Weeks)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(roadmapResult)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs text-foreground hover:bg-muted cursor-pointer transition-colors"
                  >
                    <Copy className="size-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground">
                  {roadmapResult}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
