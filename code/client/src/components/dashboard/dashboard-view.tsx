import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  Plus,
  StickyNote,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Check,
  Zap,
  GitCommit,
  Rocket,
  Flame,
  ListTodo,
  FileText,
  ChevronRight,
} from "lucide-react";
import {
  WorkflowTask,
  TaskPriority,
  TaskStatus,
} from "@/components/tasks/task-types";
import { useTaskManager, calculateTimeRemaining } from "@/components/tasks/task-context";
import { useNotes } from "@/components/notes/note-context";
import { useProjects } from "@/components/projects/project-context";
import { useOnboarding } from "@/context/OnboardingContext";
import { OnboardingResumeBanner } from "@/components/onboarding/onboarding-resume-banner";
import { OnboardingChecklistCard } from "@/components/onboarding/onboarding-checklist-card";
import { Compass, FolderKanban } from "lucide-react";

export type { TaskStatus, TaskPriority, WorkflowTask };

export interface WorkflowUpdate {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: "deploy" | "skill" | "task" | "ai" | "system";
}

const initialUpdates: WorkflowUpdate[] = [
  {
    id: "up-1",
    title: "Workflow Automation v1.2 Deployed",
    detail: "Production release deployed to Vercel with zero downtime",
    time: "10m ago",
    type: "deploy",
  },
  {
    id: "up-2",
    title: "Skill Verified: Advanced TypeScript",
    detail: "Developer passed AST type inference and generics benchmark",
    time: "45m ago",
    type: "skill",
  },
  {
    id: "up-3",
    title: "New Security Audit Task Logged",
    detail: "Auth middleware token expiry test cases created",
    time: "1h ago",
    type: "task",
  },
  {
    id: "up-4",
    title: "AI Skill Roadmap Generated",
    detail: "Personalized backend microservices roadmap created for org",
    time: "3h ago",
    type: "ai",
  },
  {
    id: "up-5",
    title: "Database Sync Complete",
    detail: "Supabase PostgreSQL migrations synced across environments",
    time: "5h ago",
    type: "system",
  },
];

export interface DashboardViewProps {
  userName?: string;
  userEmail?: string;
  isDevUser?: boolean;
  onOpenAI?: () => void;
  onOpenTasks?: (options?: { openCreateModal?: boolean; initialTitle?: string }) => void;
  onOpenNotes?: () => void;
  onOpenProjects?: () => void;
}

