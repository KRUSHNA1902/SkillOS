import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  Pin,
  Tag,
  Code2,
  FileText,
  Eye,
  Edit3,
  Bold,
  List,
  AlertCircle,
  Loader2,
  Check,
  Save,
  Undo2,
} from "lucide-react";
import { KnowledgeNote, NoteTrack, CodeLanguage } from "./note-types";
import { TagPicker } from "@/components/tags/tag-picker";
import { sendAIChat } from "@/lib/ai-service";
import { cn } from "@/lib/utils";

interface NoteEditorProps {
  note: KnowledgeNote;
  onSave: (noteData: Omit<KnowledgeNote, "id" | "createdAt" | "updatedAt"> & { id?: string }) => void;
  onCancel: () => void;
  className?: string;
}

const TRACKS: NoteTrack[] = [
  "SQL & Databases",
  "Python & Analytics",
  "Power BI & Semantic Modeling",
  "Finance & Markets",
  "AI & Cloud Architecture",
  "Projects & Portfolio",
  "Architecture",
  "General",
];

const CODE_LANGUAGES: { id: CodeLanguage; label: string }[] = [
  { id: "sql", label: "SQL / PostgreSQL" },
  { id: "python", label: "Python / Pandas" },
  { id: "typescript", label: "TypeScript" },
  { id: "javascript", label: "JavaScript" },
  { id: "dax", label: "DAX / Power BI" },
  { id: "bash", label: "Bash / Shell" },
  { id: "json", label: "JSON" },
  { id: "markdown", label: "Markdown" },
];

