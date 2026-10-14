import { motion } from "motion/react";
import {
  Plus,
  Clock,
  ArrowRight,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { Project, ProjectStatus } from "./project-types";
import { useProjects } from "./project-context";
import { TRACK_THEMES } from "./project-card";
import { cn } from "@/lib/utils";

interface ProjectKanbanBoardProps {
  projects: Project[];
  onOpenDetails: (project: Project) => void;
  onNewProject: (defaultStatus?: ProjectStatus) => void;
}

const COLUMNS: {
  id: ProjectStatus;
  title: string;
  badgeClass: string;
  dotClass: string;
}[] = [
  {
    id: "planning",
    title: "Planning & Architecture",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    dotClass: "bg-purple-400",
  },
  {
    id: "in_progress",
    title: "In Active Sprint",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-400 animate-pulse",
  },
  {
    id: "review",
    title: "Testing & Review",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-400",
  },
  {
    id: "completed",
    title: "Completed Portfolio",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-400",
  },
];

export function ProjectKanbanBoard({
  projects,
  onOpenDetails,
  onNewProject,
}: ProjectKanbanBoardProps) {
  const { updateProject } = useProjects();

  const moveProject = (projectId: string, targetStatus: ProjectStatus) => {
    updateProject(projectId, {
      status: targetStatus,
      completedDate: targetStatus === "completed" ? new Date().toISOString().split("T")[0] : undefined,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start min-h-[500px]">
      {COLUMNS.map((col) => {
        const colProjects = projects.filter((p) => p.status === col.id);
        const colHours = colProjects.reduce((acc, p) => acc + (p.loggedHours || 0), 0);

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-2xl border border-border/70 bg-card/40 p-3.5 backdrop-blur-sm"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", col.dotClass)} />
                <h3 className="text-xs font-semibold tracking-tight text-foreground">
                  {col.title}
                </h3>
                <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
                  {colProjects.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-muted-foreground/70 mr-1" title="Logged hours in stage">
                  {colHours}h
                </span>
                <button
                  type="button"
                  onClick={() => onNewProject(col.id)}
                  title={`Add new project to ${col.title}`}
                  className="grid size-6 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Column Cards */}
            <div className="mt-3 space-y-3 flex-1 min-h-[100px]">
              {colProjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground/60 italic">
                  No projects in this stage
                </div>
              ) : (
                colProjects.map((project) => {
                  const theme = TRACK_THEMES[project.track] || TRACK_THEMES["Fullstack & Systems"];
                  const activeMilestone =
                    project.milestones.find((m) => m.status === "in_progress") ||
                    project.milestones[0];

                  return (
                    <motion.div
                      key={project.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="group relative rounded-xl border border-border/70 bg-card/80 p-3.5 shadow-xs hover:border-border hover:bg-card transition-all"
                    >
                      {/* Track badge & Hours */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                            theme.badge
                          )}
                        >
                          {theme.label}
                        </span>

                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          <Clock className="size-2.5 text-muted-foreground/60" />
                          {project.loggedHours}h / {project.estimatedHours}h
                        </span>
                      </div>

                      {/* Title & Tagline */}
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => onOpenDetails(project)}
                          className="text-left font-semibold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1 cursor-pointer"
                        >
                          {project.title}
                        </button>
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {project.tagline}
                        </p>
                      </div>

                      {/* Progress mini-bar */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-bold text-foreground">{project.progress}%</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-muted/60">
                          <div
                            style={{ width: `${project.progress}%` }}
                            className={cn(
                              "h-full rounded-full transition-all",
                              project.progress === 100 ? "bg-emerald-500" : "bg-primary"
                            )}
                          />
                        </div>
                      </div>

                      {/* Current Milestone */}
                      {activeMilestone && (
                        <div className="mt-2 text-[10px] text-muted-foreground/80 truncate flex items-center gap-1">
                          <Calendar className="size-2.5 text-muted-foreground/60 shrink-0" />
                          <span className="truncate">{activeMilestone.title}</span>
                        </div>
                      )}

                      {/* Bottom Controls: Stage Move Buttons */}
                      <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {col.id !== "planning" && (
                            <button
                              type="button"
                              onClick={() => {
                                const prevIdx = COLUMNS.findIndex((c) => c.id === col.id) - 1;
                                if (prevIdx >= 0) moveProject(project.id, COLUMNS[prevIdx].id);
                              }}
                              title="Move back"
                              className="grid size-6 place-items-center rounded border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                            >
                              <ArrowLeft className="size-3" />
                            </button>
                          )}
                          {col.id !== "completed" && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextIdx = COLUMNS.findIndex((c) => c.id === col.id) + 1;
                                if (nextIdx < COLUMNS.length) moveProject(project.id, COLUMNS[nextIdx].id);
                              }}
                              title="Move to next stage"
                              className="grid size-6 place-items-center rounded border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                            >
                              <ArrowRight className="size-3" />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenDetails(project)}
                          className="text-[10px] font-medium text-primary hover:underline cursor-pointer"
                        >
                          Deep Dive →
                        </button>
                      </div>
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
