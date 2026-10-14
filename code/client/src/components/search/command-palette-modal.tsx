import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  Zap,
  ListTodo,
  FolderKanban,
  NotebookTabs,
  Tag as TagIcon,
  CornerDownLeft,
} from "lucide-react";
import { useTaskManager } from "@/components/tasks/task-context";
import { useProjects } from "@/components/projects/project-context";
import { useNotes } from "@/components/notes/note-context";
import { useTags } from "@/components/tags/tag-context";
import { indexEntities, executeSearch } from "./search-engine";
import { SearchResultItem, SearchAction } from "./search-types";
import { cn } from "@/lib/utils";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTo: (view: string) => void;
  onOpenTaskModal?: () => void;
  onOpenProjectModal?: () => void;
  onOpenNoteModal?: () => void;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  onNavigateTo,
  onOpenTaskModal,
  onOpenProjectModal,
  onOpenNoteModal,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { tasks } = useTaskManager();
  const { projects, setSelectedProjectId } = useProjects();
  const { notes, setSelectedNoteId } = useNotes();
  const { tags, openTagManager } = useTags();

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Platform Actions
  const platformActions = useMemo<SearchAction[]>(
    () => [
      {
        id: "cmd-nav-search",
        title: "Open Dedicated Search Workspace",
        description: "Full two-pane search engine with live preview inspector",
        icon: "search",
        actionType: "navigate",
        shortcut: "⌘K",
        handler: () => {
          onNavigateTo("Search");
          onClose();
        },
      },
      {
        id: "cmd-new-task",
        title: "Create New Task",
        description: "Add a new task to your sprint pipeline",
        icon: "plus",
        actionType: "open_modal",
        handler: () => {
          onClose();
          if (onOpenTaskModal) onOpenTaskModal();
          else onNavigateTo("Tasks");
        },
      },
      {
        id: "cmd-new-project",
        title: "Create New Project",
        description: "Initialize a new project milestone tracker",
        icon: "folder",
        actionType: "open_modal",
        handler: () => {
          onClose();
          if (onOpenProjectModal) onOpenProjectModal();
          else onNavigateTo("Projects");
        },
      },
      {
        id: "cmd-new-note",
        title: "Create New Note",
        description: "Draft markdown notes and code snippets",
        icon: "note",
        actionType: "open_modal",
        handler: () => {
          onClose();
          if (onOpenNoteModal) onOpenNoteModal();
          else onNavigateTo("Notes");
        },
      },
      {
        id: "cmd-nav-dashboard",
        title: "Go to Dashboard",
        description: "Workspace analytics, tasks metrics, and progress",
        icon: "layout",
        actionType: "navigate",
        handler: () => {
          onNavigateTo("Dashboard");
          onClose();
        },
      },
      {
        id: "cmd-nav-tasks",
        title: "Go to Tasks",
        description: "View sprint backlog, Kanban, and deadline alerts",
        icon: "tasks",
        actionType: "navigate",
        handler: () => {
          onNavigateTo("Tasks");
          onClose();
        },
      },
      {
        id: "cmd-nav-projects",
        title: "Go to Projects",
        description: "Manage portfolio projects, deliverables, and tech stack",
        icon: "projects",
        actionType: "navigate",
        handler: () => {
          onNavigateTo("Projects");
          onClose();
        },
      },
      {
        id: "cmd-nav-notes",
        title: "Go to Notes",
        description: "Browse knowledge base and code snippets",
        icon: "notes",
        actionType: "navigate",
        handler: () => {
          onNavigateTo("Notes");
          onClose();
        },
      },
      {
        id: "cmd-nav-ai",
        title: "Open AI Assistant",
        description: "Chat with SkillOS Copilot for guidance and roadmap generation",
        icon: "ai",
        actionType: "navigate",
        handler: () => {
          onNavigateTo("AI Assistant");
          onClose();
        },
      },
      {
        id: "cmd-manage-tags",
        title: "Manage Universal Tags",
        description: "Create and edit cross-entity color tags",
        icon: "tag",
        actionType: "open_modal",
        handler: () => {
          onClose();
          openTagManager();
        },
      },
    ],
    [
      onNavigateTo,
      onClose,
      onOpenTaskModal,
      onOpenProjectModal,
      onOpenNoteModal,
      openTagManager,
    ]
  );

  // Indexed documents
  const indexedDocs = useMemo(() => {
    return indexEntities({
      tasks,
      projects,
      notes,
      tags,
      actions: platformActions,
    });
  }, [tasks, projects, notes, tags, platformActions]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return platformActions.map((act) => ({
        document: {
          id: act.id,
          type: "action" as const,
          title: act.title,
          subtitle: act.description,
          content: `${act.title} ${act.description}`,
          tags: [],
          raw: act,
          meta: { shortcut: act.shortcut },
        },
        score: 100,
        titleHighlights: [{ text: act.title, isMatch: false }],
        snippet: act.description,
        snippetHighlights: [{ text: act.description, isMatch: false }],
        matchedField: "none" as const,
      }));
    }
    const { results } = executeSearch(query, indexedDocs);
    return results.slice(0, 15);
  }, [query, indexedDocs, platformActions]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Select Item Handler
  const handleSelectItem = (item: SearchResultItem) => {
    const doc = item.document;
    onClose();

    if (doc.type === "action") {
      const act = doc.raw as SearchAction;
      if (act.handler) act.handler();
    } else if (doc.type === "task") {
      onNavigateTo("Tasks");
    } else if (doc.type === "project") {
      setSelectedProjectId(doc.id);
      onNavigateTo("Projects");
    } else if (doc.type === "note") {
      setSelectedNoteId(doc.id);
      onNavigateTo("Notes");
    } else if (doc.type === "tag") {
      onNavigateTo("Search");
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : Math.max(0, searchResults.length - 1)
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelectItem(searchResults[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-2xl rounded-3xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl overflow-hidden z-10 flex flex-col max-h-[80vh]"
          >
            {/* Input Bar */}
            <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5">
              <Search className="size-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command, task, project, note, or tag..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="grid size-6 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ESC
                </kbd>
              )}
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-2 space-y-1 divide-y-0"
            >
              {searchResults.length > 0 ? (
                searchResults.map((item, idx) => {
                  const doc = item.document;
                  const isSelected = idx === selectedIndex;

                  let Icon = Zap;
                  let typeColor = "text-cyan-400";
                  if (doc.type === "task") {
                    Icon = ListTodo;
                    typeColor = "text-blue-400";
                  } else if (doc.type === "project") {
                    Icon = FolderKanban;
                    typeColor = "text-purple-400";
                  } else if (doc.type === "note") {
                    Icon = NotebookTabs;
                    typeColor = "text-emerald-400";
                  } else if (doc.type === "tag") {
                    Icon = TagIcon;
                    typeColor = "text-amber-400";
                  }

                  return (
                    <div
                      key={`${doc.type}-${doc.id}`}
                      data-index={idx}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl text-xs transition-colors cursor-pointer select-none",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted/70"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "grid size-8 place-items-center rounded-xl shrink-0 transition-colors",
                            isSelected
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className={cn("size-4", !isSelected && typeColor)} />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span
                            className={cn(
                              "font-semibold truncate",
                              isSelected ? "text-primary-foreground" : "text-foreground"
                            )}
                          >
                            {doc.title}
                          </span>
                          {doc.subtitle && (
                            <span
                              className={cn(
                                "text-[11px] truncate",
                                isSelected
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              )}
                            >
                              {doc.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {doc.meta?.shortcut && (
                          <kbd
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-mono border",
                              isSelected
                                ? "border-primary-foreground/30 bg-primary-foreground/20 text-primary-foreground"
                                : "border-border/60 bg-muted/50 text-muted-foreground"
                            )}
                          >
                            {doc.meta.shortcut}
                          </kbd>
                        )}
                        <span
                          className={cn(
                            "text-[10px] capitalize px-1.5 py-0.5 rounded font-medium",
                            isSelected
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {doc.type}
                        </span>
                        {isSelected && (
                          <CornerDownLeft className="size-3.5 text-primary-foreground shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">No matches found</p>
                  <p>Try searching for a different keyword or command.</p>
                </div>
              )}
            </div>

            {/* Bottom Keyboard Guide */}
            <div className="flex items-center justify-between border-t border-border/70 bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-border/70 bg-background text-[10px]">
                    ↑↓
                  </kbd>{" "}
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-border/70 bg-background text-[10px]">
                    ↵
                  </kbd>{" "}
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-border/70 bg-background text-[10px]">
                    ESC
                  </kbd>{" "}
                  Close
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTo("Search");
                }}
                className="hover:text-primary transition-colors cursor-pointer text-xs font-sans font-medium"
              >
                Open Full Search Engine →
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
