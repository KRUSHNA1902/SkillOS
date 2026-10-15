import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  FolderKanban,
  FileCode,
  Calendar,
  Clock,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Github,
  AlertCircle,
  Lightbulb,
  Tag,
  X,
  Save,
  Undo2,
  Star,
  Flame,
  CalendarDays,
  Check,
  Compass,
  Code2,
} from "lucide-react";
import {
  Project,
  ProjectTrack,
  ProjectPriority,
  ProjectStatus,
  ProjectMilestone,
} from "./project-types";
import { TagPicker } from "@/components/tags/tag-picker";
import { generateProjectMilestones } from "@/lib/ai-service";
import { cn } from "@/lib/utils";

interface ProjectEditorProps {
  project: Project;
  onSave: (
    projectData: Omit<Project, "id" | "createdAt" | "updatedAt" | "progress"> & {
      id?: string;
      progress?: number;
    }
  ) => void;
  onCancel: () => void;
  className?: string;
}

const TRACKS: { id: ProjectTrack; label: string; icon: string }[] = [
  { id: "Python & Analytics", label: "Python & Analytics", icon: "🐍" },
  { id: "SQL & Databases", label: "SQL & Databases", icon: "🐘" },
  { id: "AI & Cloud Architecture", label: "AI & Cloud Architecture", icon: "⚡" },
  { id: "Power BI & BI", label: "Power BI & BI", icon: "📊" },
  { id: "Finance & Markets", label: "Finance & Markets", icon: "📈" },
  { id: "Fullstack & Systems", label: "Fullstack & Systems", icon: "💻" },
];

const STATUS_OPTIONS: { id: ProjectStatus; label: string; dotClass: string }[] = [
  { id: "planning", label: "Planning", dotClass: "bg-blue-400" },
  { id: "in_progress", label: "In Active Sprint", dotClass: "bg-amber-400 animate-pulse" },
  { id: "review", label: "Under Review", dotClass: "bg-purple-400" },
  { id: "completed", label: "Completed & Ready", dotClass: "bg-emerald-400" },
  { id: "archived", label: "Archived", dotClass: "bg-zinc-500" },
];

