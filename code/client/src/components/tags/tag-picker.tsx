import { useState, useRef, useEffect } from "react";
import { Tag, Plus, X, Settings2 } from "lucide-react";
import { useTags } from "./tag-context";
import { TAG_COLOR_CONFIG } from "./tag-types";
import { cn } from "@/lib/utils";

interface TagPickerProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxDisplaySuggestions?: number;
  className?: string;
}

export function TagPicker({
  selectedTags,
  onChange,
  placeholder = "Type to search or add tags...",
  maxDisplaySuggestions = 6,
  className,
}: TagPickerProps) {
  const { tags, createTag, getTagColor, getTagClass, openTagManager } = useTags();
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cleanInput = inputValue.trim().replace(/^#/, "");

  // Filter matching existing tags
  const matchingTags = tags.filter((t) => {
    const isAlreadySelected = selectedTags.some(
      (st) => st.toLowerCase() === t.name.toLowerCase()
    );
    if (isAlreadySelected) return false;
    if (!cleanInput) return true;
    return t.name.toLowerCase().includes(cleanInput.toLowerCase());
  });

  const exactMatchExists = tags.some(
    (t) => t.name.toLowerCase() === cleanInput.toLowerCase()
  );

  const handleAddTag = (tagName: string) => {
    const clean = tagName.trim().replace(/^#/, "");
    if (!clean) return;

    // Check if already in selectedTags
    if (selectedTags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setInputValue("");
      setIsDropdownOpen(false);
      return;
    }

    // If tag doesn't exist in registry, create it with deterministic color
    if (!tags.some((t) => t.name.toLowerCase() === clean.toLowerCase())) {
      createTag({ name: clean });
    }

    onChange([...selectedTags, clean]);
    setInputValue("");
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(
      selectedTags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase())
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (cleanInput) {
        if (matchingTags.length > 0 && !exactMatchExists && matchingTags[0]) {
          handleAddTag(matchingTags[0].name);
        } else {
          handleAddTag(cleanInput);
        }
      }
    } else if (e.key === "Backspace" && !inputValue && selectedTags.length > 0) {
      // Remove last tag when backspacing on empty input
      const lastTag = selectedTags[selectedTags.length - 1];
      if (lastTag) handleRemoveTag(lastTag);
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  // Quick suggestions: top registry tags not yet selected
  const suggestedPills = tags
    .filter(
      (t) =>
        !selectedTags.some((st) => st.toLowerCase() === t.name.toLowerCase())
    )
    .slice(0, maxDisplaySuggestions);

  return (
    <div ref={containerRef} className={cn("space-y-2", className)}>
      {/* Selected Tags Box with Input */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="min-h-[44px] flex flex-wrap items-center gap-2 rounded-xl border border-border/80 bg-background/80 p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all cursor-text shadow-xs"
      >
        {selectedTags.map((tagName) => {
          const colorKey = getTagColor(tagName);
          const colorCfg = TAG_COLOR_CONFIG[colorKey] || TAG_COLOR_CONFIG.blue;

          return (
            <span
              key={tagName}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all group shadow-2xs",
                colorCfg.badge
              )}
            >
              <span className={cn("size-1.5 rounded-full shrink-0", colorCfg.dot)} />
              <span>#{tagName}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tagName);
                }}
                className="ml-0.5 rounded p-0.5 text-muted-foreground hover:bg-black/20 hover:text-foreground transition-colors cursor-pointer"
                title={`Remove #${tagName}`}
                aria-label={`Remove tag ${tagName}`}
              >
                <X className="size-3" />
              </button>
            </span>
          );
        })}

        {/* Text Input */}
        <div className="relative flex-1 min-w-[140px]">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length === 0 ? placeholder : "Add more..."}
            className="w-full bg-transparent px-1.5 py-0.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isDropdownOpen && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 w-full max-h-56 overflow-y-auto rounded-xl border border-border/80 bg-card/95 p-1.5 shadow-xl backdrop-blur-md">
            {/* Create new option if not exact match */}
            {cleanInput && !exactMatchExists && (
              <button
                type="button"
                onClick={() => handleAddTag(cleanInput)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors cursor-pointer mb-1 border-b border-border/40 pb-1.5"
              >
                <div className="flex items-center gap-2">
                  <Plus className="size-3.5" />
                  <span>
                    Create new tag <strong>#{cleanInput}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">Press Enter</span>
              </button>
            )}

            {/* Existing Tag Matches */}
            {matchingTags.length > 0 ? (
              <div className="space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Available Tags</span>
                  <span>{matchingTags.length}</span>
                </div>
                {matchingTags.slice(0, 15).map((t) => {
                  const colorCfg = TAG_COLOR_CONFIG[t.color] || TAG_COLOR_CONFIG.blue;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleAddTag(t.name)}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted/70 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", colorCfg.dot)} />
                        <span className="font-medium">#{t.name}</span>
                        {t.description && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            — {t.description}
                          </span>
                        )}
                      </div>
                      <span className={cn("rounded px-1.5 py-0.2 text-[10px] border", colorCfg.badge)}>
                        {t.color}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : !cleanInput ? (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                All existing tags already selected
              </div>
            ) : null}

            {/* Quick footer action to open Tag Manager */}
            <div className="mt-1 border-t border-border/40 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  openTagManager();
                }}
                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <Settings2 className="size-3 text-muted-foreground" />
                <span>Open Tag Manager (create, edit, delete tags)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Quick-Pills */}
      {suggestedPills.length > 0 && selectedTags.length < 5 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground/80 flex items-center gap-1.5 mr-0.5 font-medium">
            <Tag className="size-3 text-primary/70" />
            <span>Suggestions:</span>
          </span>
          {suggestedPills.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleAddTag(t.name)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer flex items-center gap-1 shadow-2xs hover:scale-102",
                getTagClass(t.name)
              )}
            >
              <span>#{t.name}</span>
              <Plus className="size-3 opacity-60" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => openTagManager()}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1 cursor-pointer font-medium"
          >
            Manage
          </button>
        </div>
      )}
    </div>
  );
}
