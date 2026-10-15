import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTags } from "@/components/tags/tag-context";
import {
  WorkflowTask,
  TaskPriority,
  TaskTimelineStage,
  DeadlineAlert,
  TaskMetrics,
} from "./task-types";

export const STORAGE_KEY = "skillos_workflow_tasks_v2";

export type SyncStatus = "synced" | "syncing" | "local_dev" | "offline_cached" | "error";

const initialTasksSeed: WorkflowTask[] = [
  {
    id: "task-1",
    title: "Implement Animated Sidebar navigation rail with spring physics",
    status: "in_progress",
    priority: "high",
    category: "Frontend UI",
    dueDate: "Today, 5:00 PM",
    deadline: "2026-10-13T17:00",
    timelineStage: "in_progress",
    tags: ["Frontend UI", "Architecture"],
    notes:
      "Spring damping should be critically tuned (mass 0.75, damping 35) to avoid overshooting zero-width rails on desktop resize.",
    reminderAlert: true,
    createdAt: "2026-10-12T09:00:00",
  },
  {
    id: "task-2",
    title: "Connect Supabase Auth session tokens with Express middleware",
    status: "in_progress",
    priority: "urgent",
    category: "Auth Pipeline",
    dueDate: "Today, 7:30 PM",
    deadline: "2026-10-13T19:30",
    timelineStage: "in_progress",
    tags: ["Auth Pipeline", "Backend", "Security"],
    notes:
      "Ensure JWT validation runs before protected routes. Dev bypass mode must only activate when VITE_DEV_BYPASS is explicitly true.",
    reminderAlert: true,
    createdAt: "2026-10-12T11:30:00",
  },
  {
    id: "task-3",
    title: "Audit and patch high-risk API rate limit bypass",
    status: "pending",
    priority: "urgent",
    category: "Security",
    dueDate: "Overdue (Yesterday)",
    deadline: "2026-10-12T18:00",
    timelineStage: "planning",
    tags: ["Security", "Backend"],
    notes:
      "Check express-rate-limit IP resolution behind reverse proxy headers (x-forwarded-for). Verify brute force guard on auth endpoints.",
    reminderAlert: true,
    createdAt: "2026-10-11T14:00:00",
  },
  {
    id: "task-4",
    title: "Optimize LCP and reduce motion jank on mobile drawer viewport",
    status: "in_progress",
    priority: "medium",
    category: "Performance",
    dueDate: "Tomorrow, 2:00 PM",
    deadline: "2026-10-14T14:00",
    timelineStage: "in_progress",
    tags: ["Performance", "Frontend UI"],
    notes:
      "Audit touch gesture listener passive flags. Avoid layout thrashing when triggering backdrop blur filters.",
    reminderAlert: false,
    createdAt: "2026-10-13T08:15:00",
  },
  {
    id: "task-5",
    title: "Design SkillOS task hierarchy & interactive checklist workflow",
    status: "completed",
    priority: "high",
    category: "Workflow Engine",
    dueDate: "Completed",
    deadline: "2026-10-12T12:00",
    timelineStage: "completed",
    tags: ["Workflow Engine", "Architecture"],
    notes:
      "Completed multi-operation task manager with timeline view, deadline alerts, priority badges, and note reader.",
    reminderAlert: false,
    createdAt: "2026-10-10T10:00:00",
    completedAt: "2026-10-12T15:30:00",
  },
  {
    id: "task-6",
    title: "Configure Tailwind CSS dark theme tokens for shadcn UI components",
    status: "completed",
    priority: "medium",
    category: "Design System",
    dueDate: "Completed",
    deadline: "2026-10-11T16:00",
    timelineStage: "completed",
    tags: ["Frontend UI", "Architecture"],
    notes:
      "Configured hsl(var(--card)) and hsl(var(--muted)) theme variables for native dark/light switching.",
    reminderAlert: false,
    createdAt: "2026-10-09T14:00:00",
    completedAt: "2026-10-11T18:00:00",
  },
  {
    id: "task-7",
    title: "Automate PostgreSQL database migration scripts on cloud host",
    status: "pending",
    priority: "high",
    category: "Backend",
    dueDate: "In 3 days",
    deadline: "2026-10-16T18:00",
    timelineStage: "planning",
    tags: ["Backend", "PostgreSQL", "SQL"],
    notes:
      "Prepare idempotent SQL migration runner with schema verification checks and rollback snapshots.",
    reminderAlert: false,
    createdAt: "2026-10-12T16:00:00",
  },
  {
    id: "task-8",
    title: "Benchmark AI skill assessment prompts against real developer code",
    status: "pending",
    priority: "medium",
    category: "AI Engine",
    dueDate: "Friday",
    deadline: "2026-10-17T17:00",
    timelineStage: "backlog",
    tags: ["AI", "Analytics"],
    notes:
      "Benchmark AST accuracy across TypeScript generics, async runtime hooks, and memory leak patterns.",
    reminderAlert: false,
    createdAt: "2026-10-13T10:00:00",
  },
];

