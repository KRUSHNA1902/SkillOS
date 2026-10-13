import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ListTodo,
  Plus,
  Trash2,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Flag,
  FileText,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Milestone,
  BellRing,
  LayoutList,
  Flame,
  ArrowUpDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTaskManager, calculateTimeRemaining } from "./task-context";
import {
  WorkflowTask,
  TaskPriority,
  TaskStatus,
} from "./task-types";
import { TaskModal } from "./task-modal";
import { TaskAlertsBanner } from "./task-alerts-banner";
import { TaskTimelineView } from "./task-timeline-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SORT_OPTIONS = [
  { id: "deadline", label: "Deadline (Earliest)" },
  { id: "priority", label: "Priority (Highest)" },
  { id: "newest", label: "Newest First" },
  { id: "title", label: "Alphabetical" },
] as const;

interface TasksViewProps {
  onNavigateToAI?: () => void;
}

export function TasksView({ onNavigateToAI }: TasksViewProps) {
  const {
    tasks,
    metrics,
    addTask,
    updateTask,
    deleteTask,
    deleteOldTasks,
    toggleTaskStatus,
    setTaskPriority,
    toggleReminderAlert,
    loadStarterTemplates,
  } = useTaskManager();

  // View state
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus | "overdue">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "newest" | "title">("deadline");

  // Fast inline task creation
  const [quickTitle, setQuickTitle] = useState("");

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkflowTask | null>(null);
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  // Notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Quick Inline Add Task
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    addTask({
      title: quickTitle.trim(),
      category: "Workflow",
      priority: "high",
      status: "in_progress",
      dueDate: "Today, 6:00 PM",
      deadline: "2026-10-13T18:00",
      timelineStage: "in_progress",
      notes: "",
      reminderAlert: true,
    });

    setQuickTitle("");
    showToast("Task added successfully");
  };

  // Save Task (from full modal)
  const handleSaveModal = (
    taskData: Omit<WorkflowTask, "id" | "createdAt"> & { id?: string }
  ) => {
    if (taskData.id) {
      updateTask(taskData.id, taskData);
      showToast("Task updated successfully");
    } else {
      addTask(taskData);
      showToast("New task created");
    }
    setEditingTask(null);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (task: WorkflowTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Execute Cleanup
  const handleConfirmCleanup = () => {
    const deletedCount = deleteOldTasks("all_completed");
    setIsCleanupDialogOpen(false);
    showToast(`Removed ${deletedCount} completed tasks from workspace`);
  };

  // Filtered and Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchCategory = task.category.toLowerCase().includes(q);
          const matchNotes = task.notes?.toLowerCase().includes(q) ?? false;
          if (!matchTitle && !matchCategory && !matchNotes) return false;
        }

        // Status filter
        if (statusFilter === "overdue") {
          if (task.status === "completed") return false;
          const calc = calculateTimeRemaining(task.deadline);
          if (!calc.isOverdue) return false;
        } else if (statusFilter !== "all") {
          if (task.status !== statusFilter) return false;
        }

        // Priority filter
        if (priorityFilter !== "all" && task.priority !== priorityFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deadline") {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (sortBy === "priority") {
          const rank: Record<TaskPriority, number> = {
            urgent: 4,
            high: 3,
            medium: 2,
            low: 1,
          };
          return rank[b.priority] - rank[a.priority];
        }
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortBy]);

  // Cycle Priority on click
  const cyclePriority = (taskId: string, current: TaskPriority) => {
    const next: Record<TaskPriority, TaskPriority> = {
      urgent: "high",
      high: "medium",
      medium: "low",
      low: "urgent",
    };
    setTaskPriority(taskId, next[current]);
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 right-6 z-50 rounded-xl border border-emerald-500/30 bg-card dark:bg-emerald-950/90 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-200 shadow-xl backdrop-blur-md flex items-center gap-2"
          >
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <ListTodo className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Task Operations & Timeline
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Interactive task management with deadlines, priorities, reminders, notes, and chronological timelines.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToAI && (
            <button
              type="button"
              onClick={onNavigateToAI}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted cursor-pointer shadow-xs"
            >
              <Sparkles className="size-3.5 text-amber-500 dark:text-amber-400" />
              <span>Ask AI</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Deadline Alert Notifications Banner */}
      <TaskAlertsBanner />

      {/* 4 Operations Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: In Progress */}
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              In Progress
            </CardTitle>
            <div className="grid size-8 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Flame className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.inProgress}
            </div>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
              {metrics.dueToday} tasks due today
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Overdue Deadlines Alert */}
        <Card className={`bg-card shadow-xs border-border/80 ${metrics.overdue > 0 ? "border-rose-300 dark:border-rose-500/30" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Overdue Deadlines
            </CardTitle>
            <div className={`grid size-8 place-items-center rounded-xl ${metrics.overdue > 0 ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" : "bg-muted text-muted-foreground"}`}>
              <AlertTriangle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.overdue > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
              {metrics.overdue}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {metrics.overdue > 0 ? "Urgent attention required" : "Zero overdue milestones"}
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Urgent Priority */}
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Urgent Priority
            </CardTitle>
            <div className="grid size-8 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Flag className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.urgent}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              High impact & security items
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Completed Rate */}
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Completed Tasks
            </CardTitle>
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.completed} / {metrics.total}
            </div>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {metrics.completionRate}% sprint completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: View Switcher, Search & Filters */}
      <Card className="border-border/80 bg-card shadow-xs p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* View mode toggle: List vs Timeline */}
          <div className="flex items-center gap-1 rounded-xl bg-muted/70 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutList className="size-3.5" />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                viewMode === "timeline"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Milestone className="size-3.5" />
              <span>Timeline View</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, categories, or notes..."
              className="w-full rounded-xl border border-border/80 bg-background pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Sort By Dropdown with 21st.dev DropdownMenu */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap hidden lg:inline">
              Sort by:
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-1.5 text-xs text-foreground hover:border-border hover:bg-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                >
                  <ArrowUpDown className="size-3 text-muted-foreground" />
                  <span>
                    {SORT_OPTIONS.find((s) => s.id === sortBy)?.label || "Sort"}
                  </span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[190px] border border-border/80 bg-popover p-1.5 shadow-2xl"
              >
                <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                  Sort Tasks By
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1 bg-border/60" />
                <div className="space-y-0.5">
                  {SORT_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.id}
                      onClick={() => setSortBy(opt.id)}
                      className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
                        sortBy === opt.id
                          ? "bg-primary/15 text-primary font-medium"
                          : "text-foreground hover:bg-muted/70"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.id && (
                        <Check className="size-3.5 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground mr-1">Status:</span>
            {(
              [
                { id: "all", label: "All" },
                { id: "in_progress", label: "Active" },
                { id: "pending", label: "Pending" },
                { id: "overdue", label: "Overdue" },
                { id: "completed", label: "Done" },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  statusFilter === s.id
                    ? s.id === "overdue"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-semibold"
                      : "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="h-3 w-px bg-border/60 mx-1 hidden sm:block" />

          {/* Priority Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground mr-1">Priority:</span>
            {(
              [
                { id: "all", label: "All" },
                { id: "urgent", label: "Urgent" },
                { id: "high", label: "High" },
                { id: "medium", label: "Medium" },
                { id: "low", label: "Low" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriorityFilter(p.id)}
                className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  priorityFilter === p.id
                    ? "bg-foreground text-background font-semibold"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Content Rendering: List View vs Timeline View */}
      {viewMode === "timeline" ? (
        <Card className="border-border/80 bg-card shadow-xs p-4 sm:p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Milestone className="size-4 text-primary" />
                <span>Chronological Delivery Timeline</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visualizing task milestones by urgency, target deadline and sprint phase.
              </p>
            </div>
          </div>
          <TaskTimelineView onEditTask={handleOpenEdit} />
        </Card>
      ) : (
        /* List View */
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span>Task Registry</span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono font-medium text-muted-foreground">
                    {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Click checkbox to complete • Click priority to cycle • Click bell to toggle deadline alert
                </CardDescription>
              </div>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleQuickAdd} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Quick add a new task (e.g. Set up JWT refresh rotation)..."
                className="flex-1 rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Quick Add</span>
              </button>
            </form>
          </CardHeader>

          <CardContent className="space-y-2 pt-1">
            <div className="divide-y divide-border/60">
              {tasks.length === 0 ? (
                <div className="py-14 text-center space-y-4">
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                    <ListTodo className="size-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">
                      No Tasks Created Yet
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Your workspace is ready. Plan your study milestones, technical objectives, or sprint goals.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleOpenCreate}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>Create Your First Task</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        loadStarterTemplates();
                        showToast("Loaded 5 starter workflow tasks");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background hover:bg-muted/60 px-4 py-2 text-xs font-semibold text-foreground active:scale-95 transition cursor-pointer"
                    >
                      <Sparkles className="size-3.5 text-amber-500" />
                      <span>Load Starter Templates (5 Tasks)</span>
                    </button>
                  </div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
                    <ListTodo className="size-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    No tasks match your criteria
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Try clearing filters, searching for a different keyword, or click "+ Create Task" to begin a new workflow task.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setPriorityFilter("all");
                    }}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isDone = task.status === "completed";
                  const calc = calculateTimeRemaining(task.deadline);
                  const isNotesOpen = expandedNotesId === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`group flex flex-col gap-2 py-3.5 px-3 rounded-xl transition-all hover:bg-muted/40 ${
                        isDone
                          ? "opacity-75 bg-muted/20"
                          : calc.isOverdue
                          ? "bg-rose-50/70 dark:bg-rose-950/15 border-l-2 border-rose-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Checkbox and main content */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleTaskStatus(task.id)}
                            aria-label={
                              isDone ? "Mark as in progress" : "Mark as completed"
                            }
                            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-lg border transition-all cursor-pointer ${
                              isDone
                                ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                                : "border-border/80 bg-background hover:border-primary hover:bg-primary/5"
                            }`}
                          >
                            {isDone && <Check className="size-3 stroke-[3]" />}
                          </button>

                          <div className="min-w-0 space-y-1 flex-1">
                            {/* Title & tags */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <p
                                className={`text-xs font-semibold leading-snug transition-all ${
                                  isDone
                                    ? "line-through text-muted-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {task.title}
                              </p>

                              {/* Priority Badge (Clickable to cycle) */}
                              <button
                                type="button"
                                onClick={() => cyclePriority(task.id, task.priority)}
                                title="Click to cycle priority"
                                className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase transition-all border cursor-pointer ${
                                  task.priority === "urgent"
                                    ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                                    : task.priority === "high"
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                                    : task.priority === "medium"
                                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/20"
                                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                                }`}
                              >
                                {task.priority}
                              </button>

                              {/* Category */}
                              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-medium">
                                {task.category}
                              </span>

                              {/* Stage */}
                              <span className="rounded-md bg-muted/70 px-2 py-0.5 text-[10px] text-muted-foreground font-medium">
                                {task.timelineStage.replace("_", " ")}
                              </span>
                            </div>

                            {/* Meta & Deadline */}
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                              {/* Deadline badge */}
                              <span
                                className={`inline-flex items-center gap-1 font-medium ${
                                  isDone
                                    ? "text-muted-foreground"
                                    : calc.isOverdue
                                    ? "text-rose-600 dark:text-rose-400 font-semibold"
                                    : calc.isDueToday
                                    ? "text-amber-600 dark:text-amber-400 font-semibold"
                                    : "text-muted-foreground"
                                }`}
                              >
                                <Clock className="size-3" />
                                <span>{task.dueDate}</span>
                                {!isDone && <span>({calc.formatted})</span>}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Alert Notification Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleReminderAlert(task.id)}
                            title={
                              task.reminderAlert
                                ? "Deadline alert active"
                                : "Deadline alert disabled"
                            }
                            className={`grid size-7 place-items-center rounded-lg transition-colors cursor-pointer ${
                              task.reminderAlert
                                ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                                : "text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <BellRing className="size-3.5" />
                          </button>

                          {/* Notes Drawer Toggle */}
                          {task.notes && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedNotesId(isNotesOpen ? null : task.id)
                              }
                              title="View notes"
                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
                                isNotesOpen
                                  ? "bg-primary/15 text-primary font-semibold"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              <FileText className="size-3.5" />
                              <span className="hidden sm:inline">Notes</span>
                              {isNotesOpen ? (
                                <ChevronUp className="size-3" />
                              ) : (
                                <ChevronDown className="size-3" />
                              )}
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(task)}
                            title="Edit task"
                            className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                          >
                            <Edit2 className="size-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => {
                              deleteTask(task.id);
                              showToast("Task deleted");
                            }}
                            title="Delete task"
                            className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Notes Reader */}
                      <AnimatePresence>
                        {isNotesOpen && task.notes && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-2 overflow-hidden rounded-xl border border-border/80 bg-muted/30 p-3 text-xs text-foreground leading-relaxed font-mono"
                          >
                            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border/60 text-[10px] text-muted-foreground font-sans">
                              <span className="font-semibold text-foreground flex items-center gap-1">
                                <FileText className="size-3 text-primary" />
                                Task Notes & Documentation
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(task)}
                                className="text-primary hover:underline"
                              >
                                Edit Notes
                              </button>
                            </div>
                            <p className="whitespace-pre-wrap">{task.notes}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Creation & Editing Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveModal}
        initialTask={editingTask}
      />

      {/* Cleanup Old Tasks Confirmation Dialog */}
      <AnimatePresence>
        {isCleanupDialogOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCleanupDialogOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/80"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl shadow-black/10 dark:shadow-black/90 z-10 space-y-4 text-foreground"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-destructive/15 text-destructive">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Clean Up Old Tasks
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Permanent workspace pruning
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                This will delete all completed tasks ({metrics.completed} tasks) from your workspace to keep your sprint backlog lean and focused. Active in-progress and pending tasks will not be touched.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCleanupDialogOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCleanup}
                  className="rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground hover:opacity-90 cursor-pointer"
                >
                  Confirm Cleanup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TasksView;
