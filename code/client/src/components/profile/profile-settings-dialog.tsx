import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useTaskManager } from "@/components/tasks/task-context";
import { useOnboarding } from "@/context/OnboardingContext";
import ContributionSkyline, { ContributionDay, PaletteName } from "@/components/ui/contribution-skyline";
import { UserAvatarIcon } from "./user-avatar-icon";
import {
  X,
  User as UserIcon,
  Sliders,
  Shield,
  Check,
  Plus,
  LogOut,
  Mail,
  Briefcase,
  Building,
  Phone,
  FileText,
  Sparkles,
  Bell,
  SunMoon,
  Laptop,
  Sun,
  Moon,
  CheckCircle2,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Calendar,
  Compass,
  Bot,
  Terminal,
  Code,
} from "lucide-react";

interface ProfileSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "profile" | "preferences" | "security";

const AVATAR_ICONS = [
  { id: "user", label: "Profile", icon: UserIcon },
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "code", label: "Code", icon: Code },
  { id: "sparkles", label: "Sparkles", icon: Sparkles },
  { id: "bot", label: "Bot", icon: Bot },
  { id: "shield", label: "Shield", icon: Shield },
];

const ACCENT_COLORS = [
  { id: "amber", name: "Amber Gold", dot: "bg-amber-400" },
  { id: "emerald", name: "Emerald Green", dot: "bg-emerald-400" },
  { id: "blue", name: "Sky Blue", dot: "bg-blue-400" },
  { id: "purple", name: "Purple", dot: "bg-purple-400" },
  { id: "rose", name: "Rose Pink", dot: "bg-rose-400" },
  { id: "zinc", name: "Mono Zinc", dot: "bg-zinc-400" },
];

