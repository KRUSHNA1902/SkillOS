import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  InboxItem,
  InboxFilterTab,
  InboxPriority,
  InboxMetrics,
} from "./inbox-types";

export const INBOX_STORAGE_KEY = "skillos_inbox_notifications_v1";

const initialInboxSeed: InboxItem[] = [
  {
    id: "inbox-1",
    title: "Overdue: Audit and patch high-risk API rate limit bypass",
    snippet:
      "Rate limit guard vulnerability detected in auth endpoints. Express IP proxy header resolution requires fix.",
    contentMarkdown: `### 🚨 Urgent Security Alert
The automated security scanner detected that the Express rate-limiting middleware is currently reading \`req.ip\` without explicitly validating reverse-proxy trust headers (\`x-forwarded-for\`).

#### Impact & Vulnerability Details
- **Severity**: High (CVSS 7.8)
- **Target Endpoint**: \`/api/auth/login\` and \`/api/auth/register\`
- **Attack Vector**: An attacker can spoof IP headers to circumvent brute-force locks.

#### Recommended Action
1. Open the associated task **Audit and patch high-risk API rate limit bypass** in Tasks view.
2. In \`code/server/src/server.js\`, configure \`app.set("trust proxy", 1)\` and configure \`keyGenerator\` properly.
3. Verify test cases pass before deploying to staging.`,
    category: "security",
    priority: "urgent",
    status: "unread",
    source: {
      name: "Security Sentinel",
      role: "Automated Guard",
      tag: "security-bot",
    },
    createdAt: "2026-10-14T08:15:00",
    timestampDisplay: "15m ago",
    starred: true,
    tags: ["Security", "CVE", "Overdue Task", "Auth"],
    actionPayload: {
      target: "task",
      referenceId: "task-3",
      label: "Open in Tasks View",
    },
    metadata: {
      taskDueDate: "Overdue (Yesterday)",
      cve: "CVE-2026-3819",
      errorSnippet: "RateLimitExceeded check bypassed via forged client headers",
    },
  },
  {
    id: "inbox-2",
    title: "AI Architecture Review: Decoupled Event-Driven Pipeline proposed",
    snippet:
      "SkillOS Copilot completed architecture review for high-throughput batch ETL. 3 optimization steps ready.",
    contentMarkdown: `### ⚡ AI Copilot Architecture Proposal
SkillOS AI evaluated your recent ETL ingestion pipeline in the workspace and identified an opportunity to replace synchronous batch HTTP calls with an **asynchronous event queue pattern**.

#### Key Recommendations:
1. **Decouple Ingestion from Processing**: Ingest incoming events into a durable stream (Redis Streams or Kafka) to achieve sub-5ms producer latency.
2. **Worker Pool Batching**: Workers pull items in batches of 500 records rather than individual single-row transactions.
3. **Dead-Letter Queue (DLQ)**: Failed transformations get routed to a quarantine queue with automatic exponential backoff retry.

> [!TIP]
> This pattern is projected to decrease CPU spikes by **48%** during peak 9:00 AM ingestion windows.`,
    category: "ai",
    priority: "high",
    status: "unread",
    source: {
      name: "SkillOS Copilot",
      role: "AI Architecture Engine",
      tag: "copilot-v2",
    },
    createdAt: "2026-10-14T07:30:00",
    timestampDisplay: "1h ago",
    starred: false,
    tags: ["Architecture", "ETL", "AI Copilot", "Performance"],
    actionPayload: {
      target: "ai",
      promptContext:
        "I'd like to dive into the Decoupled Event-Driven Pipeline proposal for ETL ingestion. Can you provide code examples and architectural trade-offs?",
      label: "Discuss with AI Assistant",
    },
    metadata: {
      author: "SkillOS Copilot",
    },
  },
  {
    id: "inbox-3",
    title: "CI/CD Pipeline failed on branch feature/auth-guard (#418)",
    snippet:
      "Build failed during integration-tests step: 2 test assertions failed in JWT token expiry middleware.",
    contentMarkdown: `### ❌ Workflow Run #418 Failed
The continuous integration test pipeline encountered an error during automated verification on commit \`a92e10c\`.

#### Failure Breakdown
\`\`\`bash
FAIL test/integration/auth-tokens.test.js
  ● Token Refresh Suite > should reject expired bearer token
    Expected status code 401, but received 500 (InternalServerError)
    at verifyTokenMiddleware (middleware/auth.js:42:15)
\`\`\`

#### Diagnostics:
- **Branch**: \`feature/auth-guard\`
- **Trigger**: Push by \`developer@skillos.local\`
- **Environment**: Node 20.x Alpine Runner`,
    category: "workflow",
    priority: "high",
    status: "unread",
    source: {
      name: "GitHub Actions",
      role: "CI Runner",
      tag: "workflow-ci",
    },
    createdAt: "2026-10-14T06:45:00",
    timestampDisplay: "2h ago",
    starred: false,
    tags: ["CI/CD", "Workflows", "Tests Failed"],
    actionPayload: {
      target: "workflows",
      referenceId: "run-418",
      label: "Inspect Workflow Runs",
    },
    metadata: {
      workflowStatus: "failed",
      branch: "feature/auth-guard",
      commitHash: "a92e10c",
      errorSnippet: "Expected 401, received 500 in auth-tokens.test.js",
    },
  },
  {
    id: "inbox-4",
    title: "Sarah Lin mentioned you in note: PostgreSQL Window Functions",
    snippet:
      "@Developer Can you verify if DENSE_RANK() with LAG() satisfies the churn cohort gap requirement?",
    contentMarkdown: `### 💬 Mention in Shared Studio Note
**Sarah Lin** commented on your knowledge note **PostgreSQL Window Functions: LEAD, LAG & DENSE_RANK**:

> *"@Developer Can you check lines 34-39 in the query example? When running against the churn cohort dataset, \`LAG(salary, 1)\` calculates the delta correctly, but should we partition by \`quarter\` instead of \`department_id\` for customer retention?"*

#### Note Reference
- **Title**: PostgreSQL Window Functions: LEAD, LAG & DENSE_RANK
- **Domain**: SQL & Databases
- **Tags**: \`#SQL\`, \`#PostgreSQL\`, \`#Analytics\``,
    category: "mention",
    priority: "normal",
    status: "unread",
    source: {
      name: "Sarah Lin",
      role: "Lead Data Engineer",
      tag: "@sarah",
    },
    createdAt: "2026-10-14T05:20:00",
    timestampDisplay: "3h ago",
    starred: true,
    tags: ["Mentions", "Team", "Notes", "SQL"],
    actionPayload: {
      target: "notes",
      referenceId: "note-sql-01",
      label: "Open Note in Studio",
    },
    metadata: {
      noteTitle: "PostgreSQL Window Functions: LEAD, LAG & DENSE_RANK",
      author: "Sarah Lin",
    },
  },
  {
    id: "inbox-5",
    title: "Supabase PostgreSQL schema migrations synced across dev & staging",
    snippet:
      "Migration 20261012_tasks_rls_policies.sql applied with zero errors. Row-level security active.",
    contentMarkdown: `### ✅ System Migration Synchronized
The automated database migration bot applied recent schema revisions across connected environments.

#### Migration Summary:
- **Migration File**: \`20261012_tasks_rls_policies.sql\`
- **Database**: \`skillos_core_db\` (Supabase Postgres 15.6)
- **Status**: Complete (0 warnings, 0 execution errors)
- **Tables Affected**: \`tasks\`, \`user_profiles\`, \`audit_log\`

Row-level security policies have been recompiled and indexed successfully.`,
    category: "system",
    priority: "normal",
    status: "read",
    source: {
      name: "Database Sentinel",
      role: "Supabase Migration Engine",
      tag: "db-sync",
    },
    createdAt: "2026-10-13T22:00:00",
    timestampDisplay: "Yesterday",
    starred: false,
    tags: ["System", "Supabase", "PostgreSQL", "RLS"],
  },
  {
    id: "inbox-6",
    title: "Task due in 2 hours: Implement Animated Sidebar navigation rail",
    snippet:
      "Spring damping should be critically tuned (mass 0.75, damping 35) to avoid overshooting zero-width rails.",
    contentMarkdown: `### ⏰ Upcoming Task Deadline Reminder
Your task **Implement Animated Sidebar navigation rail with spring physics** is scheduled for delivery today.

#### Task Details:
- **Priority**: High
- **Category**: Frontend UI
- **Due**: Today, 5:00 PM
- **Key Requirement**: Ensure smooth transition when expanding and collapsing between mobile and desktop viewport sizes.`,
    category: "task",
    priority: "high",
    status: "read",
    source: {
      name: "Task Engine",
      role: "Workflow Scheduler",
      tag: "task-manager",
    },
    createdAt: "2026-10-13T16:00:00",
    timestampDisplay: "Yesterday",
    starred: false,
    tags: ["Tasks", "Frontend UI", "Due Soon"],
    actionPayload: {
      target: "task",
      referenceId: "task-1",
      label: "View Task Details",
    },
    metadata: {
      taskDueDate: "Today, 5:00 PM",
    },
  },
];

