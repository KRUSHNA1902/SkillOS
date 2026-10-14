import { useEffect, useState, useCallback, ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Bot,
  ListTodo,
  TrendingUp,
  ArrowRight,
  X,
  Check,
  Sliders,
} from "lucide-react";
import { useOnboarding } from "@/context/OnboardingContext";

export interface TourStep {
  target: string; // data-tour selector e.g. "sidebar-nav"
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  icon: ComponentType<{ className?: string }>;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "sidebar-nav",
    title: "Platform Workspace Hub",
    description:
      "Quickly toggle between your central Dashboard, Learning Roadmaps, Sprints, Knowledge Notes, and AI Assistant.",
    placement: "right",
    icon: Compass,
  },
  {
    target: "ai-copilot-nav",
    title: "Gemini 3.8 Flash AI Copilot",
    description:
      "Your intelligent engineering partner. Ask deep technical questions, synthesize study notes, or generate custom skill roadmaps.",
    placement: "right",
    icon: Bot,
  },
  {
    target: "metrics-bar",
    title: "Study Velocity & Pacing",
    description:
      "Real-time overview of active sprint tasks, continuous learning streak, study duration, and workflow deployments.",
    placement: "bottom",
    icon: TrendingUp,
  },
  {
    target: "task-engine",
    title: "Interactive Task & Sprint Engine",
    description:
      "Organize tasks with 1-click priority cycle switcher, deadline countdowns, overdue alert banners, and chronological milestone timelines.",
    placement: "top",
    icon: ListTodo,
  },
  {
    target: "user-menu",
    title: "Profile, Themes & Tour Restart",
    description:
      "Click your avatar or name to tune your accent color, view your 3D contribution skyline, update skills, or replay this tour anytime.",
    placement: "top",
    icon: Sliders,
  },
];

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export function ProductTour() {
  const { state, endTour, nextTourStep, prevTourStep, setTourStep } =
    useOnboarding();
  const { isTourActive, currentTourStep } = state;

  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const step = TOUR_STEPS[currentTourStep] || TOUR_STEPS[0];
  const totalSteps = TOUR_STEPS.length;
  const isFirstStep = currentTourStep === 0;
  const isLastStep = currentTourStep === totalSteps - 1;

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update target rect on step change or resize
  const updateTargetRect = useCallback(() => {
    if (!isTourActive) return;

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Scroll into view if out of viewport
      if (
        rect.top < 0 ||
        rect.bottom > window.innerHeight ||
        rect.left < 0 ||
        rect.right > window.innerWidth
      ) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });
    } else {
      // Element not found (fallback to centered spotlight)
      setTargetRect(null);
    }
  }, [isTourActive, step.target]);

  useEffect(() => {
    updateTargetRect();
    const timeout = setTimeout(updateTargetRect, 250);
    return () => clearTimeout(timeout);
  }, [updateTargetRect, currentTourStep]);

  // Keyboard navigation: Escape closes, Left/Right arrow keys navigate
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        endTour(false);
      } else if (e.key === "ArrowRight") {
        if (!isLastStep) nextTourStep();
        else endTour(true);
      } else if (e.key === "ArrowLeft") {
        if (!isFirstStep) prevTourStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourActive, isFirstStep, isLastStep, nextTourStep, prevTourStep, endTour]);

  if (!isTourActive) return null;

  // Calculate popover coordinates based on target rect and preferred placement
  const popoverStyle = (() => {
    const cardWidth = 340;
    const cardHeight = 220;
    const margin = 16;

    if (!targetRect) {
      return {
        top: `calc(50% - ${cardHeight / 2}px)`,
        left: `calc(50% - ${cardWidth / 2}px)`,
      };
    }

    const { top, left, width, height, bottom, right } = targetRect;
    const placement = step.placement || "bottom";

    let calculatedTop = top;
    let calculatedLeft = left;

    if (placement === "right") {
      calculatedLeft = right + margin;
      calculatedTop = top + height / 2 - cardHeight / 2;
    } else if (placement === "left") {
      calculatedLeft = left - cardWidth - margin;
      calculatedTop = top + height / 2 - cardHeight / 2;
    } else if (placement === "top") {
      calculatedTop = top - cardHeight - margin;
      calculatedLeft = left + width / 2 - cardWidth / 2;
    } else {
      // default "bottom"
      calculatedTop = bottom + margin;
      calculatedLeft = left + width / 2 - cardWidth / 2;
    }

    // Clamp inside viewport
    calculatedLeft = Math.max(
      16,
      Math.min(calculatedLeft, windowSize.width - cardWidth - 16)
    );
    calculatedTop = Math.max(
      16,
      Math.min(calculatedTop, windowSize.height - cardHeight - 16)
    );

    return {
      top: `${calculatedTop}px`,
      left: `${calculatedLeft}px`,
    };
  })();

  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto overflow-hidden">
      {/* SVG Spotlight Cutout Overlay (21st.dev style spotlight) */}
      <svg
        className="absolute inset-0 size-full pointer-events-auto"
        style={{
          width: "100vw",
          height: "100vh",
        }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White covers entire screen (opaque) */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black cuts out the spotlight area (transparent) */}
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Semi-transparent dark backdrop masked with spotlight hole */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#tour-spotlight-mask)"
          onClick={() => endTour(false)}
        />
      </svg>

      {/* Glowing border ring around highlighted element */}
      {targetRect && (
        <motion.div
          layout
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: 12,
          }}
          className="pointer-events-none ring-2 ring-amber-400 ring-offset-2 ring-offset-black/50 shadow-[0_0_25px_rgba(245,158,11,0.35)]"
        />
      )}

      {/* Floating Tour Popover Card (Inspired by shadcnspace/product-tour-popover) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTourStep}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={popoverStyle}
          className="absolute z-50 w-[340px] rounded-2xl border border-amber-500/40 bg-[#0e0e10] p-4 text-zinc-100 shadow-2xl shadow-black backdrop-blur-md dark"
        >
          {/* Card Header with Step Counter & Close Button */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="grid size-7 place-items-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Icon className="size-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Tour • {currentTourStep + 1} of {totalSteps}
              </span>
            </div>
            <button
              type="button"
              onClick={() => endTour(false)}
              title="Exit product tour (Esc)"
              className="grid size-6 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Card Body */}
          <div className="py-3">
            <h4 className="text-sm font-bold text-zinc-100 tracking-tight">
              {step.title}
            </h4>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Card Footer: Step Dots & Navigation Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            {/* Step indicator dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTourStep(idx)}
                  className={`size-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentTourStep
                      ? "w-4 bg-amber-400"
                      : "bg-zinc-700 hover:bg-zinc-500"
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={prevTourStep}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  Back
                </button>
              )}

              {isLastStep ? (
                <button
                  type="button"
                  onClick={() => endTour(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-black hover:bg-emerald-400 transition-colors cursor-pointer shadow-sm"
                >
                  <Check className="size-3 stroke-[3]" />
                  <span>Finish</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextTourStep}
                  className="inline-flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1 text-[11px] font-semibold text-black hover:bg-amber-300 transition-colors cursor-pointer shadow-sm shadow-amber-400/20"
                >
                  <span>Next</span>
                  <ArrowRight className="size-3" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
