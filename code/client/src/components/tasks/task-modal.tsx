import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
}: TaskModalProps) {
  const isEditing = Boolean(initialTask);
  const { projects } = useProjects();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Frontend UI");
  const [priority, setPriority] = useState<TaskPriority>("high");
  const [deadline, setDeadline] = useState("2026-10-14T17:00");
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
      setTitle("");
      setCategory("Frontend UI");
      setPriority("high");
      setDeadline("2026-10-14T17:00");
      setTimelineStage("in_progress");
      setNotes("");
      setReminderAlert(true);
      setStatus("in_progress");
      setProjectId(undefined);
      setTags(["Frontend UI"]);
    }
  }, [initialTask, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Generate formatted dueDate string from deadline
    let dueDate = "Today";
    try {
      const d = new Date(deadline);
      const isToday =
        d.getFullYear() === 2026 && d.getMonth() === 9 && d.getDate() === 13;
      const isTomorrow =
        d.getFullYear() === 2026 && d.getMonth() === 9 && d.getDate() === 14;

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
    const base = new Date("2026-10-13T16:41:33");
    base.setHours(base.getHours() + hoursFromNow);
    // Format to yyyy-MM-ddThh:mm
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/80"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-card p-6 shadow-2xl shadow-black/10 dark:shadow-black/90 z-10 space-y-5 text-foreground"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div>
                <h2
                  id="task-modal-title"
                  className="text-lg font-bold text-foreground flex items-center gap-2"
                >
                  <Sparkles className="size-5 text-primary" />
                  <span>{isEditing ? "Edit Workflow Task" : "Create New Task"}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure timeline schedule, deadlines, priority alerts & notes.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Task Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>Task Title</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement WebSocket rate limiter with token bucket algorithm"
                  className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Category & Status with 21st.dev DropdownMenu */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Folder className="size-3.5 text-muted-foreground" />
                    <span>Category / Area</span>
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground hover:border-border transition-colors focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Folder className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{category}</span>
                        </span>
                        <ChevronDown className="size-3.5 text-muted-foreground shrink-0 ml-2" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-[calc(100vw-2rem)] max-w-xs sm:w-64 border border-border/80 bg-popover p-1.5 shadow-2xl"
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

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Milestone className="size-3.5 text-muted-foreground" />
                    <span>Timeline Phase</span>
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground hover:border-border transition-colors focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Milestone className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">
                            {TIMELINE_PHASES.find((p) => p.id === timelineStage)?.label || timelineStage}
                          </span>
                        </span>
                        <ChevronDown className="size-3.5 text-muted-foreground shrink-0 ml-2" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-[calc(100vw-2rem)] max-w-xs sm:w-72 border border-border/80 bg-popover p-1.5 shadow-2xl"
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
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="size-3.5 text-primary" />
                    <span>Associated Project (Optional)</span>
                  </span>
                  {projectId && (
                    <button
                      type="button"
                      onClick={() => setProjectId(undefined)}
                      className="text-[10px] text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      Clear link
                    </button>
                  )}
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground hover:border-border transition-colors focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FolderKanban className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">
                          {projects.find((p) => p.id === projectId)?.title || "Standalone Task (No Project)"}
                        </span>
                      </span>
                      <ChevronDown className="size-3.5 text-muted-foreground shrink-0 ml-2" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[calc(100vw-2rem)] max-w-sm sm:w-80 border border-border/80 bg-popover p-1.5 shadow-2xl"
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

              {/* Task Tags & Cross-Entity Concepts */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="size-3.5 text-primary" />
                    <span>Tags & Cross-Entity Concepts</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Shared with Notes & Projects
                  </span>
                </label>
                <TagPicker
                  selectedTags={tags}
                  onChange={setTags}
                  placeholder="Type to search or add tags (e.g. Frontend UI, Security, Backend)..."
                />
              </div>

              {/* Priority Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Flag className="size-3.5 text-muted-foreground" />
                  <span>Priority Level</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      { id: "urgent", label: "Urgent", color: "rose" },
                      { id: "high", label: "High", color: "amber" },
                      { id: "medium", label: "Medium", color: "blue" },
                      { id: "low", label: "Low", color: "emerald" },
                    ] as const
                  ).map((p) => {
                    const isSelected = priority === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? p.id === "urgent"
                              ? "border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300 shadow-sm"
                              : p.id === "high"
                              ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-sm"
                              : p.id === "medium"
                              ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300 shadow-sm"
                              : "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-sm"
                            : "border-border/80 bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium"
                        }`}
                      >
                        <span
                          className={`size-2 rounded-full ${
                            p.id === "urgent"
                              ? "bg-rose-400"
                              : p.id === "high"
                              ? "bg-amber-400"
                              : p.id === "medium"
                              ? "bg-blue-400"
                              : "bg-emerald-400"
                          }`}
                        />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Deadline Date & Time with Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    <span>Target Deadline</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Reference: Oct 13, 2026
                  </span>
                </div>

                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring [color-scheme:light] dark:[color-scheme:dark]"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => applyPresetDeadline(2)}
                    className="rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                  >
                    +2h (Today)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDeadline(6)}
                    className="rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                  >
                    Tonight (10 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDeadline(24)}
                    className="rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                  >
                    Tomorrow (+24h)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDeadline(72)}
                    className="rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                  >
                    +3 Days
                  </button>
                </div>
              </div>

              {/* Alert Notification Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 p-3.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`grid size-8 place-items-center rounded-lg ${
                      reminderAlert
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-muted text-muted-foreground"
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

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderAlert}
                    onChange={(e) => setReminderAlert(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Notes / Scratchpad */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="size-3.5 text-muted-foreground" />
                  <span>Technical Notes & Requirements</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Architecture notes, acceptance criteria, sub-tasks, or documentation links..."
                  className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-border/80 bg-transparent px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
                >
                  <Sparkles className="size-3.5" />
                  <span>{isEditing ? "Save Changes" : "Create Task"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
