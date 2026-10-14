import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Tag as TagIcon,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  NotebookTabs,
  ListTodo,
  FolderKanban,
  Palette,
  Sparkles,
} from "lucide-react";
import { useTags } from "./tag-context";
import { Tag, TagColorKey, TAG_COLOR_CONFIG } from "./tag-types";
import { useNotes } from "@/components/notes/note-context";
import { useTaskManager } from "@/components/tasks/task-context";
import { useProjects } from "@/components/projects/project-context";
import { cn } from "@/lib/utils";

const COLOR_KEYS: TagColorKey[] = [
  "blue",
  "emerald",
  "purple",
  "amber",
  "rose",
  "cyan",
  "indigo",
  "orange",
  "teal",
  "slate",
];

export function TagManagementModal() {
  const {
    tags,
    createTag,
    updateTag,
    deleteTag,
    isManagerOpen,
    closeTagManager,
  } = useTags();

  // Cross-entity contexts to compute live usage counts
  const { notes } = useNotes();
  const { tasks } = useTaskManager();
  const { projects } = useProjects();

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Create / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [colorInput, setColorInput] = useState<TagColorKey>("blue");
  const [descInput, setDescInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  // Compute usage statistics for all tags
  const tagStatsMap = useMemo(() => {
    const map = new Map<
      string,
      { notesCount: number; tasksCount: number; projectsCount: number; total: number }
    >();

    tags.forEach((t) => {
      const lower = t.name.toLowerCase();
      const notesCount = notes.filter((n) =>
        n.tags.some((tag) => tag.toLowerCase() === lower)
      ).length;

      const tasksCount = tasks.filter((task) =>
        (task as unknown as { tags?: string[] }).tags?.some((tag: string) => tag.toLowerCase() === lower)
      ).length;

      const projectsCount = projects.filter((p) =>
        (p as unknown as { tags?: string[] }).tags?.some((tag: string) => tag.toLowerCase() === lower)
      ).length;

      map.set(t.id, {
        notesCount,
        tasksCount,
        projectsCount,
        total: notesCount + tasksCount + projectsCount,
      });
    });

    return map;
  }, [tags, notes, tasks, projects]);

  // Filtered tags list
  const filteredTags = useMemo(() => {
    return tags.filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().replace(/^#/, "");
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }).sort((a, b) => {
      // Sort by total usage count descending, then alphabetically
      const statsA = tagStatsMap.get(a.id)?.total || 0;
      const statsB = tagStatsMap.get(b.id)?.total || 0;
      if (statsB !== statsA) return statsB - statsA;
      return a.name.localeCompare(b.name);
    });
  }, [tags, searchQuery, tagStatsMap]);

  if (!isManagerOpen) return null;

  // Handle open create form
  const handleOpenCreate = () => {
    setEditingTagId(null);
    setNameInput("");
    setColorInput("blue");
    setDescInput("");
    setFormError(null);
    setIsFormOpen(true);
  };

  // Handle open edit form
  const handleOpenEdit = (tag: Tag) => {
    setEditingTagId(tag.id);
    setNameInput(tag.name);
    setColorInput(tag.color);
    setDescInput(tag.description || "");
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingTagId(null);
    setNameInput("");
    setDescInput("");
    setFormError(null);
  };

  // Handle save (Create or Edit)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim().replace(/^#/, "");

    if (!cleanName) {
      setFormError("Tag name is required");
      return;
    }

    // Check duplicate name
    const duplicate = tags.find(
      (t) =>
        t.name.toLowerCase() === cleanName.toLowerCase() &&
        t.id !== editingTagId
    );
    if (duplicate) {
      setFormError(`Tag "#${cleanName}" already exists`);
      return;
    }

    if (editingTagId) {
      updateTag(editingTagId, {
        name: cleanName,
        color: colorInput,
        description: descInput.trim(),
      });
    } else {
      createTag({
        name: cleanName,
        color: colorInput,
        description: descInput.trim(),
      });
    }

    handleCancelForm();
  };

  // Handle confirmed delete
  const handleConfirmDelete = () => {
    if (!deletingTag) return;
    deleteTag(deletingTag.id);
    setDeletingTag(null);
  };

  const previewColorCfg = TAG_COLOR_CONFIG[colorInput] || TAG_COLOR_CONFIG.blue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <TagIcon className="size-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Tag Manager</span>
                <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-mono font-normal text-muted-foreground">
                  {tags.length} total
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage tags and their colors across Notes, Tasks, and Projects
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeTagManager}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* CONTROLS BAR: SEARCH & CREATE TRIGGER */}
        <div className="flex items-center justify-between gap-3 border-b border-border/40 px-6 py-3 bg-card/60">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tags by name or description..."
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

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="size-3.5" />
            <span>New Tag</span>
          </button>
        </div>

        {/* INLINE CREATE / EDIT FORM */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleSaveForm}
              className="border-b border-border/60 bg-muted/30 px-6 py-4 overflow-hidden space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Palette className="size-3.5 text-primary" />
                  {editingTagId ? "Edit Tag" : "Create New Tag"}
                </span>
                {/* Live Preview Chip */}
                {nameInput.trim() && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>Preview:</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
                        previewColorCfg.badge
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", previewColorCfg.dot)} />
                      #{nameInput.trim().replace(/^#/, "")}
                    </span>
                  </div>
                )}
              </div>

              {formError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive flex items-center gap-2">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tag Name */}
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Tag Name *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      #
                    </span>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => {
                        setNameInput(e.target.value);
                        setFormError(null);
                      }}
                      placeholder="e.g. Analytics, SQL, Bug"
                      autoFocus
                      className="w-full rounded-xl border border-border/80 bg-background pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    placeholder="Short description or usage notes..."
                    className="w-full rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Color Swatch Selector */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                  Color Theme
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_KEYS.map((ck) => {
                    const cfg = TAG_COLOR_CONFIG[ck];
                    const isSelected = colorInput === ck;
                    return (
                      <button
                        key={ck}
                        type="button"
                        onClick={() => setColorInput(ck)}
                        className={cn(
                          "relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                          cfg.badge,
                          isSelected
                            ? "ring-2 ring-primary ring-offset-1 ring-offset-background font-bold shadow-xs"
                            : "opacity-80 hover:opacity-100"
                        )}
                        title={cfg.label}
                      >
                        <span className={cn("size-2 rounded-full", cfg.dot)} />
                        <span>{cfg.label.split(" ")[0]}</span>
                        {isSelected && <Check className="size-3 text-primary ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="rounded-xl border border-border/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  {editingTagId ? "Save Changes" : "Create Tag"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* TAGS LIST */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-2">
          {filteredTags.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <TagIcon className="size-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium">No tags matching &quot;{searchQuery}&quot;</p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer"
              >
                <Plus className="size-3" />
                <span>Create #{searchQuery.replace(/^#/, "")}</span>
              </button>
            </div>
          ) : (
            filteredTags.map((tag) => {
              const colorCfg = TAG_COLOR_CONFIG[tag.color] || TAG_COLOR_CONFIG.blue;
              const stats = tagStatsMap.get(tag.id) || {
                notesCount: 0,
                tasksCount: 0,
                projectsCount: 0,
                total: 0,
              };

              return (
                <div
                  key={tag.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 p-3 hover:bg-muted/30 hover:border-border transition-all"
                >
                  {/* Tag badge & info */}
                  <div className="min-w-0 flex-1 flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shrink-0 transition-all",
                        colorCfg.badge
                      )}
                    >
                      <span className={cn("size-2 rounded-full", colorCfg.dot)} />
                      <span>#{tag.name}</span>
                    </span>

                    {tag.description && (
                      <p className="text-xs text-muted-foreground truncate hidden md:block">
                        {tag.description}
                      </p>
                    )}
                  </div>

                  {/* Multi-Entity Usage Breakdown Pills */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {/* Notes count */}
                      <span
                        className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/80 px-2 py-0.5"
                        title={`${stats.notesCount} Notes`}
                      >
                        <NotebookTabs className="size-3 text-blue-400" />
                        <span>{stats.notesCount}</span>
                      </span>

                      {/* Tasks count */}
                      <span
                        className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/80 px-2 py-0.5"
                        title={`${stats.tasksCount} Tasks`}
                      >
                        <ListTodo className="size-3 text-emerald-400" />
                        <span>{stats.tasksCount}</span>
                      </span>

                      {/* Projects count */}
                      <span
                        className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/80 px-2 py-0.5"
                        title={`${stats.projectsCount} Projects`}
                      >
                        <FolderKanban className="size-3 text-purple-400" />
                        <span>{stats.projectsCount}</span>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 border-l border-border/60 pl-2 ml-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(tag)}
                        className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        title={`Edit #${tag.name}`}
                      >
                        <Edit2 className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingTag(tag)}
                        className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors cursor-pointer"
                        title={`Delete #${tag.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between border-t border-border/60 px-6 py-3 bg-muted/20 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <span>Changes reflect instantly across Notes, Tasks, and Projects.</span>
          </div>
          <button
            type="button"
            onClick={closeTagManager}
            className="rounded-xl border border-border/80 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingTag && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-destructive/40 bg-card p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-destructive">
                <div className="grid size-10 place-items-center rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Delete Tag #{deletingTag.name}?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    This action will remove the tag from all linked items.
                  </p>
                </div>
              </div>

              {(() => {
                const stats = tagStatsMap.get(deletingTag.id) || {
                  notesCount: 0,
                  tasksCount: 0,
                  projectsCount: 0,
                  total: 0,
                };

                return (
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-2 text-xs">
                    <p className="text-muted-foreground">
                      This tag is currently used across:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-border/60 bg-background/80 p-2 text-center">
                        <span className="block text-sm font-bold text-blue-400">
                          {stats.notesCount}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Notes</span>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background/80 p-2 text-center">
                        <span className="block text-sm font-bold text-emerald-400">
                          {stats.tasksCount}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Tasks</span>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background/80 p-2 text-center">
                        <span className="block text-sm font-bold text-purple-400">
                          {stats.projectsCount}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Projects</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingTag(null)}
                  className="rounded-xl border border-border/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="rounded-xl bg-destructive px-4 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  Delete Tag Everywhere
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
