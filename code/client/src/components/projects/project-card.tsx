import { motion } from "motion/react";
import {
  FolderKanban,
  Star,
  ExternalLink,
  Github,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  CopyPlus,
  Download,
  ArrowRightCircle,
  FileCode,
} from "lucide-react";
import { Project, ProjectTrack, ProjectPriority, ProjectStatus } from "./project-types";
import { useProjects } from "./project-context";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const TRACK_THEMES: Record<
  ProjectTrack,
  { label: string; badge: string; border: string; glow: string; text: string }
> = {
  "SQL & Databases": {
    label: "SQL & Databases",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    border: "hover:border-blue-500/40",
    glow: "group-hover:shadow-[0_0_24px_rgba(59,130,246,0.12)]",
    text: "text-blue-400",
  },
  "Python & Analytics": {
    label: "Python & Analytics",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    border: "hover:border-emerald-500/40",
    glow: "group-hover:shadow-[0_0_24px_rgba(16,185,129,0.12)]",
    text: "text-emerald-400",
  },
  "Power BI & BI": {
    label: "Power BI & BI",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    border: "hover:border-amber-500/40",
    glow: "group-hover:shadow-[0_0_24px_rgba(245,158,11,0.12)]",
    text: "text-amber-400",
  },
  "Finance & Markets": {
    label: "Finance & Markets",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/25",
    border: "hover:border-purple-500/40",
    glow: "group-hover:shadow-[0_0_24px_rgba(168,85,247,0.12)]",
    text: "text-purple-400",
  },
  "AI & Cloud Architecture": {
    label: "AI & Agents",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/25",
    border: "hover:border-rose-500/40",
    glow: "group-hover:shadow-[0_0_24px_rgba(244,63,94,0.12)]",
    text: "text-rose-400",
  },
  "Fullstack & Systems": {
    label: "Fullstack & Systems",
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25",
    border: "hover:border-cyan-500/40",
    glow: "group-hover:shadow-[0_0_24px_rgba(6,182,212,0.12)]",
    text: "text-cyan-400",
  },
};

