import React, { useState, useEffect } from "react";
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
  Eye,
  Edit3,
  Loader2,
  ExternalLink,
  Github,
  AlertCircle,
  Lightbulb,
  Tag,
  X,
  Save,
  Undo2,
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

const TRACKS: ProjectTrack[] = [
  "Python & Analytics",
  "SQL & Databases",
  "AI & Cloud Architecture",
  "Power BI & BI",
  "Finance & Markets",
  "Fullstack & Systems",
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
  }, [title, tagline, track, status, priority, startDate, targetDate, estimatedHours, loggedHours, pinned, techStack, repoUrl, demoUrl, docsUrl, milestones, architectureNotes, descriptionMarkdown, tags]);

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
      id: `m-${Date.now()}`,
      title: `Phase ${milestones.length + 1}: Implementation Stage`,
      status: "pending",
      dueDate: targetDate,
      deliverables: [{ id: `d-${Date.now()}`, title: "Deliverable item 1", completed: false }],
    };
    setMilestones((prev) => [...prev, newM]);
  };

  const updateMilestoneTitle = (mId: string, newTitle: string) => {
    setMilestones((prev) => prev.map((m) => (m.id === mId ? { ...m, title: newTitle } : m)));
  };

  const updateMilestoneDueDate = (mId: string, newDueDate: string) => {
    setMilestones((prev) => prev.map((m) => (m.id === mId ? { ...m, dueDate: newDueDate } : m)));
  };

  const deleteMilestoneItem = (mId: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== mId));
  };

  const addDeliverableToMilestone = (mId: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== mId) return m;
        return {
          ...m,
          deliverables: [
            ...m.deliverables,
            { id: `d-${Date.now()}`, title: "New acceptance deliverable", completed: false },
          ],
        };
      })
    );
  };

  const updateDeliverableText = (mId: string, dId: string, text: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== mId) return m;
        return {
          ...m,
          deliverables: m.deliverables.map((d) => (d.id === dId ? { ...d, title: text } : d)),
        };
      })
    );
  };

  const toggleDeliverableCompleted = (mId: string, dId: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== mId) return m;
        return {
          ...m,
          deliverables: m.deliverables.map((d) =>
            d.id === dId ? { ...d, completed: !d.completed } : d
          ),
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
      transition={{ duration: 0.2 }}
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6", className)}
    >
      {/* Top Studio Header Banner */}
      <div className="rounded-2xl border border-border/80 bg-card/70 p-6 sm:p-7 backdrop-blur-md shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <FolderKanban className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Edit Portfolio Project
                </h1>
                <span className="hidden md:inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-mono font-medium text-primary uppercase">
                  Studio Edit Mode
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Define engineering deliverables, milestones, tech stack, and system architecture.
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shadow-xs"
              title="Discard changes and return (Esc)"
            >
              <Undo2 className="size-3.5" />
              <span>Cancel</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!title.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
              title="Save project changes (Cmd+Enter)"
            >
              <Save className="size-3.5" />
              <span>Update Project</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-t border-border/50 mt-6 pt-3 overflow-x-auto no-scrollbar scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0",
              activeTab === "general"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <FolderKanban className="size-3.5" />
            <span>General Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tech")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0",
              activeTab === "tech"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <FileCode className="size-3.5" />
            <span>Tech Stack & Links</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("milestones")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0",
              activeTab === "milestones"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Layers className="size-3.5" />
            <span>Milestones ({milestones.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("architecture")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0",
              activeTab === "architecture"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Lightbulb className="size-3.5" />
            <span>Architecture Spec</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content Card */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-md shadow-sm space-y-6">
        {/* TAB 1: GENERAL DETAILS */}
        {activeTab === "general" && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Project Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Automated Stock Market Data Pipeline & Lakehouse"
                className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Tagline / One-Line Objective
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. End-to-end streaming financial data lakehouse with DuckDB & Streamlit"
                className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Curriculum Track
                </label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value as ProjectTrack)}
                  className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none shadow-xs"
                >
                  {TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Status Stage
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none shadow-xs"
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Under Review</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                  className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none shadow-xs"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  <span>Start Date</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  <span>Target Delivery Date</span>
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none shadow-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  <span>Estimated Hours</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  <span>Logged Hours (Actual)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={loggedHours}
                  onChange={(e) => setLoggedHours(Number(e.target.value))}
                  className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none shadow-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <input
                type="checkbox"
                id="edit-pinned-checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary cursor-pointer size-4"
              />
              <label htmlFor="edit-pinned-checkbox" className="text-xs text-foreground font-medium cursor-pointer">
                Pin to top of Projects workspace & portfolio showcase
              </label>
            </div>
          </div>
        )}

        {/* TAB 2: TECH STACK & EXTERNAL LINKS */}
        {activeTab === "tech" && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Tag className="size-3.5 text-primary" />
                <span>Project Tags</span>
                <span className="text-[10px] text-muted-foreground/70 font-normal lowercase">
                  (unified cross-workspace with notes & tasks)
                </span>
              </label>
              <TagPicker
                selectedTags={tags}
                onChange={setTags}
                placeholder="Select or create tags (e.g. frontend, sprint-1, ai)..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Technologies & Frameworks
              </label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border/80 bg-background min-h-12 shadow-xs">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/70 px-2.5 py-1 text-xs font-mono font-medium text-foreground"
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
                  className="flex-1 min-w-[160px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none px-1"
                />
              </div>

              {/* Suggested Tech Pills */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold mr-1">
                  Suggested Tools:
                </span>
                {SUGGESTED_TECH.slice(0, 14).map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => addTechTag(tool)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-[10px] font-mono transition-colors cursor-pointer",
                      techStack.includes(tool)
                        ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                        : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    + {tool}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-3 border-t border-border/50">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Project Showcase & Repository Links
              </h4>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Github className="size-3.5" />
                  <span>GitHub Repository URL</span>
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/your-username/repository-name"
                  className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <ExternalLink className="size-3.5 text-emerald-400" />
                  <span>Live Production Demo URL</span>
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://my-project.vercel.app or https://analytics.domain.com"
                  className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <FileCode className="size-3.5 text-cyan-400" />
                  <span>Technical Documentation / Architecture Spec URL</span>
                </label>
                <input
                  type="url"
                  value={docsUrl}
                  onChange={(e) => setDocsUrl(e.target.value)}
                  placeholder="https://docs.domain.com or Notion/Loom link"
                  className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none shadow-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MILESTONES & AI ARCHITECT */}
        {activeTab === "milestones" && (
          <div className="space-y-6">
            {/* AI Generator Action Banner */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="size-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-amber-300">
                      Gemini 3.8 Flash Milestone Architect
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Automatically generate 4-phase delivery roadmaps with verifiable checklist deliverables tailored to your tech stack.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isAIGenerating || !title.trim()}
                  onClick={handleAIGenerateMilestones}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
                >
                  {isAIGenerating ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Synthesizing Phases...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      <span>Generate with AI</span>
                    </>
                  )}
                </button>
              </div>

              {aiSuccessMessage && (
                <p className="mt-3 text-xs font-medium text-emerald-400 flex items-center gap-1.5 border-t border-amber-500/20 pt-2.5">
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
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Chronological Delivery Milestones ({milestones.length})
                </h4>
                <button
                  type="button"
                  onClick={addEmptyMilestone}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-muted hover:border-border transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Add Delivery Phase</span>
                </button>
              </div>

              {milestones.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
                  No milestones added yet. Click "+ Add Delivery Phase" or use "Generate with AI" above.
                </div>
              ) : (
                milestones.map((m, idx) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-border/70 bg-background/50 p-4 space-y-3.5 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="size-6 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-mono font-bold grid place-items-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => updateMilestoneTitle(m.id, e.target.value)}
                          placeholder="Milestone title..."
                          className="flex-1 font-semibold text-xs sm:text-sm text-foreground bg-transparent border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none py-1"
                        />
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="size-3.5" />
                          <input
                            type="date"
                            value={m.dueDate}
                            onChange={(e) => updateMilestoneDueDate(m.id, e.target.value)}
                            className="text-xs rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-muted-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteMilestoneItem(m.id)}
                          className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                          title="Delete phase"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Deliverables Checklist */}
                    <div className="pl-3 sm:pl-8 space-y-2 border-l-2 border-border/60 ml-2">
                      <p className="text-[11px] font-mono uppercase text-muted-foreground/80 font-medium">
                        Acceptance Deliverables ({m.deliverables.length})
                      </p>
                      {m.deliverables.map((d) => (
                        <div key={d.id} className="flex items-center gap-2 group">
                          <button
                            type="button"
                            onClick={() => toggleDeliverableCompleted(m.id, d.id)}
                            className={cn(
                              "size-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0",
                              d.completed
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                : "border-border/80 hover:border-border text-transparent"
                            )}
                            title={d.completed ? "Mark incomplete" : "Mark completed"}
                          >
                            <CheckCircle2 className="size-3 fill-current" />
                          </button>

                          <input
                            type="text"
                            value={d.title}
                            onChange={(e) => updateDeliverableText(m.id, d.id, e.target.value)}
                            placeholder="Acceptance deliverable..."
                            className={cn(
                              "flex-1 text-xs text-foreground bg-transparent border-b border-transparent hover:border-border/40 focus:border-primary focus:outline-none py-0.5",
                              d.completed && "line-through text-muted-foreground"
                            )}
                          />

                          <button
                            type="button"
                            onClick={() => removeDeliverable(m.id, d.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity cursor-pointer p-1"
                            title="Remove deliverable"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addDeliverableToMilestone(m.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer pt-1"
                      >
                        <Plus className="size-3" />
                        <span>Add Deliverable Checklist Item</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: ARCHITECTURE SPEC & MARKDOWN */}
        {activeTab === "architecture" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    System Architecture & Engineering Decisions
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Document system trade-offs, schemas, microservices, and interview talking points.
                  </p>
                </div>

                <div className="inline-flex items-center rounded-lg border border-border/80 bg-muted/40 p-1 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setSpecPreviewTab("edit")}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                      specPreviewTab === "edit"
                        ? "bg-card text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Edit3 className="size-3.5" />
                    <span>Edit Markdown</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpecPreviewTab("preview")}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                      specPreviewTab === "preview"
                        ? "bg-card text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Eye className="size-3.5" />
                    <span>Live Preview</span>
                  </button>
                </div>
              </div>

              {specPreviewTab === "edit" ? (
                <textarea
                  rows={12}
                  value={architectureNotes}
                  onChange={(e) => setArchitectureNotes(e.target.value)}
                  placeholder="Document high-level data contracts, ER schema layouts, caching strategies, and engineering tradeoffs..."
                  className="w-full font-mono text-xs rounded-xl border border-border/80 bg-background p-4 text-foreground focus:border-primary focus:outline-none shadow-xs leading-relaxed"
                />
              ) : (
                <div className="rounded-xl border border-border/70 bg-background/50 p-5 text-xs text-foreground/90 max-w-none min-h-[220px] overflow-y-auto leading-relaxed shadow-xs">
                  {architectureNotes ? (
                    <div className="whitespace-pre-wrap font-sans">{architectureNotes}</div>
                  ) : (
                    <p className="text-muted-foreground italic">No architecture notes written yet.</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-border/50">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Detailed Project Description
              </h4>
              <textarea
                rows={6}
                value={descriptionMarkdown}
                onChange={(e) => setDescriptionMarkdown(e.target.value)}
                placeholder="Comprehensive project background and deliverables..."
                className="w-full font-mono text-xs rounded-xl border border-border/80 bg-background p-4 text-foreground focus:border-primary focus:outline-none shadow-xs leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground order-2 sm:order-1">
            Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-muted border border-border/70">Esc</kbd> to cancel or <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-muted border border-border/70">Cmd+Enter</kbd> to save.
          </p>

          <div className="flex items-center gap-2.5 order-1 sm:order-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-border/80 bg-background/80 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shadow-xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!title.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <FolderKanban className="size-3.5" />
              <span>Update Project</span>
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
