import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  X,
  Filter,
  SlidersHorizontal,
  Sparkles,
  Zap,
  ListTodo,
  FolderKanban,
  NotebookTabs,
  Tag as TagIcon,
  Clock,
  RotateCcw,
  HelpCircle,
  ChevronDown,
  Check,
  Plus,
} from "lucide-react";
import {
  SearchEntityType,
  SearchFilterState,
  SearchResultItem,
  SearchAction,
  SearchSortOption,
} from "./search-types";
import {
  indexEntities,
  executeSearch,
} from "./search-engine";
import { SearchResultCard } from "./search-result-card";
import { SearchDetailInspector } from "./search-detail-inspector";
import { useTaskManager } from "@/components/tasks/task-context";
import { useProjects } from "@/components/projects/project-context";
import { useNotes } from "@/components/notes/note-context";
import { useTags } from "@/components/tags/tag-context";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SEARCH_HISTORY_KEY = "skillos_search_history_v1";

export interface SearchViewProps {
  initialQuery?: string;
  onNavigateToTasks?: () => void;
  onNavigateToProjects?: () => void;
  onNavigateToNotes?: () => void;
  onNavigateToAI?: () => void;
  onNavigateToInbox?: () => void;
  onNavigateToDashboard?: () => void;
  onOpenTaskModal?: () => void;
  onOpenProjectModal?: () => void;
  onOpenNoteModal?: () => void;
}

const ENTITY_TABS: {
  id: SearchEntityType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "all", label: "All Items", icon: Search },
  { id: "task", label: "Tasks", icon: ListTodo },
  { id: "project", label: "Projects", icon: FolderKanban },
  { id: "note", label: "Notes", icon: NotebookTabs },
  { id: "tag", label: "Tags", icon: TagIcon },
  { id: "action", label: "Actions", icon: Zap },
];

const SUGGESTIONS = [
  { label: "⚡ Urgent Tasks", query: "type:task is:urgent" },
  { label: "⏳ In Progress", query: "status:in_progress" },
  { label: "📌 Pinned Notes", query: "type:note is:pinned" },
  { label: "📝 Code Snippets", query: "type:note has:code" },
  { label: "🏷️ #frontend", query: "#frontend" },
  { label: "🏷️ #security", query: "#security" },
];