export function calculateTimeRemaining(deadlineIso: string): {
  diffMinutes: number;
  diffHours: number;
  diffDays: number;
  formatted: string;
  isOverdue: boolean;
  isDueToday: boolean;
} {
  const target = new Date(deadlineIso).getTime();
  const now = new Date("2026-10-13T16:41:33").getTime();
  const diffMs = target - now;
  const isOverdue = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const diffMinutes = Math.floor(absMs / (1000 * 60));
  const diffHours = Math.floor(absMs / (1000 * 60 * 60));
  const diffDays = Math.floor(absMs / (1000 * 60 * 60 * 24));

  const deadlineDate = new Date(deadlineIso);
  const isDueToday =
    deadlineDate.getFullYear() === 2026 &&
    deadlineDate.getMonth() === 9 &&
    deadlineDate.getDate() === 13;

  let formatted = "";
  if (isOverdue) {
    if (diffDays >= 1) formatted = `Overdue by ${diffDays}d`;
    else if (diffHours >= 1) formatted = `Overdue by ${diffHours}h`;
    else formatted = `Overdue by ${diffMinutes}m`;
  } else {
    if (diffDays >= 1) formatted = `Due in ${diffDays}d`;
    else if (diffHours >= 1) formatted = `Due in ${diffHours}h`;
    else formatted = `Due in ${diffMinutes}m`;
  }

  return { diffMinutes, diffHours, diffDays, formatted, isOverdue, isDueToday };
}

interface TaskManagerContextType {
  tasks: WorkflowTask[];
  activeAlerts: DeadlineAlert[];
  dismissedAlertIds: string[];
  metrics: TaskMetrics;
  syncStatus: SyncStatus;
  syncWithCloud: () => Promise<void>;
  addTask: (
    taskData: Omit<WorkflowTask, "id" | "createdAt"> & { id?: string }
  ) => WorkflowTask;
  updateTask: (id: string, updates: Partial<WorkflowTask>) => void;
  deleteTask: (id: string) => void;
  deleteOldTasks: (filterMode?: "completed" | "older_than_day" | "all_completed") => number;
  toggleTaskStatus: (id: string) => void;
  setTaskPriority: (id: string, priority: TaskPriority) => void;
  setTaskTimelineStage: (id: string, stage: TaskTimelineStage) => void;
  toggleReminderAlert: (id: string) => void;
  dismissAlert: (alertId: string) => void;
  resetDefaultTasks: () => void;
  loadStarterTemplates: () => void;
  batchRenameTag: (oldName: string, newName: string) => void;
  batchRemoveTag: (tagName: string) => void;
}

const TaskManagerContext = createContext<TaskManagerContextType | null>(null);