interface InboxContextType {
  items: InboxItem[];
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  selectedItem: InboxItem | null;
  metrics: InboxMetrics;
  filterTab: InboxFilterTab;
  setFilterTab: (tab: InboxFilterTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  priorityFilter: "all" | InboxPriority;
  setPriorityFilter: (priority: "all" | InboxPriority) => void;
  toastMessage: string | null;
  clearToast: () => void;
  showToast: (msg: string) => void;

  // Actions
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAllAsRead: () => void;
  archiveItem: (id: string) => void;
  unarchiveItem: (id: string) => void;
  archiveAllRead: () => void;
  toggleStar: (id: string) => void;
  deleteItem: (id: string) => void;
  resetToInitialSeed: () => void;
}

const InboxContext = createContext<InboxContextType | undefined>(undefined);

export function InboxProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const storageKey = user ? `${INBOX_STORAGE_KEY}_${user.id}` : INBOX_STORAGE_KEY;

  const [items, setItems] = useState<InboxItem[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to read inbox from localStorage:", e);
    }
    return initialInboxSeed;
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(() => {
    const firstUnread = initialInboxSeed.find((i) => i.status === "unread");
    return firstUnread ? firstUnread.id : initialInboxSeed[0]?.id || null;
  });

  const [filterTab, setFilterTab] = useState<InboxFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | InboxPriority>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to persist inbox items to localStorage:", e);
    }
  }, [items, storageKey]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const clearToast = () => {
    setToastMessage(null);
  };

  // Metrics
  const metrics: InboxMetrics = useMemo(() => {
    const unarchived = items.filter((i) => i.status !== "archived");
    return {
      total: unarchived.length,
      unread: unarchived.filter((i) => i.status === "unread").length,
      urgent: unarchived.filter((i) => i.priority === "urgent" && i.status === "unread").length,
      starred: unarchived.filter((i) => i.starred).length,
      archived: items.filter((i) => i.status === "archived").length,
    };
  }, [items]);

  // Selected item reference
  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  const markAsRead = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "read" } : item))
    );
  };

  const markAsUnread = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "unread" } : item))
    );
    showToast("Marked as unread");
  };

  const markAllAsRead = () => {
    setItems((prev) =>
      prev.map((item) =>
        item.status === "unread" ? { ...item, status: "read" } : item
      )
    );
    showToast("All notifications marked as read");
  };

  const archiveItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "archived" } : item))
    );
    showToast("Notification archived");
  };

  const unarchiveItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "read" } : item))
    );
    showToast("Restored from archive");
  };

  const archiveAllRead = () => {
    setItems((prev) =>
      prev.map((item) =>
        item.status === "read" ? { ...item, status: "archived" } : item
      )
    );
    showToast("All read notifications archived");
  };

  const toggleStar = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, starred: !item.starred } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
    showToast("Notification deleted");
  };

  const resetToInitialSeed = () => {
    setItems(initialInboxSeed);
    setSelectedItemId(initialInboxSeed[0]?.id || null);
    setFilterTab("all");
    setPriorityFilter("all");
    setSearchQuery("");
    showToast("Reset inbox to default sample data");
  };

  return (
    <InboxContext.Provider
      value={{
        items,
        selectedItemId,
        setSelectedItemId,
        selectedItem,
        metrics,
        filterTab,
        setFilterTab,
        searchQuery,
        setSearchQuery,
        priorityFilter,
        setPriorityFilter,
        toastMessage,
        clearToast,
        showToast,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        archiveItem,
        unarchiveItem,
        archiveAllRead,
        toggleStar,
        deleteItem,
        resetToInitialSeed,
      }}
    >
      {children}
    </InboxContext.Provider>
  );
}

export function useInbox() {
  const context = useContext(InboxContext);
  if (!context) {
    throw new Error("useInbox must be used within an InboxProvider");
  }
  return context;
}
