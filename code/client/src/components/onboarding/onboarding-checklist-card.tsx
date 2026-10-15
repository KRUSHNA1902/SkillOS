import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ListTodo,
  Bot,
  NotebookTabs,
  Compass,
  Check,
  CheckCircle2,
  X,
} from "lucide-react";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTaskManager } from "@/components/tasks/task-context";
import { useNotes } from "@/components/notes/note-context";
import { useAuth } from "@/context/AuthContext";

interface OnboardingChecklistCardProps {
  onOpenAI?: () => void;
  onOpenTasks?: () => void;
  onOpenNotes?: () => void;
}

export function OnboardingChecklistCard({
  onOpenAI,
  onOpenTasks,
  onOpenNotes,
}: OnboardingChecklistCardProps) {
  const {
    state,
    startTour,
    openWizard,
    updateChecklist,
    dismissChecklist,
    toggleChecklistCollapsed,
    syncChecklistItems,
  } = useOnboarding();
  const { checklist, status, checklistDismissed, checklistCollapsed } = state;
  const { tasks } = useTaskManager();
  const { notes } = useNotes();
  const { user } = useAuth();

  // Auto-sync real application state into checklist progress
  useEffect(() => {
    const updates: Partial<typeof checklist> = {};
    if (tasks.length > 0 && !checklist.firstTaskCreated) {
      updates.firstTaskCreated = true;
    }
    if (notes.length > 0 && !checklist.firstNoteCreated) {
      updates.firstNoteCreated = true;
    }
    if (
      (status === "completed" ||
        user?.role ||
        user?.bio ||
        (user?.skills && user.skills.length > 0)) &&
      !checklist.personaConfigured
    ) {
      updates.personaConfigured = true;
    }
    if (Object.keys(updates).length > 0) {
      syncChecklistItems(updates);
    }
  }, [
    tasks.length,
    notes.length,
    status,
    user?.role,
    user?.bio,
    user?.skills,
    checklist.firstTaskCreated,
    checklist.firstNoteCreated,
    checklist.personaConfigured,
    syncChecklistItems,
  ]);

  // Define checklist items reactively based on context & active data stores
  const hasConfiguredPersona = Boolean(
    checklist.personaConfigured ||
      status === "completed" ||
      user?.role ||
      user?.bio ||
      (user?.skills && user.skills.length > 0)
  );
  const hasCreatedTask = Boolean(checklist.firstTaskCreated || tasks.length > 0);
  const hasCreatedNote = Boolean(checklist.firstNoteCreated || notes.length > 0);

  const items = [
    {
      id: "personaConfigured",
      label: "Choose Learner Persona & Goal",
      detail: "Configured your technical archetype and weekly study hours.",
      completed: hasConfiguredPersona,
      actionText: "Edit",
      onAction: () => openWizard(1),
      icon: Compass,
    },
    {
      id: "tourCompleted",
      label: "Complete Spotlight Product Tour",
      detail: "Walk through navigation, AI assistant, and sprint task tools.",
      completed: checklist.tourCompleted,
      actionText: "Take Tour",
      onAction: () => startTour(),
      icon: Sparkles,
    },
    {
      id: "firstTaskCreated",
      label: "Create First Learning Milestone",
      detail: "Log a task with priority, due date, or timeline tag.",
      completed: hasCreatedTask,
      actionText: "Tasks",
      onAction: () => {
        updateChecklist("firstTaskCreated", true);
        if (onOpenTasks) onOpenTasks();
      },
      icon: ListTodo,
    },
    {
      id: "aiAssistantExplored",
      label: "Ask Gemini 3.8 Flash AI Copilot",
      detail: "Generate a custom roadmap or synthesize technical study notes.",
      completed: checklist.aiAssistantExplored,
      actionText: "Ask AI",
      onAction: () => {
        updateChecklist("aiAssistantExplored", true);
        if (onOpenAI) onOpenAI();
      },
      icon: Bot,
    },
    {
      id: "firstNoteCreated",
      label: "Review or Create Study Note",
      detail: "Capture code snippets, architecture diagrams, and takeaways.",
      completed: hasCreatedNote,
      actionText: "Notes",
      onAction: () => {
        updateChecklist("firstNoteCreated", true);
        if (onOpenNotes) onOpenNotes();
      },
      icon: NotebookTabs,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const percentComplete = Math.round((completedCount / totalCount) * 100);
  const isAllComplete = completedCount === totalCount;

  // If persistently dismissed, do not render card
  if (checklistDismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/40 p-4 text-foreground shadow-sm mb-6 backdrop-blur-sm">
      {/* Header with Title and Progress */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground tracking-tight">
              Getting Started Checklist
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Master the core workflows of your SkillOS environment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleChecklistCollapsed()}
            className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
            title={checklistCollapsed ? "Expand checklist" : "Collapse checklist"}
          >
            {checklistCollapsed ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronUp className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={dismissChecklist}
            className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
            title={
              isAllComplete
                ? "Dismiss completed checklist"
                : "Hide checklist from dashboard"
            }
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Completion Banner */}
      {isAllComplete && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span className="font-medium truncate">
              All onboarding milestones completed! You&apos;re ready for deep work.
            </span>
          </div>
          <button
            type="button"
            onClick={dismissChecklist}
            className="shrink-0 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 transition-colors cursor-pointer"
          >
            Dismiss Checklist
          </button>
        </div>
      )}

      {/* Progress Bar (21st.dev checklist style) */}
      <div className="pt-3 pb-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mb-1.5">
          <span>Onboarding Progress</span>
          <span className="font-semibold text-amber-400">{percentComplete}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentComplete}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
          />
        </div>
      </div>

      {/* Checklist items list */}
      <AnimatePresence>
        {!checklistCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 transition-all ${
                    item.completed
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-border/50 bg-background/40 hover:bg-muted/30 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        updateChecklist(
                          item.id as keyof typeof checklist,
                          !item.completed
                        )
                      }
                      title={item.completed ? "Mark incomplete" : "Mark complete"}
                      className={`grid size-5 shrink-0 place-items-center rounded-full transition-colors cursor-pointer ${
                        item.completed
                          ? "bg-emerald-500 text-black font-bold"
                          : "border border-muted-foreground/50 hover:border-amber-400 text-transparent"
                      }`}
                    >
                      <Check className="size-3 stroke-[3]" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon className="size-3 text-amber-400 shrink-0" />
                        <span
                          className={`text-xs font-semibold block truncate ${
                            item.completed
                              ? "text-muted-foreground line-through decoration-muted-foreground/60"
                              : "text-foreground"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {item.detail}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={item.onAction}
                    className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      item.completed
                        ? "border border-border/50 bg-card/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                        : "bg-amber-400 text-black hover:bg-amber-300 font-semibold"
                    }`}
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
