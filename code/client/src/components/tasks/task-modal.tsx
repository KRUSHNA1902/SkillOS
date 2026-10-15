import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Calendar,
  Flag,
  Folder,
  FileText,
  BellRing,
  Sparkles,
  Milestone,
  ChevronDown,
  Check,
  FolderKanban,
  Tag,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  WorkflowTask,
  TaskPriority,
  TaskTimelineStage,
  TaskStatus,
} from "./task-types";
import { useProjects } from "@/components/projects/project-context";
import { TagPicker } from "@/components/tags/tag-picker";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<WorkflowTask, "id" | "createdAt"> & { id?: string }) => void;
  initialTask?: WorkflowTask | null;
  initialTitle?: string;
}

const CATEGORY_PRESETS = [
  "Frontend UI",
  "Backend",
  "Auth Pipeline",
  "Security",
  "Design System",
  "AI Engine",
  "Performance",
  "Workflow Engine",
  "DevOps",
];

const TIMELINE_PHASES: { id: TaskTimelineStage; label: string }[] = [
  { id: "planning", label: "Phase 1: Planning" },
  { id: "in_progress", label: "Phase 2: In Progress (Active)" },
  { id: "review", label: "Phase 3: Review & Test" },
  { id: "completed", label: "Phase 4: Completed" },
  { id: "backlog", label: "Backlog / Queued" },
];

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  initialTask,
  initialTitle,
}: TaskModalProps) {
  const isEditing = Boolean(initialTask);
  const { projects } = useProjects();
  const formRef = useRef<HTMLFormElement>(null);

  const getDefaultDeadline = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(17, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [title, setTitle] = useState(initialTitle || "");
  const [category, setCategory] = useState("Frontend UI");
  const [priority, setPriority] = useState<TaskPriority>("high");
  const [deadline, setDeadline] = useState(getDefaultDeadline);
  const [timelineStage, setTimelineStage] = useState<TaskTimelineStage>("in_progress");
  const [notes, setNotes] = useState("");
  const [reminderAlert, setReminderAlert] = useState(true);
  const [status, setStatus] = useState<TaskStatus>("in_progress");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setCategory(initialTask.category);
      setPriority(initialTask.priority);
      setDeadline(initialTask.deadline);
      setTimelineStage(initialTask.timelineStage);
      setNotes(initialTask.notes || "");
      setReminderAlert(initialTask.reminderAlert ?? true);
      setStatus(initialTask.status);
      setProjectId(initialTask.projectId);
      setTags(
        initialTask.tags && initialTask.tags.length > 0
          ? [...initialTask.tags]
          : [initialTask.category || "General"]
      );
    } else {
      setTitle(initialTitle || "");
      setCategory("Frontend UI");
      setPriority("high");
      setDeadline(getDefaultDeadline());
      setTimelineStage("in_progress");
      setNotes("");
      setReminderAlert(true);
      setStatus("in_progress");
      setProjectId(undefined);
      setTags(["Frontend UI"]);
    }
  }, [initialTask, initialTitle, isOpen]);

  // Handle ESC key and Cmd/Ctrl + Enter shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (title.trim()) {
          formRef.current?.requestSubmit();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, title]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Generate formatted dueDate string from deadline
    let dueDate = "Today";
    try {
      const d = new Date(deadline);
      const now = new Date();
      const isToday =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow =
        d.getFullYear() === tomorrow.getFullYear() &&
        d.getMonth() === tomorrow.getMonth() &&
        d.getDate() === tomorrow.getDate();

      const timeStr = d.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });

      if (status === "completed") {
        dueDate = "Completed";
      } else if (isToday) {
        dueDate = `Today, ${timeStr}`;
      } else if (isTomorrow) {
        dueDate = `Tomorrow, ${timeStr}`;
      } else {
        dueDate = d.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
      }
    } catch {
      dueDate = "Scheduled";
    }

    const selectedProject = projects.find((p) => p.id === projectId);

    onSave({
      id: initialTask?.id,
      title: title.trim(),
      category: category.trim() || "General",
      priority,
      status,
      dueDate,
      deadline,
      timelineStage,
      notes: notes.trim(),
      reminderAlert,
      projectId,
      projectName: selectedProject?.title,
      tags: tags.length > 0 ? tags : [category.trim() || "General"],
    });

    onClose();
  };

  const applyPresetDeadline = (hoursFromNow: number) => {
    const base = new Date();
    if (hoursFromNow === 24) {
      base.setDate(base.getDate() + 1);
      base.setHours(17, 0, 0, 0);
    } else if (hoursFromNow === 72) {
      base.setDate(base.getDate() + 3);
      base.setHours(17, 0, 0, 0);
    } else if (hoursFromNow === 6) {
      base.setHours(22, 0, 0, 0);
    } else {
      base.setHours(base.getHours() + hoursFromNow);
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const isoString = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(
      base.getDate()
    )}T${pad(base.getHours())}:${pad(base.getMinutes())}`;
    setDeadline(isoString);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        >
          {/* Backdrop with cozy blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container: Distinct Wide Rectangular Shape */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative flex flex-col w-full max-w-4xl max-h-[88vh] md:max-h-[620px] rounded-3xl border border-border/80 bg-card shadow-2xl shadow-black/80 z-10 text-foreground overflow-hidden"
          >
            {/* Header Banner */}
            <div className="flex items-center justify-between border-b border-border/60 px-6 sm:px-8 py-5 shrink-0 bg-gradient-to-r from-muted/30 via-transparent to-muted/10 backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h2
                    id="task-modal-title"
                    className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
                  >
                    {isEditing ? "Edit Workflow Task" : "Create New Task"}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Configure timeline schedule, deadlines, priority alerts & notes.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                  Esc
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* Scrollable Form Body with Cozy Sizing & 2-Column Balanced Grid */}
              <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 scrollbar-thin">
                {/* Hero: Task Title Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="task-title-input"
                      className="text-xs font-semibold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <span>Task Title</span>
                      <span className="text-rose-400 font-bold">*</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">Required</span>
                  </div>
                  <input
                    id="task-title-input"
                    type="text"
                    required
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Implement WebSocket rate limiter with token bucket algorithm"
                    className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-3 text-sm sm:text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs font-medium"
                  />
                </div>

                {/* 2-Column Landscape Layout: Distinctly Rectangular & Ergonomic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Left Column: Categorization, Project Association & Notes */}
                  <div className="space-y-5">
                    {/* Category & Timeline Stage Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Category Selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Folder className="size-3.5 text-primary/80" />
                          <span>Category / Area</span>
                        </label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex w-full h-11 items-center justify-between rounded-xl border border-border/80 bg-background/80 px-3.5 text-xs sm:text-sm text-foreground hover:border-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-xs"
                            >
                              <span className="flex items-center gap-2 truncate">
                                <Folder className="size-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate">{category}</span>
                              </span>
                              <ChevronDown className="size-3.5 text-muted-foreground shrink-0 ml-1.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-64 border border-border/80 bg-popover p-1.5 shadow-2xl"
                          >
                            <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                              Select Category
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="my-1 bg-border/60" />
                            <div className="max-h-56 overflow-y-auto space-y-0.5">
                              {CATEGORY_PRESETS.map((cat) => (
                                <DropdownMenuItem
                                  key={cat}
                                  onClick={() => setCategory(cat)}
                                  className={`flex items-center justify-between px-2.5 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                                    category === cat
                                      ? "bg-primary/15 text-primary font-medium"
                                      : "text-foreground hover:bg-muted/70"
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <Folder className="size-3.5 text-muted-foreground" />
                                    <span>{cat}</span>
                                  </span>
                                  {category === cat && (
                                    <Check className="size-3.5 text-primary" />
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Timeline Phase Selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Milestone className="size-3.5 text-primary/80" />
                          <span>Timeline Phase</span>
                        </label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex w-full h-11 items-center justify-between rounded-xl border border-border/80 bg-background/80 px-3.5 text-xs sm:text-sm text-foreground hover:border-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-xs"
                            >
                              <span className="flex items-center gap-2 truncate">
                                <Milestone className="size-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate">
                                  {TIMELINE_PHASES.find((p) => p.id === timelineStage)?.label || timelineStage}
                                </span>
                              </span>
                              <ChevronDown className="size-3.5 text-muted-foreground shrink-0 ml-1.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-72 border border-border/80 bg-popover p-1.5 shadow-2xl"
                          >
                            <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                              Select Timeline Phase
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="my-1 bg-border/60" />
                            <div className="space-y-0.5">
                              {TIMELINE_PHASES.map((phase) => (
                                <DropdownMenuItem
                                  key={phase.id}
                                  onClick={() => setTimelineStage(phase.id)}
                                  className={`flex items-center justify-between px-2.5 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                                    timelineStage === phase.id
                                      ? "bg-primary/15 text-primary font-medium"
                                      : "text-foreground hover:bg-muted/70"
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <Milestone className="size-3.5 text-muted-foreground" />
                                    <span>{phase.label}</span>
                                  </span>
                                  {timelineStage === phase.id && (
                                    <Check className="size-3.5 text-primary" />
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Connected Project (Optional) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <FolderKanban className="size-3.5 text-primary" />
                          <span>Associated Project (Optional)</span>
                        </label>
                        {projectId && (
                          <button
                            type="button"
                            onClick={() => setProjectId(undefined)}
                            className="text-[11px] font-medium text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                          >
                            Clear link
                          </button>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full h-11 items-center justify-between rounded-xl border border-border/80 bg-background/80 px-3.5 text-xs sm:text-sm text-foreground hover:border-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-xs"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <FolderKanban className="size-3.5 text-primary shrink-0" />
                              <span className="truncate">
                                {projects.find((p) => p.id === projectId)?.title || "Standalone Task (No Project)"}
                              </span>
                            </span>
                            <ChevronDown className="size-3.5 text-muted-foreground shrink-0 ml-1.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-80 border border-border/80 bg-popover p-1.5 shadow-2xl"
                        >
                          <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                            Link Task to Portfolio Project
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="my-1 bg-border/60" />
                          <DropdownMenuItem
                            onClick={() => setProjectId(undefined)}
                            className={`flex items-center justify-between px-2.5 py-2 text-xs rounded-lg cursor-pointer ${
                              !projectId ? "bg-primary/15 text-primary font-medium" : "text-foreground hover:bg-muted/70"
                            }`}
                          >
                            <span>Standalone Task (No Project)</span>
                            {!projectId && <Check className="size-3.5 text-primary" />}
                          </DropdownMenuItem>
                          <div className="max-h-56 overflow-y-auto space-y-0.5 pt-1">
                            {projects.map((proj) => (
                              <DropdownMenuItem
                                key={proj.id}
                                onClick={() => setProjectId(proj.id)}
                                className={`flex items-center justify-between px-2.5 py-2 text-xs rounded-lg cursor-pointer ${
                                  projectId === proj.id
                                    ? "bg-primary/15 text-primary font-medium"
                                    : "text-foreground hover:bg-muted/70"
                                }`}
                              >
                                <span className="truncate pr-2">{proj.title}</span>
                                {projectId === proj.id && <Check className="size-3.5 text-primary shrink-0" />}
                              </DropdownMenuItem>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Technical Notes / Acceptance Criteria Textarea */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="size-3.5 text-primary/80" />
                        <span>Technical Notes & Requirements</span>
                      </label>
                      <textarea
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Architecture notes, acceptance criteria, sub-tasks, or documentation links..."
                        className="w-full rounded-2xl border border-border/80 bg-background/80 p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all leading-relaxed resize-y min-h-[110px]"
                      />
                    </div>
                  </div>

                  {/* Right Column: Priority, Deadline, Reminders & Tags */}
                  <div className="space-y-5">
                    {/* Priority Level Selection: Cozy Option Cards */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Flag className="size-3.5 text-primary/80" />
                        <span>Priority Level</span>
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {(
                          [
                            {
                              id: "urgent",
                              label: "Urgent",
                              color: "rose",
                              dot: "bg-rose-500",
                              active:
                                "border-rose-500/60 bg-rose-500/15 text-rose-300 shadow-xs ring-1 ring-rose-500/30",
                            },
                            {
                              id: "high",
                              label: "High",
                              color: "amber",
                              dot: "bg-amber-500",
                              active:
                                "border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-xs ring-1 ring-amber-500/30",
                            },
                            {
                              id: "medium",
                              label: "Medium",
                              color: "blue",
                              dot: "bg-blue-500",
                              active:
                                "border-blue-500/60 bg-blue-500/15 text-blue-300 shadow-xs ring-1 ring-blue-500/30",
                            },
                            {
                              id: "low",
                              label: "Low",
                              color: "emerald",
                              dot: "bg-emerald-500",
                              active:
                                "border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-xs ring-1 ring-emerald-500/30",
                            },
                          ] as const
                        ).map((p) => {
                          const isSelected = priority === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setPriority(p.id)}
                              className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-2 text-xs font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? p.active
                                  : "border-border/70 bg-background/80 text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium"
                              }`}
                            >
                              <span
                                className={`size-2 rounded-full shrink-0 ${p.dot} ${
                                  isSelected ? "scale-110" : "opacity-70"
                                }`}
                              />
                              <span>{p.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Target Deadline with Smart Presets */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-primary/80" />
                          <span>Target Deadline</span>
                        </label>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          <span>Schedule</span>
                        </span>
                      </div>

                      <input
                        type="datetime-local"
                        required
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all [color-scheme:light] dark:[color-scheme:dark]"
                      />

                      {/* Quick Presets */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => applyPresetDeadline(2)}
                          className="rounded-lg border border-border/70 bg-muted/40 hover:bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-all"
                        >
                          +2h (Today)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPresetDeadline(6)}
                          className="rounded-lg border border-border/70 bg-muted/40 hover:bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-all"
                        >
                          Tonight (10 PM)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPresetDeadline(24)}
                          className="rounded-lg border border-border/70 bg-muted/40 hover:bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-all"
                        >
                          Tomorrow (+24h)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPresetDeadline(72)}
                          className="rounded-lg border border-border/70 bg-muted/40 hover:bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-all"
                        >
                          +3 Days
                        </button>
                      </div>
                    </div>

                    {/* Deadline Alert Notification: Cozy Card with Radix Switch */}
                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 hover:bg-muted/30 p-3.5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid size-9 place-items-center rounded-xl border transition-colors ${
                            reminderAlert
                              ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                              : "bg-muted/50 border-border/50 text-muted-foreground"
                          }`}
                        >
                          <BellRing className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            Deadline Alert Notification
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Display banner alert & countdown when deadline approaches
                          </p>
                        </div>
                      </div>

                      <Switch
                        id="task-reminder-toggle"
                        checked={reminderAlert}
                        onCheckedChange={setReminderAlert}
                        aria-label="Toggle deadline alert notification"
                      />
                    </div>

                    {/* Task Tags & Cross-Entity Concepts */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="size-3.5 text-primary" />
                          <span>Tags & Cross-Entity Concepts</span>
                        </label>
                        <span className="text-[11px] text-muted-foreground">
                          Shared with Notes & Projects
                        </span>
                      </div>
                      <TagPicker
                        selectedTags={tags}
                        onChange={setTags}
                        placeholder="Type to search or add tags..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between px-6 sm:px-8 py-4.5 border-t border-border/60 shrink-0 bg-muted/20 backdrop-blur-md">
                <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      Esc
                    </kbd>
                    <span>Cancel</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      ⌘ / Ctrl ↵
                    </kbd>
                    <span>{isEditing ? "Save" : "Create"}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-border/80 bg-background/60 px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all cursor-pointer"
                  >
                    <Sparkles className="size-3.5" />
                    <span>{isEditing ? "Save Changes" : "Create Task"}</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
