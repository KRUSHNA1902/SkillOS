import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, X, PlayCircle } from "lucide-react";
import { useOnboarding } from "@/context/OnboardingContext";

const STEP_TITLES: Record<number, string> = {
  1: "Learning Persona & Handle",
  2: "Profile & Theme Accent",
  3: "Focus Track & Weekly Commitment",
  4: "AI Copilot Configuration",
  5: "Final Review & Launch",
};

export function OnboardingResumeBanner() {
  const { state, openWizard } = useOnboarding();
  const { status, currentStep, isWizardOpen } = state;
  const [isDismissed, setIsDismissed] = useState(false);

  // Only display if onboarding was started/paused and wizard is currently closed
  if (status !== "in_progress" || isWizardOpen || isDismissed) {
    return null;
  }

  const stepName = STEP_TITLES[currentStep] || `Step ${currentStep}`;
  const percentComplete = Math.round(((currentStep - 1) / 5) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-3.5 sm:p-4 text-foreground shadow-sm mb-5"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-400 text-black shadow-sm shadow-amber-400/25">
              <Sparkles className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  Resume Setup: Step {currentStep} of 5 ({stepName})
                </span>
                <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                  {percentComplete}% Done
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Pick up right where you left off. Your draft answers are saved safely on this device.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => openWizard(currentStep)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 transition-colors shadow-sm cursor-pointer"
            >
              <PlayCircle className="size-3.5" />
              <span>Resume Onboarding</span>
              <ArrowRight className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              title="Dismiss banner"
              className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
