import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
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
} from "lucide-react";
import {
  Project,
  ProjectTrack,
  ProjectPriority,
  ProjectStatus,
  ProjectMilestone,
} from "./project-types";
import { generateProjectMilestones } from "@/lib/ai-service";
import { cn } from "@/lib/utils";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    projectData: Omit<Project, "id" | "createdAt" | "updatedAt" | "progress"> & {
      id?: string;
      progress?: number;
    }
  ) => void;
  initialProject?: Project | null;
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

export function ProjectModal({
  isOpen,
  onClose,
  onSave,
  initialProject,
}: ProjectModalProps) {
  const isEditing = Boolean(initialProject);

  const [activeTab, setActiveTab] = useState<"general" | "tech" | "milestones" | "architecture">("general");

  // Form states
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [track, setTrack] = useState<ProjectTrack>("Python & Analytics");
  const [status, setStatus] = useState<ProjectStatus>("in_progress");
  const [priority, setPriority] = useState<ProjectPriority>("high");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [estimatedHours, setEstimatedHours] = useState(40);
  const [loggedHours, setLoggedHours] = useState(0);
  const [pinned, setPinned] = useState(false);

  // Tech stack & links
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [docsUrl, setDocsUrl] = useState("");

  // Milestones & Architecture
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [architectureNotes, setArchitectureNotes] = useState("");
  const [descriptionMarkdown, setDescriptionMarkdown] = useState("");
  const [specPreviewTab, setSpecPreviewTab] = useState<"edit" | "preview">("edit");

  // AI Generation State
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialProject) {
      setTitle(initialProject.title);
      setTagline(initialProject.tagline);
      setTrack(initialProject.track);
      setStatus(initialProject.status);
      setPriority(initialProject.priority);
      setStartDate(initialProject.startDate);
      setTargetDate(initialProject.targetDate);
      setEstimatedHours(initialProject.estimatedHours);
      setLoggedHours(initialProject.loggedHours);
      setPinned(initialProject.pinned);
      setTechStack([...initialProject.techStack]);
      setRepoUrl(initialProject.repoUrl || "");
      setDemoUrl(initialProject.demoUrl || "");
      setDocsUrl(initialProject.docsUrl || "");
      setMilestones(JSON.parse(JSON.stringify(initialProject.milestones)));
      setArchitectureNotes(initialProject.architectureNotes || "");
      setDescriptionMarkdown(initialProject.descriptionMarkdown);
    } else {
      // Default reset for new project
      setTitle("");
      setTagline("");
      setTrack("Python & Analytics");
      setStatus("in_progress");
      setPriority("high");
      setStartDate(new Date().toISOString().split("T")[0]);
      setTargetDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
      setEstimatedHours(40);
      setLoggedHours(0);
      setPinned(false);
      setTechStack(["Python", "PostgreSQL"]);
      setRepoUrl("");
      setDemoUrl("");
      setDocsUrl("");
      setMilestones([
        {
          id: `m-${Date.now()}-1`,
          title: "Phase 1: Architecture, Schemas & Data Modeling",
          description: "Establish foundational data models, repositories, and development environment.",
          status: "in_progress",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          deliverables: [
            { id: `d-${Date.now()}-1`, title: "Define schema contracts and API specifications", completed: false },
            { id: `d-${Date.now()}-2`, title: "Set up version control and CI/CD linting", completed: false },
          ],
        },
        {
          id: `m-${Date.now()}-2`,
          title: "Phase 2: Core Processing & Engine Implementation",
          description: "Develop core business logic, transformation pipelines, and unit tests.",
          status: "pending",
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          deliverables: [
            { id: `d-${Date.now()}-3`, title: "Implement core business algorithms", completed: false },
            { id: `d-${Date.now()}-4`, title: "Write automated integration tests", completed: false },
          ],
        },
      ]);
      setArchitectureNotes("");
      setDescriptionMarkdown("### Project Overview\nEnter detailed project description here...");
    }
    setAiError(null);
    setAiSuccessMessage(null);
    setActiveTab("general");
  }, [initialProject, isOpen]);

  // Handle tech stack tags
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    onSave({
      ...(initialProject ? { id: initialProject.id } : {}),
      title: title.trim(),
      slug: slug || "portfolio-project",
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
      linkedTaskIds: initialProject?.linkedTaskIds || [],
      linkedNoteIds: initialProject?.linkedNoteIds || [],
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <FolderKanban className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {isEditing ? "Edit Portfolio Project" : "New Portfolio Project"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Define engineering deliverables, milestones, tech stack, and system architecture.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-border/50 px-6 pt-2 bg-muted/10 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer",
                activeTab === "general"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <FolderKanban className="size-3.5" />
              <span>General Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tech")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer",
                activeTab === "tech"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <FileCode className="size-3.5" />
              <span>Tech Stack & Links</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("milestones")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer",
                activeTab === "milestones"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="size-3.5" />
              <span>Milestones ({milestones.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("architecture")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer",
                activeTab === "architecture"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Lightbulb className="size-3.5" />
              <span>Architecture Spec</span>
            </button>
          </div>

          {/* Modal Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* TAB 1: GENERAL DETAILS */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Project Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Automated Stock Market Data Pipeline & Lakehouse"
                    className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Tagline / One-Line Objective
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. End-to-end streaming financial data lakehouse with DuckDB & Streamlit"
                    className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Curriculum Track
                    </label>
                    <select
                      value={track}
                      onChange={(e) => setTrack(e.target.value as ProjectTrack)}
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      {TRACKS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Status Stage
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="planning">Planning</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Under Review</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Priority Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="size-3" />
                      <span>Start Date</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="size-3" />
                      <span>Target Delivery Date</span>
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>Estimated Hours</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(Number(e.target.value))}
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>Logged Hours (Actual)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={loggedHours}
                      onChange={(e) => setLoggedHours(Number(e.target.value))}
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pinned-checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="pinned-checkbox" className="text-xs text-foreground font-medium cursor-pointer">
                    Pin to top of Projects workspace & portfolio showcase
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: TECH STACK & EXTERNAL LINKS */}
            {activeTab === "tech" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Technologies & Frameworks
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-border/80 bg-background min-h-11">
                    {techStack.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/60 px-2 py-0.5 text-xs font-mono font-medium text-foreground"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeTechTag(tech)}
                          className="hover:text-destructive text-muted-foreground cursor-pointer"
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
                      className="flex-1 min-w-[140px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none px-1"
                    />
                  </div>

                  {/* Suggested Tech Pills */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold mr-1">
                      Suggested:
                    </span>
                    {SUGGESTED_TECH.slice(0, 10).map((tool) => (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => addTechTag(tool)}
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] font-mono transition-colors cursor-pointer",
                          techStack.includes(tool)
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        + {tool}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Project Showcase Links
                  </h4>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Github className="size-3" />
                      <span>GitHub Repository URL</span>
                    </label>
                    <input
                      type="url"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/your-username/repository-name"
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <ExternalLink className="size-3" />
                      <span>Live Production Demo URL</span>
                    </label>
                    <input
                      type="url"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      placeholder="https://my-project.vercel.app or https://analytics.domain.com"
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <FileCode className="size-3" />
                      <span>Technical Documentation / Architecture Spec URL</span>
                    </label>
                    <input
                      type="url"
                      value={docsUrl}
                      onChange={(e) => setDocsUrl(e.target.value)}
                      placeholder="https://docs.domain.com or Notion/Loom link"
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MILESTONES & AI ARCHITECT */}
            {activeTab === "milestones" && (
              <div className="space-y-4">
                {/* AI Generator Action Banner */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="size-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-amber-300">
                          Gemini 3.8 Flash Milestone Architect
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Automatically generate 4-phase delivery roadmaps with verifiable checklist deliverables.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAIGenerating || !title.trim()}
                      onClick={handleAIGenerateMilestones}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {isAIGenerating ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Generating...</span>
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
                    <p className="mt-2 text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5" />
                      {aiSuccessMessage}
                    </p>
                  )}

                  {aiError && (
                    <p className="mt-2 text-xs font-medium text-destructive flex items-center gap-1.5">
                      <AlertCircle className="size-3.5" />
                      {aiError}
                    </p>
                  )}
                </div>

                {/* Milestone List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Chronological Delivery Milestones ({milestones.length})
                    </h4>
                    <button
                      type="button"
                      onClick={addEmptyMilestone}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>Add Phase</span>
                    </button>
                  </div>

                  {milestones.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
                      No milestones added yet. Click "+ Add Phase" or use "Generate with AI" above.
                    </div>
                  ) : (
                    milestones.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl border border-border/70 bg-background/50 p-3.5 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={m.title}
                            onChange={(e) => updateMilestoneTitle(m.id, e.target.value)}
                            placeholder="Milestone title..."
                            className="flex-1 font-semibold text-xs text-foreground bg-transparent border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none py-0.5"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={m.dueDate}
                              onChange={(e) => updateMilestoneDueDate(m.id, e.target.value)}
                              className="text-[11px] rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-muted-foreground"
                            />
                            <button
                              type="button"
                              onClick={() => deleteMilestoneItem(m.id)}
                              className="text-muted-foreground hover:text-destructive cursor-pointer"
                              title="Delete phase"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Deliverables Checklist */}
                        <div className="pl-2 space-y-1.5 border-l-2 border-border/50">
                          {m.deliverables.map((d) => (
                            <div key={d.id} className="flex items-center gap-2">
                              <span className="size-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                              <input
                                type="text"
                                value={d.title}
                                onChange={(e) => updateDeliverableText(m.id, d.id, e.target.value)}
                                placeholder="Acceptance deliverable..."
                                className="flex-1 text-[11px] text-foreground bg-transparent border-b border-transparent hover:border-border/40 focus:border-primary focus:outline-none py-0.5"
                              />
                              <button
                                type="button"
                                onClick={() => removeDeliverable(m.id, d.id)}
                                className="text-muted-foreground/50 hover:text-destructive cursor-pointer"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addDeliverableToMilestone(m.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-primary/80 hover:text-primary cursor-pointer pt-1"
                          >
                            <Plus className="size-3" />
                            <span>Add deliverable</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: ARCHITECTURE SPEC & NOTES */}
            {activeTab === "architecture" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-muted-foreground">
                    System Architecture & Engineering Decisions
                  </label>
                  <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5">
                    <button
                      type="button"
                      onClick={() => setSpecPreviewTab("edit")}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                        specPreviewTab === "edit"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Edit3 className="size-3" />
                      <span>Edit Markdown</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecPreviewTab("preview")}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                        specPreviewTab === "preview"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Eye className="size-3" />
                      <span>Live Preview</span>
                    </button>
                  </div>
                </div>

                {specPreviewTab === "edit" ? (
                  <textarea
                    rows={10}
                    value={architectureNotes}
                    onChange={(e) => setArchitectureNotes(e.target.value)}
                    placeholder="Document high-level data contracts, ER schema layouts, caching strategies, and engineering tradeoffs..."
                    className="w-full font-mono text-xs rounded-xl border border-border/80 bg-background p-3 text-foreground focus:border-primary focus:outline-none"
                  />
                ) : (
                  <div className="rounded-xl border border-border/70 bg-background/50 p-4 text-xs prose prose-invert max-w-none min-h-[200px] overflow-y-auto">
                    {architectureNotes ? (
                      <div className="whitespace-pre-wrap">{architectureNotes}</div>
                    ) : (
                      <p className="text-muted-foreground italic">No architecture notes written yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border/80 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!title.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                <FolderKanban className="size-3.5" />
                <span>{isEditing ? "Update Project" : "Create Project"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