export function TaskManagerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const isDevUser = user?.id === "dev-user-001";
  const storageKey = user ? `skillos_workflow_tasks_${user.id}` : "skillos_workflow_tasks_guest";
  const alertsKey = user ? `skillos_dismissed_alerts_${user.id}` : "skillos_dismissed_alerts_guest";

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    isDevUser ? "local_dev" : "syncing"
  );

  const [tasks, setTasks] = useState<WorkflowTask[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      if (isDevUser) {
        const legacy = localStorage.getItem("skillos_workflow_tasks_v2");
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return initialTasksSeed;
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(alertsKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Persist tasks in localStorage scoped to current user
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch {}
  }, [tasks, storageKey]);

  // Persist dismissed alerts in localStorage scoped to current user
  useEffect(() => {
    try {
      localStorage.setItem(alertsKey, JSON.stringify(dismissedAlertIds));
    } catch {}
  }, [dismissedAlertIds, alertsKey]);

  // Cloud Database Synchronization Engine
  const syncWithCloud = useCallback(async () => {
    if (isDevUser) {
      setSyncStatus("local_dev");
      return;
    }

    if (!user) {
      setSyncStatus("offline_cached");
      return;
    }

    setSyncStatus("syncing");
    try {
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.tableNotCreated) {
          setSyncStatus("offline_cached");
          return;
        }

        if (Array.isArray(data.tasks)) {
          if (data.tasks.length > 0) {
            setTasks(data.tasks);
            setSyncStatus("synced");
          } else {
            // If remote database is empty but user has local tasks, push local to remote
            let currentTasks: WorkflowTask[] = [];
            try {
              const localSaved = localStorage.getItem(storageKey);
              if (localSaved) currentTasks = JSON.parse(localSaved);
            } catch {}
            if (Array.isArray(currentTasks) && currentTasks.length > 0) {
              // Background batch seed to Supabase
              for (const t of currentTasks) {
                fetch("/api/tasks", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(t),
                  credentials: "include",
                }).catch(() => {});
              }
            }
            setSyncStatus("synced");
          }
        }
      } else {
        setSyncStatus("offline_cached");
      }
    } catch (err) {
      console.warn("[TaskManager] Failed to reach /api/tasks:", err);
      setSyncStatus("offline_cached");
    }
  }, [isDevUser, user?.id, storageKey]);

  // Trigger initial cloud fetch on user login/auth change
  useEffect(() => {
    let active = true;
    if (active) {
      syncWithCloud();
    }
    return () => {
      active = false;
    };
  }, [user?.id, isDevUser, syncWithCloud]);

  // Hook into Central Tag System for automatic rename and delete sync
  const { registerTagRenameListener, registerTagDeleteListener } = useTags();

  const batchRenameTag = useCallback((oldName: string, newName: string) => {
    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        tags: t.tags?.map((tag) =>
          tag.toLowerCase() === oldName.toLowerCase() ? newName : tag
        ),
      }))
    );
  }, []);

  const batchRemoveTag = useCallback((tagName: string) => {
    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        tags: t.tags?.filter(
          (tag) => tag.toLowerCase() !== tagName.toLowerCase()
        ),
      }))
    );
  }, []);

  useEffect(() => {
    const unregisterRename = registerTagRenameListener((oldName, newName) => {
      batchRenameTag(oldName, newName);
    });
    const unregisterDelete = registerTagDeleteListener((tagName) => {
      batchRemoveTag(tagName);
    });
    return () => {
      unregisterRename();
      unregisterDelete();
    };
  }, [registerTagRenameListener, registerTagDeleteListener, batchRenameTag, batchRemoveTag]);

  // Compute real-time deadline alerts
  const activeAlerts = useMemo<DeadlineAlert[]>(() => {
    const alerts: DeadlineAlert[] = [];

    tasks.forEach((task) => {
      if (task.status === "completed") return;

      const calc = calculateTimeRemaining(task.deadline);
      const isDismissed = dismissedAlertIds.includes(task.id);
      if (isDismissed) return;

      if (calc.isOverdue) {
        alerts.push({
          id: `alert-overdue-${task.id}`,
          taskId: task.id,
          taskTitle: task.title,
          priority: task.priority,
          type: "overdue",
          message: `Deadline expired (${calc.formatted}) - Action required`,
          deadline: task.deadline,
          timeRemaining: calc.formatted,
        });
      } else if (calc.isDueToday) {
        alerts.push({
          id: `alert-today-${task.id}`,
          taskId: task.id,
          taskTitle: task.title,
          priority: task.priority,
          type: "due_today",
          message: `Due today before deadline (${calc.formatted})`,
          deadline: task.deadline,
          timeRemaining: calc.formatted,
        });
      } else if (task.reminderAlert && calc.diffHours <= 48) {
        alerts.push({
          id: `alert-reminder-${task.id}`,
          taskId: task.id,
          taskTitle: task.title,
          priority: task.priority,
          type: "reminder",
          message: `Active reminder: ${calc.formatted}`,
          deadline: task.deadline,
          timeRemaining: calc.formatted,
        });
      }
    });

    return alerts.sort((a, b) => {
      if (a.type === "overdue" && b.type !== "overdue") return -1;
      if (b.type === "overdue" && a.type !== "overdue") return 1;
      if (a.priority === "urgent" && b.priority !== "urgent") return -1;
      if (b.priority === "urgent" && a.priority !== "urgent") return 1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [tasks, dismissedAlertIds]);

  // Compute global workflow metrics
  const metrics = useMemo<TaskMetrics>(() => {
    const total = tasks.length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const urgent = tasks.filter(
      (t) => t.priority === "urgent" && t.status !== "completed"
    ).length;

    let overdue = 0;
    let dueToday = 0;

    tasks.forEach((t) => {
      if (t.status === "completed") return;
      const c = calculateTimeRemaining(t.deadline);
      if (c.isOverdue) overdue += 1;
      else if (c.isDueToday) dueToday += 1;
    });

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      inProgress,
      completed,
      pending,
      blocked,
      urgent,
      overdue,
      dueToday,
      completionRate,
    };
  }, [tasks]);

  // Add Task (Optimistic UI + Background Cloud DB Sync)
  const addTask = (
    taskData: Omit<WorkflowTask, "id" | "createdAt"> & { id?: string }
  ): WorkflowTask => {
    const generatedId = typeof crypto !== "undefined" && crypto.randomUUID
      ? `task-${crypto.randomUUID()}`
      : `task-${user?.id ? user.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) : "guest"}-${Date.now()}`;

    const newTask: WorkflowTask = {
      ...taskData,
      id: taskData.id || generatedId,
      tags:
        taskData.tags && taskData.tags.length > 0
          ? taskData.tags
          : [taskData.category || "General"],
      createdAt: new Date().toISOString(),
      status: taskData.status || "in_progress",
      timelineStage: taskData.timelineStage || "in_progress",
    };

    setTasks((prev) => [newTask, ...prev]);

    // Background Cloud Sync
    if (!isDevUser && user) {
      fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) setSyncStatus("synced");
        })
        .catch(() => setSyncStatus("offline_cached"));
    }

    return newTask;
  };

  // Update Task (Optimistic UI + Background Cloud DB Sync)
  const updateTask = (id: string, updates: Partial<WorkflowTask>) => {
    let updatedPayload: WorkflowTask | null = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };
        if (updates.status === "completed" && !t.completedAt) {
          updated.completedAt = new Date().toISOString();
          updated.timelineStage = "completed";
          updated.dueDate = "Completed";
        }
        updatedPayload = updated;
        return updated;
      })
    );

    // Background Cloud Sync
    if (!isDevUser && user && updatedPayload) {
      fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) setSyncStatus("synced");
        })
        .catch(() => setSyncStatus("offline_cached"));
    }
  };

  // Delete Individual Task (Optimistic UI + Background Cloud DB Sync)
  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setDismissedAlertIds((prev) => prev.filter((alertId) => alertId !== id));

    // Background Cloud Sync
    if (!isDevUser && user) {
      fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) setSyncStatus("synced");
        })
        .catch(() => setSyncStatus("offline_cached"));
    }
  };

  // Delete Old Tasks (bulk cleanup)
  const deleteOldTasks = (
    _filterMode: "completed" | "older_than_day" | "all_completed" = "all_completed"
  ): number => {
    let deletedCount = 0;
    setTasks((prev) => {
      const filtered = prev.filter((t) => {
        if (t.status === "completed") {
          deletedCount += 1;
          return false;
        }
        return true;
      });
      return filtered;
    });

    // Background Cloud Sync
    if (!isDevUser && user) {
      fetch("/api/tasks/cleanup/completed", {
        method: "DELETE",
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) setSyncStatus("synced");
        })
        .catch(() => setSyncStatus("offline_cached"));
    }

    return deletedCount;
  };

  // Toggle Task Status
  const toggleTaskStatus = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const isNowCompleted = task.status !== "completed";
    updateTask(id, {
      status: isNowCompleted ? "completed" : "in_progress",
      timelineStage: isNowCompleted ? "completed" : "in_progress",
      completedAt: isNowCompleted ? new Date().toISOString() : undefined,
      dueDate: isNowCompleted ? "Completed" : "Today",
    });
  };

  // Change Priority
  const setTaskPriority = (id: string, priority: TaskPriority) => {
    updateTask(id, { priority });
  };

  // Change Timeline Stage
  const setTaskTimelineStage = (id: string, stage: TaskTimelineStage) => {
    const isCompleted = stage === "completed";
    updateTask(id, {
      timelineStage: stage,
      status: isCompleted ? "completed" : "in_progress",
    });
  };

  // Toggle Reminder Alert
  const toggleReminderAlert = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    updateTask(id, { reminderAlert: !task.reminderAlert });
  };

  // Dismiss Alert
  const dismissAlert = (alertId: string) => {
    const taskId = alertId.replace(/^alert-[a-z]+-/, "");
    setDismissedAlertIds((prev) => [...prev, taskId]);
  };

  // Reset to default seed
  const resetDefaultTasks = () => {
    const userSeedTasks = initialTasksSeed.map((t) => ({
      ...t,
      id: isDevUser ? t.id : `task-${user?.id ? user.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) : "guest"}-${t.id}`,
    }));
    setTasks(userSeedTasks);
    setDismissedAlertIds([]);
    if (!isDevUser && user) {
      // Seed to cloud DB
      for (const t of userSeedTasks) {
        fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t),
          credentials: "include",
        }).catch(() => {});
      }
    }
  };

  return (
    <TaskManagerContext.Provider
      value={{
        tasks,
        activeAlerts,
        dismissedAlertIds,
        metrics,
        syncStatus,
        syncWithCloud,
        addTask,
        updateTask,
        deleteTask,
        deleteOldTasks,
        toggleTaskStatus,
        setTaskPriority,
        setTaskTimelineStage,
        toggleReminderAlert,
        dismissAlert,
        resetDefaultTasks,
        loadStarterTemplates: resetDefaultTasks,
        batchRenameTag,
        batchRemoveTag,
      }}
    >
      {children}
    </TaskManagerContext.Provider>
  );
}

export function useTaskManager() {
  const context = useContext(TaskManagerContext);
  if (!context) {
    throw new Error("useTaskManager must be used within a TaskManagerProvider");
  }
  return context;
}
