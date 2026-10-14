import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Inbox,
  Search,
  CheckCheck,
  Archive,
  RotateCcw,
  Filter,
  Flame,
  CheckCircle2,
  X,
  Keyboard,
  MoreVertical,
} from "lucide-react";
import { useInbox } from "./inbox-context";
import { InboxItemRow } from "./inbox-item-row";
import { InboxDetailsPane } from "./inbox-details-pane";
import { InboxFilterTab, InboxItem } from "./inbox-types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InboxViewProps {
  onNavigateToTasks?: (taskId?: string) => void;
  onNavigateToAI?: (initialPrompt?: string) => void;
  onNavigateToNotes?: (noteId?: string) => void;
  onNavigateToWorkflows?: () => void;
}

export function InboxView({
  onNavigateToTasks,
  onNavigateToAI,
  onNavigateToNotes,
  onNavigateToWorkflows,
}: InboxViewProps) {
  const {
    items,
    selectedItemId,
    setSelectedItemId,
    selectedItem,
    metrics,
    filterTab,
    setFilterTab,
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    toastMessage,
    clearToast,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    archiveItem,
    unarchiveItem,
    archiveAllRead,
    toggleStar,
    deleteItem,
    resetToInitialSeed,
  } = useInbox();

  // Mobile navigation state: show detail view or list view
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Filtered and sorted notifications list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Tab filtering
      if (filterTab === "unread" && item.status !== "unread") return false;
      if (filterTab === "archived") {
        if (item.status !== "archived") return false;
      } else {
        // Any non-archived tab hides archived items
        if (item.status === "archived") return false;
      }

      if (filterTab === "ai" && item.category !== "ai") return false;
      if (filterTab === "task" && item.category !== "task") return false;
      if (filterTab === "workflow" && item.category !== "workflow") return false;
      if (filterTab === "security" && item.category !== "security") return false;

      // 2. Priority filtering
      if (priorityFilter !== "all" && item.priority !== priorityFilter) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSnippet = item.snippet.toLowerCase().includes(q);
        const matchesSource = item.source.name.toLowerCase().includes(q);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSnippet && !matchesSource && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [items, filterTab, priorityFilter, searchQuery]);

  // Keep selectedItemId valid when filtering
  useEffect(() => {
    if (filteredItems.length > 0) {
      const stillInList = filteredItems.some((i) => i.id === selectedItemId);
      if (!stillInList && !selectedItemId) {
        setSelectedItemId(filteredItems[0].id);
      }
    }
  }, [filteredItems, selectedItemId, setSelectedItemId]);

  // Auto mark read when opening an item (after slight delay to allow preview)
  const handleSelectItem = (item: InboxItem) => {
    setSelectedItemId(item.id);
    setMobileShowDetail(true);
    if (item.status === "unread") {
      markAsRead(item.id);
    }
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts if focus is inside an input/textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        if (filteredItems.length === 0) return;
        const currentIndex = filteredItems.findIndex(
          (i) => i.id === selectedItemId
        );
        const nextIndex =
          currentIndex < filteredItems.length - 1 ? currentIndex + 1 : 0;
        const nextItem = filteredItems[nextIndex];
        if (nextItem) {
          setSelectedItemId(nextItem.id);
          if (nextItem.status === "unread") markAsRead(nextItem.id);
        }
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        if (filteredItems.length === 0) return;
        const currentIndex = filteredItems.findIndex(
          (i) => i.id === selectedItemId
        );
        const prevIndex =
          currentIndex > 0 ? currentIndex - 1 : filteredItems.length - 1;
        const prevItem = filteredItems[prevIndex];
        if (prevItem) {
          setSelectedItemId(prevItem.id);
          if (prevItem.status === "unread") markAsRead(prevItem.id);
        }
      } else if (e.key === "e") {
        // Archive
        if (selectedItemId) {
          e.preventDefault();
          archiveItem(selectedItemId);
        }
      } else if (e.key === "u") {
        // Toggle unread
        if (selectedItem) {
          e.preventDefault();
          if (selectedItem.status === "unread") {
            markAsRead(selectedItem.id);
          } else {
            markAsUnread(selectedItem.id);
          }
        }
      } else if (e.key === "s") {
        // Star
        if (selectedItemId) {
          e.preventDefault();
          toggleStar(selectedItemId);
        }
      } else if (e.key === "?") {
        e.preventDefault();
        setShowShortcutsHelp((v) => !v);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    filteredItems,
    selectedItemId,
    selectedItem,
    archiveItem,
    markAsRead,
    markAsUnread,
    toggleStar,
    setSelectedItemId,
  ]);

  return (
    <div className="flex flex-1 flex-col h-full min-h-0 overflow-hidden bg-background">
      {/* View Header */}
      <div className="flex flex-col gap-3 border-b border-border/40 bg-card/10 px-4 py-3 md:px-6 backdrop-blur-sm shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Inbox className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">Inbox</h1>
                {metrics.unread > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-xs font-semibold text-primary">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    {metrics.unread} unread
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    All caught up
                  </span>
                )}

                {metrics.urgent > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-400">
                    <Flame className="size-3" />
                    {metrics.urgent} urgent
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Consolidated alerts across workflows, AI Copilot, tasks, and system integrity.
              </p>
            </div>
          </div>

          {/* Quick Actions & Menu */}
          <div className="flex items-center gap-2">
            {/* Mark All As Read */}
            {metrics.unread > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                title="Mark all notifications as read"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/70 px-3 py-1.5 text-xs font-medium text-foreground transition-colors cursor-pointer"
              >
                <CheckCheck className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}

            {/* Archive All Read */}
            <button
              type="button"
              onClick={archiveAllRead}
              title="Archive all read notifications"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/70 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Archive className="size-3.5" />
              <span className="hidden sm:inline">Archive read</span>
            </button>

            {/* Overflow & Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="More actions"
                  className="grid size-8 place-items-center rounded-xl border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <MoreVertical className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Inbox Controls</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowShortcutsHelp(true)}
                  className="text-xs cursor-pointer flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Keyboard className="size-3.5 text-muted-foreground" />
                    Keyboard Shortcuts
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">?</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={resetToInitialSeed}
                  className="text-xs cursor-pointer flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" />
                  Reset to Sample Alerts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search Bar & Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications, senders, or #tags..."
              className="w-full h-8.5 rounded-xl border border-border/60 bg-background/60 pl-8.5 pr-8 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/80 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                title="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Priority Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 h-8.5 px-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer",
                  priorityFilter !== "all"
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/60 bg-background/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Filter className="size-3.5" />
                <span className="capitalize">
                  {priorityFilter === "all" ? "Priority: All" : `Priority: ${priorityFilter}`}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(["all", "urgent", "high", "normal", "low"] as const).map((p) => (
                <DropdownMenuItem
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className="text-xs capitalize cursor-pointer flex items-center justify-between"
                >
                  <span>{p}</span>
                  {priorityFilter === p && <span className="size-1.5 rounded-full bg-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
            {(
              [
                { id: "all", label: "All", count: metrics.total },
                { id: "unread", label: "Unread", count: metrics.unread },
                { id: "ai", label: "AI Copilot" },
                { id: "task", label: "Tasks" },
                { id: "workflow", label: "Workflows" },
                { id: "security", label: "Security" },
                { id: "archived", label: "Archived", count: metrics.archived },
              ] as const
            ).map((tab) => {
              const isActive = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id as InboxFilterTab)}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <span>{tab.label}</span>
                  {"count" in tab && typeof tab.count === "number" && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Two-Pane Container */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Master List Feed */}
        <div
          className={cn(
            "flex flex-col h-full min-h-0 border-r border-border/40 bg-card/15 overflow-y-auto p-3 space-y-2.5 transition-all duration-200",
            // Responsive visibility: On desktop, show left pane; on mobile, hide if detail view is active
            mobileShowDetail ? "hidden md:flex md:w-[420px] lg:w-[460px] shrink-0" : "flex w-full md:w-[420px] lg:w-[460px] shrink-0"
          )}
        >
          {filteredItems.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="max-w-xs space-y-2">
                <div className="mx-auto grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <CheckCircle2 className="size-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  No notifications found
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {searchQuery
                    ? `No notifications matched "${searchQuery}".`
                    : filterTab === "unread"
                    ? "You're all caught up! No unread notifications remaining."
                    : filterTab === "archived"
                    ? "Archive is empty."
                    : "There are no notifications matching your active filters."}
                </p>
                {filterTab !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterTab("all");
                      setPriorityFilter("all");
                      setSearchQuery("");
                    }}
                    className="mt-2 text-xs text-primary font-medium hover:underline cursor-pointer"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredItems.map((item) => (
              <InboxItemRow
                key={item.id}
                item={item}
                isSelected={item.id === selectedItemId}
                onSelect={() => handleSelectItem(item)}
                onToggleStar={(e) => {
                  e.stopPropagation();
                  toggleStar(item.id);
                }}
                onToggleRead={(e) => {
                  e.stopPropagation();
                  if (item.status === "unread") {
                    markAsRead(item.id);
                  } else {
                    markAsUnread(item.id);
                  }
                }}
                onArchive={(e) => {
                  e.stopPropagation();
                  archiveItem(item.id);
                }}
                onUnarchive={
                  item.status === "archived"
                    ? (e) => {
                        e.stopPropagation();
                        unarchiveItem(item.id);
                      }
                    : undefined
                }
              />
            ))
          )}
        </div>

        {/* Right Detail Pane */}
        <div
          className={cn(
            "flex flex-1 min-h-0 h-full overflow-hidden transition-all duration-200",
            // Responsive visibility: On mobile, only show when mobileShowDetail is true
            !mobileShowDetail ? "hidden md:flex" : "flex w-full"
          )}
        >
          <InboxDetailsPane
            item={selectedItem}
            onBackToList={() => setMobileShowDetail(false)}
            onToggleStar={toggleStar}
            onToggleRead={(id) => {
              if (selectedItem?.status === "unread") {
                markAsRead(id);
              } else {
                markAsUnread(id);
              }
            }}
            onArchive={archiveItem}
            onUnarchive={unarchiveItem}
            onDelete={deleteItem}
            onNavigateToTasks={onNavigateToTasks}
            onNavigateToAI={onNavigateToAI}
            onNavigateToNotes={onNavigateToNotes}
            onNavigateToWorkflows={onNavigateToWorkflows}
          />
        </div>
      </div>

      {/* Floating Subtle Feedback Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-border/80 bg-background/95 px-4 py-2.5 text-xs text-foreground shadow-lg backdrop-blur-md"
          >
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={clearToast}
              className="ml-2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Dialog Modal */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-background p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Keyboard Shortcuts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsHelp(false)}
                className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { key: "J / ↓", desc: "Select next notification" },
                { key: "K / ↑", desc: "Select previous notification" },
                { key: "E", desc: "Archive selected notification" },
                { key: "U", desc: "Toggle read / unread" },
                { key: "S", desc: "Star / bookmark notification" },
                { key: "?", desc: "Show / hide shortcuts help" },
              ].map(({ key, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-1 border-b border-border/40 last:border-0"
                >
                  <span className="text-muted-foreground">{desc}</span>
                  <kbd className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground font-semibold">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowShortcutsHelp(false)}
              className="w-full rounded-xl bg-primary py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
