import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
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
  Calculator,
  Loader2,
  Check,
} from "lucide-react";
import { KnowledgeNote, NoteTrack, CodeLanguage } from "./note-types";
import { TagPicker } from "@/components/tags/tag-picker";
import { sendAIChat } from "@/lib/ai-service";
import { cn } from "@/lib/utils";

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: Omit<KnowledgeNote, "id" | "createdAt" | "updatedAt"> & { id?: string }) => void;
  initialNote?: KnowledgeNote | null;
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

export function NoteModal({
  isOpen,
  onClose,
  onSave,
  initialNote,
}: NoteModalProps) {
  const isEditing = Boolean(initialNote);

  const [title, setTitle] = useState("");
  const [area, setArea] = useState<NoteTrack>("SQL & Databases");
  const [tags, setTags] = useState<string[]>([]);
  const [contentMarkdown, setContentMarkdown] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [language, setLanguage] = useState<CodeLanguage>("sql");
  const [pinned, setPinned] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // AI polishing state
  const [isAIPolishing, setIsAIPolishing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title);
      setArea(initialNote.area);
      setTags([...initialNote.tags]);
      setContentMarkdown(initialNote.contentMarkdown);
      setCodeSnippet(initialNote.codeSnippet || "");
      setLanguage(initialNote.language || "sql");
      setPinned(initialNote.pinned);
    } else {
      setTitle("");
      setArea("SQL & Databases");
      setTags(["SQL", "Analytics"]);
      setContentMarkdown("");
      setCodeSnippet("");
      setLanguage("sql");
      setPinned(false);
    }
    setActiveTab("edit");
    setAiError(null);
  }, [initialNote, isOpen]);

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
      setAiError("Please enter a title or topic first so Gemini has context to generate.");
      return;
    }
    setIsAIPolishing(true);
    setAiError(null);

    try {
      const prompt = `Synthesize a comprehensive, high-yield study note for SkillOS on the following topic:\n\nTitle: ${title}\nTrack: ${area}\nCurrent Draft / Notes:\n${contentMarkdown || "None provided"}\n\nPlease generate:\n1. Executive Summary\n2. ⏳ Chronological Concept Timeline\n3. ⚡ Core Formula / Cheatsheet\n4. ⚠️ Common Pitfalls & Anti-Patterns\n\nAlso include a practical code snippet.`;

      const res = await sendAIChat(
        prompt,
        [],
        { activeTab: "notes", focusArea: area },
        "notes",
        "gemini-3.8-flash"
      );

      if (res.reply) {
        // Extract code snippet if present in markdown
        const codeBlockMatch = res.reply.match(/```(\w+)?\n([\s\S]*?)```/);
        let extractedCode = codeSnippet;
        let markdownClean = res.reply;

        if (codeBlockMatch && !codeSnippet.trim()) {
          const detectedLang = codeBlockMatch[1]?.toLowerCase() as CodeLanguage;
          if (detectedLang && CODE_LANGUAGES.some((c) => c.id === detectedLang)) {
            setLanguage(detectedLang);
          }
          extractedCode = codeBlockMatch[2].trim();
          setCodeSnippet(extractedCode);
        }

        setContentMarkdown(markdownClean);
        setActiveTab("preview");
      }
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Failed to synthesize with AI");
    } finally {
      setIsAIPolishing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      ...(initialNote?.id ? { id: initialNote.id } : {}),
      title: title.trim(),
      area,
      tags: tags.length > 0 ? tags : ["General"],
      contentMarkdown: contentMarkdown.trim() || "No content provided.",
      codeSnippet: codeSnippet.trim() || undefined,
      language: codeSnippet.trim() ? language : undefined,
      pinned,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-3xl rounded-2xl border border-border/80 bg-card text-foreground shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText className="size-4.5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {isEditing ? "Edit Knowledge Note" : "New Knowledge Note"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Structured markdown study synthesis, cheatsheets, and code snippets
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAIPolish}
                disabled={isAIPolishing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-50"
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
                onClick={onClose}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {aiError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Title & Track Row */}
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-8 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>Note Title</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. PostgreSQL Window Functions: LEAD, LAG & DENSE_RANK"
                    className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Learning Track
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value as NoteTrack)}
                    className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
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
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="size-3 text-primary" />
                    <span>Tags & Concepts</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Cross-entity tagging across Notes, Tasks & Projects
                  </span>
                </label>

                <TagPicker
                  selectedTags={tags}
                  onChange={setTags}
                  placeholder="Type to search or add tags (e.g. SQL, Analytics)..."
                />
              </div>

              {/* Markdown Content with Toolbar & Tab Switcher */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="size-3 text-primary" />
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
                          ? "bg-background text-foreground shadow-xs"
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
                          ? "bg-background text-foreground shadow-xs"
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
                  <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
                    <button
                      type="button"
                      onClick={() => insertMarkdown("**", "**", "bold text")}
                      title="Bold"
                      className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Bold className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("## ", "\n", "Heading 2")}
                      title="Heading 2"
                      className="p-1 rounded text-xs font-bold font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("### ", "\n", "Heading 3")}
                      title="Heading 3"
                      className="p-1 rounded text-xs font-bold font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      H3
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("- ", "\n", "List item")}
                      title="Bullet List"
                      className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <List className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("`", "`", "code")}
                      title="Inline Code"
                      className="p-1 rounded text-xs font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      `code`
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("\n> [!NOTE]\n> ", "\n", "Important takeaway")}
                      title="Alert Callout"
                      className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <AlertCircle className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("$$\n", "\n$$", "\\text{Formula}")}
                      title="Math Formula"
                      className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Calculator className="size-3.5" />
                    </button>
                  </div>
                )}

                {activeTab === "edit" ? (
                  <textarea
                    ref={contentTextareaRef}
                    rows={8}
                    value={contentMarkdown}
                    onChange={(e) => setContentMarkdown(e.target.value)}
                    placeholder={`Write your structured notes using Markdown:\n\n### Executive Summary\nCore explanation...\n\n### ⚡ Key Takeaways\n- Point 1\n- Point 2`}
                    className="w-full rounded-xl border border-border/80 bg-background/80 p-3.5 text-xs font-mono leading-relaxed text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
                  />
                ) : (
                  <div className="w-full rounded-xl border border-border/80 bg-background/80 p-4 text-xs leading-relaxed text-foreground min-h-[190px] max-h-[300px] overflow-y-auto space-y-2 whitespace-pre-wrap font-sans">
                    {contentMarkdown ? (
                      <div>{contentMarkdown}</div>
                    ) : (
                      <p className="text-muted-foreground italic">No content to preview.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Code Snippet Drawer */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Code2 className="size-3 text-primary" />
                    <span>Syntax Code Snippet / Cheatsheet (Optional)</span>
                  </label>

                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
                    className="rounded-lg border border-border/80 bg-background px-2 py-1 text-[11px] font-mono text-muted-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    {CODE_LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  rows={5}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder={`// Enter copyable code snippet, SQL query, or template\nSELECT column, COUNT(*)\nFROM table\nGROUP BY column;`}
                  className="w-full rounded-xl border border-border/80 bg-neutral-900 dark:bg-black/80 p-3.5 text-xs font-mono leading-relaxed text-emerald-400 dark:text-emerald-300 placeholder:text-neutral-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
                />
              </div>

              {/* Pin Switch */}
              <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <Pin className={cn("size-4", pinned ? "text-amber-400 fill-amber-400" : "text-muted-foreground")} />
                  <div>
                    <p className="text-xs font-medium text-foreground">Pin to Top of Knowledge Base</p>
                    <p className="text-[10px] text-muted-foreground">
                      Keep this note pinned prominently in the Dashboard and Notes list
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-border/60 px-5 py-3.5 bg-muted/20">
              <span className="text-[11px] text-muted-foreground">
                Auto-saved locally with 0ms latency
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-border/80 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                >
                  <Check className="size-3.5" />
                  <span>{isEditing ? "Save Changes" : "Create Note"}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
