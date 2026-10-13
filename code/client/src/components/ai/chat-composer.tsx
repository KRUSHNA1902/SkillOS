import React, { useRef, useEffect, useState } from "react";
import {
  ArrowUp,
  Square,
  Sparkles,
  GraduationCap,
  Compass,
  FileText,
  Paperclip,
  Wrench,
  Trash2,
  ChevronDown,
  Check,
  Database,
  Code2,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { AIMode } from "@/lib/ai-service";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  input: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  onClear?: () => void;
  isGenerating: boolean;
  modelName?: string;
  hasMessages?: boolean;
  mode?: AIMode;
  onModeChange?: (mode: AIMode) => void;
  onSelectTrackPrompt?: (prompt: string) => void;
}

const MODE_OPTIONS: { id: AIMode; label: string; icon: typeof GraduationCap; description: string }[] = [
  {
    id: "learning",
    label: "Learning",
    icon: GraduationCap,
    description: "Concepts, deep explanations & practice drills",
  },
  {
    id: "planning",
    label: "Planning",
    icon: Compass,
    description: "Chronological roadmaps & execution plans",
  },
  {
    id: "notes",
    label: "Notes",
    icon: FileText,
    description: "Structured synthesis & syntax cheatsheets",
  },
];

const QUICK_TOOLS = [
  {
    label: "SQL Window Functions Drill",
    icon: Database,
    prompt: "Explain SQL Window Functions (ROW_NUMBER, RANK, LEAD, LAG) and provide an interactive challenge.",
  },
  {
    label: "Python Pandas Pipeline",
    icon: Code2,
    prompt: "Guide me through building a production Pandas data cleaning pipeline with vectorization best practices.",
  },
  {
    label: "Power BI DAX Filter Context",
    icon: BarChart3,
    prompt: "Deep dive into DAX filter context and CALCULATE transition with a practical dashboard scenario.",
  },
  {
    label: "Financial DCF Valuation Model",
    icon: TrendingUp,
    prompt: "Walk through building a 3-Statement Financial Model and DCF Valuation from scratch.",
  },
];

