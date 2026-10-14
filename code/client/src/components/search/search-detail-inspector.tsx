import { useState } from "react";
import {
  Tag as TagIcon,
  Github,
  Globe,
  Copy,
  Check,
  Pin,
  CheckCircle2,
  ArrowUpRight,
  X,
  Code2,
  Compass,
} from "lucide-react";
import { SearchDocument } from "./search-types";
import { WorkflowTask } from "@/components/tasks/task-types";
import { Project } from "@/components/projects/project-types";
import { KnowledgeNote } from "@/components/notes/note-types";
import { Tag } from "@/components/tags/tag-types";
import { cn } from "@/lib/utils";

interface SearchDetailInspectorProps {
  document: SearchDocument | null;
  onClose?: () => void;
  onOpenInView: (document: SearchDocument) => void;
  onToggleTaskComplete?: (taskId: string) => void;
  onToggleNotePin?: (noteId: string) => void;
  onFilterByTag?: (tagName: string) => void;
  onOpenTagManager?: () => void;
}

export function SearchDetailInspector({
  document: doc,
  onClose,
  onOpenInView,
  onToggleTaskComplete,
  onToggleNotePin,
  onFilterByTag,
  onOpenTagManager,
}: SearchDetailInspectorProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!doc) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground border border-border/60 rounded-2xl bg-card/30">
        <Compass className="size-10 text-muted-foreground/40 mb-3 animate-pulse" />
        <h4 className="text-sm font-semibold text-foreground">No item selected</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
          Click any result card from the list to preview details and quick actions.
        </p>
      </div>
    );
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/80 bg-card/80 shadow-md backdrop-blur-md overflow-hidden">
      {/* Top Inspector Header */}
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold capitalize tracking-wider text-muted-foreground">
            {doc.type} Inspector
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenInView(doc)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:opacity-90 transition-opacity"
          >
            <span>Open in {doc.type === "task" ? "Tasks" : doc.type === "project" ? "Projects" : doc.type === "note" ? "Notes" : "Workspace"}</span>
            <ArrowUpRight className="size-3.5" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close inspector"
              className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Title and Subtitle */}
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-foreground leading-snug">
            {doc.title}
          </h2>
          {doc.subtitle && (
            <p className="text-xs font-medium text-muted-foreground">
              {doc.subtitle}
            </p>
          )}
        </div>

        {/* ===================== TASK INSPECTION ===================== */}
        {doc.type === "task" && (
          <div className="space-y-4">
            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <span className="text-[10px] text-muted-foreground font-medium block mb-1">
                  Status
                </span>
                <span className="font-semibold text-foreground capitalize">
                  {doc.status?.replace("_", " ") || "In Progress"}
                </span>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <span className="text-[10px] text-muted-foreground font-medium block mb-1">
                  Priority
                </span>
                <span className="font-semibold text-foreground capitalize">
                  {doc.priority || "Normal"}
                </span>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <span className="text-[10px] text-muted-foreground font-medium block mb-1">
                  Stage
                </span>
                <span className="font-semibold text-foreground capitalize">
                  {doc.meta?.stage || "In Progress"}
                </span>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <span className="text-[10px] text-muted-foreground font-medium block mb-1">
                  Deadline
                </span>
                <span className="font-semibold text-foreground font-mono">
                  {doc.date ? new Date(doc.date).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Scheduled"}
                </span>
              </div>
            </div>

            {/* Notes Section */}
            {(doc.raw as WorkflowTask).notes && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Task Notes & Specifications
                </span>
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs text-foreground font-mono whitespace-pre-wrap leading-relaxed">
                  {(doc.raw as WorkflowTask).notes}
                </div>
              </div>
            )}

            {/* Quick Task Actions */}
            {onToggleTaskComplete && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onToggleTaskComplete(doc.id)}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-medium border transition-colors",
                    doc.status === "completed"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : "border-border/80 bg-background hover:border-primary hover:text-primary text-foreground"
                  )}
                >
                  <CheckCircle2 className="size-4" />
                  <span>{doc.status === "completed" ? "Mark as Incomplete" : "Mark as Completed"}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===================== PROJECT INSPECTION ===================== */}
        {doc.type === "project" && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Sprint Completion</span>
                <span className="font-mono font-bold text-foreground">{doc.meta?.progress || 0}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${doc.meta?.progress || 0}%` }}
                />
              </div>
            </div>

            {/* Project Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <span className="text-[10px] text-muted-foreground font-medium block mb-1">Track</span>
                <span className="font-semibold text-foreground truncate block">{doc.category}</span>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <span className="text-[10px] text-muted-foreground font-medium block mb-1">Status</span>
                <span className="font-semibold text-foreground capitalize">{doc.status?.replace("_", " ")}</span>
              </div>
            </div>

            {/* Description */}
            {(doc.raw as Project).descriptionMarkdown && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Overview</span>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {(doc.raw as Project).descriptionMarkdown}
                </p>
              </div>
            )}

            {/* Tech Stack */}
            {doc.meta?.techStack && doc.meta.techStack.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tech Stack</span>
                <div className="flex flex-wrap gap-1.5">
                  {doc.meta.techStack.map((tech: string) => (
                    <span
                      key={tech}
                      className="rounded-lg border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-mono text-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones Preview */}
            {(doc.raw as Project).milestones && (doc.raw as Project).milestones.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Milestones ({(doc.raw as Project).milestones.length})
                </span>
                <div className="space-y-1 rounded-xl border border-border/60 bg-muted/20 p-2.5">
                  {(doc.raw as Project).milestones.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-b-0">
                      <span className={cn("text-foreground", m.status === "completed" && "line-through text-muted-foreground")}>
                        {m.title}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-medium",
                        m.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
                      )}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* External Links */}
            <div className="flex flex-wrap gap-2 pt-1">
              {(doc.raw as Project).repoUrl && (
                <a
                  href={(doc.raw as Project).repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                >
                  <Github className="size-3.5" />
                  <span>Repository</span>
                </a>
              )}
              {(doc.raw as Project).demoUrl && (
                <a
                  href={(doc.raw as Project).demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                >
                  <Globe className="size-3.5" />
                  <span>Live Demo</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* ===================== NOTE INSPECTION ===================== */}
        {doc.type === "note" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                {doc.category}
              </span>
              {onToggleNotePin && (
                <button
                  type="button"
                  onClick={() => onToggleNotePin(doc.id)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition-colors",
                    doc.pinned
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                      : "border-border/60 hover:border-amber-400 hover:text-amber-400 text-muted-foreground"
                  )}
                >
                  <Pin className="size-3" />
                  <span>{doc.pinned ? "Pinned" : "Pin Note"}</span>
                </button>
              )}
            </div>

            {/* Note Markdown Content */}
            {(doc.raw as KnowledgeNote).contentMarkdown && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Content</span>
                <div className="rounded-xl border border-border/70 bg-card p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {(doc.raw as KnowledgeNote).contentMarkdown}
                </div>
              </div>
            )}

            {/* Code Snippet Box */}
            {(doc.raw as KnowledgeNote).codeSnippet && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                    <Code2 className="size-3 text-emerald-400" />
                    {(doc.raw as KnowledgeNote).language || "Snippet"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy((doc.raw as KnowledgeNote).codeSnippet || "")}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedCode ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="rounded-xl border border-border/80 bg-zinc-950 p-3 text-xs font-mono text-zinc-100 overflow-x-auto leading-relaxed shadow-inner">
                  <pre>{(doc.raw as KnowledgeNote).codeSnippet}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAG INSPECTION ===================== */}
        {doc.type === "tag" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TagIcon className="size-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  {(doc.raw as Tag).name}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {(doc.raw as Tag).description || "Universal Cross-Entity Tag. Assigned across projects, tasks, and notes."}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {onFilterByTag && (
                <button
                  type="button"
                  onClick={() => onFilterByTag((doc.raw as Tag).name)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/20 py-2 px-3 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <span>Filter Search by #{(doc.raw as Tag).name}</span>
                </button>
              )}
              {onOpenTagManager && (
                <button
                  type="button"
                  onClick={onOpenTagManager}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-background py-2 px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <span>Manage Tags in Modal</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tags Section for Task / Project / Note */}
        {doc.tags && doc.tags.length > 0 && doc.type !== "tag" && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Associated Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {doc.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onFilterByTag && onFilterByTag(tag)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
