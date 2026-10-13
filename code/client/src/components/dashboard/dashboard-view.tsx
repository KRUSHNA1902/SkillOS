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
} from "lucide-react";

export type TaskStatus = "in_progress" | "pending" | "completed";
export type TaskPriority = "urgent" | "high" | "medium" | "low";

export interface WorkflowTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  dueDate: string;
}

export interface NoteItem {
  id: string;
  title: string;
  preview: string;
  tag: string;
  updatedAt: string;
  pinned?: boolean;
}

export interface WorkflowUpdate {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: "deploy" | "skill" | "task" | "ai" | "system";
}

const initialTasks: WorkflowTask[] = [
  {
    id: "task-1",
    title: "Implement Animated Sidebar navigation rail with spring physics",
    status: "in_progress",
    priority: "high",
    category: "Frontend UI",
    dueDate: "Today, 5:00 PM",
  },
  {
    id: "task-2",
    title: "Connect Supabase Auth session tokens with Express middleware",
    status: "in_progress",
    priority: "urgent",
    category: "Auth Pipeline",
    dueDate: "Today, 7:30 PM",
  },
  {
    id: "task-3",
    title: "Optimize LCP and reduce motion jank on mobile drawer viewport",
    status: "in_progress",
    priority: "medium",
    category: "Performance",
    dueDate: "Tomorrow",
  },
  {
    id: "task-4",
    title: "Design SkillOS task hierarchy & interactive checklist workflow",
    status: "completed",
    priority: "high",
    category: "Workflow Engine",
    dueDate: "Completed",
  },
  {
    id: "task-5",
    title: "Configure Tailwind CSS dark theme tokens for shadcn UI components",
    status: "completed",
    priority: "medium",
    category: "Design System",
    dueDate: "Completed",
  },
  {
    id: "task-6",
    title: "Automate PostgreSQL database migration scripts on cloud host",
    status: "pending",
    priority: "high",
    category: "Backend",
    dueDate: "In 2 days",
  },
  {
    id: "task-7",
    title: "Benchmark AI skill assessment prompts against real developer code",
    status: "pending",
    priority: "medium",
    category: "AI Engine",
    dueDate: "Friday",
  },
];

const initialNotes: NoteItem[] = [
  {
    id: "note-1",
    title: "Architecture: Responsive Shell Boundaries",
    preview: "Spring damping should be critically tuned (mass 0.75, damping 35) to avoid overshooting zero-width rails on desktop resize.",
    tag: "Architecture",
    updatedAt: "25m ago",
    pinned: true,
  },
  {
    id: "note-2",
    title: "Sprint 4 Checklist: Auth & Tokens",
    preview: "Ensure JWT validation runs before protected routes. Dev bypass mode must only activate when VITE_DEV_BYPASS is explicitly true.",
    tag: "Security",
    updatedAt: "2h ago",
    pinned: true,
  },
  {
    id: "note-3",
    title: "Skill Verification Rubric",
    preview: "Developers need 3 validated task submissions across AST parsing, responsive layout, and async state management.",
    tag: "Learning",
    updatedAt: "5h ago",
  },
  {
    id: "note-4",
    title: "Tailwind Color Mapping Notes",
    preview: "Always map hsl(var(--card)) and hsl(var(--muted)) rather than hardcoding hex so dark/light theme switching works natively.",
    tag: "Design System",
    updatedAt: "1d ago",
  },
];

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
}

export function DashboardView({
  userName = "Developer",
  userEmail = "developer@skillos.local",
  isDevUser = false,
  onOpenAI,
}: DashboardViewProps) {
  const [tasks, setTasks] = useState<WorkflowTask[]>(initialTasks);
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [newTaskInput, setNewTaskInput] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNotePreview, setNewNotePreview] = useState("");
  const [newNoteTag, setNewNoteTag] = useState("General");

  // Dynamic workflow metrics
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Toggle task status
  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const nextStatus: TaskStatus =
            task.status === "completed" ? "in_progress" : "completed";
          return {
            ...task,
            status: nextStatus,
            dueDate: nextStatus === "completed" ? "Completed" : "Today",
          };
        }
        return task;
      })
    );
  };

  // Quick add task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask: WorkflowTask = {
      id: `task-${Date.now()}`,
      title: newTaskInput.trim(),
      status: "in_progress",
      priority: "high",
      category: "Workflow",
      dueDate: "Today",
    };
    setTasks([newTask, ...tasks]);
    setNewTaskInput("");
  };

  // Quick add note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNotePreview.trim()) return;
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim(),
      preview: newNotePreview.trim(),
      tag: newNoteTag.trim() || "General",
      updatedAt: "Just now",
      pinned: true,
    };
    setNotes([newNote, ...notes]);
    setNewNoteTitle("");
    setNewNotePreview("");
    setShowAddNote(false);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
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

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
            <Clock className="size-3.5 text-emerald-400" />
            <span>Sprint 4 • Day 6 of 14</span>
          </div>
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

      {/* 4 Core Workflow Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          {/* SECTION 1: Current Tasks & Workflow Board */}
          <Card className="border-border bg-card/60 backdrop-blur-sm">
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
                    Interactive task manager • Click checkbox to mark as completed
                  </CardDescription>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 rounded-xl bg-muted/70 p-1 text-[11px]">
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

              {/* Quick Add Task Input */}
              <form onSubmit={handleAddTask} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="Add a new task (e.g. Write integration test for webhook)..."
                  className="flex-1 rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </CardHeader>

            <CardContent className="space-y-2 pt-1">
              <div className="divide-y divide-border/50">
                {filteredTasks.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No tasks found in this view.
                  </p>
                ) : (
                  filteredTasks.map((task) => {
                    const isDone = task.status === "completed";
                    const isUrgent = task.priority === "urgent";
                    const isHigh = task.priority === "high";

                    return (
                      <div
                        key={task.id}
                        className="group flex items-start justify-between gap-3 py-3 transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-xl"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Interactive Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            aria-label={isDone ? "Mark as in progress" : "Mark as completed"}
                            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-lg border transition-all cursor-pointer ${
                              isDone
                                ? "border-emerald-500 bg-emerald-500 text-black shadow-xs"
                                : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10"
                            }`}
                          >
                            {isDone && <Check className="size-3 stroke-[3]" />}
                          </button>

                          <div className="min-w-0 space-y-1">
                            <p
                              className={`text-xs font-medium leading-snug transition-all ${
                                isDone
                                  ? "line-through text-muted-foreground/60"
                                  : "text-foreground"
                              }`}
                            >
                              {task.title}
                            </p>
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

                              <span className="text-muted-foreground flex items-center gap-1">
                                <Clock className="size-2.5" />
                                {task.dueDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
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

              <button
                type="button"
                onClick={() => setShowAddNote(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                <Plus className="size-3" />
                <span>New Note</span>
              </button>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 pt-1">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-background/60 p-3.5 transition-all hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {note.tag}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {note.updatedAt}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {note.title}
                    </h4>
                    <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                      {note.preview}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (3 cols): Latest Updates & Workflow Breakdown */}
        <div className="space-y-6 lg:col-span-3">
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
                {initialUpdates.map((item) => {
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
                      className="flex items-start justify-between gap-3 py-3 transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-xl"
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