export function DashboardView({
  userName = "Developer",
  userEmail = "developer@skillos.local",
  isDevUser = false,
  onOpenAI,
  onOpenTasks,
  onOpenNotes,
  onOpenProjects,
}: DashboardViewProps) {
  const {
    tasks,
    metrics,
    addTask,
    toggleTaskStatus,
    activeAlerts,
  } = useTaskManager();

  const {
    notes,
    addNote,
    setSelectedNoteId,
  } = useNotes();

  const {
    projects,
    metrics: projectMetrics,
    setSelectedProjectId,
  } = useProjects();

  const { state: onboardingState, startTour } = useOnboarding();

  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [newTaskInput, setNewTaskInput] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNotePreview, setNewNotePreview] = useState("");
  const [newNoteTag, setNewNoteTag] = useState("General");
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  // Dynamic workflow metrics from shared TaskManager
  const inProgressCount = metrics.inProgress;
  const completedCount = metrics.completed;
  const pendingCount = metrics.pending;
  const totalCount = metrics.total;
  const completionRate = metrics.completionRate;

  // Personal activity feed for real users vs dev updates
  const userUpdates = React.useMemo(() => {
    if (isDevUser) return initialUpdates;
    const updates: WorkflowUpdate[] = [
      {
        id: "up-welcome",
        title: "Workspace Initialized",
        detail: `Welcome to SkillOS, ${userName}. Your personal operating system is ready.`,
        time: "Just now",
        type: "system",
      },
    ];
    if (tasks.length > 0) {
      const latestTask = tasks[0];
      updates.unshift({
        id: `up-task-${latestTask.id}`,
        title: `Task Logged: ${latestTask.title}`,
        detail: `Status: ${latestTask.status} • Priority: ${latestTask.priority}`,
        time: "Recent",
        type: "task",
      });
    }
    if (notes.length > 0) {
      const latestNote = notes[0];
      updates.unshift({
        id: `up-note-${latestNote.id}`,
        title: `Note Saved: ${latestNote.title}`,
        detail: `Track: ${latestNote.area}`,
        time: "Recent",
        type: "ai",
      });
    }
    return updates;
  }, [isDevUser, userName, tasks, notes]);

  // Toggle task status
  const toggleTask = (id: string) => {
    toggleTaskStatus(id);
  };

  // Add task -> Redirects to Task section with Create Task modal
  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = newTaskInput.trim();
    if (onOpenTasks) {
      onOpenTasks({ openCreateModal: true, initialTitle: title });
      setNewTaskInput("");
    } else {
      if (!title) return;
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      addTask({
        title,
        status: "in_progress",
        priority: "high",
        category: "Workflow",
        dueDate: "Tomorrow, 6:00 PM",
        deadline: tomorrow.toISOString(),
        timelineStage: "in_progress",
        notes: "",
        reminderAlert: true,
      });
      setNewTaskInput("");
      if (filter !== "all" && filter !== "in_progress") {
        setFilter("all");
      }
    }
  };

  // Quick add note to shared Knowledge Notes store
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNotePreview.trim()) return;
    addNote({
      title: newNoteTitle.trim(),
      contentMarkdown: newNotePreview.trim(),
      area: "General",
      tags: [newNoteTag.trim() || "General"],
      pinned: true,
    });
    setNewNoteTitle("");
    setNewNotePreview("");
    setShowAddNote(false);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  return (
    <div className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden min-w-0 max-w-full p-4 sm:p-6 lg:p-8">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Workflow Dashboard
            </h1>
            {isDevUser && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono font-medium text-amber-300">
                <ShieldCheck className="size-3.5 text-amber-400" />
                Dev Mode
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, <span className="font-semibold text-foreground">{userName}</span> ({userEmail}). Here is your real-time workflow pulse.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeAlerts.length > 0 && onOpenTasks && (
            <button
              type="button"
              onClick={() => onOpenTasks()}
              title="View deadline alerts in Tasks workspace"
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 backdrop-blur-sm hover:bg-rose-500/25 transition-colors cursor-pointer"
            >
              <AlertCircle className="size-3.5 text-rose-400 animate-pulse" />
              <span>{activeAlerts.length} Deadline Alert{activeAlerts.length > 1 ? "s" : ""}</span>
            </button>
          )}
          {onOpenTasks && (
            <button
              type="button"
              onClick={() => onOpenTasks()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
            >
              <ListTodo className="size-3.5 text-primary" />
              <span>Tasks</span>
            </button>
          )}
          {onOpenAI && (
            <button
              type="button"
              onClick={onOpenAI}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
            >
              <Sparkles className="size-3.5 text-amber-400" />
              <span>Ask AI</span>
            </button>
          )}
          {!onboardingState.checklist?.tourCompleted && (
            <button
              type="button"
              onClick={startTour}
              title="Start interactive product tour"
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 cursor-pointer"
            >
              <Compass className="size-3.5 text-amber-400" />
              <span>Tour</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAddNote(!showAddNote)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Quick Note</span>
          </button>
        </div>
      </div>

      {/* Resumable Onboarding Setup Banner */}
      <OnboardingResumeBanner />

      {/* 21st.dev Getting Started Checklist Card */}
      <OnboardingChecklistCard
        onOpenAI={onOpenAI}
        onOpenTasks={onOpenTasks}
        onOpenNotes={onOpenNotes}
      />

      {/* 4 Core Workflow Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 min-w-0 max-w-full" data-tour="metrics-bar">
        {/* 1. Current / In Progress Tasks */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 380, damping: 25 }}
        >
          <Card className="h-full border-border bg-card/60 backdrop-blur-sm transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Current Tasks
              </CardTitle>
              <div className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-400">
                <PlayCircle className="size-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {inProgressCount}
              </div>
              <p className="mt-2 flex items-center text-xs font-medium text-amber-400">
                <Flame className="mr-1 size-3.5" />
                <span>Active in progress</span>
                <span className="ml-auto text-muted-foreground">3 due today</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 2. Tasks Completed */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 380, damping: 25 }}
        >
          <Card className="h-full border-border bg-card/60 backdrop-blur-sm transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tasks Completed
              </CardTitle>
              <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="size-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {completedCount}
              </div>
              <p className="mt-2 flex items-center text-xs font-medium text-emerald-400">
                <TrendingUp className="mr-1 size-3.5" />
                <span>{completionRate}% of sprint goal</span>
                <span className="ml-auto text-muted-foreground">+{completedCount} finished</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3. Pending Tasks */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 380, damping: 25 }}
        >
          <Card className="h-full border-border bg-card/60 backdrop-blur-sm transition-all hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pending / Queued
              </CardTitle>
              <div className="grid size-9 place-items-center rounded-xl bg-blue-500/10 text-blue-400">
                <AlertCircle className="size-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {pendingCount}
              </div>
              <p className="mt-2 flex items-center text-xs font-medium text-blue-400">
                <Clock className="mr-1 size-3.5" />
                <span>Awaiting review & backlog</span>
                <span className="ml-auto text-muted-foreground">1 blocked</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 4. Sprint Velocity */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 380, damping: 25 }}
        >
          <Card className="h-full border-border bg-card/60 backdrop-blur-sm transition-all hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Sprint Velocity
              </CardTitle>
              <div className="grid size-9 place-items-center rounded-xl bg-purple-500/10 text-purple-400">
                <Zap className="size-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                94%
              </div>
              <p className="mt-2 flex items-center text-xs font-medium text-purple-400">
                <Sparkles className="mr-1 size-3.5" />
                <span>Optimal pacing</span>
                <span className="ml-auto text-muted-foreground">+5.4 pts ahead</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Optional Quick Add Note Drawer / Modal */}
      <AnimatePresence>
        {showAddNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/30 bg-primary/5 p-4 backdrop-blur-md">
              <form onSubmit={handleAddNote} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <StickyNote className="size-4 text-primary" />
                    New Workspace Note
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddNote(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Note title (e.g. API Architecture Decision)"
                    className="sm:col-span-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                  <input
                    type="text"
                    value={newNoteTag}
                    onChange={(e) => setNewNoteTag(e.target.value)}
                    placeholder="Tag (e.g. Security, Design)"
                    className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <textarea
                  value={newNotePreview}
                  onChange={(e) => setNewNotePreview(e.target.value)}
                  placeholder="Key takeaways, takeaways, code snippets or learnings..."
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 cursor-pointer"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Left (Current Tasks & Notes) + Right (Latest Updates & Progress) */}
      <div className="grid gap-6 lg:grid-cols-7 min-w-0 max-w-full">
        {/* Left Column (4 cols) */}
        <div className="space-y-6 lg:col-span-4 min-w-0 max-w-full">
          {/* SECTION 1: Current Tasks & Workflow Board */}
          <Card className="border-border bg-card/60 backdrop-blur-sm" data-tour="task-engine">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span>Current Workflow Tasks</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground">
                      {tasks.length}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Interactive task manager • Click checkbox to complete • Click task to view notes
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 rounded-xl bg-muted/70 p-1 text-[11px] max-w-full overflow-x-auto scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setFilter("all")}
                      className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                        filter === "all"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("in_progress")}
                      className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                        filter === "in_progress"
                          ? "bg-background text-amber-400 shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Active ({inProgressCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("pending")}
                      className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                        filter === "pending"
                          ? "bg-background text-blue-400 shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Pending ({pendingCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("completed")}
                      className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                        filter === "completed"
                          ? "bg-background text-emerald-400 shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Done ({completedCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Add Task Input */}
              <form onSubmit={handleAddTask} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="Add a new task (e.g. Write integration test for webhook)..."
                  className="flex-1 min-w-0 rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  onClick={handleAddTask}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 cursor-pointer active:scale-95 transition-all"
                >
                  <Plus className="size-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </CardHeader>

            <CardContent className="space-y-2 pt-1">
              <div className="divide-y divide-border/50">
                {tasks.length === 0 ? (
                  <div className="py-8 text-center space-y-2 rounded-xl border border-dashed border-border/70 bg-background/30 p-4">
                    <p className="text-xs text-muted-foreground">
                      No tasks yet. Plan your first roadmap milestone above or jump into Tasks.
                    </p>
                    {onOpenTasks && (
                      <button
                        type="button"
                        onClick={() => onOpenTasks()}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer font-medium"
                      >
                        Open Task Operations &rarr;
                      </button>
                    )}
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No tasks found matching this filter.
                  </p>
                ) : (
                  filteredTasks.map((task) => {
                    const isDone = task.status === "completed";
                    const isUrgent = task.priority === "urgent";
                    const isHigh = task.priority === "high";
                    const calc = calculateTimeRemaining(task.deadline);
                    const isNotesExpanded = expandedNotesId === task.id;

                    return (
                      <div
                        key={task.id}
                        className="group flex flex-col gap-1.5 py-3 transition-colors hover:bg-muted/30 sm:-mx-2 sm:px-2 mx-0 px-1 rounded-xl"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Interactive Checkbox */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTask(task.id);
                              }}
                              aria-label={isDone ? "Mark as in progress" : "Mark as completed"}
                              className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-lg border transition-all cursor-pointer ${
                                isDone
                                  ? "border-emerald-500 bg-emerald-500 text-black shadow-xs"
                                  : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10"
                              }`}
                            >
                              {isDone && <Check className="size-3 stroke-[3]" />}
                            </button>

                            {/* Clickable Task Content - toggles notes preview directly */}
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                setExpandedNotesId(
                                  isNotesExpanded ? null : task.id
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setExpandedNotesId(
                                    isNotesExpanded ? null : task.id
                                  );
                                }
                              }}
                              className="min-w-0 space-y-1 flex-1 cursor-pointer select-none group/title text-left"
                              title="Click task to view notes & requirements"
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p
                                  className={`text-xs font-medium leading-snug transition-colors group-hover/title:text-primary group-hover/title:underline ${
                                    isDone
                                      ? "line-through text-muted-foreground/60"
                                      : isNotesExpanded
                                      ? "text-primary font-semibold"
                                      : "text-foreground"
                                  }`}
                                >
                                  {task.title}
                                </p>
                                {task.notes && (
                                  <span
                                    className={`inline-flex items-center gap-0.5 text-[10px] transition-colors ${
                                      isNotesExpanded
                                        ? "text-primary font-medium"
                                        : "text-muted-foreground/60 group-hover/title:text-primary"
                                    }`}
                                  >
                                    <FileText className="size-2.5" />
                                    <span className="text-[9px]">Notes</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                                  {task.category}
                                </span>

                                {isUrgent && (
                                  <span className="rounded-md bg-rose-500/15 px-2 py-0.5 font-semibold text-rose-400 border border-rose-500/20">
                                    Urgent
                                  </span>
                                )}
                                {isHigh && (
                                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-400 border border-amber-500/20">
                                    High
                                  </span>
                                )}

                                <span
                                  className={`flex items-center gap-1 font-medium ${
                                    isDone
                                      ? "text-muted-foreground"
                                      : calc.isOverdue
                                      ? "text-rose-400 font-semibold"
                                      : calc.isDueToday
                                      ? "text-amber-400 font-semibold"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  <Clock className="size-2.5" />
                                  <span>{task.dueDate}</span>
                                  {!isDone && <span>({calc.formatted})</span>}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {task.status === "in_progress" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
                                <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Active
                              </span>
                            )}
                            {task.status === "pending" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400 border border-blue-500/20">
                                Pending
                              </span>
                            )}
                            {task.status === "completed" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                                Done
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inline Notes Preview */}
                        {isNotesExpanded && (
                          <div className="mt-1 ml-8 rounded-lg border border-border/60 bg-background/70 p-2.5 text-[11px] text-muted-foreground leading-relaxed font-mono">
                            <div className="flex items-center justify-between gap-2 mb-1 font-sans">
                              <span className="text-[10px] font-semibold text-foreground flex items-center gap-1">
                                <FileText className="size-3 text-primary" />
                                Task Notes & Requirements:
                              </span>
                              <span className="text-[9px] text-muted-foreground">Click task title to close</span>
                            </div>
                            <div className="font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-words break-all">
                              {task.notes?.trim() || "No detailed notes provided for this task."}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: Latest Notes */}
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <StickyNote className="size-4 text-primary" />
                  <span>Latest Notes & Scratchpad</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Key architectural decisions, takeaways, and meeting synthesis
                </CardDescription>
              </div>

              <div className="flex items-center gap-2.5">
                {onOpenNotes && (
                  <button
                    type="button"
                    onClick={onOpenNotes}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>Open Studio</span>
                    <ChevronRight className="size-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddNote(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
                >
                  <Plus className="size-3" />
                  <span>New Note</span>
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              {notes.length === 0 ? (
                <div className="py-8 text-center space-y-2 rounded-xl border border-dashed border-border/70 bg-background/30 p-4">
                  <p className="text-xs text-muted-foreground">
                    No knowledge notes yet. Capture technical concepts or use the AI Synthesizer.
                  </p>
                  {onOpenNotes && (
                    <button
                      type="button"
                      onClick={onOpenNotes}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer font-medium"
                    >
                      Open Knowledge Studio &rarr;
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {notes.slice(0, 4).map((note) => (
                    <div
                      key={note.id}
                      onClick={() => {
                        setSelectedNoteId(note.id);
                        onOpenNotes?.();
                      }}
                      className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-background/60 p-3.5 transition-all hover:border-primary/40 hover:bg-muted/40 cursor-pointer"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            {note.tags[0] || note.area}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(note.updatedAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {note.title}
                        </h4>
                        <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                          {note.contentMarkdown.replace(/[#*`>-]/g, "").slice(0, 110)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (3 cols): Projects, Latest Updates & Workflow Breakdown */}
        <div className="space-y-6 lg:col-span-3 min-w-0 max-w-full">
          {/* SECTION 2.5: Active Portfolio Projects */}
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <FolderKanban className="size-4 text-primary" />
                  <span>Portfolio Projects</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {projectMetrics.inProgress} active sprints • {projectMetrics.completed} portfolio ready
                </CardDescription>
              </div>
              {onOpenProjects && (
                <button
                  type="button"
                  onClick={onOpenProjects}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
                >
                  <span>Showcase</span>
                  <ChevronRight className="size-3" />
                </button>
              )}
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <div className="space-y-2.5">
                {projects.slice(0, 3).map((proj) => {
                  return (
                    <div
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        if (onOpenProjects) onOpenProjects();
                      }}
                      className="group/item flex flex-col gap-1.5 rounded-xl border border-border/60 bg-background/50 p-3 hover:border-border hover:bg-background/80 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground group-hover/item:text-primary transition-colors truncate">
                          {proj.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-foreground shrink-0">
                          {proj.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span className="truncate max-w-[140px]">{proj.track}</span>
                        <span>{proj.loggedHours}h / {proj.estimatedHours}h</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: Latest Updates */}
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Rocket className="size-4 text-emerald-400" />
                  <span>Latest Updates</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time system events, skill verifications & releases
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <div className="divide-y divide-border/50">
                {userUpdates.map((item) => {
                  let badgeColor = "text-emerald-400 bg-emerald-500/10";
                  let Icon = GitCommit;
                  if (item.type === "deploy") {
                    badgeColor = "text-emerald-400 bg-emerald-500/10";
                    Icon = Rocket;
                  } else if (item.type === "skill") {
                    badgeColor = "text-purple-400 bg-purple-500/10";
                    Icon = Sparkles;
                  } else if (item.type === "task") {
                    badgeColor = "text-amber-400 bg-amber-500/10";
                    Icon = Clock;
                  } else if (item.type === "ai") {
                    badgeColor = "text-blue-400 bg-blue-500/10";
                    Icon = Zap;
                  }

                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 py-3 transition-colors hover:bg-muted/30 sm:-mx-2 sm:px-2 mx-0 px-1 rounded-xl"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${badgeColor}`}>
                          <Icon className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {item.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4: Workflow Health & Velocity Progress */}
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="size-4 text-purple-400" />
                <span>Workflow Distribution</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Sprint status distribution across all skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar 1: In Progress */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-400" />
                    Current Active Tasks
                  </span>
                  <span className="text-foreground font-semibold">
                    {inProgressCount} ({totalCount > 0 ? Math.round((inProgressCount / totalCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{
                      width: `${totalCount > 0 ? (inProgressCount / totalCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Progress Bar 2: Completed */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    Completed Tasks
                  </span>
                  <span className="text-foreground font-semibold">
                    {completedCount} ({completionRate}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              {/* Progress Bar 3: Pending */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-400" />
                    Pending / In Review
                  </span>
                  <span className="text-foreground font-semibold">
                    {pendingCount} ({totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{
                      width: `${totalCount > 0 ? (pendingCount / totalCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Sprint Quick Summary Box */}
              <div className="mt-4 rounded-xl border border-border/80 bg-background/50 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-muted-foreground">Sprint Pace:</span>
                  <span className="text-emerald-400 font-semibold">+14% On Track</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  3 active skill milestones ready for peer review before end of sprint.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