export function ChatComposer({
  input,
  onChange,
  onSubmit,
  onStop,
  onClear,
  isGenerating,
  modelName = "gemini-3.8-flash",
  hasMessages = false,
  mode = "learning",
  onModeChange,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);

  const activeModeConfig =
    MODE_OPTIONS.find((m) => m.id === mode) || MODE_OPTIONS[0];
  const ModeIcon = activeModeConfig.icon;

  const getPlaceholder = () => {
    switch (mode) {
      case "learning":
        return "Build anything... Ask a concept, debug a query, or request practice exercises...";
      case "planning":
        return "Build anything... Outline milestones, project roadmaps, or curriculum timelines...";
      case "notes":
        return "Build anything... Generate cheatsheets, syntax references, or structured notes...";
      default:
        return "Build anything...";
    }
  };

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 28), 160)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && isGenerating && onStop) {
      e.preventDefault();
      onStop();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && input.trim()) {
        setModeMenuOpen(false);
        setToolsMenuOpen(false);
        setAttachmentMenuOpen(false);
        onSubmit();
      }
    }
  };

  const handleInsertAttachment = (template: string) => {
    onChange(input ? `${input}\n\n${template}` : template);
    setAttachmentMenuOpen(false);
    textareaRef.current?.focus();
  };

  const handleSelectTool = (prompt: string) => {
    onChange(prompt);
    setToolsMenuOpen(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full relative">
      {/* Outer Prompt Bar Container */}
      <div className="relative rounded-[24px] sm:rounded-[28px] border border-border/80 bg-card p-3.5 sm:p-4 shadow-xl shadow-black/5 dark:shadow-black/60 transition-all focus-within:border-primary/50 hover:border-border">
        {/* Subtle top specular sheen */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent pointer-events-none" />

        {/* Text Area */}
        <div className="w-full">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={getPlaceholder()}
            className="w-full resize-none bg-transparent px-1 py-1 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none max-h-40 font-sans leading-relaxed selection:bg-primary/20"
          />
        </div>

        {/* Bottom Action Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Left Chips / Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Attachment Paperclip Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAttachmentMenuOpen((prev) => !prev);
                  setModeMenuOpen(false);
                  setToolsMenuOpen(false);
                }}
                title="Attach context or code template"
                className="size-8 rounded-full bg-muted/70 hover:bg-muted border border-border/70 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
              >
                <Paperclip className="size-3.5" />
              </button>

              {/* Attachment Popover */}
              {attachmentMenuOpen && (
                <div className="absolute bottom-10 left-0 z-50 w-64 rounded-xl border border-border/80 bg-popover p-2 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95">
                  <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Insert Template
                  </div>
                  <div className="mt-1 space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleInsertAttachment("```sql\n-- Paste your SQL query or schema here\n\n```")
                      }
                      className="w-full text-left px-2.5 py-1.5 text-xs text-popover-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Database className="size-3.5 text-blue-500" />
                      <span>SQL Query Snippet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleInsertAttachment("```python\n# Paste Python/Pandas snippet here\n\n```")
                      }
                      className="w-full text-left px-2.5 py-1.5 text-xs text-popover-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Code2 className="size-3.5 text-emerald-500" />
                      <span>Python Code Block</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleInsertAttachment("```text\n[Dataset Description & Requirements]\n```")
                      }
                      className="w-full text-left px-2.5 py-1.5 text-xs text-popover-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="size-3.5 text-amber-500" />
                      <span>Dataset Schema Context</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Active Model Chip (Gemini 3.8 Flash) */}
            <div className="relative group">
              <div
                className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 border border-border/70 px-3.5 py-1.5 text-xs font-medium text-foreground select-none hover:border-border transition-all cursor-default"
              >
                <Sparkles className="size-3 text-amber-500 shrink-0" />
                <span className="font-medium text-[11px] tracking-tight">Gemini 3.8 Flash</span>
              </div>
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-9 left-0 hidden group-hover:block z-50 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1 text-[11px] font-mono text-popover-foreground shadow-xl">
                Active: {modelName || "Gemini 3.8 Flash"} (High Reasoning)
              </div>
            </div>

            {/* 3. Mode (Learning / Planning / Notes) */}
            {onModeChange && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setModeMenuOpen((prev) => !prev);
                    setToolsMenuOpen(false);
                    setAttachmentMenuOpen(false);
                  }}
                  title="Switch Mode"
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 hover:bg-muted border border-border/70 px-3.5 py-1.5 text-xs font-medium text-foreground transition-all cursor-pointer active:scale-95"
                >
                  <ModeIcon className="size-3 text-primary" />
                  <span>{activeModeConfig.label}</span>
                  <ChevronDown className="size-3 text-muted-foreground opacity-70" />
                </button>

                {/* Mode Selector Dropdown */}
                {modeMenuOpen && (
                  <div className="absolute bottom-10 left-0 z-50 w-56 rounded-xl border border-border/80 bg-popover p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95">
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Select Conversation Mode
                    </div>
                    {MODE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = mode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            onModeChange(opt.id);
                            setModeMenuOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer",
                            isSelected
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="size-3.5 text-primary" />
                            <div>
                              <div className="leading-none">{opt.label}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {opt.description}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="size-3.5 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. Tools Chip */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setToolsMenuOpen((prev) => !prev);
                  setModeMenuOpen(false);
                  setAttachmentMenuOpen(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 hover:bg-muted border border-border/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95"
              >
                <Wrench className="size-3 text-muted-foreground" />
                <span>Tools</span>
              </button>

              {/* Tools Menu Popover */}
              {toolsMenuOpen && (
                <div className="absolute bottom-10 left-0 z-50 w-72 rounded-xl border border-border/80 bg-popover p-2 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Curriculum Tools & Drills
                  </div>
                  <div className="mt-1 space-y-1">
                    {QUICK_TOOLS.map((t, i) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectTool(t.prompt)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-popover-foreground hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Icon className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Optional Clear Button */}
            {hasMessages && onClear && (
              <button
                type="button"
                onClick={onClear}
                title="Clear conversation"
                className="size-8 rounded-full bg-muted/70 hover:bg-rose-500/10 border border-border/60 hover:border-rose-500/30 text-muted-foreground hover:text-rose-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <Trash2 className="size-3" />
              </button>
            )}
          </div>

          {/* Right Controls: Hint & Send Button */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-sans tracking-tight hidden sm:inline select-none">
              {isGenerating ? "Click stop to cancel" : "Enter to send"}
            </span>

            {/* Send / Stop Button */}
            <button
              type="button"
              onClick={isGenerating ? onStop : onSubmit}
              disabled={!isGenerating && !input.trim()}
              className={cn(
                "size-8 sm:size-8.5 rounded-full flex items-center justify-center transition-all",
                isGenerating
                  ? "bg-rose-500/20 border border-rose-500/40 text-rose-500 hover:bg-rose-500/30 hover:border-rose-500/60 cursor-pointer shadow-sm active:scale-95"
                  : input.trim()
                  ? "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer shadow-sm active:scale-95"
                  : "bg-muted text-muted-foreground border border-border/60 cursor-not-allowed opacity-60"
              )}
              title={isGenerating ? "Stop generating (Cancel)" : "Send prompt (Enter)"}
              aria-label={isGenerating ? "Stop generating" : "Send prompt"}
            >
              {isGenerating ? (
                <Square className="size-3.5 fill-current text-rose-500" />
              ) : (
                <ArrowUp className="size-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
