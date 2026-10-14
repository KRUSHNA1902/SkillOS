import { useState } from "react";
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
  X,
} from "lucide-react";
import { useOnboarding } from "@/context/OnboardingContext";

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
  const { state, startTour, openWizard, updateChecklist } = useOnboarding();
  const { checklist, status } = state;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Define checklist items
  const items = [
    {
      id: "personaConfigured",
      label: "Choose Learner Persona & Goal",
      detail: "Configured your technical archetype and weekly study hours.",
      completed: checklist.personaConfigured || status === "completed",
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
      completed: checklist.firstTaskCreated,
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
      completed: checklist.firstNoteCreated,
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

  if (isDismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/40 p-4 text-foreground shadow-sm mb-6 backdrop-blur-sm">
      {/* Header with Title and Progress */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground tracking-tight">
                Getting Started Checklist
              </h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                {completedCount} / {totalCount} completed
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Master the core workflows of your SkillOS environment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
            title={isCollapsed ? "Expand checklist" : "Collapse checklist"}
          >
            {isCollapsed ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronUp className="size-4" />
            )}
          </button>
          {completedCount === totalCount && (
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
              title="Dismiss completed checklist"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

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
        {!isCollapsed && (
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
