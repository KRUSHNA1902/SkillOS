export type ProjectStatus =
  | "planning"
  | "in_progress"
  | "review"
  | "completed"
  | "archived";

export type ProjectPriority = "urgent" | "high" | "medium" | "low";

export type ProjectTrack =
  | "SQL & Databases"
  | "Python & Analytics"
  | "Power BI & BI"
  | "Finance & Markets"
  | "AI & Cloud Architecture"
  | "Fullstack & Systems";

export interface ProjectDeliverable {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  dueDate: string; // ISO date YYYY-MM-DD
  completedAt?: string;
  deliverables: ProjectDeliverable[];
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  descriptionMarkdown: string;
  track: ProjectTrack;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number; // 0 - 100%
  milestones: ProjectMilestone[];
  techStack: string[];
  repoUrl?: string;
  demoUrl?: string;
  docsUrl?: string;
  estimatedHours: number;
  loggedHours: number;
  startDate: string; // ISO date YYYY-MM-DD
  targetDate: string; // ISO date YYYY-MM-DD
  completedDate?: string;
  pinned: boolean;
  linkedTaskIds: string[];
  linkedNoteIds: string[];
  architectureNotes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type ProjectViewMode = "grid" | "kanban" | "timeline" | "list";

export interface ProjectFilterOptions {
  search: string;
  status: "all" | ProjectStatus;
  track: "all" | ProjectTrack;
  priority: "all" | ProjectPriority;
  tag?: "all" | string;
  sortBy: "updated" | "progress" | "targetDate" | "priority" | "title";
}

export interface ProjectMetrics {
  total: number;
  inProgress: number;
  planning: number;
  review: number;
  completed: number;
  archived: number;
  totalEstimatedHours: number;
  totalLoggedHours: number;
  averageProgress: number;
  byTrack: Record<ProjectTrack, number>;
}
