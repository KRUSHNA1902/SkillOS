import React, { useState } from "react";
import {
  ArrowLeft,
  Star,
  Archive,
  RotateCcw,
  Trash2,
  Check,
  Sparkles,
  GitCommit,
  ListTodo,
  ShieldAlert,
  AtSign,
  Server,
  ExternalLink,
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { InboxItem, InboxCategory } from "./inbox-types";
import { cn } from "@/lib/utils";

interface InboxDetailsPaneProps {
  item: InboxItem | null;
  onBackToList?: () => void;
  onToggleStar: (id: string) => void;
  onToggleRead: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigateToTasks?: (taskId?: string) => void;
  onNavigateToAI?: (initialPrompt?: string) => void;
  onNavigateToNotes?: (noteId?: string) => void;
  onNavigateToWorkflows?: () => void;
}

const CATEGORY_MAP: Record<
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

export function InboxDetailsPane({
  item,
  onBackToList,
  onToggleStar,
  onToggleRead,
  onArchive,
  onUnarchive,
  onDelete,
  onNavigateToTasks,
  onNavigateToAI,
  onNavigateToNotes,
  onNavigateToWorkflows,
}: InboxDetailsPaneProps) {
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  if (!item) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-card/20 backdrop-blur-sm">
        <div className="max-w-sm space-y-3">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/50">
            <CheckCircle2 className="size-6 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No notification selected
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Select a message from the feed to view comprehensive diagnostics,
            contextual action triggers, and collaboration updates.
          </p>
        </div>
      </div>
    );
  }

  const category = CATEGORY_MAP[item.category] || CATEGORY_MAP.system;
  const CategoryIcon = category.icon;
  const isUnread = item.status === "unread";
  const isArchived = item.status === "archived";

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActionClick = () => {
    if (!item.actionPayload) return;
    const { target, referenceId, promptContext } = item.actionPayload;

    if (target === "task" && onNavigateToTasks) {
      onNavigateToTasks(referenceId);
    } else if (target === "ai" && onNavigateToAI) {
      onNavigateToAI(promptContext);
    } else if (target === "notes" && onNavigateToNotes) {
      onNavigateToNotes(referenceId);
    } else if (target === "workflows" && onNavigateToWorkflows) {
      onNavigateToWorkflows();
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full min-h-0 overflow-y-auto bg-card/30 backdrop-blur-sm border-t md:border-t-0 md:border-l border-border/60">
      {/* Top Action Bar */}
      <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-background/80 px-4 md:px-6 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {/* Mobile Back Button */}
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              title="Back to notifications"
              className="md:hidden grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground mr-1"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}

          {/* Category Pill */}
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium",
              category.bg,
              category.text,
              category.border
            )}
          >
            <CategoryIcon className="size-3.5" />
            <span>{category.label}</span>
          </div>

          {/* Priority Pill */}
          {item.priority === "urgent" && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400">
              <Flame className="size-3 animate-pulse" />
              Urgent
            </span>
          )}
          {item.priority === "high" && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
              <AlertTriangle className="size-3" />
              High Priority
            </span>
          )}
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Toggle Read */}
          <button
            type="button"
            onClick={() => onToggleRead(item.id)}
            title={isUnread ? "Mark as read" : "Mark as unread"}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
              isUnread
                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <Check className="size-3.5" />
            <span>{isUnread ? "Mark Read" : "Unread"}</span>
          </button>

          {/* Star */}
          <button
            type="button"
            onClick={() => onToggleStar(item.id)}
            title={item.starred ? "Unstar" : "Star"}
            className={cn(
              "grid size-8 place-items-center rounded-lg border border-border/60 transition-colors cursor-pointer",
              item.starred
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:text-amber-300"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Star
              className="size-3.5"
              fill={item.starred ? "currentColor" : "none"}
            />
          </button>

          {/* Archive / Unarchive */}
          {isArchived && onUnarchive ? (
            <button
              type="button"
              onClick={() => onUnarchive(item.id)}
              title="Restore from archive"
              className="grid size-8 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onArchive(item.id)}
              title="Archive notification"
              className="grid size-8 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <Archive className="size-3.5" />
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            title="Delete notification"
            className="grid size-8 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:bg-destructive/15 hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Detail Content Body */}
      <div className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl">
        {/* Title & Timestamp Header */}
        <div className="space-y-3">
          <h1 className="text-lg md:text-xl font-bold text-foreground leading-snug">
            {item.title}
          </h1>

          {/* Source Profile Card */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-background/50">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl border font-semibold",
                  category.bg,
                  category.text,
                  category.border
                )}
              >
                <CategoryIcon className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground">
                    {item.source.name}
                  </p>
                  {item.source.role && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md font-mono">
                      {item.source.role}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <Clock className="size-3" />
                  <span>Received {item.timestampDisplay}</span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy share link"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-primary" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="size-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Contextual Action Banner / Deep-linking CTA */}
        {item.actionPayload && (
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm">
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-semibold text-primary">
                Actionable Context Detected
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {item.category === "task"
                  ? "Direct link available to related workflow task and deadlines."
                  : item.category === "ai"
                  ? "AI Assistant is primed with this proposal's technical context."
                  : item.category === "mention"
                  ? "Direct link to knowledge note in the studio workspace."
                  : "Inspect related pipeline metrics and workflow runs."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleActionClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              <span>{item.actionPayload.label}</span>
              <ExternalLink className="size-3.5" />
            </button>
          </div>
        )}

        {/* Markdown Content / Formatted Message Body */}
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5 md:p-6 backdrop-blur-sm space-y-4 text-xs md:text-sm leading-relaxed text-foreground/90">
          {item.contentMarkdown.split("\n\n").map((block, idx) => {
            const trimmed = block.trim();

            // Heading 3 / 4
            if (trimmed.startsWith("### ")) {
              return (
                <h3
                  key={idx}
                  className="text-sm md:text-base font-bold text-foreground pt-1 flex items-center gap-2"
                >
                  {trimmed.replace("### ", "")}
                </h3>
              );
            }
            if (trimmed.startsWith("#### ")) {
              return (
                <h4
                  key={idx}
                  className="text-xs md:text-sm font-semibold text-foreground/90 pt-1"
                >
                  {trimmed.replace("#### ", "")}
                </h4>
              );
            }

            // Callout / Blockquote
            if (trimmed.startsWith("> ")) {
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground/90 font-medium"
                >
                  {trimmed.replace(/^>\s*(\[!TIP\]\s*)?/i, "")}
                </div>
              );
            }

            // Code block
            if (trimmed.startsWith("```")) {
              const codeLines = trimmed.replace(/```[a-z]*\n?/g, "");
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border/80 bg-zinc-950 p-3.5 font-mono text-xs text-zinc-200 overflow-x-auto shadow-inner"
                >
                  <pre className="whitespace-pre-wrap">{codeLines}</pre>
                </div>
              );
            }

            // Unordered list
            if (trimmed.startsWith("- ") || trimmed.startsWith("1. ")) {
              const items = trimmed.split("\n");
              return (
                <ul key={idx} className="space-y-1.5 pl-4 list-disc marker:text-primary">
                  {items.map((line, lIdx) => (
                    <li key={lIdx} className="text-xs leading-relaxed text-muted-foreground">
                      <span className="text-foreground">
                        {line.replace(/^[-*]\s+|\d+\.\s+/, "")}
                      </span>
                    </li>
                  ))}
                </ul>
              );
            }

            // Normal paragraph
            return (
              <p key={idx} className="text-xs md:text-sm leading-relaxed text-muted-foreground">
                {trimmed}
              </p>
            );
          })}
        </div>

        {/* Diagnostic Metadata (if available) */}
        {item.metadata && (
          <div className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Diagnostic Metadata
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {item.metadata.branch && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                  <span className="text-muted-foreground">Branch</span>
                  <span className="font-mono font-medium text-foreground">
                    {item.metadata.branch}
                  </span>
                </div>
              )}
              {item.metadata.commitHash && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                  <span className="text-muted-foreground">Commit</span>
                  <span className="font-mono font-medium text-foreground">
                    {item.metadata.commitHash}
                  </span>
                </div>
              )}
              {item.metadata.cve && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <span className="text-rose-400">Vulnerability ID</span>
                  <span className="font-mono font-bold text-rose-300">
                    {item.metadata.cve}
                  </span>
                </div>
              )}
              {item.metadata.taskDueDate && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="text-amber-400">Deadline</span>
                  <span className="font-mono font-semibold text-amber-300">
                    {item.metadata.taskDueDate}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags footer */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          <span className="text-xs text-muted-foreground font-medium mr-1">Tags:</span>
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-muted/80 border border-border/50 px-2 py-0.5 text-xs font-mono text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Bottom Resolution / Acknowledge Action Bar */}
        <div className="pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAcknowledged(true)}
              disabled={acknowledged}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                acknowledged
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 cursor-default"
                  : "bg-muted hover:bg-muted/80 text-foreground border-border/60"
              )}
            >
              <Check className="size-3.5" />
              <span>{acknowledged ? "Acknowledged" : "Acknowledge Alert"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onToggleRead(item.id);
                onArchive(item.id);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border/60 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <Archive className="size-3.5" />
              <span>Resolve & Archive</span>
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground font-mono">
            ID: {item.id}
          </p>
        </div>
      </div>
    </div>
  );
}