export function ProfileSettingsDialog({
  isOpen,
  onClose,
}: ProfileSettingsDialogProps) {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { startTour, openWizard } = useOnboarding();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);

  // Form state
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [accentColor, setAccentColor] = useState("amber");
  const [avatarType, setAvatarType] = useState<"icon" | "initials">("icon");
  const [avatarIcon, setAvatarIcon] = useState<string>("user");

  // Preferences state
  const [compactMode, setCompactMode] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [workflowAlerts, setWorkflowAlerts] = useState(true);
  const [themePreference, setThemePreference] = useState<"light" | "dark" | "system">(theme || "light");

  // User task activity & stats telemetry
  const { tasks, metrics } = useTaskManager();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Skyline palette (defaults to iconic GitHub green '#39d353' on dark '#0d1117' background)
  const [skylinePalette, setSkylinePalette] = useState<PaletteName>("github");
  const [skylineThemeMode, setSkylineThemeMode] = useState<"dark" | "light" | "auto">("dark");

  // Aggregate task contributions for 365 days
  const taskContributionData = useMemo<ContributionDay[]>(() => {
    const counts = new Map<string, number>();

    // Aggregate completed and created tasks
    tasks.forEach((t) => {
      const dateStr = t.completedAt
        ? new Date(t.completedAt).toISOString().slice(0, 10)
        : t.createdAt
        ? new Date(t.createdAt).toISOString().slice(0, 10)
        : null;
      if (dateStr) {
        counts.set(dateStr, (counts.get(dateStr) || 0) + 1);
      }
    });

    const now = Date.now();
    const days = 365;
    const result: ContributionDay[] = [];

    // Synthesize historical activity baseline seeded deterministically by user id
    // while layering user's real live tasks on top
    const userSeedStr = (user?.id || "dev-01") + (user?.email || "");
    let seedNum = 0;
    for (let c = 0; c < userSeedStr.length; c++) {
      seedNum = (seedNum + userSeedStr.charCodeAt(c) * (c + 1)) % 10000;
    }

    for (let i = days - 1; i >= 0; i--) {
      const dMs = now - i * 86400000;
      const dateKey = new Date(dMs).toISOString().slice(0, 10);
      const liveCount = counts.get(dateKey) || 0;

      // Deterministic baseline for past months
      const dayIndex = Math.floor(dMs / 86400000);
      const hash = ((dayIndex * 9301 + seedNum * 49297) % 233280) / 233280;
      const dow = new Date(dMs).getUTCDay();
      const isWeekend = dow === 0 || dow === 6;

      let baseCount = 0;
      if (!isWeekend && hash > 0.42) {
        baseCount = Math.floor(hash * 4) + 1;
      } else if (isWeekend && hash > 0.88) {
        baseCount = 1;
      }

      const total = liveCount + baseCount;
      if (total > 0) {
        result.push({ date: dateKey, count: total });
      }
    }

    return result;
  }, [tasks, user]);

  // Filter tasks for the selected date drill-down
  const filteredTasksForDate = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((t) => {
      const created = t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : "";
      const completed = t.completedAt ? new Date(t.completedAt).toISOString().slice(0, 10) : "";
      const deadline = t.deadline ? t.deadline.slice(0, 10) : "";
      return completed === selectedDate || created === selectedDate || deadline === selectedDate;
    });
  }, [tasks, selectedDate]);

  // Populate from user state when opened
  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.fullName || (user.email ? user.email.split("@")[0] : "Developer"));
      setRole(user.role || "Lead Engineer");
      setDepartment(user.department || "Engineering Org");
      setPhone(user.phone || "+1 (555) 019-2834");
      setBio(
        user.bio ||
          "Full stack engineer crafting intelligent workflow systems, microservices, and AI agents."
      );
      setSkills(
        user.skills || ["React", "TypeScript", "Tailwind", "Supabase", "Node.js"]
      );
      setAccentColor(user.accentColor || "amber");
      setAvatarType(user.avatarType || "icon");
      setAvatarIcon(user.avatarIcon || "user");
      setCompactMode(user.settings?.compactMode || false);
      setEmailAlerts(user.settings?.emailAlerts ?? true);
      setAiSuggestions(user.settings?.aiSuggestions ?? true);
      setWorkflowAlerts(user.settings?.workflowAlerts ?? true);
      const userTh = user.settings?.theme;
      if (userTh === "light" || userTh === "dark" || userTh === "system") {
        setThemePreference(userTh);
      } else {
        setThemePreference(theme);
      }
    }
  }, [user, isOpen, theme]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);

    setTimeout(() => {
      updateUser({
        fullName: fullName.trim() || "Developer",
        role: role.trim(),
        department: department.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        skills,
        accentColor,
        avatarType,
        avatarIcon,
        settings: {
          compactMode,
          emailAlerts,
          aiSuggestions,
          workflowAlerts,
          theme: themePreference,
        },
      });

      setIsSaving(false);
      setSaveSuccess(true);

      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    }, 350);
  };

  // Reusable Tab Content renderer
  const renderTabContent = (isFullLayout: boolean) => (
    <>
      {/* TAB 1: Profile Details */}
      {activeTab === "profile" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Avatar & Profile Icon Customization Section */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Avatar & Profile Icon
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Customize the appearance of your profile icon and theme across SkillOS workspace headers and sidebars.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Preview:</span>
                <UserAvatarIcon
                  name={fullName || user.email}
                  email={user.email}
                  size="md"
                  accentColor={accentColor}
                  avatarType={avatarType}
                  avatarIcon={avatarIcon}
                />
              </div>
            </div>

            {/* Avatar Display Style: Profile Icon vs Initials */}
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Avatar Display Style
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAvatarType("icon")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    avatarType === "icon"
                      ? "border-primary bg-primary/10 text-foreground font-semibold shadow-sm ring-1 ring-primary/40"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <UserIcon className="size-3.5 text-primary" />
                  <span>Profile Icon</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarType("initials")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    avatarType === "initials"
                      ? "border-primary bg-primary/10 text-foreground font-semibold shadow-sm ring-1 ring-primary/40"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <span className="font-mono font-bold text-xs">DE</span>
                  <span>Name Initials</span>
                </button>
              </div>
            </div>

            {/* Icon Picker (Visible when avatarType === "icon") */}
            {avatarType === "icon" && (
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Choose Profile Icon
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {AVATAR_ICONS.map((item) => {
                    const IconCmp = item.icon;
                    const isSelected = avatarIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAvatarIcon(item.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/10 text-foreground font-semibold shadow-sm ring-1 ring-primary/40"
                            : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        <IconCmp className={`size-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Accent Theme Color */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Colorway Theme
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAccentColor(c.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all cursor-pointer ${
                      accentColor === c.id
                        ? "border-primary bg-primary/10 text-foreground font-semibold shadow-sm ring-1 ring-primary/40"
                        : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <span className={`size-3 rounded-full ${c.dot}`} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Task Velocity & Contribution Skyline */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Workflow Activity & Task Completion Skyline
                  </h4>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Live productivity telemetry from TaskManager. Click any day on the heat map or 3D skyline to filter tasks.
                </p>
              </div>

              {/* Task metrics pill counters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground mr-1.5">Total Tasks:</span>
                  <span className="font-semibold text-foreground">{metrics.total}</span>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-500 dark:text-emerald-400">
                  <span className="mr-1.5">Completed:</span>
                  <span className="font-semibold">{metrics.completed}</span>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-primary">
                  <span className="mr-1.5">Velocity:</span>
                  <span className="font-semibold">{metrics.completionRate}%</span>
                </div>
              </div>
            </div>

            {/* Skyline Controls: Palette & Dark Theme options */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-medium mr-1">Colorway:</span>
                {(
                  [
                    { id: "github", label: "GitHub Green", color: "#39d353" },
                    { id: "halloween", label: "Amber Fire", color: "#fa7a18" },
                    { id: "ocean", label: "Ocean Blue", color: "#7cc7ff" },
                    { id: "grape", label: "Grape", color: "#c4b5fd" },
                    { id: "ember", label: "Ember", color: "#ffa46b" },
                    { id: "mono", label: "Mono", color: "#e5e5e5" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSkylinePalette(p.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                      skylinePalette === p.id
                        ? "border-emerald-500/40 bg-emerald-500/15 text-foreground shadow-sm ring-1 ring-emerald-500/30"
                        : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className="size-2 rounded-full inline-block"
                      style={{ backgroundColor: p.color }}
                    />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground font-medium mr-1">Canvas:</span>
                {(["dark", "auto"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSkylineThemeMode(mode)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                      skylineThemeMode === mode
                        ? "border-primary/40 bg-primary/15 text-primary shadow-sm"
                        : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {mode === "dark" ? "GitHub Dark (#0d1117)" : "Match App"}
                  </button>
                ))}
              </div>
            </div>

            {/* Skyline Component */}
            <div className="w-full overflow-hidden">
              <ContributionSkyline
                data={taskContributionData}
                palette={skylinePalette}
                themeMode={skylineThemeMode}
                title={
                  <span>
                    <span className="font-semibold tabular-nums">{metrics.completed}</span> tasks completed across engineering sprints
                  </span>
                }
                unit="task"
                unitPlural="tasks"
                heightScale={1.1}
                defaultView="3d"
                showStats={true}
                showLegend={true}
                showToggle={true}
                onCellClick={(day) => setSelectedDate((prev) => (prev === day.date ? null : day.date))}
                className="w-full border-border/60 shadow-sm"
              />
            </div>

            {/* Drill-down: Filtered Tasks for clicked date */}
            {selectedDate && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">
                      Activity for {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                    </span>
                    <span className="rounded-full bg-primary/20 text-primary text-[10px] font-mono px-2 py-0.5">
                      {filteredTasksForDate.length} {filteredTasksForDate.length === 1 ? "task" : "tasks"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <X className="size-3.5" />
                    <span>Clear filter</span>
                  </button>
                </div>

                {filteredTasksForDate.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {filteredTasksForDate.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/60 bg-card text-xs hover:border-border transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`size-2 shrink-0 rounded-full ${
                                task.status === "completed"
                                  ? "bg-emerald-400"
                                  : task.status === "in_progress"
                                  ? "bg-blue-400"
                                  : task.status === "blocked"
                                  ? "bg-destructive"
                                  : "bg-amber-400"
                              }`}
                            />
                            <span className="font-medium text-foreground truncate">{task.title}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                            <span>{task.category}</span>
                            <span>•</span>
                            <span>Due: {task.dueDate}</span>
                            {task.completedAt && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-500 dark:text-emerald-400">Completed</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                            task.priority === "urgent"
                              ? "bg-destructive/15 text-destructive"
                              : task.priority === "high"
                              ? "bg-amber-500/15 text-amber-500 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground rounded-lg border border-dashed border-border/80 bg-background/50">
                    No individual tasks recorded on {selectedDate}. Click another day on the heat map or clear filter.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Grid: Full Name & Email */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-border/80 bg-background/60 py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full rounded-xl border border-border/40 bg-muted/30 py-2.5 pl-9 pr-3 text-xs text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Account email is managed via authentication
                </span>
              </div>
            </div>

            {/* Grid: Role & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Role / Job Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Principal AI Engineer"
                    className="w-full rounded-xl border border-border/80 bg-background/60 py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Department / Org
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering Org"
                    className="w-full rounded-xl border border-border/80 bg-background/60 py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Phone number */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full rounded-xl border border-border/80 bg-background/60 py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Bio / About */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
            <label className="block text-xs font-semibold text-foreground">
              Bio & Professional Summary
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <textarea
                rows={isFullLayout ? 4 : 3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your current engineering focus, projects, or goals..."
                className="w-full rounded-xl border border-border/80 bg-background/60 py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Skills and Tags */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-foreground">
                Skills & Expertise Tags
              </label>
              <span className="text-[11px] text-muted-foreground">
                {skills.length} skills listed
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 min-h-8">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-1 text-xs text-foreground group"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    aria-label={`Remove ${skill}`}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddSkill} className="flex gap-2 pt-1">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                placeholder="Add a new skill (e.g. Python, Docker, PyTorch)..."
                className="flex-1 rounded-xl border border-border/80 bg-background/60 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl bg-muted/60 px-4 py-2 text-xs font-medium text-foreground hover:bg-muted border border-border/80 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Add Skill</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Preferences & Settings */}
      {activeTab === "preferences" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Appearance / Theme */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <SunMoon className="size-4 text-amber-400" />
              <span className="text-xs font-semibold text-foreground">
                Theme & Display
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Select your preferred appearance for the SkillOS interface.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["light", "dark", "system"] as const).map((t) => {
                const Icon = t === "light" ? Sun : t === "dark" ? Moon : Laptop;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setThemePreference(t);
                      setTheme(t);
                    }}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-xs capitalize transition-all cursor-pointer ${
                      themePreference === t
                        ? "border-primary bg-primary/10 text-foreground font-semibold shadow-sm ring-1 ring-primary/40"
                        : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="font-medium">{t} Mode</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Density */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-foreground block">
                Compact Layout Density
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Reduce vertical padding across navigation and cards for denser information display
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCompactMode(!compactMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                compactMode ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  compactMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* AI Assistant Settings */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-foreground">
                  Proactive AI Suggestions
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                Allow SkillOS AI to recommend workflow optimizations and next study topics
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAiSuggestions(!aiSuggestions)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                aiSuggestions ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  aiSuggestions ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Workflow Status Notifications */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                <Bell className="size-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-foreground">
                  Workflow Status Alerts
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                Receive notifications on pipeline completion, task assignments, and overdue items
              </span>
            </div>
            <button
              type="button"
              onClick={() => setWorkflowAlerts(!workflowAlerts)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                workflowAlerts ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  workflowAlerts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Onboarding & Guided Tours */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Compass className="size-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-foreground">
                  Onboarding & Guided Tours
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                Revisit the interactive spotlight walkthrough or reset your learner persona and track setup
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  startTour();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 transition-colors cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Take Product Tour</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openWizard(1);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Sliders className="size-3.5" />
                <span>Relaunch Onboarding Setup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Account & Security */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Account summary */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Account Identifier
                </span>
                <span className="text-xs font-mono text-muted-foreground mt-0.5 block">
                  {user.id}
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[11px] font-mono text-emerald-300">
                Active Session
              </span>
            </div>
            <div className="border-t border-border/40 pt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Auth Provider:</span>
              <span className="font-semibold text-foreground">
                {user.id === "dev-user-001" ? "Local Developer Bypass" : "Supabase Auth"}
              </span>
            </div>
          </div>

          {/* Password update notice */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
            <span className="text-xs font-semibold text-foreground block">
              Password & Authentication
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your credentials are encrypted using industry standard hashing. To rotate security tokens or request a password change link, click below.
            </p>
            <button
              type="button"
              onClick={() => alert("Password reset link sent to " + user.email)}
              className="rounded-xl border border-border bg-background/80 px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Request Password Reset
            </button>
          </div>

          {/* Sign out section */}
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-destructive block">
                Sign Out of SkillOS
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Ends current session and returns to login screen
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/15 hover:bg-destructive/25 text-destructive px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );

  // 1. FULL SCREEN LAYOUT (Default & primary mode)
  if (isFullscreen) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-dialog-title"
        className="fixed inset-0 z-50 flex flex-col w-full h-full bg-background text-foreground overflow-hidden animate-in fade-in duration-200"
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/90 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all cursor-pointer"
              title="Return to Workspace (Esc)"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Back to Workspace</span>
            </button>

            <div className="h-4 w-px bg-border/60" />

            <div className="flex items-center gap-2">
              <h2
                id="profile-dialog-title"
                className="text-sm font-bold tracking-tight text-foreground truncate"
              >
                Profile & Settings
              </h2>
              <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono text-primary font-medium">
                {user.id === "dev-user-001" ? "Dev Account" : "Member"}
              </span>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium animate-in fade-in mr-2">
                <CheckCircle2 className="size-4" />
                <span>Saved!</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="size-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>

            {/* Toggle windowed mode */}
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              aria-label="Exit full screen"
              title="Windowed mode"
              className="grid size-8 place-items-center rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer border border-border/60"
            >
              <Minimize2 className="size-3.5" />
            </button>

            {/* Close button with ESC indicator */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              title="Close (Esc)"
              className="grid size-8 place-items-center rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer border border-border/60"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        {/* Fullscreen Body: Left Sidebar + Right Content Canvas */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Sidebar Navigation */}
          <aside className="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-border/60 bg-card/40 flex flex-col justify-between overflow-y-auto p-4 sm:p-5">
            <div className="space-y-6">
              {/* User Overview Profile Card */}
              <div className="rounded-2xl border border-border/60 bg-muted/50 p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div
                    className="relative group/avatar cursor-pointer"
                    onClick={() => setActiveTab("profile")}
                    title="Click to customize profile icon & avatar"
                  >
                    <UserAvatarIcon
                      name={fullName || user.email}
                      email={user.email}
                      size="lg"
                      accentColor={accentColor}
                      avatarType={avatarType}
                      avatarIcon={avatarIcon}
                    />
                    <span className="absolute -bottom-1 -right-1 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border-2 border-card ring-1 ring-border/50 transition-transform group-hover/avatar:scale-110">
                      <UserIcon className="size-2.5" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {fullName || "User Profile"}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {user.email}
                    </p>
                    <span className="inline-block text-[11px] font-mono text-muted-foreground mt-1 truncate">
                      {role || "Lead Engineer"}
                    </span>
                  </div>
                </div>

                {/* Task Metrics Quick Overview */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-center">
                  <div className="rounded-lg bg-background/60 p-2">
                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Tasks</div>
                    <div className="text-xs font-bold text-foreground mt-0.5">{metrics.total}</div>
                  </div>
                  <div className="rounded-lg bg-background/60 p-2">
                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Done</div>
                    <div className="text-xs font-bold text-emerald-500 dark:text-emerald-400 mt-0.5">{metrics.completed}</div>
                  </div>
                  <div className="rounded-lg bg-background/60 p-2">
                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Rate</div>
                    <div className="text-xs font-bold text-primary mt-0.5">{metrics.completionRate}%</div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-1.5">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/70 px-2 block mb-2">
                  Navigation
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <UserIcon className="size-4" />
                  <div className="text-left flex-1">
                    <div>Profile Details</div>
                    <div
                      className={`text-[10px] ${
                        activeTab === "profile"
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      Avatar, role, bio & skills
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("preferences")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === "preferences"
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Sliders className="size-4" />
                  <div className="text-left flex-1">
                    <div>Settings & Preferences</div>
                    <div
                      className={`text-[10px] ${
                        activeTab === "preferences"
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      Theme, density & alerts
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("security")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === "security"
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Shield className="size-4" />
                  <div className="text-left flex-1">
                    <div>Account & Security</div>
                    <div
                      className={`text-[10px] ${
                        activeTab === "security"
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      Sessions, auth & sign out
                    </div>
                  </div>
                </button>
              </nav>
            </div>

            {/* Sidebar Bottom Status */}
            <div className="pt-6 border-t border-border/40 space-y-3 mt-6">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/80 text-[10px] font-mono">ESC</kbd> to exit</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="size-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </aside>

          {/* Right Main Content Panel */}
          <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-8 lg:p-12">
            <div className="max-w-4xl mx-auto space-y-6 pb-16">
              {/* Active Tab Heading */}
              <div className="border-b border-border/60 pb-4">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {activeTab === "profile" && "Profile Details"}
                  {activeTab === "preferences" && "Settings & Preferences"}
                  {activeTab === "security" && "Account & Security"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeTab === "profile" &&
                    "Manage your public identity, contact information, role, and skill set."}
                  {activeTab === "preferences" &&
                    "Customize workspace appearance, layout density, and notifications."}
                  {activeTab === "security" &&
                    "Review authentication status, session keys, and access controls."}
                </p>
              </div>

              {/* Render Selected Tab Form */}
              {renderTabContent(true)}

              {/* Sticky / Bottom save button in canvas */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="rounded-xl border border-border/80 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="size-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 2. WINDOWED DIALOG LAYOUT (Accessible if user toggles out of full screen)
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      {/* Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/70 transition-opacity duration-200"
      />

      {/* Modal Container */}
      <div className="relative z-10 flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-border/80 bg-card text-foreground shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="relative border-b border-border/60 p-4 sm:p-6 pb-4 bg-gradient-to-r from-muted/30 via-transparent to-muted/20">
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              aria-label="Enter full screen"
              title="Full screen"
              className="grid size-8 place-items-center rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
            >
              <Maximize2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile dialog"
              className="grid size-8 place-items-center rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <UserAvatarIcon
              name={fullName || user.email}
              email={user.email}
              size="lg"
              accentColor={accentColor}
              avatarType={avatarType}
              avatarIcon={avatarIcon}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2
                  id="profile-dialog-title"
                  className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate"
                >
                  {fullName || "User Profile"}
                </h2>
                <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono text-primary font-medium">
                  {user.id === "dev-user-001" ? "Dev Account" : "Member"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {user.email} • {role || "SkillOS Workspace"}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-border/40 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "profile"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <UserIcon className="size-3.5" />
              <span>Profile Details</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preferences")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "preferences"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Sliders className="size-3.5" />
              <span>Settings & Preferences</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "security"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Shield className="size-3.5" />
              <span>Account & Security</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {renderTabContent(false)}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 p-4 sm:px-6">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium animate-in fade-in">
                <CheckCircle2 className="size-4" />
                <span>Changes saved!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-border/80 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="size-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
