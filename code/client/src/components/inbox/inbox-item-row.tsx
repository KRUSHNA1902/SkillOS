import React from "react";
import {
  Sparkles,
  GitCommit,
  ListTodo,
  ShieldAlert,
  AtSign,
  Server,
  Flame,
  AlertTriangle,
  Star,
  Archive,
  Check,
  RotateCcw,
} from "lucide-react";
import { InboxItem, InboxCategory } from "./inbox-types";
import { cn } from "@/lib/utils";

interface InboxItemRowProps {
  item: InboxItem;
  isSelected: boolean;
  onSelect: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
  onToggleRead: (e: React.MouseEvent) => void;
  onArchive: (e: React.MouseEvent) => void;
  onUnarchive?: (e: React.MouseEvent) => void;
}

const CATEGORY_CONFIG: Record<
  InboxCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string }
> = {
  ai: {
    label: "AI Copilot",
    icon: Sparkles,
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
  workflow: {
    label: "CI/CD Workflow",
    icon: GitCommit,
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  task: {
    label: "Task & Deadline",
    icon: ListTodo,
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  security: {
    label: "Security & Vulnerability",
    icon: ShieldAlert,
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
  },
  mention: {
    label: "Team Mention",
    icon: AtSign,
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  system: {
    label: "System Engine",
    icon: Server,
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/20",
  },
};

export function InboxItemRow({
  item,
  isSelected,
  onSelect,
  onToggleStar,
  onToggleRead,
  onArchive,
  onUnarchive,
}: InboxItemRowProps) {
  const categoryConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.system;
  const CategoryIcon = categoryConfig.icon;
  const isUnread = item.status === "unread";
  const isArchived = item.status === "archived";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group relative flex flex-col gap-2 p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer outline-none",
        isSelected
          ? "border-primary/50 bg-primary/[0.04] shadow-sm shadow-primary/5 ring-1 ring-primary/30"
          : isUnread
          ? "border-border/70 bg-card/60 hover:bg-card/90 hover:border-border"
          : "border-border/40 bg-card/25 hover:bg-card/50 opacity-90 hover:opacity-100"
      )}
    >
      {/* Top Bar: Icon, Source/Category, Priority, Time, Hover Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Unread Glow Indicator */}
          {isUnread && (
            <span
              className="relative flex h-2 w-2 shrink-0"
              title="Unread notification"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          )}

          {/* Category Icon Badge */}
          <div
            className={cn(
              "grid size-6 shrink-0 place-items-center rounded-lg border",
              categoryConfig.bg,
              categoryConfig.text,
              categoryConfig.border
            )}
            title={categoryConfig.label}
          >
            <CategoryIcon className="size-3.5" />
          </div>

          {/* Source Name / Tag */}
          <span className="truncate text-xs font-medium text-foreground">
            {item.source.name}
          </span>

          {/* Priority indicator */}
          {item.priority === "urgent" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400">
              <Flame className="size-2.5 animate-pulse" />
              Urgent
            </span>
          )}
          {item.priority === "high" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
              <AlertTriangle className="size-2.5" />
              High
            </span>
          )}
        </div>

        {/* Right side: Timestamp & Hover Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] text-muted-foreground group-hover:hidden font-mono">
            {item.timestampDisplay}
          </span>

          {/* Hover Actions Bar */}
          <div className="hidden group-hover:flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 px-1 py-0.5 shadow-sm">
            {/* Star button */}
            <button
              type="button"
              onClick={onToggleStar}
              title={item.starred ? "Unstar notification" : "Star notification"}
              className={cn(
                "p-1 rounded-md transition-colors hover:bg-muted",
                item.starred
                  ? "text-amber-400 hover:text-amber-300"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Star
                className="size-3.5"
                fill={item.starred ? "currentColor" : "none"}
              />
            </button>

            {/* Mark read / unread */}
            <button
              type="button"
              onClick={onToggleRead}
              title={isUnread ? "Mark as read" : "Mark as unread"}
              className="p-1 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Check className="size-3.5" />
            </button>

            {/* Archive / Unarchive */}
            {isArchived && onUnarchive ? (
              <button
                type="button"
                onClick={onUnarchive}
                title="Restore from archive"
                className="p-1 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onArchive}
                title="Archive notification (e)"
                className="p-1 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Archive className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3
        className={cn(
          "line-clamp-1 text-xs transition-colors",
          isUnread
            ? "font-semibold text-foreground"
            : "font-medium text-foreground/80 group-hover:text-foreground"
        )}
      >
        {item.title}
      </h3>

      {/* Snippet preview */}
      <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
        {item.snippet}
      </p>

      {/* Bottom row: Tags / Badges */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {item.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
          >
            #{tag}
          </span>
        ))}
        {item.tags.length > 3 && (
          <span className="text-[10px] text-muted-foreground/60 font-mono">
            +{item.tags.length - 3}
          </span>
        )}

        {item.actionPayload && (
          <span className="ml-auto text-[10px] font-medium text-primary/80 group-hover:text-primary transition-colors flex items-center gap-1">
            <span className="size-1 rounded-full bg-primary/60" />
            {item.actionPayload.label}
          </span>
        )}
      </div>
    </div>
  );
}
