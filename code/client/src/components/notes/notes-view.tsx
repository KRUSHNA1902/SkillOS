import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  NotebookTabs,
  Plus,
  Search,
  Pin,
  Tag,
  Code2,
  Sparkles,
  Download,
  Copy,
  Check,
  Edit2,
  Trash2,
  CopyPlus,
  LayoutGrid,
  Columns2,
  CheckCircle2,
  Terminal,
  AlertCircle,
  Lightbulb,
  Loader2,
  X,
  Bot,
} from "lucide-react";
import { useNotes } from "./note-context";
import { KnowledgeNote, NoteTrack } from "./note-types";
import { NoteModal } from "./note-modal";
import { sendAIChat } from "@/lib/ai-service";
import { cn } from "@/lib/utils";

interface NotesViewProps {
  onNavigateToAI?: () => void;
}

const TRACK_CONFIG: Record<
  NoteTrack,
  { label: string; badgeClass: string; iconClass: string }
> = {
  "SQL & Databases": {
    label: "SQL & Relational",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    iconClass: "text-blue-400",
  },
  "Python & Analytics": {
    label: "Python Analytics",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    iconClass: "text-emerald-400",
  },
  "Power BI & Semantic Modeling": {
    label: "Power BI & DAX",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    iconClass: "text-amber-400",
  },
  "Finance & Markets": {
    label: "Finance & DCF",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    iconClass: "text-purple-400",
  },
  "AI & Cloud Architecture": {
    label: "AI & Agents",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    iconClass: "text-rose-400",
  },
  "Projects & Portfolio": {
    label: "Projects & ETL",
    badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    iconClass: "text-indigo-400",
  },
  Architecture: {
    label: "Architecture",
    badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    iconClass: "text-cyan-400",
  },
  General: {
    label: "General",
    badgeClass: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
    iconClass: "text-neutral-400",
  },
};

