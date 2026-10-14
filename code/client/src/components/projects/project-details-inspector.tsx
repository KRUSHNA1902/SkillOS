import { useState } from "react";
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
} from "lucide-react";
import { Project } from "./project-types";
import { useProjects } from "./project-context";
import { useTaskManager } from "@/components/tasks/task-context";
import { useNotes } from "@/components/notes/note-context";
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

  const [activeTab, setActiveTab] = useState<"milestones" | "tasks" | "notes" | "architecture" | "ai_review">("milestones");

  // Inline Quick Task Add
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskPriority, setQuickTaskPriority] = useState<"urgent" | "high" | "medium" | "low">("high");

  // AI Review State
  const [isAIReviewing, setIsAIReviewing] = useState(false);
  const [aiReviewOutput, setAiReviewOutput] = useState<string | null>(null);

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
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/70 backdrop-blur-sm">
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 220 }}
          className="relative w-full max-w-2xl h-full flex flex-col border-l border-border/80 bg-card shadow-2xl overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-muted/20">
            <div className="flex items-center gap-2">
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
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  statusCfg.badge
                )}
              >
                <span className={cn("size-1.5 rounded-full", statusCfg.dot)} />
                {statusCfg.label}
              </span>

              <button
                type="button"
                onClick={() => advanceProjectStatus(project.id)}
                className="text-[10px] font-mono font-medium text-primary hover:underline cursor-pointer ml-1"
                title="Advance to next project stage"
              >
                Advance Stage →
              </button>
            </div>

            <div className="flex items-center gap-1">
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

              <button
                type="button"
                onClick={() => exportProjectMarkdown(project)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Export Markdown (.md)"
              >
                <Download className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => onEdit(project)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Edit Project Details"
              >
                <Edit2 className="size-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Close Deep Dive"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Project Title & Overview Banner */}
          <div className="p-6 border-b border-border/40 bg-card/60 space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {project.title}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {project.tagline}
            </p>

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
          <div className="flex items-center gap-1 border-b border-border/40 px-6 pt-2 bg-muted/10 overflow-x-auto">
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

            {/* TAB 2: CONNECTED TASKS (WORKFLOW ENGINE) */}
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
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground"
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
