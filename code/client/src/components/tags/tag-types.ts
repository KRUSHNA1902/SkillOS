export type TagColorKey =
  | "blue"
  | "emerald"
  | "purple"
  | "amber"
  | "rose"
  | "cyan"
  | "indigo"
  | "orange"
  | "teal"
  | "slate";

export interface TagColorStyle {
  id: TagColorKey;
  label: string;
  badge: string;
  activeBadge: string;
  dot: string;
  hex: string;
  border: string;
}

export const TAG_COLOR_CONFIG: Record<TagColorKey, TagColorStyle> = {
  blue: {
    id: "blue",
    label: "Ocean Blue",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
    activeBadge: "bg-blue-500 text-white border-blue-600 shadow-xs",
    dot: "bg-blue-400",
    hex: "#3b82f6",
    border: "border-blue-500/30",
  },
  emerald: {
    id: "emerald",
    label: "Emerald Green",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
    activeBadge: "bg-emerald-500 text-white border-emerald-600 shadow-xs",
    dot: "bg-emerald-400",
    hex: "#10b981",
    border: "border-emerald-500/30",
  },
  purple: {
    id: "purple",
    label: "Royal Purple",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20",
    activeBadge: "bg-purple-500 text-white border-purple-600 shadow-xs",
    dot: "bg-purple-400",
    hex: "#a855f7",
    border: "border-purple-500/30",
  },
  amber: {
    id: "amber",
    label: "Amber Gold",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
    activeBadge: "bg-amber-500 text-white border-amber-600 shadow-xs",
    dot: "bg-amber-400",
    hex: "#f59e0b",
    border: "border-amber-500/30",
  },
  rose: {
    id: "rose",
    label: "Rose Red",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20",
    activeBadge: "bg-rose-500 text-white border-rose-600 shadow-xs",
    dot: "bg-rose-400",
    hex: "#f43f5e",
    border: "border-rose-500/30",
  },
  cyan: {
    id: "cyan",
    label: "Cyan Teal",
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20",
    activeBadge: "bg-cyan-500 text-white border-cyan-600 shadow-xs",
    dot: "bg-cyan-400",
    hex: "#06b6d4",
    border: "border-cyan-500/30",
  },
  indigo: {
    id: "indigo",
    label: "Indigo Violet",
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20",
    activeBadge: "bg-indigo-500 text-white border-indigo-600 shadow-xs",
    dot: "bg-indigo-400",
    hex: "#6366f1",
    border: "border-indigo-500/30",
  },
  orange: {
    id: "orange",
    label: "Coral Orange",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20",
    activeBadge: "bg-orange-500 text-white border-orange-600 shadow-xs",
    dot: "bg-orange-400",
    hex: "#f97316",
    border: "border-orange-500/30",
  },
  teal: {
    id: "teal",
    label: "Seafoam Teal",
    badge: "bg-teal-500/10 text-teal-400 border-teal-500/20 hover:bg-teal-500/20",
    activeBadge: "bg-teal-500 text-white border-teal-600 shadow-xs",
    dot: "bg-teal-400",
    hex: "#14b8a6",
    border: "border-teal-500/30",
  },
  slate: {
    id: "slate",
    label: "Neutral Slate",
    badge: "bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20",
    activeBadge: "bg-slate-500 text-white border-slate-600 shadow-xs",
    dot: "bg-slate-400",
    hex: "#64748b",
    border: "border-slate-500/30",
  },
};

export interface Tag {
  id: string;
  name: string;
  color: TagColorKey;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagUsageStats {
  notesCount: number;
  tasksCount: number;
  projectsCount: number;
  totalCount: number;
}