export function SearchView({
  initialQuery = "",
  onNavigateToTasks,
  onNavigateToProjects,
  onNavigateToNotes,
  onNavigateToAI,
  onNavigateToInbox,
  onNavigateToDashboard,
  onOpenTaskModal,
  onOpenProjectModal,
  onOpenNoteModal,
}: SearchViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [filterState, setFilterState] = useState<SearchFilterState>({
    entityType: "all",
    status: "all",
    priority: "all",
    tag: "all",
    sortBy: "relevance",
  });
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load Contexts
  const { tasks, updateTask } = useTaskManager();
  const { projects, setSelectedProjectId } = useProjects();
  const { notes, togglePinNote, setSelectedNoteId } = useNotes();
  const { tags, openTagManager } = useTags();

  // Load Search History
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to load search history:", e);
    }
  }, []);

  const saveToHistory = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((h) => h.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to save search history:", e);
      }
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {
      console.warn("Failed to clear search history:", e);
    }
  };

  // Define Platform Actions
  const platformActions = useMemo<SearchAction[]>(() => [
    {
      id: "act-new-task",
      title: "Create New Task",
      description: "Quickly log a new task with deadline and stage",
      icon: "plus",
      actionType: "open_modal",
      shortcut: "N",
      handler: () => {
        if (onOpenTaskModal) onOpenTaskModal();
        else if (onNavigateToTasks) onNavigateToTasks();
      },
    },
    {
      id: "act-new-project",
      title: "Create New Project",
      description: "Start a new tracked project portfolio item",
      icon: "folder",
      actionType: "open_modal",
      handler: () => {
        if (onOpenProjectModal) onOpenProjectModal();
        else if (onNavigateToProjects) onNavigateToProjects();
      },
    },
    {
      id: "act-new-note",
      title: "Create New Note",
      description: "Capture technical documentation, markdown, or code",
      icon: "note",
      actionType: "open_modal",
      handler: () => {
        if (onOpenNoteModal) onOpenNoteModal();
        else if (onNavigateToNotes) onNavigateToNotes();
      },
    },
    {
      id: "act-ai-copilot",
      title: "Ask AI Assistant",
      description: "Generate roadmaps, breakdown tasks, or analyze skills",
      icon: "sparkles",
      actionType: "navigate",
      handler: onNavigateToAI,
    },
    {
      id: "act-manage-tags",
      title: "Manage Universal Tags",
      description: "Configure colors, names, and cross-entity tags",
      icon: "tag",
      actionType: "open_modal",
      handler: openTagManager,
    },
    {
      id: "act-nav-dashboard",
      title: "Go to Dashboard",
      description: "Return to organization overview and metrics",
      icon: "layout",
      actionType: "navigate",
      handler: onNavigateToDashboard,
    },
    {
      id: "act-nav-inbox",
      title: "View Inbox",
      description: "Check recent notifications, alerts, and system pings",
      icon: "inbox",
      actionType: "navigate",
      handler: onNavigateToInbox,
    },
  ], [
    onOpenTaskModal,
    onNavigateToTasks,
    onOpenProjectModal,
    onNavigateToProjects,
    onOpenNoteModal,
    onNavigateToNotes,
    onNavigateToAI,
    openTagManager,
    onNavigateToDashboard,
    onNavigateToInbox,
  ]);

  // Build Normalized Index
  const indexedDocs = useMemo(() => {
    return indexEntities({
      tasks,
      projects,
      notes,
      tags,
      actions: platformActions,
    });
  }, [tasks, projects, notes, tags, platformActions]);

  // Execute Search
  const { results, stats } = useMemo(() => {
    return executeSearch(query, indexedDocs, filterState);
  }, [query, indexedDocs, filterState]);

  // Keep first result selected if current selection is invalid or null
  useEffect(() => {
    if (results.length > 0) {
      if (!selectedResultId || !results.some((r) => r.document.id === selectedResultId)) {
        setSelectedResultId(results[0].document.id);
      }
    } else {
      setSelectedResultId(null);
    }
  }, [results, selectedResultId]);

  const selectedResult = useMemo(() => {
    return results.find((r) => r.document.id === selectedResultId)?.document || null;
  }, [results, selectedResultId]);

  // Action handlers
  const handleOpenItem = (item: SearchResultItem) => {
    const doc = item.document;
    saveToHistory(query || doc.title);

    if (doc.type === "task") {
      if (onNavigateToTasks) onNavigateToTasks();
    } else if (doc.type === "project") {
      setSelectedProjectId(doc.id);
      if (onNavigateToProjects) onNavigateToProjects();
    } else if (doc.type === "note") {
      setSelectedNoteId(doc.id);
      if (onNavigateToNotes) onNavigateToNotes();
    } else if (doc.type === "tag") {
      setFilterState((prev) => ({ ...prev, tag: (doc.raw as any).name }));
    } else if (doc.type === "action") {
      const act = doc.raw as SearchAction;
      if (act.handler) act.handler();
    }
  };

  const handleToggleTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const nextStatus = target.status === "completed" ? "in_progress" : "completed";
    updateTask(taskId, {
      status: nextStatus,
      completedAt: nextStatus === "completed" ? new Date().toISOString() : undefined,
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* ===================== TOP HEADER & OMNI SEARCH BAR ===================== */}
      <div className="border-b border-border/70 bg-card/60 backdrop-blur-md px-4 sm:px-6 py-4 space-y-3">
        {/* Omni Search Input Box */}
        <div className="flex items-center gap-2">
          <div
            onClick={() => inputRef.current?.focus()}
            className="group relative flex flex-1 items-center gap-3 h-12 rounded-2xl border border-border/80 bg-background/95 dark:bg-card/90 px-4 shadow-sm transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25 cursor-text"
          >
            <Search className="size-5 text-muted-foreground group-focus-within:text-primary transition-colors shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  saveToHistory(query.trim());
                }
              }}
              placeholder="Search tasks, projects, notes, tags, or use operators (e.g. type:task is:urgent #frontend)..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/80 outline-none leading-none"
            />

            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                title="Clear search query"
                className="grid size-6 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground select-none pointer-events-none">
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-lg border border-border/70 bg-muted/60 px-2 py-1 font-mono text-[11px]">
                  <span>⌘</span>K
                </kbd>
              </div>
            )}
          </div>

          {/* New Task / Quick Add Action */}
          {onOpenTaskModal && (
            <button
              type="button"
              onClick={onOpenTaskModal}
              title="Quick Add Task"
              className="hidden sm:inline-flex items-center gap-1.5 h-12 px-4 rounded-2xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs shrink-0"
            >
              <Plus className="size-4" />
              <span>New Task</span>
            </button>
          )}
        </div>

        {/* Filter Tabs & Options Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Entity Scope Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-none">
            {ENTITY_TABS.map((tab) => {
              const Icon = tab.icon;
              const count =
                tab.id === "all"
                  ? stats.totalResults
                  : stats.countsByType[tab.id as Exclude<SearchEntityType, "all">] || 0;
              const isActive = filterState.entityType === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setFilterState((prev) => ({
                      ...prev,
                      entityType: tab.id,
                    }))
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer select-none",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-border/70 bg-background/80 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary Filters Dropdowns */}
          <div className="flex items-center gap-2">
            {/* Priority Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl border text-xs font-medium transition-colors shadow-xs cursor-pointer",
                    filterState.priority !== "all"
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/70 bg-background hover:bg-muted/60 text-muted-foreground"
                  )}
                >
                  <Filter className="size-3" />
                  <span>
                    {filterState.priority === "all"
                      ? "Priority"
                      : filterState.priority.toUpperCase()}
                  </span>
                  <ChevronDown className="size-2.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs">Filter Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {["all", "urgent", "high", "medium", "low"].map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => setFilterState((prev) => ({ ...prev, priority: p }))}
                    className="text-xs capitalize flex items-center justify-between cursor-pointer"
                  >
                    <span>{p === "all" ? "All Priorities" : p}</span>
                    {filterState.priority === p && <Check className="size-3 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-border/70 bg-background text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors shadow-xs cursor-pointer"
                >
                  <SlidersHorizontal className="size-3" />
                  <span className="capitalize">{filterState.sortBy}</span>
                  <ChevronDown className="size-2.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs">Sort Results</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(
                  [
                    { id: "relevance", label: "Best Match / Relevance" },
                    { id: "updated", label: "Recently Updated" },
                    { id: "priority", label: "Highest Priority" },
                    { id: "title", label: "Alphabetical (A-Z)" },
                  ] as { id: SearchSortOption; label: string }[]
                ).map((opt) => (
                  <DropdownMenuItem
                    key={opt.id}
                    onClick={() =>
                      setFilterState((prev) => ({ ...prev, sortBy: opt.id }))
                    }
                    className="text-xs flex items-center justify-between cursor-pointer"
                  >
                    <span>{opt.label}</span>
                    {filterState.sortBy === opt.id && (
                      <Check className="size-3 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear All Filters Button */}
            {(filterState.entityType !== "all" ||
              filterState.priority !== "all" ||
              filterState.status !== "all" ||
              filterState.tag !== "all") && (
              <button
                type="button"
                onClick={() =>
                  setFilterState({
                    entityType: "all",
                    status: "all",
                    priority: "all",
                    tag: "all",
                    sortBy: "relevance",
                  })
                }
                className="text-xs text-primary hover:underline font-medium px-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===================== SEARCH BODY (SPLIT MASTER-DETAIL) ===================== */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Column: Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Search Metrics Bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">
              Found <strong className="text-foreground">{results.length}</strong> {results.length === 1 ? "match" : "matches"}
              {query && <span> for &ldquo;<span className="text-foreground font-semibold">{query}</span>&rdquo;</span>}
            </span>
            <span className="font-mono text-[11px]">
              Executed in {stats.elapsedMs}ms
            </span>
          </div>

          {/* Zero State: Query is Empty -> Suggestions & History */}
          {!query.trim() && (
            <div className="space-y-6 pt-2">
              {/* Recent Searches */}
              {history.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Clear History
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {history.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setQuery(item);
                          inputRef.current?.focus();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card/60 px-3 py-1.5 text-xs text-foreground hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                      >
                        <RotateCcw className="size-3 text-muted-foreground" />
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Query Suggestions */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-400" />
                  Quick Filter Presets
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUGGESTIONS.map((sug) => (
                    <button
                      key={sug.label}
                      type="button"
                      onClick={() => {
                        setQuery(sug.query);
                        inputRef.current?.focus();
                      }}
                      className="flex flex-col items-start gap-1 p-3 rounded-2xl border border-border/70 bg-card/50 hover:border-primary hover:bg-card/90 transition-all text-left cursor-pointer group"
                    >
                      <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {sug.label}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {sug.query}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Operators Cheat Sheet */}
              <div className="rounded-2xl border border-border/70 bg-card/30 p-4 space-y-3">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <HelpCircle className="size-3.5 text-primary" />
                  Search Engine Operators Reference
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-border/50 bg-background/50 p-2.5 space-y-0.5">
                    <span className="font-mono font-semibold text-primary text-[11px]">type:task | note | project</span>
                    <p className="text-[11px] text-muted-foreground">Filter strictly by entity category</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/50 p-2.5 space-y-0.5">
                    <span className="font-mono font-semibold text-primary text-[11px]">is:urgent | is:completed</span>
                    <p className="text-[11px] text-muted-foreground">Match urgent priority or finished tasks</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/50 p-2.5 space-y-0.5">
                    <span className="font-mono font-semibold text-primary text-[11px]">#tag or tag:frontend</span>
                    <p className="text-[11px] text-muted-foreground">Search universal cross-entity tags</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/50 p-2.5 space-y-0.5">
                    <span className="font-mono font-semibold text-primary text-[11px]">has:code</span>
                    <p className="text-[11px] text-muted-foreground">Find knowledge notes containing code snippets</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Stream */}
          {results.length > 0 ? (
            <div className="space-y-2.5">
              {results.map((item) => (
                <SearchResultCard
                  key={item.document.id}
                  item={item}
                  isSelected={selectedResultId === item.document.id}
                  onSelect={() => setSelectedResultId(item.document.id)}
                  onOpen={() => handleOpenItem(item)}
                  onToggleTaskComplete={handleToggleTask}
                  onToggleNotePin={togglePinNote}
                />
              ))}
            </div>
          ) : query.trim() ? (
            /* Empty state for query without results */
            <div className="flex flex-col items-center justify-center p-12 text-center border border-border/60 rounded-3xl bg-card/20 space-y-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <Search className="size-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                No matching results found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                We couldn&apos;t find anything matching &ldquo;{query}&rdquo;. Try checking for typos, clearing filters, or searching by #tag or entity type.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilterState({
                    entityType: "all",
                    status: "all",
                    priority: "all",
                    tag: "all",
                    sortBy: "relevance",
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Clear Query & Filters
              </button>
            </div>
          ) : null}
        </div>

        {/* Right Column: Live Detail Inspector Preview Pane */}
        <div className="hidden lg:block w-[420px] xl:w-[480px] p-4 sm:p-6 pl-0 border-l border-border/70 overflow-hidden">
          <SearchDetailInspector
            document={selectedResult}
            onOpenInView={(doc) => {
              const matched = results.find((r) => r.document.id === doc.id);
              if (matched) handleOpenItem(matched);
            }}
            onToggleTaskComplete={handleToggleTask}
            onToggleNotePin={togglePinNote}
            onFilterByTag={(tagName) => {
              setQuery(`#${tagName}`);
            }}
            onOpenTagManager={openTagManager}
          />
        </div>
      </div>
    </div>
  );
}
