import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  Zap,
  Bot,
  BrainCircuit,
  Code,
  Layers,
  GraduationCap,
  Cloud,
  Check,
  Rocket,
  Save,
  Clock,
} from "lucide-react";
import { useOnboarding } from "@/context/OnboardingContext";
import { UserAvatarIcon } from "@/components/profile/user-avatar-icon";
import { Switch } from "@/components/ui/switch";

const LEARNER_ARCHETYPES = [
  {
    id: "fullstack",
    title: "Full-Stack & Systems Engineer",
    description:
      "Build resilient end-to-end architectures, distributed services, and modern interfaces.",
    icon: Code,
    badge: "Popular",
  },
  {
    id: "ai_engineer",
    title: "AI / ML Researcher & Agent Builder",
    description:
      "Specialize in autonomous LLM agents, vector embeddings, fine-tuning, and RAG systems.",
    icon: BrainCircuit,
    badge: "Trending",
  },
  {
    id: "architect",
    title: "Software Architect & Tech Lead",
    description:
      "Design large-scale distributed systems, fault tolerance, and high-throughput pipelines.",
    icon: Layers,
    badge: "Advanced",
  },
  {
    id: "student",
    title: "Self-Directed Deep Learner",
    description:
      "Structured progress through computer science fundamentals, algorithms, and core tracks.",
    icon: GraduationCap,
    badge: "Foundational",
  },
  {
    id: "devops",
    title: "DevOps & Cloud SRE",
    description:
      "Master Kubernetes clusters, Terraform infrastructure-as-code, and cloud observability.",
    icon: Cloud,
    badge: "Infrastructure",
  },
];

const ACCENT_COLORS = [
  { id: "amber", name: "Amber Gold", dot: "bg-amber-400", ring: "ring-amber-400" },
  { id: "emerald", name: "Emerald Green", dot: "bg-emerald-400", ring: "ring-emerald-400" },
  { id: "blue", name: "Sky Blue", dot: "bg-blue-400", ring: "ring-blue-400" },
  { id: "purple", name: "Purple", dot: "bg-purple-400", ring: "ring-purple-400" },
  { id: "rose", name: "Rose Pink", dot: "bg-rose-400", ring: "ring-rose-400" },
  { id: "zinc", name: "Mono Zinc", dot: "bg-zinc-400", ring: "ring-zinc-400" },
];

const LEARNING_TRACKS = [
  {
    id: "fullstack_ai",
    title: "Full-Stack AI Engineering",
    tags: ["Gemini 3.8 Flash", "LangChain", "Vector DBs", "Next.js"],
    icon: Zap,
  },
  {
    id: "distributed_systems",
    title: "Distributed Systems & Cloud",
    tags: ["Go", "Kafka", "Docker", "Consensus"],
    icon: Layers,
  },
  {
    id: "modern_frontend",
    title: "Modern Frontend Architecture",
    tags: ["React 19", "Tailwind CSS", "Framer Motion", "Vite"],
    icon: Code,
  },
  {
    id: "rust_systems",
    title: "Rust Systems & WebAssembly",
    tags: ["Memory Safety", "Concurrency", "Wasm", "Performance"],
    icon: Compass,
  },
];

const WEEKLY_GOALS = [
  { hours: 5, label: "Casual", detail: "5 hours/wk • 45m daily pace" },
  { hours: 10, label: "Recommended", detail: "10 hours/wk • Solid momentum" },
  { hours: 15, label: "Intensive", detail: "15+ hours/wk • Deep mastery" },
];

