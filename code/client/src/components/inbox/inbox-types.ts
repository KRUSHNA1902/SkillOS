export type InboxCategory =
  | "task"
  | "workflow"
  | "ai"
  | "security"
  | "mention"
  | "system";

export type InboxPriority = "urgent" | "high" | "normal" | "low";

export type InboxStatus = "unread" | "read" | "archived";

export type InboxActionTarget = "task" | "ai" | "notes" | "workflows" | "external";

export interface InboxSource {
  name: string;
  avatarUrl?: string;
  role?: string;
  tag?: string;
}

export interface InboxActionPayload {
  target: InboxActionTarget;
  referenceId?: string;
  promptContext?: string;
  label: string;
}

export interface InboxMetadata {
  taskDueDate?: string;
  workflowStatus?: "success" | "failed" | "running";
  branch?: string;
  commitHash?: string;
  errorSnippet?: string;
  cve?: string;
  noteTitle?: string;
  author?: string;
}

export interface InboxItem {
  id: string;
  title: string;
  snippet: string;
  contentMarkdown: string;
  category: InboxCategory;
  priority: InboxPriority;
  status: InboxStatus;
  source: InboxSource;
  createdAt: string;
  timestampDisplay: string;
  starred: boolean;
  tags: string[];
  actionPayload?: InboxActionPayload;
  metadata?: InboxMetadata;
}

export type InboxFilterTab =
  | "all"
  | "unread"
  | "ai"
  | "task"
  | "workflow"
  | "security"
  | "archived";

export interface InboxMetrics {
  total: number;
  unread: number;
  urgent: number;
  starred: number;
  archived: number;
}
