import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  Milestone,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Trash2,
  Edit2,
} from "lucide-react";
import { WorkflowTask } from "./task-types";
import { useTaskManager, calculateTimeRemaining } from "./task-context";
import { useTags } from "@/components/tags/tag-context";
import { cn } from "@/lib/utils";

interface TaskTimelineViewProps {
  onEditTask: (task: WorkflowTask) => void;
}

export function TaskTimelineView({ onEditTask }: TaskTimelineViewProps) {
  const {
    tasks,
    toggleTaskStatus,
    deleteTask,
  } = useTaskManager();
  const { getTagClass } = useTags();

  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  // Group tasks chronologically
  const groups = useMemo(() => {
    const overdue: WorkflowTask[] = [];
    const today: WorkflowTask[] = [];
    const tomorrow: WorkflowTask[] = [];
    const thisSprint: WorkflowTask[] = [];
    const futureBacklog: WorkflowTask[] = [];
    const completed: WorkflowTask[] = [];

    tasks.forEach((task) => {
      if (task.status === "completed") {
        completed.push(task);
        return;
      }

      const calc = calculateTimeRemaining(task.deadline);
      if (calc.isOverdue) {
        overdue.push(task);
      } else if (calc.isDueToday) {
        today.push(task);
      } else if (calc.diffDays === 1) {
        tomorrow.push(task);
      } else if (calc.diffDays <= 7) {
        thisSprint.push(task);
      } else {
        futureBacklog.push(task);
      }
    });

    return [
      {
        id: "overdue",
        title: "Overdue Milestones",
        description: "Deadlines expired - Immediate focus required",
        color: "border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10",
        badgeColor: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
        nodeColor: "bg-rose-500 ring-rose-500/30",
        tasks: overdue,
      },
      {
        id: "today",
        title: "Today's Delivery Window",
        description: "Scheduled to complete before end of day",
        color: "border-amber-300 dark:border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10",
        badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        nodeColor: "bg-amber-500 ring-amber-500/30",
        tasks: today,
      },
      {
        id: "tomorrow",
        title: "Tomorrow & Next 48 Hours",
        description: "Upcoming sprint deliverables",
        color: "border-blue-300 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10",
        badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
        nodeColor: "bg-blue-500 ring-blue-500/30",
        tasks: tomorrow,
      },
      {
        id: "sprint",
        title: "Sprint 4 Target Milestones",
        description: "Scheduled within current 14-day iteration",
        color: "border-purple-300 dark:border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/10",
        badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
        nodeColor: "bg-purple-500 ring-purple-500/30",
        tasks: thisSprint,
      },
      {
        id: "backlog",
        title: "Backlog & Long-Term Roadmap",
        description: "Future architectural features and benchmarks",
        color: "border-slate-300 dark:border-slate-500/40 text-slate-600 dark:text-slate-400 bg-slate-500/10",
        badgeColor: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
        nodeColor: "bg-slate-500 ring-slate-500/30",
        tasks: futureBacklog,
      },
      {
        id: "completed",
        title: "Completed Milestone Archive",
        description: "Successfully delivered tasks & verified skills",
        color: "border-emerald-300 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
        badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        nodeColor: "bg-emerald-500 ring-emerald-500/30",
        tasks: completed,
      },
    ];
  }, [tasks]);

  return (
    <div className="relative space-y-8 pl-4 sm:pl-8 before:absolute before:bottom-2 before:left-[19px] sm:before:left-[35px] before:top-2 before:w-[2px] before:bg-border/60">
      {groups.map((group) => {
        if (group.tasks.length === 0 && group.id !== "today" && group.id !== "overdue") {
          return null;
        }

        return (
          <div key={group.id} className="relative space-y-3">
            {/* Timeline Marker Node */}
            <div className="relative flex items-center gap-3">
              <div
                className={`relative z-10 grid size-8 -translate-x-[15px] sm:-translate-x-[19px] place-items-center rounded-xl border border-border/80 bg-card shadow-sm ring-4 ${group.nodeColor}`}
              >
                <Milestone className="size-4" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    {group.title}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold border ${group.badgeColor}`}
                  >
                    {group.tasks.length}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {group.description}
                </p>
              </div>
            </div>

            {/* Tasks in this milestone section */}
            <div className="ml-2 sm:ml-4 space-y-2.5">
              {group.tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 bg-background/30 p-4 text-xs text-muted-foreground">
                  No tasks currently in this timeline slice.
                </div>
              ) : (
                group.tasks.map((task) => {
                  const isDone = task.status === "completed";
                  const calc = calculateTimeRemaining(task.deadline);
                  const isNotesOpen = expandedNotesId === task.id;

                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`group relative rounded-xl border bg-card p-3.5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md ${
                        isDone
                          ? "border-border/60 bg-muted/20 opacity-75"
                          : calc.isOverdue
                          ? "border-rose-300 dark:border-rose-500/40 bg-rose-50/70 dark:bg-rose-950/15"
                          : "border-border/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Complete Checkbox */}
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

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs font-semibold leading-snug transition-all ${
                                  isDone
                                    ? "line-through text-muted-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {task.title}
                              </span>

                              {/* Priority Badge */}
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                                  task.priority === "urgent"
                                    ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                                    : task.priority === "high"
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                    : task.priority === "medium"
                                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                }`}
                              >
                                {task.priority}
                              </span>

                              {/* Timeline Stage Chip */}
                              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-medium">
                                {task.timelineStage.replace("_", " ")}
                              </span>
                            </div>

                            {/* Metadata Pills */}
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                              <span className="font-medium text-foreground/80">
                                {task.category}
                              </span>
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1">
                                  {task.tags.map((t) => (
                                    <span
                                      key={t}
                                      className={cn(
                                        "rounded border px-1.5 py-0.2 text-[9px] font-mono",
                                        getTagClass(t)
                                      )}
                                    >
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3 text-muted-foreground" />
                                {task.dueDate} ({calc.formatted})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {task.notes && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedNotesId(isNotesOpen ? null : task.id)
                              }
                              title="Toggle Notes"
                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
                                isNotesOpen
                                  ? "bg-primary/20 text-primary"
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

                          <button
                            type="button"
                            onClick={() => onEditTask(task)}
                            title="Edit task"
                            className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                          >
                            <Edit2 className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            title="Delete task"
                            className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-rose-500/20 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Notes Section */}
                      <AnimatePresence>
                        {isNotesOpen && task.notes && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-background/80 p-3 text-xs text-foreground/90 leading-relaxed font-mono"
                          >
                            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border/40 text-[10px] text-muted-foreground">
                              <span>Milestone Technical Notes</span>
                              <span>Markdown / Code</span>
                            </div>
                            <p className="whitespace-pre-wrap">{task.notes}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
