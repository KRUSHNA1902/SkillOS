import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FolderKanban,
  Plus,
  Search,
  Sparkles,
  Download,
  LayoutGrid,
  Columns4,
  Calendar,
  List,
  Clock,
  CheckCircle2,
  Star,
  X,
  Tag,
  Settings2,
  ChevronDown,
  Check,
  Flame,
  TrendingUp,
} from "lucide-react";
import {
  Project,
  ProjectStatus,
  ProjectTrack,
  ProjectViewMode,
} from "./project-types";
import { useProjects } from "./project-context";
import { useTags } from "@/components/tags/tag-context";
import { ProjectCard, TRACK_THEMES, STATUS_CONFIG } from "./project-card";
import { ProjectModal } from "./project-modal";
import { ProjectKanbanBoard } from "./project-kanban-board";
import { ProjectTimelineView } from "./project-timeline-view";
import { ProjectDetailsInspector } from "./project-details-inspector";
import { cn } from "@/lib/utils";

const VIEW_OPTIONS: {
  id: ProjectViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}[] = [
  { id: "grid", label: "Showcase Grid", icon: LayoutGrid, desc: "Portfolio card grid" },
  { id: "kanban", label: "Sprint Kanban", icon: Columns4, desc: "Stage-based sprint board" },
  { id: "timeline", label: "Roadmap Timeline", icon: Calendar, desc: "Milestones & deadlines" },
  { id: "list", label: "List Table", icon: List, desc: "High-density tabular view" },
];

interface ProjectsViewProps {
  initialFilter?: "all" | "in_progress" | "completed";
  onNavigateToAI?: () => void;
  onNavigateToTasks?: () => void;
  onNavigateToNotes?: () => void;
}

