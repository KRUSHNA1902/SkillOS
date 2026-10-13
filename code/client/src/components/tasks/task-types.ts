export type TaskStatus = "in_progress" | "pending" | "completed" | "blocked";
export type TaskPriority = "urgent" | "high" | "medium" | "low";
export type TaskTimelineStage =
  | "backlog"
  | "planning"
  | "in_progress"
  | "review"
  | "completed";

export interface WorkflowTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  dueDate: string;
  deadline: string; // ISO string e.g. "2026-10-13T17:00"
  timelineStage: TaskTimelineStage;
  notes?: string;
  reminderAlert?: boolean;
  createdAt: string;
  completedAt?: string;
}

export type AlertType = "overdue" | "due_today" | "due_soon" | "reminder";

export interface DeadlineAlert {
  id: string;
  taskId: string;
  taskTitle: string;
  priority: TaskPriority;
  type: AlertType;
  message: string;
  deadline: string;
  timeRemaining: string;
}

export interface TaskFilterOptions {
  status: "all" | TaskStatus | "overdue";
  priority: "all" | TaskPriority;
  timelineStage: "all" | TaskTimelineStage;
  search: string;
  sortBy: "deadline" | "priority" | "created" | "title";
}

export interface TaskMetrics {
  total: number;
  inProgress: number;
  completed: number;
  pending: number;
  blocked: number;
  urgent: number;
  overdue: number;
  dueToday: number;
  completionRate: number;
}