export function NotesView({ onNavigateToAI }: NotesViewProps) {
  const {
    notes,
    selectedNoteId,
    setSelectedNoteId,
    metrics,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    duplicateNote,
    exportNoteMarkdown,
    exportAllNotesMarkdown,
  } = useNotes();

  // View state
  const [viewMode, setViewMode] = useState<"studio" | "grid">("studio");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<"all" | NoteTrack>("all");
  const [selectedTag, setSelectedTag] = useState<"all" | string>("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<KnowledgeNote | null>(null);
  const [isAISynthesizerOpen, setIsAISynthesizerOpen] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState("");
  const [aiTrackInput, setAiTrackInput] = useState<NoteTrack>("SQL & Databases");
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);

  // Feedback Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered & Sorted notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Search query across title, markdown, code, tags
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(query);
        const matchesContent = n.contentMarkdown.toLowerCase().includes(query);
        const matchesCode = n.codeSnippet?.toLowerCase().includes(query) ?? false;
        const matchesTags = n.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesContent && !matchesCode && !matchesTags) {
          return false;
        }
      }

      // Track filter
      if (selectedTrack !== "all" && n.area !== selectedTrack) {
        return false;
      }

      // Tag filter
      if (selectedTag !== "all" && !n.tags.includes(selectedTag)) {
        return false;
      }

      // Pinned only
      if (pinnedOnly && !n.pinned) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Pinned first, then by updatedAt descending
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, searchQuery, selectedTrack, selectedTag, pinnedOnly]);

  // Selected note for studio view
  const currentSelectedNote = useMemo(() => {
    if (selectedNoteId) {
      const found = notes.find((n) => n.id === selectedNoteId);
      if (found) return found;
    }
    return filteredNotes[0] || notes[0] || null;
  }, [selectedNoteId, notes, filteredNotes]);

  // Handle Save from NoteModal
  const handleSaveModal = (
    noteData: Omit<KnowledgeNote, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ) => {
    if (noteData.id) {
      updateNote(noteData.id, noteData);
      showToast("Knowledge note updated successfully");
    } else {
      const created = addNote(noteData);
      setSelectedNoteId(created.id);
      showToast("New knowledge note created");
    }
    setEditingNote(null);
  };

  // Handle Copy Code
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    showToast("Code snippet copied to clipboard");
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Handle Copy Full Note Markdown
  const handleCopyMarkdown = (note: KnowledgeNote) => {
    let md = `# ${note.title}\n\n${note.contentMarkdown}`;
    if (note.codeSnippet?.trim()) {
      md += `\n\n\`\`\`${note.language || "text"}\n${note.codeSnippet}\n\`\`\``;
    }
    navigator.clipboard.writeText(md);
    showToast("Full markdown copied to clipboard");
  };

  // Handle AI Synthesizer submission
  const handleGenerateAISynthesis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopicInput.trim() || isGeneratingNote) return;

    setIsGeneratingNote(true);
    try {
      const prompt = `Synthesize a comprehensive, high-yield study note for SkillOS on the following topic:\n\nTopic: ${aiTopicInput.trim()}\nTarget Track: ${aiTrackInput}\n\nFormat with:\n1. ### Executive Summary\n2. ### ⏳ Chronological Concept Timeline\n3. ### ⚡ Core Formula / Cheatsheet\n4. ### ⚠️ Common Pitfalls & Anti-Patterns\n\nInclude a practical, copy-pasteable code snippet in a fenced block.`;

      const res = await sendAIChat(
        prompt,
        [],
        { activeTab: "notes", focusArea: aiTrackInput },
        "notes",
        "gemini-3.8-flash"
      );

      if (res.reply) {
        // Extract code snippet if present
        const codeBlockMatch = res.reply.match(/```(\w+)?\n([\s\S]*?)```/);
        let extractedCode = "";
        let lang = "sql" as const;

        if (codeBlockMatch) {
          extractedCode = codeBlockMatch[2].trim();
        }

        const newNote = addNote({
          title: aiTopicInput.trim(),
          area: aiTrackInput,
          tags: [aiTrackInput.split(" ")[0], "AI-Generated", "Cheatsheet"],
          contentMarkdown: res.reply,
          codeSnippet: extractedCode || undefined,
          language: extractedCode ? lang : undefined,
          pinned: false,
        });

        setSelectedNoteId(newNote.id);
        setIsAISynthesizerOpen(false);
        setAiTopicInput("");
        showToast(`AI note "${newNote.title}" generated successfully!`);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to generate note with AI");
    } finally {
      setIsGeneratingNote(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full min-h-0 bg-background text-foreground overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 right-6 z-50 flex items-center gap-2 rounded-xl border border-primary/30 bg-card/95 px-4 py-2.5 text-xs font-medium text-foreground shadow-xl backdrop-blur-md"
          >
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP WORKSPACE HEADER & METRIC RIBBON */}
      <div className="shrink-0 border-b border-border/40 bg-card/30 px-4 sm:px-6 py-3.5 backdrop-blur-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <NotebookTabs className="size-4.5" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                Notes & Knowledge Base
              </h1>
              <span className="rounded-full border border-border/80 bg-muted/60 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                {metrics.total} notes
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Structured study roadmaps, code cheatsheets, formulas & architectural decisions
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Metrics Pills */}
            <div className="hidden lg:flex items-center gap-2 mr-2">
              <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                <Pin className="size-3 fill-amber-400" />
                <span>{metrics.pinned} Pinned</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Code2 className="size-3" />
                <span>{metrics.withCode} Code Snippets</span>
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-border/80 bg-background/80 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("studio")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
                  viewMode === "studio"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Split-Pane Studio View"
              >
                <Columns2 className="size-3.5" />
                <span className="hidden sm:inline">Studio</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Gallery Card Grid View"
              >
                <LayoutGrid className="size-3.5" />
                <span className="hidden sm:inline">Gallery</span>
              </button>
            </div>

            {/* Export All Markdown */}
            <button
              type="button"
              onClick={exportAllNotesMarkdown}
              title="Export all notes to Markdown"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* AI Synthesizer Trigger */}
            <button
              type="button"
              onClick={() => setIsAISynthesizerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-all cursor-pointer"
              title="Generate a high-yield study note with Gemini AI"
            >
              <Sparkles className="size-3.5" />
              <span>AI Synthesizer</span>
            </button>

            {/* New Note Button */}
            <button
              type="button"
              onClick={() => {
                setEditingNote(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 shadow-sm transition-opacity cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>New Note</span>
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, markdown content, tags, or code snippets..."
              className="w-full rounded-xl border border-border/80 bg-background/80 pl-9 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Quick Track & Pinned Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPinnedOnly(!pinnedOnly)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                pinnedOnly
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                  : "border-border/80 bg-background/60 text-muted-foreground hover:text-foreground"
              )}
            >
              <Pin className={cn("size-3", pinnedOnly ? "fill-amber-400" : "")} />
              <span>Pinned Only</span>
            </button>

            {/* Track Selector Dropdown for compact display */}
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value as any)}
              className="rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Learning Tracks</option>
              {Object.keys(TRACK_CONFIG).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TOP TAGS CAROUSEL */}
        {metrics.topTags.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 mr-1">
              Filter by Tag:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTag("all")}
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-medium transition-all shrink-0 cursor-pointer",
                selectedTag === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              All Tags
            </button>
            {metrics.topTags.map(({ tag, count }) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tag ? "all" : tag)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1",
                  selectedTag === tag
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span>#{tag}</span>
                <span className="text-[9px] opacity-70">({count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* WORKSPACE BODY */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {filteredNotes.length === 0 ? (
          /* Empty State */
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="max-w-md space-y-3 rounded-2xl border border-border/60 bg-card/40 p-8 backdrop-blur-sm">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <NotebookTabs className="size-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                No matching knowledge notes
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {searchQuery || selectedTrack !== "all" || selectedTag !== "all" || pinnedOnly
                  ? "Try resetting your search query or tag filters."
                  : "Create your first knowledge note or generate one using the AI Synthesizer."}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                {(searchQuery || selectedTrack !== "all" || selectedTag !== "all" || pinnedOnly) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTrack("all");
                      setSelectedTag("all");
                      setPinnedOnly(false);
                    }}
                    className="rounded-xl border border-border/80 px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditingNote(null);
                    setIsModalOpen(true);
                  }}
                  className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  Create Note
                </button>
              </div>
            </div>
          </div>
        ) : viewMode === "studio" ? (
          /* SPLIT-PANE STUDIO VIEW (Obsidian / Notion style) */
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Left Master List */}
            <div className="w-full sm:w-80 md:w-96 shrink-0 border-r border-border/40 bg-card/10 flex flex-col min-h-0 overflow-hidden">
              <div className="p-2 border-b border-border/40 text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                <span>
                  Showing {filteredNotes.length} of {notes.length} notes
                </span>
                <span className="text-[10px] text-muted-foreground/80">
                  Sorted by recent
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border/30">
                {filteredNotes.map((note) => {
                  const isSelected = currentSelectedNote?.id === note.id;
                  const trackConfig = TRACK_CONFIG[note.area] || TRACK_CONFIG.General;

                  return (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => setSelectedNoteId(note.id)}
                      className={cn(
                        "w-full text-left p-3.5 transition-all flex flex-col gap-1.5 cursor-pointer relative",
                        isSelected
                          ? "bg-primary/10 border-l-2 border-primary"
                          : "hover:bg-muted/40"
                      )}
                    >
                      {/* Top Meta */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-medium border",
                            trackConfig.badgeClass
                          )}
                        >
                          {trackConfig.label}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {note.pinned && (
                            <Pin className="size-3 text-amber-400 fill-amber-400" />
                          )}
                          {note.codeSnippet && (
                            <Code2 className="size-3 text-muted-foreground" />
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(note.updatedAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4
                        className={cn(
                          "text-xs font-semibold leading-snug line-clamp-1 transition-colors",
                          isSelected ? "text-primary" : "text-foreground"
                        )}
                      >
                        {note.title}
                      </h4>

                      {/* Snippet Preview */}
                      <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                        {note.contentMarkdown.replace(/[#*`>-]/g, "").slice(0, 110)}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {note.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded bg-muted/60 px-1 py-0.2 text-[9px] font-mono text-muted-foreground"
                          >
                            #{t}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">
                            +{note.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Detail Reader Canvas */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-background overflow-hidden">
              {currentSelectedNote ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-5 sm:p-8 space-y-6">
                  {/* Note Reader Header */}
                  <div className="border-b border-border/40 pb-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-xs font-medium border",
                            TRACK_CONFIG[currentSelectedNote.area]?.badgeClass
                          )}
                        >
                          {currentSelectedNote.area}
                        </span>

                        {currentSelectedNote.pinned && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                            <Pin className="size-3 fill-amber-400" />
                            <span>Pinned</span>
                          </span>
                        )}

                        <span className="text-xs text-muted-foreground">
                          Updated {new Date(currentSelectedNote.updatedAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => togglePinNote(currentSelectedNote.id)}
                          title={currentSelectedNote.pinned ? "Unpin note" : "Pin note to top"}
                          className="grid size-8 place-items-center rounded-lg border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Pin
                            className={cn(
                              "size-3.5",
                              currentSelectedNote.pinned ? "fill-amber-400 text-amber-400" : ""
                            )}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyMarkdown(currentSelectedNote)}
                          title="Copy Markdown"
                          className="grid size-8 place-items-center rounded-lg border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Copy className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => exportNoteMarkdown(currentSelectedNote.id)}
                          title="Export as .md file"
                          className="grid size-8 place-items-center rounded-lg border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Download className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => duplicateNote(currentSelectedNote.id)}
                          title="Duplicate note"
                          className="grid size-8 place-items-center rounded-lg border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        >
                          <CopyPlus className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingNote(currentSelectedNote);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-all cursor-pointer"
                        >
                          <Edit2 className="size-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete "${currentSelectedNote.title}"?`)) {
                              deleteNote(currentSelectedNote.id);
                              showToast("Note deleted");
                            }
                          }}
                          title="Delete note"
                          className="grid size-8 place-items-center rounded-lg border border-border/80 text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                      {currentSelectedNote.title}
                    </h2>

                    {/* Tags List */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {currentSelectedNote.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs font-mono text-muted-foreground border border-border/60"
                        >
                          <Tag className="size-2.5 text-primary" />
                          <span>#{t}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Main Markdown Body */}
                  <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-foreground/90 font-sans">
                    {renderFormattedMarkdown(currentSelectedNote.contentMarkdown)}
                  </div>

                  {/* Dedicated Code Snippet / Terminal Box */}
                  {currentSelectedNote.codeSnippet?.trim() && (
                    <div className="rounded-2xl border border-border/80 bg-neutral-950 shadow-xl overflow-hidden mt-6">
                      <div className="flex items-center justify-between border-b border-border/40 bg-neutral-900/80 px-4 py-2 text-xs font-mono text-neutral-400">
                        <div className="flex items-center gap-2">
                          <Terminal className="size-3.5 text-emerald-400" />
                          <span className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px]">
                            {currentSelectedNote.language || "syntax code"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopyCode(
                              currentSelectedNote.codeSnippet!,
                              currentSelectedNote.id
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-md bg-neutral-800/80 px-2.5 py-1 text-[11px] text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedCodeId === currentSelectedNote.id ? (
                            <>
                              <Check className="size-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>

                      <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-emerald-400 dark:text-emerald-300">
                        <code>{currentSelectedNote.codeSnippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
                  Select a note from the left pane to view its content.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* GALLERY CARD GRID VIEW */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredNotes.map((note) => {
                const trackConfig = TRACK_CONFIG[note.area] || TRACK_CONFIG.General;

                return (
                  <div
                    key={note.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm hover:border-primary/40 hover:bg-card transition-all"
                  >
                    <div className="space-y-2.5">
                      {/* Top Bar */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[10px] font-medium border",
                            trackConfig.badgeClass
                          )}
                        >
                          {trackConfig.label}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => togglePinNote(note.id)}
                            className="p-1 text-muted-foreground hover:text-amber-400 cursor-pointer"
                            title={note.pinned ? "Unpin" : "Pin"}
                          >
                            <Pin
                              className={cn(
                                "size-3.5",
                                note.pinned ? "fill-amber-400 text-amber-400" : ""
                              )}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNote(note);
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-muted-foreground hover:text-primary cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete "${note.title}"?`)) {
                                deleteNote(note.id);
                                showToast("Note deleted");
                              }
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedNoteId(note.id);
                          setViewMode("studio");
                        }}
                        className="text-left font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 cursor-pointer"
                      >
                        {note.title}
                      </button>

                      {/* Content Preview */}
                      <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                        {note.contentMarkdown.replace(/[#*`>-]/g, "").slice(0, 160)}
                      </p>

                      {/* Code Snippet Tag (if present) */}
                      {note.codeSnippet && (
                        <div className="flex items-center justify-between rounded-lg bg-neutral-900/60 dark:bg-black/40 px-2.5 py-1 text-[11px] font-mono text-emerald-400 border border-border/40">
                          <span className="flex items-center gap-1.5">
                            <Code2 className="size-3 text-primary" />
                            <span>{note.language || "code snippet"}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(note.codeSnippet!, note.id)}
                            className="text-[10px] text-muted-foreground hover:text-white transition-colors"
                          >
                            {copiedCodeId === note.id ? "Copied" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Meta */}
                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-1">
                        {note.tags.slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] text-muted-foreground">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <span>
                        {new Date(note.updatedAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT NOTE MODAL */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveModal}
        initialNote={editingNote}
      />

      {/* QUICK AI SYNTHESIZER DIALOG */}
      <AnimatePresence>
        {isAISynthesizerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      AI Note Synthesizer
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Powered by Gemini 3.8 Flash • Generates structured notes in seconds
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAISynthesizerOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleGenerateAISynthesis} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Topic or Concept to Synthesize
                  </label>
                  <input
                    type="text"
                    required
                    value={aiTopicInput}
                    onChange={(e) => setAiTopicInput(e.target.value)}
                    placeholder="e.g. PostgreSQL CTEs & Recursive Queries, or Pandas Polars Benchmarks"
                    className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Target Learning Track
                  </label>
                  <select
                    value={aiTrackInput}
                    onChange={(e) => setAiTrackInput(e.target.value as NoteTrack)}
                    className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    {Object.keys(TRACK_CONFIG).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2.5 pt-2">
                  {onNavigateToAI ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAISynthesizerOpen(false);
                        onNavigateToAI();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      <Bot className="size-3.5" />
                      <span>Full AI Assistant</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAISynthesizerOpen(false)}
                      className="rounded-xl border border-border/80 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isGeneratingNote || !aiTopicInput.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      {isGeneratingNote ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Synthesizing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5" />
                          <span>Synthesize Note</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Helper to render rich markdown in the note detail reader
 */
function renderFormattedMarkdown(text: string) {
  const lines = text.split("\n");

  return lines.map((line, idx) => {
    // Alert callout
    if (line.startsWith("> [!NOTE]")) {
      return (
        <div
          key={idx}
          className="my-3 flex items-start gap-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-300"
        >
          <Lightbulb className="size-4 shrink-0 text-blue-400 mt-0.5" />
          <div className="font-medium">Note:</div>
        </div>
      );
    }
    if (line.startsWith("> [!TIP]")) {
      return (
        <div
          key={idx}
          className="my-3 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
          <div className="font-medium">Tip:</div>
        </div>
      );
    }
    if (line.startsWith("> [!WARNING]")) {
      return (
        <div
          key={idx}
          className="my-3 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300"
        >
          <AlertCircle className="size-4 shrink-0 text-amber-400 mt-0.5" />
          <div className="font-medium">Warning:</div>
        </div>
      );
    }
    if (line.startsWith("> ")) {
      return (
        <blockquote
          key={idx}
          className="my-2 border-l-2 border-primary/50 pl-3 text-xs italic text-muted-foreground"
        >
          {line.replace("> ", "")}
        </blockquote>
      );
    }

    // Headings
    if (line.startsWith("### ")) {
      return (
        <h4
          key={idx}
          className="text-sm font-bold text-foreground mt-4 mb-1.5 flex items-center gap-1.5"
        >
          {line.replace("### ", "")}
        </h4>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h3
          key={idx}
          className="text-base font-bold text-foreground mt-5 mb-2 pb-1 border-b border-border/40"
        >
          {line.replace("## ", "")}
        </h3>
      );
    }
    if (line.startsWith("# ")) {
      return (
        <h2 key={idx} className="text-lg font-bold text-foreground mt-6 mb-2">
          {line.replace("# ", "")}
        </h2>
      );
    }

    // Bullet points
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      return (
        <div key={idx} className="flex items-start gap-2 pl-2 my-0.5">
          <span className="text-primary mt-1 text-xs">•</span>
          <span className="text-xs leading-relaxed">{renderInline(line.trim().slice(2))}</span>
        </div>
      );
    }

    // Numbered lists
    if (/^\d+\.\s/.test(line.trim())) {
      const match = line.trim().match(/^(\d+)\.\s(.*)$/);
      return (
        <div key={idx} className="flex items-start gap-2 pl-2 my-0.5">
          <span className="text-xs font-mono font-bold text-primary mt-0.5">
            {match?.[1]}.
          </span>
          <span className="text-xs leading-relaxed">{renderInline(match?.[2] || "")}</span>
        </div>
      );
    }

    // Empty lines
    if (line.trim() === "") {
      return <div key={idx} className="h-2" />;
    }

    // Standard paragraph
    return (
      <p key={idx} className="text-xs leading-relaxed">
        {renderInline(line)}
      </p>
    );
  });
}

function renderInline(str: string) {
  const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[11px] text-primary border border-border/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