export const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; badge: string; dot: string }
> = {
  planning: {
    label: "Planning",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    dot: "bg-purple-400",
  },
  in_progress: {
    label: "In Progress",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dot: "bg-blue-400 animate-pulse",
  },
  review: {
    label: "Under Review",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400",
  },
  completed: {
    label: "Completed",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  archived: {
    label: "Archived",
    badge: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
    dot: "bg-neutral-400",
  },
};

export const PRIORITY_CONFIG: Record<
  ProjectPriority,
  { label: string; badge: string }
> = {
  urgent: { label: "Urgent", badge: "bg-rose-500/10 text-rose-400 border-rose-500/30 font-semibold" },
  high: { label: "High", badge: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
  medium: { label: "Medium", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  low: { label: "Low", badge: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
};

interface ProjectCardProps {
  project: Project;
  onOpenDetails: (project: Project) => void;
  onEdit: (project: Project) => void;
}

export function ProjectCard({ project, onOpenDetails, onEdit }: ProjectCardProps) {
  const {
    togglePinProject,
    deleteProject,
    duplicateProject,
    advanceProjectStatus,
    exportProjectMarkdown,
  } = useProjects();

  const theme = TRACK_THEMES[project.track] || TRACK_THEMES["Fullstack & Systems"];
  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.in_progress;
  const priorityCfg = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium;

  const completedMilestones = project.milestones.filter((m) => m.status === "completed").length;
  const totalMilestones = project.milestones.length;
  const activeMilestone = project.milestones.find((m) => m.status === "in_progress") || project.milestones[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-md transition-all duration-300 hover:border-border hover:bg-card/90",
        theme.border,
        theme.glow
      )}
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3">
          {/* Track & Priority Badges */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
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
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase",
                priorityCfg.badge
              )}
            >
              {priorityCfg.label}
            </span>

            {project.status === "completed" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <CheckCircle2 className="size-3" />
                Portfolio Ready
              </span>
            )}
          </div>

          {/* Quick Actions (Pin & Dropdown Menu) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => togglePinProject(project.id)}
              title={project.pinned ? "Unpin project" : "Pin project to top"}
              aria-label={project.pinned ? "Unpin project" : "Pin project"}
              className={cn(
                "grid size-7 place-items-center rounded-lg transition-colors cursor-pointer",
                project.pinned
                  ? "text-amber-400 hover:bg-amber-400/10"
                  : "text-muted-foreground/60 hover:text-amber-400 hover:bg-muted"
              )}
            >
              <Star className={cn("size-3.5", project.pinned && "fill-amber-400")} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Project options"
                  aria-label="Project options"
                  className="grid size-7 place-items-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                >
                  <MoreVertical className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                  Project Actions
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onOpenDetails(project)}
                  className="flex items-center gap-2 text-xs cursor-pointer"
                >
                  <FolderKanban className="size-3.5 text-primary" />
                  <span>Open Deep Dive</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => advanceProjectStatus(project.id)}
                  className="flex items-center gap-2 text-xs cursor-pointer"
                >
                  <ArrowRightCircle className="size-3.5 text-blue-400" />
                  <span>Advance Status</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onEdit(project)}
                  className="flex items-center gap-2 text-xs cursor-pointer"
                >
                  <Edit2 className="size-3.5 text-muted-foreground" />
                  <span>Edit Details</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => duplicateProject(project.id)}
                  className="flex items-center gap-2 text-xs cursor-pointer"
                >
                  <CopyPlus className="size-3.5 text-muted-foreground" />
                  <span>Duplicate Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportProjectMarkdown(project)}
                  className="flex items-center gap-2 text-xs cursor-pointer"
                >
                  <Download className="size-3.5 text-muted-foreground" />
                  <span>Export Markdown (.md)</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => deleteProject(project.id)}
                  className="flex items-center gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title and Tagline */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => onOpenDetails(project)}
            className="text-left group/title block"
          >
            <h3 className="text-base font-semibold text-foreground group-hover/title:text-primary transition-colors tracking-tight line-clamp-1">
              {project.title}
            </h3>
          </button>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {project.tagline}
          </p>
        </div>

        {/* Progress Bar & Counter */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className={cn("size-2 rounded-full", statusCfg.dot)} />
              <span className="text-[11px] font-semibold text-foreground">{statusCfg.label}</span>
              <span className="text-[10px] text-muted-foreground/80">
                ({completedMilestones}/{totalMilestones} Phases)
              </span>
            </span>
            <span className="font-mono text-xs font-bold text-foreground">{project.progress}%</span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full transition-all",
                project.progress === 100
                  ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  : "bg-primary shadow-[0_0_8px_rgba(59,130,246,0.4)]"
              )}
            />
          </div>
        </div>

        {/* Active Milestone Snippet */}
        {activeMilestone && (
          <div className="mt-3.5 rounded-xl border border-border/50 bg-background/50 p-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Current Milestone:
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3 text-muted-foreground/70" />
                {activeMilestone.dueDate}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-foreground line-clamp-1">
              {activeMilestone.title}
            </p>
          </div>
        )}

        {/* Tech Stack Pills */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {project.techStack.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground"
            >
              <FileCode className="size-2.5 opacity-60" />
              {tech}
            </span>
          ))}
          {project.techStack.length > 4 && (
            <span className="rounded-md border border-border/40 bg-muted/20 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
              +{project.techStack.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer: Metadata & Quick Launch Buttons */}
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1" title="Time Logged vs Estimated">
            <Clock className="size-3 text-muted-foreground/70" />
            <span className="font-mono">{project.loggedHours}h</span>
            <span className="text-muted-foreground/60">/ {project.estimatedHours}h</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open GitHub Repository"
              className="grid size-7 place-items-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Github className="size-3.5" />
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Launch Live Demo"
              className="grid size-7 place-items-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted hover:text-emerald-400 transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => onOpenDetails(project)}
            title="Inspect project details"
            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          >
            <span>Deep Dive</span>
            <ChevronRight className="size-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
