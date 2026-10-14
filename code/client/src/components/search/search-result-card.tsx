import React from "react";
import {
  ListTodo,
  FolderKanban,
  NotebookTabs,
  Tag as TagIcon,
  Zap,
  Pin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowUpRight,
  Code2,
} from "lucide-react";
import { SearchResultItem, SearchHighlightChunk } from "./search-types";
import { cn } from "@/lib/utils";

interface SearchResultCardProps {
  item: SearchResultItem;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onToggleTaskComplete?: (taskId: string) => void;
  onToggleNotePin?: (noteId: string) => void;
}

const TYPE_CONFIG = {
  task: {
    label: "Task",
    icon: ListTodo,
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  project: {
    label: "Project",
    icon: FolderKanban,
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  note: {
    label: "Note",
    icon: NotebookTabs,
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  tag: {
    label: "Tag",
    icon: TagIcon,
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  action: {
    label: "Action",
    icon: Zap,
    badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
};

const PRIORITY_BADGES: Record<string, { label: string; class: string; icon?: React.ComponentType<{ className?: string }> }> = {
  urgent: {
    label: "Urgent",
    class: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    icon: Flame,
  },
  high: {
    label: "High",
    class: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: AlertCircle,
  },
  medium: {
    label: "Medium",
    class: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  low: {
    label: "Low",
    class: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  },
};

const STATUS_BADGES: Record<string, { label: string; class: string }> = {
  in_progress: {
    label: "In Progress",
    class: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  completed: {
    label: "Completed",
    class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  blocked: {
    label: "Blocked",
    class: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  planning: {
    label: "Planning",
    class: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  review: {
    label: "Review",
    class: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
};

function renderHighlightedText(chunks: SearchHighlightChunk[]) {
  if (!chunks || chunks.length === 0) return null;
  return chunks.map((chunk, idx) =>
    chunk.isMatch ? (
      <mark
        key={idx}
        className="bg-amber-400/25 text-amber-600 dark:text-amber-300 font-semibold px-0.5 rounded not-italic"
      >
        {chunk.text}
      </mark>
    ) : (
      <span key={idx}>{chunk.text}</span>
    )
  );
}

export function SearchResultCard({
  item,
  isSelected,
  onSelect,
  onOpen,
  onToggleTaskComplete,
  onToggleNotePin,
}: SearchResultCardProps) {
  const { document: doc, titleHighlights, snippet, snippetHighlights } = item;
  const typeCfg = TYPE_CONFIG[doc.type] || TYPE_CONFIG.action;
  const TypeIcon = typeCfg.icon;

  const priorityCfg = doc.priority ? PRIORITY_BADGES[doc.priority.toLowerCase()] : null;
  const statusCfg = doc.status ? STATUS_BADGES[doc.status.toLowerCase()] : null;
  const isTaskCompleted = doc.type === "task" && doc.status === "completed";

  return (
    <div
      onClick={onSelect}
      onDoubleClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      className={cn(
        "group relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all duration-150 cursor-pointer select-none outline-none",
        isSelected
          ? "border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary/40 dark:bg-primary/10"
          : "border-border/70 bg-card/70 hover:border-border hover:bg-card/90 hover:shadow-xs"
      )}
    >
      {/* Top Meta Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Entity Type Badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide",
              typeCfg.badgeClass
            )}
          >
            <TypeIcon className="size-3" />
            <span>{typeCfg.label}</span>
          </span>

          {/* Subtitle / Category */}
          {doc.subtitle && (
            <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
              {doc.subtitle}
            </span>
          )}

          {/* Status Badge */}
          {statusCfg && (
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                statusCfg.class
              )}
            >
              {statusCfg.label}
            </span>
          )}

          {/* Priority Badge */}
          {priorityCfg && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                priorityCfg.class
              )}
            >
              {priorityCfg.icon && <priorityCfg.icon className="size-2.5" />}
              {priorityCfg.label}
            </span>
          )}

          {/* Code badge for notes */}
          {doc.type === "note" && doc.meta?.hasCode && (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
              <Code2 className="size-2.5" />
              {doc.meta.language || "Code"}
            </span>
          )}

          {/* Pinned Indicator */}
          {doc.pinned && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-500">
              <Pin className="size-2.5 fill-amber-500" />
              Pinned
            </span>
          )}
        </div>

        {/* Quick Card Action */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {doc.type === "task" && onToggleTaskComplete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleTaskComplete(doc.id);
              }}
              title={isTaskCompleted ? "Mark incomplete" : "Mark completed"}
              className={cn(
                "grid size-6 place-items-center rounded-lg border transition-colors",
                isTaskCompleted
                  ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  : "border-border/70 hover:border-primary hover:text-primary text-muted-foreground"
              )}
            >
              <CheckCircle2 className="size-3.5" />
            </button>
          )}

          {doc.type === "note" && onToggleNotePin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleNotePin(doc.id);
              }}
              title={doc.pinned ? "Unpin note" : "Pin note"}
              className={cn(
                "grid size-6 place-items-center rounded-lg border transition-colors",
                doc.pinned
                  ? "border-amber-500/40 bg-amber-500/20 text-amber-400"
                  : "border-border/70 hover:border-amber-400 hover:text-amber-400 text-muted-foreground"
              )}
            >
              <Pin className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            title="Open item"
            className="grid size-6 place-items-center rounded-lg border border-border/70 text-muted-foreground hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <ArrowUpRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3
        className={cn(
          "text-sm font-semibold leading-snug transition-colors line-clamp-1",
          isTaskCompleted
            ? "line-through text-muted-foreground"
            : "text-foreground group-hover:text-primary"
        )}
      >
        {renderHighlightedText(titleHighlights)}
      </h3>

      {/* Snippet / Content Excerpt */}
      {snippet && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {renderHighlightedText(snippetHighlights)}
        </p>
      )}

      {/* Tags & Additional Meta Footer */}
      {doc.tags && doc.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-1">
          {doc.tags.slice(0, 4).map((tagName) => {
            return (
              <span
                key={tagName}
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                #{tagName}
              </span>
            );
          })}
          {doc.tags.length > 4 && (
            <span className="text-[10px] text-muted-foreground/80 font-mono">
              +{doc.tags.length - 4} more
            </span>
          )}

          {doc.date && (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <Clock className="size-2.5" />
              {new Date(doc.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