export function NoteEditor({
  note,
  onSave,
  onCancel,
  className,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [area, setArea] = useState<NoteTrack>(note.area);
  const [tags, setTags] = useState<string[]>([...note.tags]);
  const [contentMarkdown, setContentMarkdown] = useState(note.contentMarkdown);
  const [codeSnippet, setCodeSnippet] = useState(note.codeSnippet || "");
  const [language, setLanguage] = useState<CodeLanguage>(note.language || "sql");
  const [pinned, setPinned] = useState(note.pinned);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // AI polishing state
  const [isAIPolishing, setIsAIPolishing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state if note changes externally
  useEffect(() => {
    setTitle(note.title);
    setArea(note.area);
    setTags([...note.tags]);
    setContentMarkdown(note.contentMarkdown);
    setCodeSnippet(note.codeSnippet || "");
    setLanguage(note.language || "sql");
    setPinned(note.pinned);
    setAiError(null);
  }, [note.id]);

  // Keyboard shortcuts: Cmd+Enter to save, Escape to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSaveSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [title, area, tags, contentMarkdown, codeSnippet, language, pinned]);

  // Insert markdown helpers into the content textarea at current cursor
  const insertMarkdown = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = contentMarkdown;
    const selected = text.slice(start, end) || placeholder;

    const newText = text.slice(0, start) + before + selected + after + text.slice(end);
    setContentMarkdown(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }, 50);
  };

  // AI Synthesize / Polish
  const handleAIPolish = async () => {
    if (!title.trim() && !contentMarkdown.trim()) {
      setAiError("Please provide at least a title or some draft content to synthesize.");
      return;
    }

    setIsAIPolishing(true);
    setAiError(null);

    try {
      const prompt = `You are an elite Staff Engineer and Technical Curriculum Author.
Enhance and professionally structure this engineering study note:
Topic Title: "${title}"
Area: "${area}"
Current Content Draft:
${contentMarkdown || "(Draft notes missing - please synthesize comprehensive, high-yield study notes on this topic)"}

Instructions:
1. Provide a crisp Executive Summary.
2. Outline Key Concepts with bullet points, practical trade-offs, and mental models.
3. Include an Interview Talking Point / Architecture rationale.
4. Keep the output in standard clean Markdown.`;

      const response = await sendAIChat(prompt, [], { activeTab: "notes", focusArea: area });
      if (response && response.reply) {
        setContentMarkdown(response.reply);
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to synthesize note using Gemini AI");
    } finally {
      setIsAIPolishing(false);
    }
  };

  const handleSaveSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: note.id,
      title: title.trim(),
      area,
      tags: tags.length > 0 ? tags : [area.split(" ")[0]],
      contentMarkdown: contentMarkdown.trim(),
      codeSnippet: codeSnippet.trim() ? codeSnippet : undefined,
      language: codeSnippet.trim() ? language : undefined,
      pinned,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18 }}
      className={cn("flex-1 flex flex-col min-h-0 bg-background overflow-hidden", className)}
    >
      {/* Top Note Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-4 sm:px-8 py-3.5 bg-card/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <FileText className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                Edit Knowledge Note
              </h2>
              <span className="hidden sm:inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-medium text-primary uppercase">
                In-Canvas Editor
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Structured markdown study synthesis, cheatsheets, and code snippets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAIPolish}
            disabled={isAIPolishing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            title="Synthesize and format with Gemini 3.8 AI"
          >
            {isAIPolishing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Synthesize with AI</span>
                <span className="sm:hidden">AI Polish</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shadow-xs"
            title="Discard changes (Esc)"
          >
            <Undo2 className="size-3.5" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveSubmit()}
            disabled={!title.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
            title="Save changes (Cmd+Enter)"
          >
            <Save className="size-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Form Content Body */}
      <form onSubmit={handleSaveSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-5">
          {aiError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Title & Track Row */}
          <div className="grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-8 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span>Note Title</span>
                <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. PostgreSQL Window Functions: LEAD, LAG & DENSE_RANK"
                className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-xs"
              />
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Learning Track
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value as NoteTrack)}
                className="w-full rounded-xl border border-border/80 bg-background px-3 py-2.5 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer shadow-xs"
              >
                {TRACKS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="size-3.5 text-primary" />
                <span>Tags & Concepts</span>
              </span>
              <span className="text-[10px] text-muted-foreground/70 lowercase">
                (cross-entity tagging across Notes, Tasks & Projects)
              </span>
            </label>

            <TagPicker
              selectedTags={tags}
              onChange={setTags}
              placeholder="Type to search or add tags (e.g. SQL, Analytics)..."
            />
          </div>

          {/* Markdown Content with Toolbar & Tab Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                <span>Markdown Content</span>
              </label>

              {/* Edit / Preview Tabs */}
              <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                    activeTab === "edit"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Edit3 className="size-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                    activeTab === "preview"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Eye className="size-3" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            {/* Quick Markdown Toolbar (visible in Edit mode) */}
            {activeTab === "edit" && (
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/70 bg-muted/30 p-1.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => insertMarkdown("**", "**", "bold text")}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Bold (**text**)"
                >
                  <Bold className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("## ", "\n", "Heading 2")}
                  className="rounded-lg px-2 py-1 text-[11px] font-mono font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Heading 2 (## Title)"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("### ", "\n", "Heading 3")}
                  className="rounded-lg px-2 py-1 text-[11px] font-mono font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Heading 3 (### Subtitle)"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("- ", "\n", "List item")}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Bullet List (- item)"
                >
                  <List className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("`", "`", "code")}
                  className="rounded-lg px-2 py-1 text-[11px] font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Inline Code (`code`)"
                >
                  `code`
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("> ℹ️ **Note**: ", "\n", "important concept")}
                  className="rounded-lg px-2 py-1 text-[11px] font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Callout Quote"
                >
                  ⓘ
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("```sql\n", "\n```", "-- SELECT * FROM table;")}
                  className="rounded-lg px-2 py-1 text-[11px] font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Code Block (```)"
                >
                  ☲
                </button>
              </div>
            )}

            {/* Editor Textarea vs Live Markdown Preview */}
            {activeTab === "edit" ? (
              <textarea
                ref={contentTextareaRef}
                rows={12}
                required
                value={contentMarkdown}
                onChange={(e) => setContentMarkdown(e.target.value)}
                placeholder="### Executive Summary&#10;Write comprehensive study synthesis, key takeaways, and formulas...&#10;&#10;### Key Architectural Patterns&#10;- Bullet 1&#10;- Bullet 2"
                className="w-full rounded-xl border border-border/80 bg-background p-4 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed shadow-xs"
              />
            ) : (
              <div className="rounded-xl border border-border/70 bg-background/50 p-5 min-h-[260px] max-h-[460px] overflow-y-auto text-xs text-foreground/90 space-y-2 leading-relaxed shadow-xs">
                {contentMarkdown.trim() ? (
                  <div className="whitespace-pre-wrap font-sans">{contentMarkdown}</div>
                ) : (
                  <p className="text-muted-foreground italic">No content written yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Code Snippet & Language Selector */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Code2 className="size-3.5 text-primary" />
                <span>Syntax Code Snippet / Cheatsheet (Optional)</span>
              </label>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
                className="rounded-lg border border-border/70 bg-background px-2.5 py-1 text-xs font-mono text-foreground outline-none focus:border-primary cursor-pointer shadow-xs"
              >
                {CODE_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              rows={7}
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="-- Paste production code snippet, SQL query, or algorithm template here..."
              className="w-full rounded-xl border border-border/80 bg-background p-3.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed shadow-xs"
            />
          </div>

          {/* Pinned Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="note-editor-pinned"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary cursor-pointer size-4"
            />
            <label htmlFor="note-editor-pinned" className="text-xs text-foreground font-medium cursor-pointer flex items-center gap-1">
              <Pin className="size-3 text-amber-400" />
              <span>Pin note to the top of knowledge base</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-t border-border/50 bg-card/60 backdrop-blur-md shrink-0">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-muted border border-border/70">Esc</kbd> to cancel or <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-muted border border-border/70">Cmd+Enter</kbd> to save.
          </p>

          <div className="flex items-center gap-2.5">
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
              <Check className="size-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
