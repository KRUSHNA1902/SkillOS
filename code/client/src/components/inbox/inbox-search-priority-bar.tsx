import React, { useRef } from "react";
import {
  Search,
  X,
  Filter,
  Flame,
  AlertTriangle,
  Shield,
  Clock,
  Check,
  ChevronDown,
} from "lucide-react";
import { InboxPriority } from "./inbox-types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InboxSearchPriorityBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priorityFilter: "all" | InboxPriority;
  onPriorityChange: (priority: "all" | InboxPriority) => void;
  totalFilteredCount?: number;
}

const PRIORITY_CONFIG: Record<
  InboxPriority,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
    dotClass: string;
  }
> = {
  urgent: {
    label: "Urgent",
    icon: Flame,
    badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    dotClass: "bg-rose-500",
  },
  high: {
    label: "High",
    icon: AlertTriangle,
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  normal: {
    label: "Normal",
    icon: Shield,
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    dotClass: "bg-blue-500",
  },
  low: {
    label: "Low",
    icon: Clock,
    badgeClass: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    dotClass: "bg-zinc-500",
  },
};

export function InboxSearchPriorityBar({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  totalFilteredCount,
}: InboxSearchPriorityBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConfig =
    priorityFilter !== "all" ? PRIORITY_CONFIG[priorityFilter] : null;

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Search Input and Priority Filter Compound Row */}
      <div className="flex items-center gap-2 w-full">
        {/* 21st.dev Style Search Input Group */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="group relative flex flex-1 items-center gap-2.5 h-9 rounded-xl border border-border/80 bg-background/95 dark:bg-card/75 px-3 shadow-xs transition-all duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 cursor-text"
        >
          <Search className="size-4 text-muted-foreground group-focus-within:text-primary transition-colors shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notifications, senders, or #tags..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/80 outline-none leading-none"
          />

          {searchQuery ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSearchChange("");
                inputRef.current?.focus();
              }}
              title="Clear search"
              className="grid size-5 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground select-none pointer-events-none">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          )}
        </div>

        {/* 21st.dev Inspired Priority Select with Badge Display */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer shadow-xs shrink-0 select-none",
                activeConfig
                  ? cn(activeConfig.badgeClass, "hover:opacity-90")
                  : "border-border/80 bg-background/95 dark:bg-card/75 text-foreground hover:bg-muted/60"
              )}
            >
              {activeConfig ? (
                <>
                  <activeConfig.icon className="size-3.5" />
                  <span>{activeConfig.label}</span>
                </>
              ) : (
                <>
                  <Filter className="size-3.5 text-muted-foreground" />
                  <span>Priority</span>
                </>
              )}
              <ChevronDown className="size-3 opacity-60 ml-0.5" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
              Filter by Priority
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* All Priorities Option */}
            <DropdownMenuItem
              onClick={() => onPriorityChange("all")}
              className="flex items-center justify-between text-xs cursor-pointer py-1.5"
            >
              <div className="flex items-center gap-2">
                <Filter className="size-3.5 text-muted-foreground" />
                <span>All Priorities</span>
              </div>
              {priorityFilter === "all" && (
                <Check className="size-3.5 text-primary" />
              )}
            </DropdownMenuItem>

            {/* Priority Options with Badge Displays */}
            {(Object.keys(PRIORITY_CONFIG) as InboxPriority[]).map((pKey) => {
              const cfg = PRIORITY_CONFIG[pKey];
              const Icon = cfg.icon;
              const isSelected = priorityFilter === pKey;

              return (
                <DropdownMenuItem
                  key={pKey}
                  onClick={() => onPriorityChange(pKey)}
                  className="flex items-center justify-between text-xs cursor-pointer py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                        cfg.badgeClass
                      )}
                    >
                      <Icon className="size-3" />
                      <span>{cfg.label}</span>
                    </span>
                  </div>
                  {isSelected && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              );
            })}

            {priorityFilter !== "all" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onPriorityChange("all")}
                  className="text-xs text-primary font-medium cursor-pointer py-1.5 justify-center"
                >
                  Clear Priority Filter
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filter Indicators Bar (if search or priority active) */}
      {(searchQuery.trim() || priorityFilter !== "all") && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
          <span className="text-[11px] font-medium">Filtering by:</span>

          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 border border-border/60 px-2 py-0.5 text-[11px] text-foreground font-mono">
              <span>"{searchQuery.trim()}"</span>
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="text-muted-foreground hover:text-foreground"
                title="Remove query filter"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {activeConfig && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                activeConfig.badgeClass
              )}
            >
              <activeConfig.icon className="size-3" />
              <span>{activeConfig.label}</span>
              <button
                type="button"
                onClick={() => onPriorityChange("all")}
                className="hover:opacity-75"
                title="Remove priority filter"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {typeof totalFilteredCount === "number" && (
            <span className="text-[11px] text-muted-foreground ml-auto font-mono">
              {totalFilteredCount} {totalFilteredCount === 1 ? "result" : "results"}
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              onPriorityChange("all");
            }}
            className="text-[11px] text-primary hover:underline ml-1 font-medium"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