export function ProjectsView({
  initialFilter = "all",
  onNavigateToAI,
  onNavigateToTasks,
  onNavigateToNotes,
}: ProjectsViewProps) {
  const {
    projects,
    metrics,
    addProject,
    updateProject,
    exportAllProjectsMarkdown,
  } = useProjects();
  const { getTagClass, openTagManager } = useTags();

  // View mode defaults to "grid" (Showcase Grid View) as requested by user
  const [viewMode, setViewMode] = useState<ProjectViewMode>("grid");
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  // Close view dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
        setIsViewMenuOpen(false);
      }
    }
    if (isViewMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isViewMenuOpen]);

  // Close view dropdown on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isViewMenuOpen) {
        setIsViewMenuOpen(false);
      }
    }
    if (isViewMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isViewMenuOpen]);

  const currentViewOption = VIEW_OPTIONS.find((v) => v.id === viewMode) || VIEW_OPTIONS[0];
  const CurrentViewIcon = currentViewOption.icon;

  // Filter states
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>(
    initialFilter === "all" ? "all" : (initialFilter as ProjectStatus)
  );
  const [trackFilter, setTrackFilter] = useState<"all" | ProjectTrack>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "progress" | "targetDate" | "priority" | "title">("updated");

  // Modal & Inspector states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [inspectingProject, setInspectingProject] = useState<Project | null>(null);
  const [isEditingInInspector, setIsEditingInInspector] = useState(false);

  // Compute top tags used across projects
  const projectTopTags = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((p) => {
      p.tags?.forEach((t) => {
        counts.set(t, (counts.get(t) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  // Sync initialFilter prop if changed from sidebar
  useEffect(() => {
    setInspectingProject(null);
    if (initialFilter === "in_progress") {
      setStatusFilter("in_progress");
    } else if (initialFilter === "completed") {
      setStatusFilter("completed");
    } else {
      setStatusFilter("all");
    }
  }, [initialFilter]);

  // Keep inspectingProject synced with live projects state
  const currentInspectingProject = useMemo(() => {
    if (!inspectingProject) return null;
    return projects.find((p) => p.id === inspectingProject.id) || null;
  }, [projects, inspectingProject]);

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        // Status filter
        if (statusFilter !== "all" && project.status !== statusFilter) return false;

        // Track filter
        if (trackFilter !== "all" && project.track !== trackFilter) return false;

        // Tag filter
        if (selectedTag !== "all") {
          if (!project.tags || !project.tags.includes(selectedTag)) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = project.title.toLowerCase().includes(q);
          const matchTagline = project.tagline.toLowerCase().includes(q);
          const matchTrack = project.track.toLowerCase().includes(q);
          const matchTech = project.techStack.some((t) => t.toLowerCase().includes(q));
          const matchTags = project.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchTagline && !matchTrack && !matchTech && !matchTags) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned projects always appear first
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

        if (sortBy === "progress") return b.progress - a.progress;
        if (sortBy === "targetDate") return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        if (sortBy === "priority") {
          const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return pOrder[a.priority] - pOrder[b.priority];
        }
        if (sortBy === "title") return a.title.localeCompare(b.title);
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [projects, statusFilter, trackFilter, selectedTag, searchQuery, sortBy]);

  const handleOpenEdit = (project: Project) => {
    setInspectingProject(project);
    setIsEditingInInspector(true);
  };

  const handleCreateNew = (defaultStatus?: ProjectStatus) => {
    if (defaultStatus) {
      setStatusFilter(defaultStatus);
    }
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleSaveProject = (projectData: any) => {
    if (projectData.id) {
      updateProject(projectData.id, projectData);
    } else {
      addProject(projectData);
    }
  };

  // When inspecting a project, render the full-canvas in-page workspace
  // while keeping the sidebar navigation menu and top header intact
  if (currentInspectingProject) {
    return (
      <div className="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-x-hidden bg-background overflow-hidden">
        <ProjectDetailsInspector
          project={currentInspectingProject}
          isOpen={true}
          initialIsEditing={isEditingInInspector}
          onClose={() => {
            setInspectingProject(null);
            setIsEditingInInspector(false);
          }}
          onEdit={() => {
            setIsEditingInInspector(true);
          }}
          onNavigateToTasks={onNavigateToTasks}
          onNavigateToNotes={onNavigateToNotes}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-x-hidden bg-background overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <FolderKanban className="size-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Projects & Portfolio
              </h1>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              End-to-end production pipelines, verifiable applications, and portfolio proof-of-work.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateToAI && (
              <button
                type="button"
                onClick={onNavigateToAI}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="size-3.5 text-amber-400" />
                <span className="hidden sm:inline">AI Copilot</span>
              </button>
            )}

            <button
              type="button"
              onClick={exportAllProjectsMarkdown}
              title="Export all projects as compilation markdown document"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer shadow-xs"
            >
              <Download className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Export Portfolio</span>
            </button>

            <button
              type="button"
              onClick={() => handleCreateNew()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            >
              <Plus className="size-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* High-Density KPI Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-mono uppercase tracking-wider">Total Projects</span>
              <FolderKanban className="size-4 text-primary" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-foreground">{metrics.total}</span>
              <span className="text-[10px] text-muted-foreground font-mono">portfolio builds</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-mono uppercase tracking-wider">In Active Sprint</span>
              <span className="size-2 rounded-full bg-blue-400 animate-pulse" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-blue-400">{metrics.inProgress}</span>
              <span className="text-[10px] text-muted-foreground font-mono">active builds</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-mono uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="size-4 text-emerald-400" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">{metrics.completed}</span>
              <span className="text-[10px] text-muted-foreground font-mono">portfolio ready</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-mono uppercase tracking-wider">Hours Invested</span>
              <Clock className="size-4 text-amber-400" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-foreground">{metrics.totalLoggedHours}h</span>
              <span className="text-[10px] text-muted-foreground font-mono">/ {metrics.totalEstimatedHours}h est</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-border/70 bg-card/60 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-mono uppercase tracking-wider">Average Progress</span>
              <span className="text-xs font-mono font-bold text-foreground">{metrics.averageProgress}%</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                style={{ width: `${metrics.averageProgress}%` }}
                className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
              />
            </div>
          </div>
        </div>

        {/* Filter Toolbar & View Switcher */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap no-scrollbar scrollbar-none">
            {[
              { id: "all", label: "All Projects", count: metrics.total },
              { id: "in_progress", label: "In Progress", count: metrics.inProgress },
              { id: "planning", label: "Planning", count: metrics.planning },
              { id: "review", label: "Review", count: metrics.review },
              { id: "completed", label: "Completed", count: metrics.completed },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer shrink-0",
                  statusFilter === tab.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-mono font-normal",
                    statusFilter === tab.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Controls: Search, Track Filter, Sort, View Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Box */}
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, stack, track..."
                className="w-full rounded-xl border border-border/80 bg-card pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Track Filter Dropdown */}
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value as any)}
              className="rounded-xl border border-border/80 bg-card px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">All Tracks</option>
              <option value="Python & Analytics">Python & Analytics</option>
              <option value="SQL & Databases">SQL & Databases</option>
              <option value="AI & Cloud Architecture">AI & Cloud Architecture</option>
              <option value="Power BI & BI">Power BI & BI</option>
              <option value="Finance & Markets">Finance & Markets</option>
              <option value="Fullstack & Systems">Fullstack & Systems</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-border/80 bg-card px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none hidden sm:block"
            >
              <option value="updated">Last Updated</option>
              <option value="progress">Highest Progress</option>
              <option value="targetDate">Target Date</option>
              <option value="priority">Priority</option>
              <option value="title">Alphabetical</option>
            </select>

            {/* View Mode Dropdown Menu */}
            <div className="relative" ref={viewMenuRef}>
              <button
                type="button"
                onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-2.5 py-1.5 text-xs text-foreground hover:bg-muted/50 transition-colors focus:border-primary focus:outline-none cursor-pointer shadow-xs",
                  isViewMenuOpen && "border-primary ring-1 ring-primary/20"
                )}
                title="Change project view mode"
                aria-expanded={isViewMenuOpen}
                aria-haspopup="true"
              >
                <CurrentViewIcon className="size-3.5 text-primary" />
                <span className="font-medium">{currentViewOption.label}</span>
                <ChevronDown className={cn("size-3 text-muted-foreground transition-transform duration-200", isViewMenuOpen && "rotate-180")} />
              </button>

              {isViewMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-xl border border-border/80 bg-card/95 backdrop-blur-md p-1.5 shadow-xl z-30 space-y-0.5 animate-in fade-in-0 zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Project View Mode
                  </div>
                  {VIEW_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = viewMode === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setViewMode(option.id);
                          setIsViewMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer text-left",
                          isSelected
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={cn("size-3.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                          <div>
                            <p className="leading-tight">{option.label}</p>
                            <span className="text-[10px] text-muted-foreground font-normal block leading-tight mt-0.5">
                              {option.desc}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Unified Tag Filter Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 text-xs no-scrollbar scrollbar-none">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Tag className="size-3 text-muted-foreground" />
            <span>Filter by Tag:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedTag("all")}
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-medium transition-all shrink-0 cursor-pointer",
              selectedTag === "all"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            All Tags
          </button>
          {projectTopTags.map(({ tag, count }) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(isSelected ? "all" : tag)}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                  getTagClass(tag, isSelected)
                )}
              >
                <span>#{tag}</span>
                <span className="text-[9px] opacity-75">({count})</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => openTagManager()}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shrink-0 ml-1 cursor-pointer"
            title="Create, edit, colorize, and delete tags"
          >
            <Settings2 className="size-3" />
            <span>Manage Tags</span>
          </button>
        </div>

        {/* View Mode Content Area */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/30 p-12 text-center space-y-3">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
              <FolderKanban className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No Projects Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No portfolio projects match your active search or filters. Try adjusting your criteria or create a new project.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setTrackFilter("all");
                  setSelectedTag("all");
                  setSearchQuery("");
                }}
                className="rounded-xl border border-border/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
              <button
                type="button"
                onClick={() => handleCreateNew()}
                className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
              >
                + New Project
              </button>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* 1. SHOWCASE GRID VIEW (Default) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpenDetails={(p) => setInspectingProject(p)}
                onEdit={handleOpenEdit}
              />
            ))}
          </div>
        ) : viewMode === "kanban" ? (
          /* 2. SPRINT KANBAN BOARD */
          <ProjectKanbanBoard
            projects={filteredProjects}
            onOpenDetails={(p) => setInspectingProject(p)}
            onNewProject={handleCreateNew}
          />
        ) : viewMode === "timeline" ? (
          /* 3. ROADMAP TIMELINE VIEW */
          <ProjectTimelineView
            projects={filteredProjects}
            onOpenDetails={(p) => setInspectingProject(p)}
          />
        ) : (
          /* 4. HIGH-DENSITY LIST / TABLE VIEW */
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border/60 bg-muted/40 text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Project Title</th>
                    <th className="px-4 py-3">Track</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Phases</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Target Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredProjects.map((project) => {
                    const theme = TRACK_THEMES[project.track] || TRACK_THEMES["Fullstack & Systems"];
                    const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.in_progress;
                    const completedPhases = project.milestones.filter((m) => m.status === "completed").length;

                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => setInspectingProject(project)}
                      >
                        <td className="px-4 py-3 font-semibold text-foreground group-hover:text-primary transition-colors">
                          <div className="flex items-center gap-2">
                            {project.pinned && <Star className="size-3 fill-amber-400 text-amber-400 shrink-0" />}
                            <span className="truncate max-w-xs">{project.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold", theme.badge)}>
                            {theme.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]", statusCfg.badge)}>
                            <span className={cn("size-1.5 rounded-full", statusCfg.dot)} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-foreground">
                          {project.progress}%
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {completedPhases} / {project.milestones.length}
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {project.loggedHours}h / {project.estimatedHours}h
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {project.targetDate}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingProject(project);
                            }}
                            className="text-primary hover:underline font-medium text-xs cursor-pointer"
                          >
                            Details →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Creation & Edit Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        initialProject={editingProject}
      />
    </div>
  );
}
