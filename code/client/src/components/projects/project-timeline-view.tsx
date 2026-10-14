import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Check,
} from "lucide-react";
import { Project } from "./project-types";
import { TRACK_THEMES, STATUS_CONFIG } from "./project-card";
import { useProjects } from "./project-context";
import { cn } from "@/lib/utils";

interface ProjectTimelineViewProps {
  projects: Project[];
  onOpenDetails: (project: Project) => void;
}

export function ProjectTimelineView({
  projects,
  onOpenDetails,
}: ProjectTimelineViewProps) {
  const { toggleMilestoneStatus, toggleDeliverable } = useProjects();
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Sort projects by targetDate ascending
  const sortedProjects = [...projects].sort((a, b) => {
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });

  const getDaysRemainingText = (targetDateStr: string, status: string) => {
    if (status === "completed") return { text: "Completed", isOverdue: false, isDone: true };
    const now = new Date();
    const target = new Date(targetDateStr);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d Overdue`, isOverdue: true, isDone: false };
    if (diffDays === 0) return { text: "Due Today", isOverdue: false, isDone: false };
    if (diffDays === 1) return { text: "Due Tomorrow", isOverdue: false, isDone: false };
    return { text: `${diffDays} days left`, isOverdue: false, isDone: false };
  };

  return (
    <div className="space-y-4">
      {sortedProjects.map((project) => {
        const isExpanded = expandedProjectId === project.id;
        const theme = TRACK_THEMES[project.track] || TRACK_THEMES["Fullstack & Systems"];
        const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.in_progress;
        const countdown = getDaysRemainingText(project.targetDate, project.status);

        return (
          <div
            key={project.id}
            className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-border"
          >
            {/* Project Header Row */}
            <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                  className="grid size-8 place-items-center rounded-xl bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shrink-0 mt-0.5"
                >
                  {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        theme.badge
                      )}
                    >
                      {theme.label}
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

                    <span
                      className={cn(
                        "text-[11px] font-mono font-medium px-2 py-0.5 rounded-md",
                        countdown.isDone
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : countdown.isOverdue
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {countdown.text}
                    </span>
                  </div>

                  <h3 className="mt-1.5 text-base font-semibold text-foreground tracking-tight">
                    {project.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {project.tagline}
                  </p>
                </div>
              </div>

              {/* Progress and Target Dates */}
              <div className="flex items-center gap-6 shrink-0 lg:ml-auto">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    Target Delivery
                  </span>
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1 font-mono">
                    <Calendar className="size-3 text-muted-foreground/70" />
                    {project.targetDate}
                  </span>
                </div>

                <div className="w-32 space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground text-[10px]">Progress</span>
                    <span className="font-bold text-foreground">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      style={{ width: `${project.progress}%` }}
                      className={cn(
                        "h-full rounded-full transition-all",
                        project.progress === 100 ? "bg-emerald-500" : "bg-primary"
                      )}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenDetails(project)}
                  className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  Deep Dive
                </button>
              </div>
            </div>

            {/* Horizontal Milestone Progression Bar */}
            <div className="px-5 pb-4">
              <div className="relative flex items-center justify-between pt-2">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-border/60 -translate-y-1/2 z-0" />
                {project.milestones.map((m, idx) => {
                  const isDone = m.status === "completed";
                  const isActive = m.status === "in_progress";

                  return (
                    <div
                      key={m.id}
                      className="relative z-10 flex flex-col items-center group cursor-pointer"
                      onClick={() => toggleMilestoneStatus(project.id, m.id)}
                      title={`Click to toggle: ${m.title}`}
                    >
                      <div
                        className={cn(
                          "size-6 rounded-full border-2 grid place-items-center transition-all duration-200",
                          isDone
                            ? "bg-emerald-500 border-emerald-400 text-neutral-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                            : isActive
                            ? "bg-primary border-primary text-primary-foreground shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse"
                            : "bg-background border-border text-muted-foreground/60"
                        )}
                      >
                        {isDone ? (
                          <Check className="size-3 stroke-[3]" />
                        ) : (
                          <span className="text-[10px] font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <span className="mt-1.5 text-[10px] font-medium text-muted-foreground max-w-[120px] text-center truncate group-hover:text-foreground">
                        {m.title}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground/70">
                        {m.dueDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expanded Accordion: Deliverables Checklist */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border/50 bg-background/40 p-4 sm:p-5"
                >
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Milestones & Verifiable Deliverables
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {project.milestones.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl border border-border/60 bg-card/60 p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            {m.status === "completed" ? (
                              <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <span className="size-2 rounded-full bg-primary shrink-0" />
                            )}
                            <span className="truncate">{m.title}</span>
                          </h5>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            Due: {m.dueDate}
                          </span>
                        </div>

                        {m.description && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {m.description}
                          </p>
                        )}

                        <div className="pt-1.5 space-y-1 border-t border-border/40">
                          {m.deliverables.map((del) => (
                            <label
                              key={del.id}
                              className="flex items-center gap-2 text-xs text-foreground/90 hover:text-foreground cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={del.completed}
                                onChange={() => toggleDeliverable(project.id, m.id, del.id)}
                                className="rounded border-border text-primary focus:ring-primary cursor-pointer size-3.5"
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
