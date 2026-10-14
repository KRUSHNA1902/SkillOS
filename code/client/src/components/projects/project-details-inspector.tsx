import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  FolderKanban,
  ExternalLink,
  Github,
  ListTodo,
  NotebookTabs,
  Sparkles,
  Download,
  Edit2,
  Star,
  Layers,
  FileCode,
  Lightbulb,
  Check,
  Loader2,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Clock,
  Calendar,
  Code2,
  CheckCircle2,
  TrendingUp,
  Cpu,
} from "lucide-react";
import { Project } from "./project-types";
import { useProjects } from "./project-context";
import { useTaskManager } from "@/components/tasks/task-context";
import { useNotes } from "@/components/notes/note-context";
import { useTags } from "@/components/tags/tag-context";
import { TRACK_THEMES, STATUS_CONFIG } from "./project-card";
import { callGeminiDirectly } from "@/lib/ai-service";
import { cn } from "@/lib/utils";

interface ProjectDetailsInspectorProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (project: Project) => void;
  onNavigateToTasks?: () => void;
  onNavigateToNotes?: () => void;
}

export function ProjectDetailsInspector({
  project,
  isOpen,
  onClose,
  onEdit,
  onNavigateToTasks,
  onNavigateToNotes,
}: ProjectDetailsInspectorProps) {
  const {
    toggleMilestoneStatus,
    toggleDeliverable,
    advanceProjectStatus,
    togglePinProject,
    exportProjectMarkdown,
    linkTaskToProject,
  } = useProjects();

  const { tasks, addTask, toggleTaskStatus } = useTaskManager();
  const { notes } = useNotes();
  const { getTagClass } = useTags();

  // Full Screen mode is enabled by default as requested
  const [isFullScreen, setIsFullScreen] = useState(true);

  const [activeTab, setActiveTab] = useState<"milestones" | "tasks" | "notes" | "architecture" | "ai_review">("milestones");

  // Inline Quick Task Add
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskPriority, setQuickTaskPriority] = useState<"urgent" | "high" | "medium" | "low">("high");

  // AI Review State
  const [isAIReviewing, setIsAIReviewing] = useState(false);
  const [aiReviewOutput, setAiReviewOutput] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  const theme = TRACK_THEMES[project.track] || TRACK_THEMES["Fullstack & Systems"];
  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.in_progress;

  // Filter tasks belonging to this project
  const linkedTasks = tasks.filter(
    (t) => t.projectId === project.id || project.linkedTaskIds.includes(t.id)
  );

  // Filter notes linked or sharing track
  const linkedNotes = notes.filter(
    (n) => project.linkedNoteIds.includes(n.id) || n.area === project.track
  );

  const completedMilestones = project.milestones.filter((m) => m.status === "completed").length;
  const totalMilestones = project.milestones.length;

  const totalDeliverables = project.milestones.reduce((acc, m) => acc + m.deliverables.length, 0);
  const completedDeliverables = project.milestones.reduce(
    (acc, m) => acc + m.deliverables.filter((d) => d.completed).length,
    0
  );

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    const newTask = addTask({
      title: quickTaskTitle.trim(),
      priority: quickTaskPriority,
      category: project.track,
      status: "in_progress",
      timelineStage: "in_progress",
      dueDate: "Tomorrow",
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      projectId: project.id,
      projectName: project.title,
      notes: `Associated with project: ${project.title}`,
      reminderAlert: true,
    });

    linkTaskToProject(project.id, newTask.id);
    setQuickTaskTitle("");
  };

  const handleAIArchitectureReview = async () => {
    setIsAIReviewing(true);
    setAiReviewOutput(null);

    const prompt = `You are a Principal Software Architect conducting an executive code & architecture review.
Review the following portfolio engineering project for production readiness, scalability, and interview strength:
- Project Title: "${project.title}"
- Domain: "${project.track}"
- Status: "${project.status}" (${project.progress}% completed)
- Tech Stack: ${project.techStack.join(", ")}
- Architecture Spec:
${project.architectureNotes || "No specific architecture notes provided."}

Please generate a high-yield structured review covering:
1. **Key Architectural Strengths**: What makes this project stand out to technical interviewers?
2. **Potential Bottlenecks & Failure Modes**: Edge cases, scalability limits, or missing optimizations.
3. **Production Hardening Checklist**: 3-4 concrete actions to make this portfolio-ready.
4. **Executive Interview Talking Points**: How the engineer should pitch this project in 60 seconds.`;

    try {
      const res = await callGeminiDirectly(prompt);
      setAiReviewOutput(res.text);
    } catch (err: any) {
      setAiReviewOutput("Unable to generate architecture review. Check network or API connection.");
    } finally {
      setIsAIReviewing(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className={cn(
          "fixed inset-0 z-50 transition-all duration-300",
          isFullScreen
            ? "flex flex-col bg-background text-foreground overflow-hidden"
            : "flex items-center justify-end bg-background/70 backdrop-blur-sm"
        )}
      >
        <motion.div
          initial={isFullScreen ? { opacity: 0, scale: 0.98 } : { x: "100%", opacity: 0 }}
          animate={isFullScreen ? { opacity: 1, scale: 1 } : { x: 0, opacity: 1 }}
          exit={isFullScreen ? { opacity: 0, scale: 0.98 } : { x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 220 }}
          className={cn(
            "flex flex-col bg-card overflow-hidden",
            isFullScreen
              ? "relative w-full h-full bg-background"
              : "relative w-full max-w-2xl h-full border-l border-border/80 shadow-2xl"
          )}
        >
          {/* Top Universal Header Bar */}
          <header className="flex items-center justify-between border-b border-border/60 px-4 sm:px-6 py-3.5 bg-card/80 backdrop-blur-md shrink-0">
            {/* Left Nav & Context */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted hover:border-border transition-colors cursor-pointer shadow-xs shrink-0"
                title="Back to Projects Showcase"
              >
                <ArrowLeft className="size-3.5 text-primary" />
                <span>Back to Projects</span>
              </button>

              {/* Breadcrumbs for Full Screen */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono min-w-0">
                <span>/</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase shrink-0",
                    theme.badge
                  )}
                >
                  <FolderKanban className="size-3" />
                  <span>{theme.label}</span>
                </span>
                <span>/</span>
                <span className="font-semibold text-foreground truncate max-w-[220px]">
                  {project.title}
                </span>
              </div>

              {/* Status pill */}
              <span
                className={cn(
                  "hidden md:inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium shrink-0",
                  statusCfg.badge
                )}
              >
                <span className={cn("size-1.5 rounded-full", statusCfg.dot)} />
                {statusCfg.label}
              </span>

              {/* Advance Stage button */}
              <button
                type="button"
                onClick={() => advanceProjectStatus(project.id)}
                className="hidden lg:inline-flex items-center text-[11px] font-mono font-medium text-primary hover:underline cursor-pointer shrink-0"
                title="Advance to next project workflow stage"
              >
                Advance Stage →
              </button>
            </div>

            {/* Right Action Bar */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Maximize / Minimize toggle button */}
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title={isFullScreen ? "Dock to Side Drawer" : "Enter Full Screen View"}
              >
                {isFullScreen ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </button>

              {/* Pin Project button */}
              <button
                type="button"
                onClick={() => togglePinProject(project.id)}
                className={cn(
                  "grid size-8 place-items-center rounded-lg transition-colors cursor-pointer",
                  project.pinned
                    ? "text-amber-400 bg-amber-400/10"
                    : "text-muted-foreground hover:bg-muted"
                )}
                title={project.pinned ? "Unpin project" : "Pin project"}
              >
                <Star className={cn("size-4", project.pinned && "fill-amber-400")} />
              </button>

              {/* Export Markdown */}
              <button
                type="button"
                onClick={() => exportProjectMarkdown(project)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Export Markdown (.md)"
              >
                <Download className="size-4" />
              </button>

              {/* Edit Project */}
              <button
                type="button"
                onClick={() => onEdit(project)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Edit Project Details"
              >
                <Edit2 className="size-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer ml-1"
                title="Close Project Details (Esc)"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          {/* MAIN SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto">
            {isFullScreen ? (
              /* ======================================================== */
              /* FULL SCREEN VIEWPORT LAYOUT */
              /* ======================================================== */
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Hero Banner Card */}
                <div className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 backdrop-blur-md space-y-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2 max-w-3xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                            theme.badge
                          )}
                        >
                          <FolderKanban className="size-3" />
                          <span>{theme.label}</span>
                        </span>

                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                            statusCfg.badge
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", statusCfg.dot)} />
                          {statusCfg.label}
                        </span>

                        <span className="text-[11px] font-mono text-muted-foreground uppercase border border-border/60 rounded-md px-2 py-0.5">
                          Priority: {project.priority}
                        </span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                        {project.title}
                      </h1>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {project.tagline}
                      </p>

                      {/* Project Tags */}
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors",
                                getTagClass(tag)
                              )}
                            >
                              <span>#{tag}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Launch Links & Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-start pt-1">
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer shadow-xs"
                        >
                          <Github className="size-4" />
                          <span>GitHub Repo</span>
                          <ExternalLink className="size-3 text-muted-foreground" />
                        </a>
                      )}

                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer shadow-xs"
                        >
                          <ExternalLink className="size-4" />
                          <span>Launch Live Demo</span>
                        </a>
                      )}

                      {project.docsUrl && (
                        <a
                          href={project.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-xs"
                        >
                          <FileCode className="size-4" />
                          <span>Docs</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => onEdit(project)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      >
                        <Edit2 className="size-3.5" />
                        <span>Edit Project</span>
                      </button>
                    </div>
                  </div>

                  {/* 4-Card High-Density Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/50">
                    <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] font-mono uppercase tracking-wider">Completion</span>
                        <TrendingUp className="size-3.5 text-primary" />
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl font-bold font-mono text-foreground">{project.progress}%</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                        <div
                          style={{ width: `${project.progress}%` }}
                          className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] font-mono uppercase tracking-wider">Phases Done</span>
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl font-bold font-mono text-foreground">
                          {completedMilestones}
                          <span className="text-xs text-muted-foreground font-normal"> / {totalMilestones}</span>
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground block mt-1">
                        {completedDeliverables} / {totalDeliverables} deliverables completed
                      </span>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] font-mono uppercase tracking-wider">Time Invested</span>
                        <Clock className="size-3.5 text-amber-400" />
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xl font-bold font-mono text-foreground">
                          {project.loggedHours}h
                          <span className="text-xs text-muted-foreground font-normal"> / {project.estimatedHours}h</span>
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground block mt-1">
                        {Math.max(0, project.estimatedHours - project.loggedHours)}h remaining in sprint
                      </span>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] font-mono uppercase tracking-wider">Target Date</span>
                        <Calendar className="size-3.5 text-blue-400" />
                      </div>
                      <div className="mt-1">
                        <span className="text-base font-bold font-mono text-foreground">{project.targetDate}</span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground block mt-1">
                        Updated {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2-Column Responsive Dashboard Body */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Main Workspace Column (Tabs & Content) */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* Navigation Tab Bar */}
                    <div className="flex items-center gap-1.5 border-b border-border/60 pb-1 overflow-x-auto no-scrollbar scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setActiveTab("milestones")}
                        className={cn(
                          "inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0",
                          activeTab === "milestones"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Layers className="size-4" />
                        <span>Verifiable Milestones</span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                            activeTab === "milestones"
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {project.milestones.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("tasks")}
                        className={cn(
                          "inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0",
                          activeTab === "tasks"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <ListTodo className="size-4" />
                        <span>Connected Tasks</span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                            activeTab === "tasks"
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {linkedTasks.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("notes")}
                        className={cn(
                          "inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0",
                          activeTab === "notes"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <NotebookTabs className="size-4" />
                        <span>Tech Notes</span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                            activeTab === "notes"
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {linkedNotes.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("architecture")}
                        className={cn(
                          "inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0",
                          activeTab === "architecture"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Lightbulb className="size-4" />
                        <span>Architecture Spec</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("ai_review");
                          if (!aiReviewOutput && !isAIReviewing) {
                            handleAIArchitectureReview();
                          }
                        }}
                        className={cn(
                          "inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0",
                          activeTab === "ai_review"
                            ? "bg-amber-400 text-neutral-950 font-bold shadow-xs"
                            : "text-amber-400 hover:bg-amber-400/10"
                        )}
                      >
                        <Sparkles className="size-4" />
                        <span>Gemini AI Review</span>
                      </button>
                    </div>

                    {/* TAB CONTENT PANELS */}
                    <div className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-md min-h-[420px]">
                      {/* TAB 1: MILESTONES & DELIVERABLES */}
                      {activeTab === "milestones" && (
                        <div className="space-y-5">
                          <div className="flex items-center justify-between pb-2 border-b border-border/40">
                            <div>
                              <h3 className="text-sm font-bold text-foreground">
                                Verifiable Delivery Phases
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Complete deliverables to advance the project's overall completion percentage.
                              </p>
                            </div>
                            <span className="text-xs font-mono text-primary font-semibold">
                              {completedMilestones} of {totalMilestones} Phases Completed
                            </span>
                          </div>

                          <div className="space-y-4">
                            {project.milestones.map((m) => (
                              <div
                                key={m.id}
                                className={cn(
                                  "rounded-xl border p-4 transition-all space-y-3",
                                  m.status === "completed"
                                    ? "border-emerald-500/30 bg-emerald-500/5"
                                    : m.status === "in_progress"
                                    ? "border-primary/40 bg-primary/5"
                                    : "border-border/60 bg-background/40"
                                )}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <button
                                    type="button"
                                    onClick={() => toggleMilestoneStatus(project.id, m.id)}
                                    className="flex items-start gap-3 text-left group/m cursor-pointer"
                                  >
                                    <div
                                      className={cn(
                                        "size-5.5 rounded-full border grid place-items-center transition-colors shrink-0 mt-0.5",
                                        m.status === "completed"
                                          ? "bg-emerald-500 border-emerald-400 text-neutral-950"
                                          : "border-border text-muted-foreground group-hover/m:border-primary"
                                      )}
                                    >
                                      {m.status === "completed" && <Check className="size-3.5 stroke-[3]" />}
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-semibold text-foreground group-hover/m:text-primary transition-colors">
                                        {m.title}
                                      </h4>
                                      {m.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                          {m.description}
                                        </p>
                                      )}
                                    </div>
                                  </button>

                                  <span className="text-xs font-mono text-muted-foreground shrink-0 border border-border/50 rounded-lg px-2 py-1 bg-muted/20">
                                    Target: {m.dueDate}
                                  </span>
                                </div>

                                {/* Deliverables Checklist */}
                                <div className="pl-8 space-y-2 border-t border-border/40 pt-3">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                                    Actionable Deliverables ({m.deliverables.filter((d) => d.completed).length}/{m.deliverables.length})
                                  </span>
                                  {m.deliverables.map((del) => (
                                    <label
                                      key={del.id}
                                      className="flex items-start gap-2.5 text-xs text-foreground/90 hover:text-foreground cursor-pointer select-none py-1 px-1.5 rounded-lg hover:bg-muted/30 transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={del.completed}
                                        onChange={() => toggleDeliverable(project.id, m.id, del.id)}
                                        className="rounded border-border text-primary focus:ring-primary cursor-pointer size-4 mt-0.5"
                                      />
                                      <span
                                        className={cn(
                                          "leading-relaxed",
                                          del.completed && "line-through text-muted-foreground"
                                        )}
                                      >
                                        {del.title}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TAB 2: CONNECTED TASKS */}
                      {activeTab === "tasks" && (
                        <div className="space-y-5">
                          <div className="flex items-center justify-between pb-2 border-b border-border/40">
                            <div>
                              <h3 className="text-sm font-bold text-foreground">
                                Linked Tasks in TaskManager
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Granular engineering tickets directly tied to this project sprint.
                              </p>
                            </div>
                            {onNavigateToTasks && (
                              <button
                                type="button"
                                onClick={onNavigateToTasks}
                                className="text-xs font-medium text-primary hover:underline cursor-pointer"
                              >
                                Open Tasks Workspace →
                              </button>
                            )}
                          </div>

                          {/* Quick Task Add Form */}
                          <form
                            onSubmit={handleAddQuickTask}
                            className="flex items-center gap-2 p-2 rounded-xl border border-border/80 bg-background"
                          >
                            <input
                              type="text"
                              value={quickTaskTitle}
                              onChange={(e) => setQuickTaskTitle(e.target.value)}
                              placeholder={`+ Add new task for "${project.title}"...`}
                              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none px-2"
                            />
                            <select
                              value={quickTaskPriority}
                              onChange={(e) => setQuickTaskPriority(e.target.value as any)}
                              className="text-[11px] rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-muted-foreground"
                            >
                              <option value="urgent">Urgent</option>
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                            <button
                              type="submit"
                              disabled={!quickTaskTitle.trim()}
                              className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
                            >
                              Add Task
                            </button>
                          </form>

                          {/* Linked Task Items */}
                          <div className="space-y-2.5">
                            {linkedTasks.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-xs text-muted-foreground">
                                No tasks linked to this project yet. Use the quick task input above to add one.
                              </div>
                            ) : (
                              linkedTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border/60 bg-background/50 hover:bg-background transition-colors"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={task.status === "completed"}
                                      onChange={() => toggleTaskStatus(task.id)}
                                      className="rounded border-border text-primary focus:ring-primary cursor-pointer size-4.5"
                                    />
                                    <div className="min-w-0">
                                      <p
                                        className={cn(
                                          "text-xs font-medium text-foreground truncate",
                                          task.status === "completed" && "line-through text-muted-foreground"
                                        )}
                                      >
                                        {task.title}
                                      </p>
                                      <span className="text-[10px] text-muted-foreground font-mono">
                                        Due: {task.dueDate} • Priority: {task.priority}
                                      </span>
                                    </div>
                                  </div>

                                  <span
                                    className={cn(
                                      "text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border shrink-0",
                                      task.status === "completed"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    )}
                                  >
                                    {task.status}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* TAB 3: CONNECTED NOTES */}
                      {activeTab === "notes" && (
                        <div className="space-y-5">
                          <div className="flex items-center justify-between pb-2 border-b border-border/40">
                            <div>
                              <h3 className="text-sm font-bold text-foreground">
                                Related Knowledge Base Notes
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Markdown documentation, design rationales, and syntax snippets tagged in {project.track}.
                              </p>
                            </div>
                            {onNavigateToNotes && (
                              <button
                                type="button"
                                onClick={onNavigateToNotes}
                                className="text-xs font-medium text-primary hover:underline cursor-pointer"
                              >
                                Open Notes Studio →
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            {linkedNotes.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-xs text-muted-foreground">
                                No notes created for this track yet. Open Notes Studio to document system architecture.
                              </div>
                            ) : (
                              linkedNotes.map((note) => (
                                <div
                                  key={note.id}
                                  className="p-4 rounded-xl border border-border/60 bg-background/50 hover:bg-background transition-colors space-y-2.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                                      <NotebookTabs className="size-4 text-primary" />
                                      <span>{note.title}</span>
                                    </h4>
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                      {new Date(note.updatedAt).toLocaleDateString()}
                                    </span>
                                  </div>

                                  {note.codeSnippet && (
                                    <pre className="p-3 rounded-lg bg-neutral-950 border border-border/60 text-[11px] font-mono text-muted-foreground overflow-x-auto">
                                      <code>{note.codeSnippet.slice(0, 240)}...</code>
                                    </pre>
                                  )}

                                  <div className="flex flex-wrap gap-1">
                                    {note.tags.map((t) => (
                                      <span
                                        key={t}
                                        className={cn(
                                          "text-[10px] font-mono px-2 py-0.5 rounded-md border",
                                          getTagClass(t)
                                        )}
                                      >
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* TAB 4: ARCHITECTURE SPEC */}
                      {activeTab === "architecture" && (
                        <div className="space-y-5">
                          <div className="rounded-xl border border-border/60 bg-background/50 p-5 space-y-2">
                            <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                              System Architecture & Design Decisions
                            </h3>
                            <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans">
                              {project.architectureNotes || (
                                <p className="text-muted-foreground italic">
                                  No specific architecture notes documented yet. Click Edit Project to add technical specifications.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="rounded-xl border border-border/60 bg-background/50 p-5 space-y-2">
                            <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                              Detailed Description & Technical Overview
                            </h3>
                            <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans">
                              {project.descriptionMarkdown}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 5: AI ARCHITECTURE REVIEW */}
                      {activeTab === "ai_review" && (
                        <div className="space-y-5">
                          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Sparkles className="size-5 text-amber-400 shrink-0" />
                              <div>
                                <h4 className="text-sm font-bold text-amber-300">
                                  Gemini 3.8 Flash Code & Architecture Review
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Production audit, bottleneck detection, and technical interview talking points.
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isAIReviewing}
                              onClick={handleAIArchitectureReview}
                              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-300 transition-colors disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
                            >
                              {isAIReviewing ? (
                                <>
                                  <Loader2 className="size-4 animate-spin" />
                                  <span>Analyzing...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="size-4" />
                                  <span>Re-Analyze Project</span>
                                </>
                              )}
                            </button>
                          </div>

                          {isAIReviewing && (
                            <div className="p-12 text-center space-y-3">
                              <Loader2 className="size-8 animate-spin text-amber-400 mx-auto" />
                              <p className="text-xs text-muted-foreground font-mono">
                                Gemini 3.8 Flash is analyzing architecture specs, system boundaries, and interview criteria...
                              </p>
                            </div>
                          )}

                          {aiReviewOutput && !isAIReviewing && (
                            <div className="rounded-xl border border-border/70 bg-background/60 p-6 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans shadow-inner">
                              {aiReviewOutput}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Sidebar Column (Tech Stack, Quick Specs & Tools) */}
                  <div className="lg:col-span-4 space-y-5">
                    {/* Core Tech Stack Panel */}
                    <div className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-md space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Code2 className="size-4 text-primary" />
                        <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
                          Tech Stack & Tooling
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-mono font-medium text-foreground hover:border-primary/50 transition-colors"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI Copilot Audit Trigger Card */}
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Cpu className="size-4" />
                        <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-amber-300">
                          Interview Preparation
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Generate high-yield architectural talking points and failure mode analyses tailored for senior engineering rounds.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("ai_review");
                          if (!aiReviewOutput && !isAIReviewing) {
                            handleAIArchitectureReview();
                          }
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 transition-colors cursor-pointer"
                      >
                        <Sparkles className="size-3.5 text-amber-400" />
                        <span>View Gemini AI Review</span>
                      </button>
                    </div>

                    {/* Sprint Metrics & Target Details */}
                    <div className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-md space-y-3.5">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-4 text-primary" />
                        <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
                          Sprint Governance
                        </h3>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Target Launch:</span>
                          <span className="font-mono font-semibold text-foreground">{project.targetDate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Engineering Domain:</span>
                          <span className="font-semibold text-foreground">{project.track}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Priority Level:</span>
                          <span className="uppercase font-mono font-bold text-primary">{project.priority}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Sprint Phase:</span>
                          <span className="font-mono text-foreground">{statusCfg.label}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/50 pt-2">
                          <span className="text-muted-foreground">Last Iteration:</span>
                          <span className="font-mono text-muted-foreground">
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Export & Actions */}
                    <div className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-md space-y-2.5">
                      <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground mb-2">
                        Project Utilities
                      </h3>

                      <button
                        type="button"
                        onClick={() => exportProjectMarkdown(project)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Download className="size-3.5 text-muted-foreground" />
                        <span>Export Project Markdown (.md)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => advanceProjectStatus(project.id)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        <span>Advance Workflow Stage →</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ======================================================== */
              /* SIDE DRAWER COMPACT VIEWPORT (When Minimized) */
              /* ======================================================== */
              <div className="flex flex-col h-full">
                {/* Project Title & Overview Banner */}
                <div className="p-6 border-b border-border/40 bg-card/60 space-y-3">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    {project.title}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {project.tagline}
                  </p>

                  {/* Project Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                            getTagClass(tag)
                          )}
                        >
                          <span>#{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Progress & Time Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="rounded-xl border border-border/60 bg-background/50 p-2.5">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Completion</span>
                      <p className="text-sm font-bold font-mono text-foreground mt-0.5">{project.progress}%</p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/50 p-2.5">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Phases Done</span>
                      <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                        {completedMilestones} / {totalMilestones}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/50 p-2.5">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Time Invested</span>
                      <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                        {project.loggedHours}h <span className="text-[10px] text-muted-foreground font-normal">/ {project.estimatedHours}h</span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/50 p-2.5">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Target Date</span>
                      <p className="text-xs font-semibold font-mono text-foreground mt-0.5">{project.targetDate}</p>
                    </div>
                  </div>

                  {/* External Links Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <Github className="size-3.5" />
                        <span>GitHub Repository</span>
                        <ExternalLink className="size-2.5 text-muted-foreground" />
                      </a>
                    )}

                    {project.demoUrl && (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <ExternalLink className="size-3.5" />
                        <span>Launch Live Demo</span>
                      </a>
                    )}

                    {project.docsUrl && (
                      <a
                        href={project.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <FileCode className="size-3.5" />
                        <span>Documentation</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Subview Tabs */}
                <div className="flex items-center gap-1 border-b border-border/40 px-6 pt-2 bg-muted/10 overflow-x-auto no-scrollbar scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setActiveTab("milestones")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer",
                      activeTab === "milestones"
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Layers className="size-3.5" />
                    <span>Milestones ({project.milestones.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("tasks")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer",
                      activeTab === "tasks"
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <ListTodo className="size-3.5" />
                    <span>Connected Tasks ({linkedTasks.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("notes")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer",
                      activeTab === "notes"
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <NotebookTabs className="size-3.5" />
                    <span>Tech Notes ({linkedNotes.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("architecture")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer",
                      activeTab === "architecture"
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Lightbulb className="size-3.5" />
                    <span>Architecture Spec</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("ai_review");
                      if (!aiReviewOutput && !isAIReviewing) {
                        handleAIArchitectureReview();
                      }
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer",
                      activeTab === "ai_review"
                        ? "border-amber-400 text-amber-400 font-semibold"
                        : "border-transparent text-muted-foreground hover:text-amber-400"
                    )}
                  >
                    <Sparkles className="size-3.5 text-amber-400" />
                    <span>AI Review</span>
                  </button>
                </div>

                {/* Inspector Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* TAB 1: MILESTONES & DELIVERABLES */}
                  {activeTab === "milestones" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Verifiable Delivery Phases
                        </h3>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          Check off deliverables to advance completion
                        </span>
                      </div>

                      <div className="space-y-3">
                        {project.milestones.map((m) => (
                          <div
                            key={m.id}
                            className={cn(
                              "rounded-xl border p-4 transition-all space-y-3",
                              m.status === "completed"
                                ? "border-emerald-500/30 bg-emerald-500/5"
                                : m.status === "in_progress"
                                ? "border-primary/40 bg-primary/5"
                                : "border-border/60 bg-card/40"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => toggleMilestoneStatus(project.id, m.id)}
                                className="flex items-center gap-2.5 text-left group/m"
                              >
                                <div
                                  className={cn(
                                    "size-5 rounded-full border grid place-items-center transition-colors",
                                    m.status === "completed"
                                      ? "bg-emerald-500 border-emerald-400 text-neutral-950"
                                      : "border-border text-muted-foreground group-hover/m:border-primary"
                                  )}
                                >
                                  {m.status === "completed" && <Check className="size-3 stroke-[3]" />}
                                </div>
                                <div>
                                  <h4 className="text-xs font-semibold text-foreground group-hover/m:text-primary transition-colors">
                                    {m.title}
                                  </h4>
                                  {m.description && (
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      {m.description}
                                    </p>
                                  )}
                                </div>
                              </button>

                              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                Due: {m.dueDate}
                              </span>
                            </div>

                            {/* Deliverables Checklist */}
                            <div className="pl-7 space-y-1.5 border-t border-border/40 pt-2.5">
                              {m.deliverables.map((del) => (
                                <label
                                  key={del.id}
                                  className="flex items-start gap-2.5 text-xs text-foreground/90 hover:text-foreground cursor-pointer select-none"
                                >
                                  <input
                                    type="checkbox"
                                    checked={del.completed}
                                    onChange={() => toggleDeliverable(project.id, m.id, del.id)}
                                    className="rounded border-border text-primary focus:ring-primary cursor-pointer size-3.5 mt-0.5"
                                  />
                                  <span className={cn(del.completed && "line-through text-muted-foreground text-[11px]")}>
                                    {del.title}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CONNECTED TASKS */}
                  {activeTab === "tasks" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Linked Tasks in TaskManager
                          </h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Tasks directly associated with this project sprint.
                          </p>
                        </div>
                        {onNavigateToTasks && (
                          <button
                            type="button"
                            onClick={onNavigateToTasks}
                            className="text-xs font-medium text-primary hover:underline cursor-pointer"
                          >
                            Open Tasks Workspace →
                          </button>
                        )}
                      </div>

                      {/* Inline Quick Task Creator */}
                      <form
                        onSubmit={handleAddQuickTask}
                        className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 bg-background"
                      >
                        <input
                          type="text"
                          value={quickTaskTitle}
                          onChange={(e) => setQuickTaskTitle(e.target.value)}
                          placeholder={`+ Add task for "${project.title}"...`}
                          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none px-2"
                        />
                        <select
                          value={quickTaskPriority}
                          onChange={(e) => setQuickTaskPriority(e.target.value as any)}
                          className="text-[11px] rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-muted-foreground"
                        >
                          <option value="urgent">Urgent</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                        <button
                          type="submit"
                          disabled={!quickTaskTitle.trim()}
                          className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
                        >
                          Add
                        </button>
                      </form>

                      {/* Linked Task List */}
                      <div className="space-y-2">
                        {linkedTasks.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
                            No tasks linked to this project yet. Use the quick add box above to create one.
                          </div>
                        ) : (
                          linkedTasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-card/60 hover:bg-card transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={task.status === "completed"}
                                  onChange={() => toggleTaskStatus(task.id)}
                                  className="rounded border-border text-primary focus:ring-primary cursor-pointer size-4"
                                />
                                <div className="min-w-0">
                                  <p
                                    className={cn(
                                      "text-xs font-medium text-foreground truncate",
                                      task.status === "completed" && "line-through text-muted-foreground"
                                    )}
                                  >
                                    {task.title}
                                  </p>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    Due: {task.dueDate} • Priority: {task.priority}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={cn(
                                  "text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border shrink-0",
                                  task.status === "completed"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                )}
                              >
                                {task.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CONNECTED NOTES */}
                  {activeTab === "notes" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Related Knowledge Base Notes
                          </h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Markdown documentation and syntax snippets tagged in {project.track}.
                          </p>
                        </div>
                        {onNavigateToNotes && (
                          <button
                            type="button"
                            onClick={onNavigateToNotes}
                            className="text-xs font-medium text-primary hover:underline cursor-pointer"
                          >
                            Open Notes Studio →
                          </button>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        {linkedNotes.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
                            No notes created for this track yet.
                          </div>
                        ) : (
                          linkedNotes.map((note) => (
                            <div
                              key={note.id}
                              className="p-3.5 rounded-xl border border-border/60 bg-card/60 hover:bg-card transition-colors space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                  <NotebookTabs className="size-3.5 text-primary" />
                                  <span>{note.title}</span>
                                </h4>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {new Date(note.updatedAt).toLocaleDateString()}
                                </span>
                              </div>

                              {note.codeSnippet && (
                                <pre className="p-2 rounded-lg bg-neutral-950 border border-border/60 text-[10px] font-mono text-muted-foreground overflow-x-auto">
                                  <code>{note.codeSnippet.slice(0, 150)}...</code>
                                </pre>
                              )}

                              <div className="flex flex-wrap gap-1">
                                {note.tags.map((t) => (
                                  <span
                                    key={t}
                                    className={cn(
                                      "text-[10px] font-mono px-2 py-0.5 rounded-md border",
                                      getTagClass(t)
                                    )}
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: ARCHITECTURE SPEC */}
                  {activeTab === "architecture" && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          System Architecture & Design Decisions
                        </h3>
                        <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans">
                          {project.architectureNotes || (
                            <p className="text-muted-foreground italic">
                              No custom architecture notes documented yet. Click Edit to add specs.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Detailed Overview
                        </h3>
                        <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans">
                          {project.descriptionMarkdown}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: AI ARCHITECTURE REVIEW */}
                  {activeTab === "ai_review" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="size-4 text-amber-400" />
                          <div>
                            <h4 className="text-xs font-semibold text-amber-300">
                              Gemini 3.8 Flash Code & Architecture Review
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              Production readiness audit, bottleneck detection, and portfolio talking points.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isAIReviewing}
                          onClick={handleAIArchitectureReview}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                        >
                          {isAIReviewing ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="size-3.5" />
                              <span>Re-Analyze</span>
                            </>
                          )}
                        </button>
                      </div>

                      {isAIReviewing && (
                        <div className="p-8 text-center space-y-2">
                          <Loader2 className="size-6 animate-spin text-amber-400 mx-auto" />
                          <p className="text-xs text-muted-foreground">
                            Gemini 3.8 Flash is analyzing system design, scaling bounds, and interview criteria...
                          </p>
                        </div>
                      )}

                      {aiReviewOutput && !isAIReviewing && (
                        <div className="rounded-xl border border-border/70 bg-card/70 p-5 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                          {aiReviewOutput}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
