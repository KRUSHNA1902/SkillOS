import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  CalendarPlus,
} from "lucide-react";
import { useTaskManager } from "./task-context";

export function TaskAlertsBanner() {
  const { activeAlerts, dismissAlert, toggleTaskStatus, updateTask } =
    useTaskManager();
  const [isExpanded, setIsExpanded] = useState(true);

  if (activeAlerts.length === 0) {
    return null;
  }

  const overdueCount = activeAlerts.filter((a) => a.type === "overdue").length;
  const todayCount = activeAlerts.filter((a) => a.type === "due_today").length;

  // Postpone deadline by 24 hours
  const handleExtendDeadline = (taskId: string, currentDeadline: string) => {
    try {
      const d = new Date(currentDeadline);
      d.setDate(d.getDate() + 1);
      const pad = (n: number) => String(n).padStart(2, "0");
      const newIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate()
      )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      updateTask(taskId, {
        deadline: newIso,
        dueDate: `Extended (${d.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })})`,
      });
    } catch {
      // fallback
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-950/20 shadow-xs backdrop-blur-md transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="relative grid size-8 place-items-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <BellRing className="size-4 animate-bounce" />
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-rose-500 animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                Deadline & Schedule Alerts
              </h3>
              <span className="rounded-full bg-rose-100 dark:bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                {activeAlerts.length} Active
              </span>
            </div>
            <p className="text-[11px] text-rose-700/90 dark:text-rose-200/80">
              {overdueCount > 0 && (
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {overdueCount} task{overdueCount > 1 ? "s" : ""} overdue!{" "}
                </span>
              )}
              {todayCount > 0 && (
                <span>
                  {todayCount} task{todayCount > 1 ? "s" : ""} due today.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-300 px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors"
          >
            <span>{isExpanded ? "Collapse" : "View All"}</span>
            {isExpanded ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Alert list body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-rose-200/80 dark:border-rose-500/20 px-4 py-2.5 sm:px-5 space-y-2 bg-rose-100/40 dark:bg-black/20"
          >
            {activeAlerts.map((alert) => {
              const isOverdue = alert.type === "overdue";
              const isToday = alert.type === "due_today";

              return (
                <div
                  key={alert.id}
                  className="flex flex-col gap-2 rounded-xl border border-rose-200/80 dark:border-rose-500/20 bg-card p-2.5 sm:flex-row sm:items-center sm:justify-between shadow-xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg ${
                        isOverdue
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          : isToday
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {isOverdue ? (
                        <AlertTriangle className="size-3.5" />
                      ) : (
                        <Clock className="size-3.5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {alert.taskTitle}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                            isOverdue
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {alert.timeRemaining}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] text-muted-foreground font-medium">
                          Priority: {alert.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(alert.taskId)}
                      title="Mark as completed"
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="size-3" />
                      <span>Done</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleExtendDeadline(alert.taskId, alert.deadline)
                      }
                      title="Postpone deadline by 1 day"
                      className="inline-flex items-center gap-1 rounded-lg bg-muted/80 border border-border/80 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted cursor-pointer transition-colors"
                    >
                      <CalendarPlus className="size-3" />
                      <span>+1 Day</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => dismissAlert(alert.id)}
                      title="Dismiss alert"
                      className="grid size-6 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