export function OnboardingWizard() {
  const {
    state,
    saveAndExit,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    updateDraft,
    completeOnboarding,
    skipOnboarding,
    startTour,
  } = useOnboarding();

  const { isWizardOpen, currentStep, draft } = state;

  // Local draft states synced with context draft
  const [displayName, setDisplayName] = useState(draft.displayName || "Developer");
  const [handle, setHandle] = useState(draft.handle || "developer");
  const [persona, setPersona] = useState(draft.persona || "Full-Stack & Systems Engineer");
  const [accentColor, setAccentColor] = useState(draft.accentColor || "amber");
  const [bio, setBio] = useState(draft.bio || "");
  const [learningTrack, setLearningTrack] = useState(
    draft.learningTrack || "Full-Stack AI Engineering"
  );
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(draft.weeklyGoalHours || 10);
  const [seedStarterContent, setSeedStarterContent] = useState(
    draft.seedStarterContent !== false
  );
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(
    draft.aiSuggestionsEnabled !== false
  );
  const [proactiveMilestoneAlerts, setProactiveMilestoneAlerts] = useState(
    draft.proactiveMilestoneAlerts !== false
  );
  const [dailyDigestEnabled, setDailyDigestEnabled] = useState(
    draft.dailyDigestEnabled !== false
  );

  // Sync incoming draft changes
  useEffect(() => {
    if (draft.displayName) setDisplayName(draft.displayName);
    if (draft.handle) setHandle(draft.handle);
    if (draft.persona) setPersona(draft.persona);
    if (draft.accentColor) setAccentColor(draft.accentColor);
    if (draft.bio !== undefined) setBio(draft.bio);
    if (draft.learningTrack) setLearningTrack(draft.learningTrack);
    if (draft.weeklyGoalHours) setWeeklyGoalHours(draft.weeklyGoalHours);
  }, [draft]);

  if (!isWizardOpen) return null;

  const handleNext = () => {
    // Save draft on each step progression
    updateDraft({
      displayName,
      handle,
      persona,
      accentColor,
      bio,
      learningTrack,
      weeklyGoalHours,
      seedStarterContent,
      aiSuggestionsEnabled,
      proactiveMilestoneAlerts,
      dailyDigestEnabled,
    });

    if (currentStep < 5) {
      goToNextStep();
    } else {
      completeOnboarding({
        displayName,
        handle,
        persona,
        accentColor,
        bio,
        learningTrack,
        weeklyGoalHours,
        seedStarterContent,
        aiSuggestionsEnabled,
        proactiveMilestoneAlerts,
        dailyDigestEnabled,
      });
    }
  };

  const handleSaveAndExit = () => {
    updateDraft({
      displayName,
      handle,
      persona,
      accentColor,
      bio,
      learningTrack,
      weeklyGoalHours,
      seedStarterContent,
      aiSuggestionsEnabled,
      proactiveMilestoneAlerts,
      dailyDigestEnabled,
    });
    saveAndExit();
  };

  const handleFinishAndStartTour = () => {
    completeOnboarding({
      displayName,
      handle,
      persona,
      accentColor,
      bio,
      learningTrack,
      weeklyGoalHours,
      seedStarterContent,
      aiSuggestionsEnabled,
      proactiveMilestoneAlerts,
      dailyDigestEnabled,
    });
    startTour();
  };

  const stepLabels = [
    { num: 1, label: "Persona" },
    { num: 2, label: "Identity" },
    { num: 3, label: "Track & Goal" },
    { num: 4, label: "AI Copilot" },
    { num: 5, label: "Ready" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto selection:bg-amber-500/20 dark text-zinc-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-[#0e0e10] text-zinc-100 shadow-2xl shadow-black/80 flex flex-col max-h-[92vh]"
      >
        {/* Subtle Ambient Background Sheen */}
        <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" />

        {/* Wizard Header */}
        <div className="relative shrink-0 border-b border-zinc-800/80 px-5 py-4 bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <Compass className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-zinc-100">
                  SkillOS Onboarding
                </h2>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                  Step {currentStep} of 5
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Personalized setup • Progress saves automatically
              </p>
            </div>
          </div>

          {/* Top Actions: Save & Exit + Close */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSaveAndExit}
              title="Save draft and finish later"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
            >
              <Save className="size-3.5 text-amber-400" />
              <span>Save & Exit</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndExit}
              title="Close modal (Progress is preserved)"
              className="grid size-8 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Stepper Pill Header Bar */}
        <div className="shrink-0 px-5 pt-3.5 pb-2 border-b border-zinc-800/60 bg-zinc-950/40 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {stepLabels.map(({ num, label }) => {
            const isDone = currentStep > num;
            const isCurrent = currentStep === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => goToStep(num)}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  isCurrent
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/40"
                    : isDone
                    ? "text-zinc-300 hover:bg-zinc-800/60 cursor-pointer"
                    : "text-zinc-500 cursor-pointer hover:text-zinc-400"
                }`}
              >
                <span
                  className={`grid size-4.5 place-items-center rounded-full text-[10px] font-bold ${
                    isDone
                      ? "bg-emerald-500 text-black"
                      : isCurrent
                      ? "bg-amber-400 text-black"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700/60"
                  }`}
                >
                  {isDone ? <Check className="size-2.5 stroke-[3]" /> : num}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Wizard Step Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: Persona & Learning Identity */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">
                    What best describes your learning journey?
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    We tailor default roadmaps, sprint templates, and AI recommendations to your archetype.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-1">
                  {LEARNER_ARCHETYPES.map((arch) => {
                    const isSelected = persona === arch.title;
                    const Icon = arch.icon;
                    return (
                      <div
                        key={arch.id}
                        onClick={() => setPersona(arch.title)}
                        className={`group relative flex items-start gap-3.5 rounded-xl border p-3.5 cursor-pointer transition-all ${
                          isSelected
                            ? "border-amber-500/70 bg-amber-500/15 shadow-sm"
                            : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/50"
                        }`}
                      >
                        <div
                          className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg transition-colors ${
                            isSelected
                              ? "bg-amber-400 text-black"
                              : "bg-zinc-800 text-zinc-400 group-hover:text-zinc-200"
                          }`}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-zinc-100">
                              {arch.title}
                            </span>
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono ${
                                isSelected
                                  ? "bg-amber-400/20 text-amber-300 font-semibold"
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                              }`}
                            >
                              {arch.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {arch.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Chen"
                      className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Username / Handle
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs text-zinc-500">@</span>
                      <input
                        type="text"
                        value={handle}
                        onChange={(e) =>
                          setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                        }
                        placeholder="alex_dev"
                        className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/90 pl-7 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/40"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Identity, Avatar & Accent Colors */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">
                    Customize your profile & theme accent
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Choose an accent color for your badges, avatar glow, and roadmap indicators.
                  </p>
                </div>

                {/* Avatar Preview Box (Inspired by ravikatiyar162/onboarding) */}
                <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <div className="relative">
                    <UserAvatarIcon
                      name={displayName}
                      accentColor={accentColor}
                      size="xl"
                      className="shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-emerald-500 text-black text-[9px] font-bold shadow">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                  </div>

                  <div className="text-center sm:text-left flex-1 min-w-0">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-sm font-bold text-zinc-100 truncate">
                        {displayName || "Developer"}
                      </span>
                      <span className="rounded-md bg-zinc-800 border border-zinc-700/60 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300">
                        @{handle || "dev"}
                      </span>
                    </div>
                    <p className="text-xs text-amber-400 font-semibold mt-0.5">{persona}</p>
                    <p className="text-[11px] text-zinc-300 mt-1 line-clamp-2 leading-relaxed">
                      {bio || "Ready to track deep study sessions and master technical roadmaps."}
                    </p>
                  </div>
                </div>

                {/* Accent Color Radios */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-200 mb-2">
                    Select Theme Accent Glow
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {ACCENT_COLORS.map((col) => {
                      const isSelected = accentColor === col.id;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setAccentColor(col.id)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                            isSelected
                              ? "border-amber-500/80 bg-amber-500/15 shadow-sm ring-1 ring-amber-500/50"
                              : "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 hover:border-zinc-700"
                          }`}
                        >
                          <span className={`size-5 rounded-full ${col.dot} shadow-inner`} />
                          <span
                            className={`text-[10px] ${
                              isSelected
                                ? "font-semibold text-amber-300"
                                : "font-medium text-zinc-300"
                            }`}
                          >
                            {col.name.split(" ")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Short Bio */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                    Bio / Focus Statement
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Mastering systems architecture, AI agent runtimes, and high-performance databases."
                    className="w-full resize-none rounded-xl border border-zinc-700/80 bg-zinc-900/90 p-3 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/40"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 3: Initial Learning Track & Weekly Commitment */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">
                    Choose your primary focus track
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    This sets your active dashboard roadmap and recommended sprint milestones.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {LEARNING_TRACKS.map((track) => {
                    const isSelected = learningTrack === track.title;
                    const Icon = track.icon;
                    return (
                      <div
                        key={track.id}
                        onClick={() => setLearningTrack(track.title)}
                        className={`flex flex-col justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${
                          isSelected
                            ? "border-amber-500/70 bg-amber-500/15 shadow-sm"
                            : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`grid size-7 shrink-0 place-items-center rounded-lg ${
                              isSelected
                                ? "bg-amber-400 text-black"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            <Icon className="size-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-zinc-100 block">
                              {track.title}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {track.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-zinc-800 border border-zinc-700/50 px-1.5 py-0.5 text-[9px] font-mono text-zinc-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Weekly Target Hours */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-200 mb-2">
                    Weekly Study Goal
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {WEEKLY_GOALS.map((g) => {
                      const isSelected = weeklyGoalHours === g.hours;
                      return (
                        <div
                          key={g.hours}
                          onClick={() => setWeeklyGoalHours(g.hours)}
                          className={`rounded-xl border p-3 text-center cursor-pointer transition-all ${
                            isSelected
                              ? "border-amber-500/70 bg-amber-500/15 shadow-sm ring-1 ring-amber-500/50"
                              : "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 hover:border-zinc-700"
                          }`}
                        >
                          <span className="text-base font-bold text-zinc-100 block">
                            {g.hours}h
                          </span>
                          <span className="text-[10px] font-medium text-amber-400 block mt-0.5">
                            {g.label}
                          </span>
                          <span className="text-[9px] text-zinc-400 block mt-1">
                            {g.detail}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Auto seed checkbox */}
                <div
                  onClick={() => setSeedStarterContent(!seedStarterContent)}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 cursor-pointer hover:bg-zinc-800/50 hover:border-zinc-700 transition-colors"
                >
                  <div
                    className={`grid size-4.5 place-items-center rounded border transition-colors ${
                      seedStarterContent
                        ? "bg-amber-400 border-amber-400 text-black"
                        : "border-zinc-600 bg-transparent"
                    }`}
                  >
                    {seedStarterContent && <Check className="size-3 stroke-[3]" />}
                  </div>
                  <div className="flex-1 text-xs">
                    <span className="font-semibold text-zinc-100 block">
                      Seed starter learning task & study note
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Creates a tailored kickoff milestone on your Dashboard and Notes studio.
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: AI Copilot & Smart Settings */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">
                    Configure your AI Assistant (Gemini 3.8 Flash)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Control how SkillOS proactively suggests next topics, synthesizes notes, and tracks deadlines.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* AI Smart Suggestions */}
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid size-7 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
                        <Bot className="size-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-zinc-100 block">
                          AI Smart Study Recommendations
                        </span>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">
                          Gemini analyzes your study pacing and suggests next high-yield topics.
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={aiSuggestionsEnabled}
                      onCheckedChange={setAiSuggestionsEnabled}
                    />
                  </div>

                  {/* Proactive Milestone Alerts */}
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Zap className="size-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-zinc-100 block">
                          Proactive Milestone & Deadline Alerts
                        </span>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">
                          Notifies you when study milestones are due or revision dates approach.
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={proactiveMilestoneAlerts}
                      onCheckedChange={setProactiveMilestoneAlerts}
                    />
                  </div>

                  {/* Daily Digest */}
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid size-7 place-items-center rounded-lg bg-blue-500/10 text-blue-400">
                        <Clock className="size-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-zinc-100 block">
                          Daily Progress Recap
                        </span>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">
                          Summary of completed hours, streaks, and upcoming tasks each morning.
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={dailyDigestEnabled}
                      onCheckedChange={setDailyDigestEnabled}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5">
                  <Sparkles className="size-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    You can change these preferences or switch operational modes (Study Mode, Planning Mode, Notes Synthesizer) anytime inside the AI Assistant tab.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Ready to Launch & Celebration */}
            {currentStep === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-center"
              >
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10">
                  <Rocket className="size-7" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-zinc-100">
                    You are ready to launch, {displayName || "Developer"}!
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                    Your personal learning OS is configured. Take a quick interactive tour to discover key shortcuts and workflows, or jump right into your workspace.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="text-left rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-2.5 max-w-lg mx-auto">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/80">
                    <span className="text-zinc-400">Persona</span>
                    <span className="font-semibold text-zinc-100">{persona}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/80">
                    <span className="text-zinc-400">Focus Track</span>
                    <span className="font-semibold text-amber-400">{learningTrack}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/80">
                    <span className="text-zinc-400">Weekly Target</span>
                    <span className="font-semibold text-zinc-100">{weeklyGoalHours} hours/week</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">AI Copilot</span>
                    <span className="font-mono text-[11px] text-emerald-400">Gemini 3.8 Flash Active</span>
                  </div>
                </div>

                {/* Two Action Paths */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleFinishAndStartTour}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-xs font-semibold text-black shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer"
                  >
                    <Sparkles className="size-4" />
                    <span>Start Interactive Tour</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-xs font-semibold text-zinc-100 hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    <span>Jump to Workspace</span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Wizard Footer Controls */}
        <div className="shrink-0 border-t border-zinc-800/80 px-5 py-3.5 bg-zinc-900/50 flex items-center justify-between">
          <div>
            {currentStep > 1 && currentStep < 5 ? (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={skipOnboarding}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Skip Onboarding
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 5 && (
              <button
                type="button"
                onClick={handleSaveAndExit}
                className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 mr-1 cursor-pointer"
              >
                Save & Exit
              </button>
            )}

            {currentStep < 5 && (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition-colors cursor-pointer shadow-md shadow-amber-400/20"
              >
                <span>Continue</span>
                <ArrowRight className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