const PRIORITY_OPTIONS: { id: ProjectPriority; label: string; pillClass: string }[] = [
  { id: "urgent", label: "Urgent Priority", pillClass: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { id: "high", label: "High Priority", pillClass: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { id: "medium", label: "Medium Priority", pillClass: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  { id: "low", label: "Low Priority", pillClass: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30" },
];

const SUGGESTED_TECH = [
  "Python",
  "DuckDB",
  "PostgreSQL",
  "Pandas",
  "FastAPI",
  "Streamlit",
  "Gemini 3.8 Flash",
  "TypeScript",
  "React",
  "Node.js",
  "Docker",
  "GitHub Actions",
  "Power BI",
  "DAX",
  "Terraform",
  "dbt",
  "Supabase",
  "Tailwind CSS",
  "WebSockets",
];

export function ProjectEditor({
  project,
  onSave,
  onCancel,
  className,
}: ProjectEditorProps) {
  const [activeTab, setActiveTab] = useState<"general" | "tech" | "milestones" | "architecture">("general");

  // Form states initialized from project
  const [title, setTitle] = useState(project.title);
  const [tagline, setTagline] = useState(project.tagline);
  const [track, setTrack] = useState<ProjectTrack>(project.track);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [priority, setPriority] = useState<ProjectPriority>(project.priority);
  const [startDate, setStartDate] = useState(project.startDate);
  const [targetDate, setTargetDate] = useState(project.targetDate);
  const [estimatedHours, setEstimatedHours] = useState(project.estimatedHours);
  const [loggedHours, setLoggedHours] = useState(project.loggedHours);
  const [pinned, setPinned] = useState(project.pinned);

  // Tech stack & links
  const [techStack, setTechStack] = useState<string[]>([...project.techStack]);
  const [techInput, setTechInput] = useState("");
  const [tags, setTags] = useState<string[]>(
    project.tags && project.tags.length > 0
      ? [...project.tags]
      : ["Analytics", "Architecture"]
  );
  const [repoUrl, setRepoUrl] = useState(project.repoUrl || "");
  const [demoUrl, setDemoUrl] = useState(project.demoUrl || "");
  const [docsUrl, setDocsUrl] = useState(project.docsUrl || "");

  // Milestones & Architecture
  const [milestones, setMilestones] = useState<ProjectMilestone[]>(
    JSON.parse(JSON.stringify(project.milestones || []))
  );
  const [architectureNotes, setArchitectureNotes] = useState(project.architectureNotes || "");
  const [descriptionMarkdown, setDescriptionMarkdown] = useState(project.descriptionMarkdown || "");
  const [specPreviewTab, setSpecPreviewTab] = useState<"edit" | "preview">("edit");

  // AI Generation State
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // Calculated cozy metrics
  const sprintDurationDays = useMemo(() => {
    if (!startDate || !targetDate) return null;
    const start = new Date(startDate).getTime();
    const end = new Date(targetDate).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return null;
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
  }, [startDate, targetDate]);

  const effortPercentage = useMemo(() => {
    const est = Number(estimatedHours) || 0;
    const log = Number(loggedHours) || 0;
    if (est <= 0) return 0;
    return Math.min(100, Math.round((log / est) * 100));
  }, [estimatedHours, loggedHours]);

  // Sync state if project prop changes externally
  useEffect(() => {
    setTitle(project.title);
    setTagline(project.tagline);
    setTrack(project.track);
    setStatus(project.status);
    setPriority(project.priority);
    setStartDate(project.startDate);
    setTargetDate(project.targetDate);
    setEstimatedHours(project.estimatedHours);
    setLoggedHours(project.loggedHours);
    setPinned(project.pinned);
    setTechStack([...project.techStack]);
    setTags(
      project.tags && project.tags.length > 0
        ? [...project.tags]
        : ["Analytics", "Architecture"]
    );
    setRepoUrl(project.repoUrl || "");
    setDemoUrl(project.demoUrl || "");
    setDocsUrl(project.docsUrl || "");
    setMilestones(JSON.parse(JSON.stringify(project.milestones || [])));
    setArchitectureNotes(project.architectureNotes || "");
    setDescriptionMarkdown(project.descriptionMarkdown || "");
  }, [project.id]);

  // Handle Cmd+Enter shortcut to save, and Escape to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    title,
    tagline,
    track,
    status,
    priority,
    startDate,
    targetDate,
    estimatedHours,
    loggedHours,
    pinned,
    techStack,
    repoUrl,
    demoUrl,
    docsUrl,
    milestones,
    architectureNotes,
    descriptionMarkdown,
    tags,
  ]);

  // Tech stack tags
  const addTechTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !techStack.includes(trimmed)) {
      setTechStack((prev) => [...prev, trimmed]);
    }
    setTechInput("");
  };

  const removeTechTag = (tagToRemove: string) => {
    setTechStack((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Milestone management
  const addEmptyMilestone = () => {
    const newM: ProjectMilestone = {
      id: `m-custom-${Date.now()}`,
      title: `Phase ${milestones.length + 1}: Implementation`,
      description: "Define concrete phase goals and deliverables.",
      status: "pending",
      dueDate: targetDate || new Date().toISOString().split("T")[0],
      deliverables: [],
    };
    setMilestones((prev) => [...prev, newM]);
  };

  const updateMilestoneTitle = (mId: string, newTitle: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === mId ? { ...m, title: newTitle } : m))
    );
  };

  const updateMilestoneDescription = (mId: string, newDesc: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === mId ? { ...m, description: newDesc } : m))
    );
  };

  const removeMilestone = (mId: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== mId));
  };

  const addDeliverable = (mId: string, dTitle: string) => {
    if (!dTitle.trim()) return;
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== mId) return m;
        return {
          ...m,
          deliverables: [
            ...m.deliverables,
            {
              id: `del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              title: dTitle.trim(),
              completed: false,
            },
          ],
        };
      })
    );
  };

  const removeDeliverable = (mId: string, dId: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== mId) return m;
        return {
          ...m,
          deliverables: m.deliverables.filter((d) => d.id !== dId),
        };
      })
    );
  };

  // AI Milestone Generator
  const handleAIGenerateMilestones = async () => {
    if (!title.trim()) {
      setAiError("Please provide at least a project title before generating milestones.");
      return;
    }

    setIsAIGenerating(true);
    setAiError(null);
    setAiSuccessMessage(null);

    try {
      const result = await generateProjectMilestones(title, track, tagline, techStack);

      const generatedMilestones: ProjectMilestone[] = result.milestones.map((sm, index) => {
        const dueDateObj = new Date(Date.now() + (index + 1) * sm.suggestedDurationDays * 24 * 60 * 60 * 1000);
        return {
          id: `m-ai-${Date.now()}-${index}`,
          title: sm.title,
          description: sm.description,
          status: index === 0 ? "in_progress" : "pending",
          dueDate: dueDateObj.toISOString().split("T")[0],
          deliverables: sm.deliverables.map((del, dIdx) => ({
            id: `d-ai-${Date.now()}-${index}-${dIdx}`,
            title: del,
            completed: false,
          })),
        };
      });

      setMilestones(generatedMilestones);
      if (result.architectureNotes) {
        setArchitectureNotes(result.architectureNotes);
      }
      setAiSuccessMessage(
        `Gemini 3.8 Flash generated ${generatedMilestones.length} structured project phases with deliverables!`
      );
    } catch (err: any) {
      setAiError(err.message || "Failed to generate milestones via AI");
    } finally {
      setIsAIGenerating(false);
    }
  };

  // Submit
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    onSave({
      id: project.id,
      title: title.trim(),
      slug: slug || project.slug || "portfolio-project",
      tagline: tagline.trim() || "High-impact portfolio engineering project",
      descriptionMarkdown: descriptionMarkdown.trim(),
      track,
      status,
      priority,
      startDate,
      targetDate,
      estimatedHours: Number(estimatedHours) || 0,
      loggedHours: Number(loggedHours) || 0,
      pinned,
      techStack,
      repoUrl: repoUrl.trim() || undefined,
      demoUrl: demoUrl.trim() || undefined,
      docsUrl: docsUrl.trim() || undefined,
      milestones,
      architectureNotes: architectureNotes.trim() || undefined,
      tags: tags.length > 0 ? tags : [track.split(" ")[0] || "General"],
      linkedTaskIds: project.linkedTaskIds || [],
      linkedNoteIds: project.linkedNoteIds || [],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn("relative mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-7", className)}
    >
      {/* Warm Ambient Backdrop Illumination */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 left-1/2 -z-10 -translate-x-1/2 w-full max-w-3xl h-64 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(245,158,11,0.08),rgba(217,119,6,0.03),transparent)] blur-2xl"
      />

      {/* Top Studio Header Card */}
      <div className="rounded-3xl border border-amber-500/15 dark:border-amber-400/10 bg-gradient-to-b from-card/90 via-card/80 to-card/60 p-5 sm:p-7 backdrop-blur-2xl shadow-xl shadow-black/30 relative overflow-hidden">
        {/* Subtle top inner glow highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Cozy Warm Folder Container */}
            <div className="size-12 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-amber-700/10 text-amber-300 border border-amber-500/30 grid place-items-center shadow-md shadow-amber-500/10 shrink-0">
              <FolderKanban className="size-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Edit Portfolio Project
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300 shadow-xs">
                  <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Studio Workspace
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Refine deliverables, architectural decisions, and milestones in your focused workshop.
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 hover:bg-muted/80 hover:border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
              title="Discard changes and return (Esc)"
            >
              <Undo2 className="size-3.5" />
              <span>Cancel</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.2 text-[9px] font-mono rounded bg-muted/80 border border-border/80 text-muted-foreground">
                Esc
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!title.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold px-4 sm:px-5 py-2 text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              title="Save project changes (Cmd+Enter)"
            >
              <Save className="size-3.5 stroke-[2.5]" />
              <span>Update Project</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.2 text-[9px] font-mono rounded bg-black/20 text-zinc-950 font-bold border border-black/10">
                ⌘↵
              </kbd>
            </button>
          </div>
        </div>

        {/* Cozy Pill Segmented Navigation */}
        <div className="mt-6 pt-4 border-t border-border/40">
          <div className="inline-flex flex-wrap items-center gap-1.5 rounded-2xl bg-zinc-950/50 p-1.5 border border-border/60 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer",
                activeTab === "general"
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-amber-200 border border-amber-500/35 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <FolderKanban className="size-3.5" />
              <span>General Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tech")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer",
                activeTab === "tech"
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-amber-200 border border-amber-500/35 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <FileCode className="size-3.5" />
              <span>Tech Stack & Links</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("milestones")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer",
                activeTab === "milestones"
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-amber-200 border border-amber-500/35 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Layers className="size-3.5" />
              <span>Milestones</span>
              <span className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                activeTab === "milestones" ? "bg-amber-400/25 text-amber-300 font-bold" : "bg-muted text-muted-foreground"
              )}>
                {milestones.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("architecture")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer",
                activeTab === "architecture"
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-amber-200 border border-amber-500/35 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Lightbulb className="size-3.5" />
              <span>Architecture Spec</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Workspace Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-amber-500/15 dark:border-amber-400/10 bg-gradient-to-b from-card/90 via-card/80 to-card/70 p-6 sm:p-8 backdrop-blur-2xl shadow-xl shadow-black/30 space-y-6"
      >
        {/* ============================================================ */}
        {/* TAB 1: GENERAL DETAILS (COZY WORKSHOP LAYOUT) */}
        {/* ============================================================ */}
        {activeTab === "general" && (
          <div className="space-y-6">
            {/* Group 1: Project Identity */}
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <Sparkles className="size-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Project Identity & Vision
                </h3>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span>Project Title</span>
                    <span className="text-amber-400">*</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Shown on executive portfolio header
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. SkillOS Autonomous Copilot Engine"
                  className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground flex items-center justify-between mb-1.5">
                  <span className="font-semibold">Tagline / One-Line Objective</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    High-impact summary for evaluators
                  </span>
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Gemini 3.8 Flash multi-turn agent with tool calling and markdown streaming"
                  className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Group 2: Curriculum Domain, Status & Priority */}
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <Compass className="size-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Domain Track, Stage & Priority
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Curriculum Track */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Curriculum Track
                  </label>
                  <select
                    value={track}
                    onChange={(e) => setTrack(e.target.value as ProjectTrack)}
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-xs font-medium text-foreground focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all cursor-pointer shadow-xs"
                  >
                    {TRACKS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Stage */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Status Stage
                    </label>
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          STATUS_OPTIONS.find((s) => s.id === status)?.dotClass
                        )}
                      />
                      <span>{STATUS_OPTIONS.find((s) => s.id === status)?.label}</span>
                    </span>
                  </div>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-xs font-medium text-foreground focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all cursor-pointer shadow-xs"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Level */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Priority Level
                    </label>
                    {priority === "urgent" && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                        <Flame className="size-3 fill-rose-400" />
                        <span>Critical</span>
                      </span>
                    )}
                  </div>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-xs font-medium text-foreground focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all cursor-pointer shadow-xs"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Group 3: Timeline & Effort Budget */}
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Timeline & Effort Budget
                  </h3>
                </div>
                {sprintDurationDays !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-amber-300">
                    <CalendarDays className="size-3 text-amber-400" />
                    <span>~{sprintDurationDays} days sprint duration</span>
                  </span>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-amber-400" />
                    <span>Start Date</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-xs font-medium text-foreground focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-amber-400" />
                    <span>Target Delivery Date</span>
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-xs font-medium text-foreground focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Hours & Progress */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-amber-400" />
                      <span>Estimated Hours</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Planned budget
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-xs font-medium text-foreground focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-amber-400" />
                      <span>Logged Hours (Actual)</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Invested time
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={loggedHours}
                    onChange={(e) => setLoggedHours(Number(e.target.value))}
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-xs font-medium text-foreground focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Effort Budget Progress Bar */}
              <div className="rounded-xl border border-border/50 bg-background/60 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Sprint Effort Utilization</span>
                  <span className="font-mono font-bold text-foreground">
                    {loggedHours}h / {estimatedHours}h ({effortPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                  <div
                    style={{ width: `${effortPercentage}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      effortPercentage > 100
                        ? "bg-rose-500"
                        : effortPercentage >= 75
                        ? "bg-gradient-to-r from-amber-500 to-orange-500"
                        : "bg-emerald-500"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Group 4: Portfolio Showcase Switch Card */}
            <div
              onClick={() => setPinned(!pinned)}
              className={cn(
                "cursor-pointer rounded-2xl border p-4 sm:p-5 flex items-center justify-between gap-4 transition-all duration-200 select-none",
                pinned
                  ? "border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent shadow-md shadow-amber-500/5"
                  : "border-border/70 bg-muted/20 hover:border-border hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={cn(
                    "grid size-11 place-items-center rounded-2xl border transition-colors shrink-0",
                    pinned
                      ? "bg-amber-400 text-black border-amber-300 shadow-sm shadow-amber-400/20"
                      : "bg-muted/70 text-muted-foreground border-border/80"
                  )}
                >
                  <Star className={cn("size-5", pinned ? "fill-black" : "")} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground">
                      Feature in Portfolio Showcase
                    </h4>
                    {pinned && (
                      <span className="rounded-full bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wide">
                        Pinned Hero
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pins this project to the top of your workspace and highlights it in executive reviews.
                  </p>
                </div>
              </div>

              {/* Tactile toggle switch */}
              <div
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer",
                  pinned ? "bg-amber-500" : "bg-zinc-700"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    pinned ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: TECH STACK & EXTERNAL LINKS */}
        {/* ============================================================ */}
        {activeTab === "tech" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Tag className="size-3.5 text-amber-400" />
                  <span>Project Tags</span>
                  <span className="text-[10px] text-muted-foreground/70 font-normal lowercase">
                    (cross-entity unified tagging across Notes, Tasks & Projects)
                  </span>
                </label>
                <TagPicker
                  selectedTags={tags}
                  onChange={setTags}
                  placeholder="Select or create tags (e.g. frontend, sprint-1, ai)..."
                />
              </div>

              <div className="pt-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Code2 className="size-3.5 text-amber-400" />
                  <span>Technologies & Frameworks</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border/80 bg-background/90 min-h-12 shadow-inner">
                  {techStack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-mono font-medium text-amber-200"
                    >
                      <span>{tech}</span>
                      <button
                        type="button"
                        onClick={() => removeTechTag(tech)}
                        className="hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTechTag(techInput);
                      }
                    }}
                    placeholder="Type tool & press Enter..."
                    className="flex-1 min-w-[160px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none px-1"
                  />
                </div>

                {/* Suggested Tech Pills */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold mr-1">
                    Suggested Tools:
                  </span>
                  {SUGGESTED_TECH.slice(0, 14).map((tool) => (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => addTechTag(tool)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-[10px] font-mono transition-all cursor-pointer",
                        techStack.includes(tool)
                          ? "border-amber-500/40 bg-amber-500/15 text-amber-300 font-semibold"
                          : "border-border/70 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      + {tool}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 sm:p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border/50">
                Showcase Repositories & Demo URLs
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <Github className="size-3.5 text-zinc-300" />
                    <span>GitHub Repository URL</span>
                  </label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/your-username/repository-name"
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-xs text-foreground focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <ExternalLink className="size-3.5 text-emerald-400" />
                    <span>Live Production Demo URL</span>
                  </label>
                  <input
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://my-project.vercel.app or live web app"
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-xs text-foreground focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <FileCode className="size-3.5 text-cyan-400" />
                    <span>Technical Documentation / Architecture Spec URL</span>
                  </label>
                  <input
                    type="url"
                    value={docsUrl}
                    onChange={(e) => setDocsUrl(e.target.value)}
                    placeholder="https://docs.domain.com or Notion / Loom link"
                    className="w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-xs text-foreground focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: MILESTONES & AI ARCHITECT */}
        {/* ============================================================ */}
        {activeTab === "milestones" && (
          <div className="space-y-6">
            {/* AI Generator Action Banner */}
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 p-5 sm:p-6 shadow-md shadow-amber-500/5 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 place-items-center rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-200">
                      Gemini 3.8 Flash Milestone Architect
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Synthesize 4 progressive delivery phases with checklist deliverables tailored to your tech stack.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isAIGenerating || !title.trim()}
                  onClick={handleAIGenerateMilestones}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold px-4 py-2.5 text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  {isAIGenerating ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Synthesizing Phases...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5 fill-black" />
                      <span>Generate with AI</span>
                    </>
                  )}
                </button>
              </div>

              {aiSuccessMessage && (
                <p className="mt-3 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 border-t border-amber-500/20 pt-2.5">
                  <CheckCircle2 className="size-4 shrink-0" />
                  {aiSuccessMessage}
                </p>
              )}

              {aiError && (
                <p className="mt-3 text-xs font-medium text-destructive flex items-center gap-1.5 border-t border-amber-500/20 pt-2.5">
                  <AlertCircle className="size-4 shrink-0" />
                  {aiError}
                </p>
              )}
            </div>

            {/* Milestone List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Chronological Delivery Milestones ({milestones.length})
                </h4>
                <button
                  type="button"
                  onClick={addEmptyMilestone}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Delivery Phase</span>
                </button>
              </div>

              {milestones.length === 0 ? (
                <div className="rounded-2xl border border-border/80 bg-muted/20 p-8 text-center space-y-3">
                  <p className="text-xs text-muted-foreground">
                    No milestones defined yet. Click "Generate with AI" or add phases manually.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {milestones.map((m, mIdx) => (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-border/70 bg-muted/20 p-5 space-y-3 transition-all hover:border-amber-500/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="grid size-6 place-items-center rounded-lg bg-amber-500/15 text-amber-300 font-mono text-[11px] font-bold border border-amber-500/30">
                            {mIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={m.title}
                            onChange={(e) => updateMilestoneTitle(m.id, e.target.value)}
                            placeholder="Phase title..."
                            className="flex-1 font-semibold text-xs sm:text-sm bg-transparent border-b border-transparent hover:border-border/60 focus:border-amber-500/60 focus:outline-none px-1 text-foreground"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeMilestone(m.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          title="Delete Phase"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={m.description || ""}
                        onChange={(e) => updateMilestoneDescription(m.id, e.target.value)}
                        placeholder="Phase summary / scope..."
                        className="w-full text-xs text-muted-foreground bg-transparent border-b border-transparent hover:border-border/60 focus:border-amber-500/60 focus:outline-none px-1"
                      />

                      {/* Deliverables Checklist */}
                      <div className="space-y-2 pt-2 border-t border-border/40">
                        <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                          <span>Checklist Deliverables ({m.deliverables.length})</span>
                        </div>

                        <div className="space-y-1.5">
                          {m.deliverables.map((del) => (
                            <div
                              key={del.id}
                              className="flex items-center justify-between gap-2 rounded-lg bg-background/60 px-3 py-1.5 border border-border/50 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <Check className="size-3 text-amber-400" />
                                <span className="text-foreground">{del.title}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeDeliverable(m.id, del.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add deliverable input */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="+ Add verifiable acceptance item & press Enter..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const input = e.currentTarget;
                                addDeliverable(m.id, input.value);
                                input.value = "";
                              }
                            }}
                            className="flex-1 rounded-lg border border-border/70 bg-background/80 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500/60 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: ARCHITECTURE SPEC & DETAILED NOTES */}
        {/* ============================================================ */}
        {activeTab === "architecture" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Lightbulb className="size-3.5 text-amber-400" />
                  <span>Architecture Notes & Data Contracts</span>
                </label>

                <div className="flex items-center gap-1 rounded-xl bg-background/80 p-0.5 border border-border/70">
                  <button
                    type="button"
                    onClick={() => setSpecPreviewTab("edit")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
                      specPreviewTab === "edit"
                        ? "bg-card text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Edit Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpecPreviewTab("preview")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
                      specPreviewTab === "preview"
                        ? "bg-card text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Live Preview
                  </button>
                </div>
              </div>

              {specPreviewTab === "edit" ? (
                <textarea
                  rows={12}
                  value={architectureNotes}
                  onChange={(e) => setArchitectureNotes(e.target.value)}
                  placeholder="Document high-level data contracts, ER schema layouts, caching strategies, and engineering tradeoffs..."
                  className="w-full font-mono text-xs rounded-xl border border-border/80 bg-background/90 p-4 text-foreground focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none shadow-inner leading-relaxed"
                />
              ) : (
                <div className="rounded-xl border border-border/70 bg-background/60 p-5 text-xs text-foreground/90 max-w-none min-h-[220px] overflow-y-auto leading-relaxed shadow-inner">
                  {architectureNotes ? (
                    <div className="whitespace-pre-wrap font-sans">{architectureNotes}</div>
                  ) : (
                    <p className="text-muted-foreground italic">No architecture notes written yet.</p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 sm:p-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border/50">
                Detailed Project Description
              </h4>
              <textarea
                rows={6}
                value={descriptionMarkdown}
                onChange={(e) => setDescriptionMarkdown(e.target.value)}
                placeholder="Comprehensive project background and deliverables..."
                className="w-full font-mono text-xs rounded-xl border border-border/80 bg-background/90 p-4 text-foreground focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none shadow-inner leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-border/50">
          <p className="text-xs text-muted-foreground order-2 sm:order-1 flex items-center gap-1.5">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-muted border border-border text-foreground shadow-xs">
              Esc
            </kbd>
            <span>to cancel or</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-muted border border-border text-foreground shadow-xs">
              Cmd+Enter
            </kbd>
            <span>to save.</span>
          </p>

          <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-border/80 bg-background/80 hover:bg-muted/80 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!title.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold px-5 py-2 text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="size-3.5 stroke-[2.5]" />
              <span>Update Project</span>
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
