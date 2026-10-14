import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTags } from "@/components/tags/tag-context";
import { KnowledgeNote, NoteTrack, NoteMetrics } from "./note-types";

export const STORAGE_KEY = "skillos_knowledge_notes_v1";

const initialNotesSeed: KnowledgeNote[] = [
  {
    id: "note-sql-01",
    title: "PostgreSQL Window Functions: LEAD, LAG & DENSE_RANK",
    contentMarkdown: `### Executive Summary
Window functions perform calculations across a set of table rows that are somehow related to the current row, without collapsing multiple rows into a single output row like a traditional \`GROUP BY\`.

### ⏳ Chronological Query Mechanics
1. **Partitioning**: Divides rows into distinct logical partitions (\`PARTITION BY department_id\`).
2. **Ordering**: Defines the sorting sequence within each partition (\`ORDER BY salary DESC\`).
3. **Framing**: Specifies the subset of rows relative to the current row (e.g. \`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\`).

### ⚡ Cheatsheet
- \`DENSE_RANK()\`: Ranks rows without gaps when duplicate values occur.
- \`LAG(col, 1, 0)\`: Fetches previous row's value to calculate period-over-period growth delta.
- \`LEAD(col, 1)\`: Fetches succeeding row's value for predictive or churn analysis.

> [!NOTE]
> Always place window functions in the \`SELECT\` or \`ORDER BY\` clause. To filter on a window function result, wrap it inside a Common Table Expression (CTE).`,
    codeSnippet: `WITH ranked_salaries AS (
  SELECT 
    employee_id,
    department_id,
    salary,
    DENSE_RANK() OVER (
      PARTITION BY department_id 
      ORDER BY salary DESC
    ) AS dept_rank,
    LAG(salary, 1) OVER (
      PARTITION BY department_id 
      ORDER BY salary DESC
    ) - salary AS salary_gap_from_higher
  FROM employees
)
SELECT * 
FROM ranked_salaries 
WHERE dept_rank <= 3;`,
    language: "sql",
    tags: ["SQL", "PostgreSQL", "Window Functions", "Analytics"],
    area: "SQL & Databases",
    pinned: true,
    createdAt: "2026-10-11T09:00:00",
    updatedAt: "2026-10-13T16:30:00",
  },
  {
    id: "note-py-02",
    title: "Pandas DataFrame Vectorization vs apply() Benchmarks",
    contentMarkdown: `### Core Rule: Vectorization First
Whenever performing column-wise transformations in Pandas, native NumPy vectorization outperforms \`DataFrame.apply()\` by **10x to 100x** because it delegates loops to contiguous C-memory blocks rather than invoking the Python GIL bytecode on every row.

### ⚠️ Common Pitfall
Using \`.apply(lambda row: ...)\` when \`np.select()\` or \`np.where()\` can compute multi-condition logic natively without Python loop overhead.

### ⏳ Optimization Hierarchy
1. Native Series arithmetic: \`df['revenue'] - df['cost']\`
2. NumPy boolean masking: \`np.where(df['margin'] > 0.3, 'High', 'Standard')\`
3. Cython / Numba JIT compilation for complex custom math.`,
    codeSnippet: `import numpy as np
import pandas as pd

# High-Performance Multi-Condition Categorization
conditions = [
    (df['tenure_months'] >= 24) & (df['mrr'] > 500),
    (df['tenure_months'] >= 12) & (df['mrr'] > 250),
    (df['churn_risk_score'] > 0.75)
]

choices = ['VIP Tier', 'Core Tier', 'At-Risk']

# Instant vectorized assignment:
df['account_segment'] = np.select(conditions, choices, default='Standard')`,
    language: "python",
    tags: ["Python", "Pandas", "NumPy", "Optimization", "DataFrames"],
    area: "Python & Analytics",
    pinned: true,
    createdAt: "2026-10-11T14:15:00",
    updatedAt: "2026-10-13T17:10:00",
  },
  {
    id: "note-bi-03",
    title: "DAX Time Intelligence Patterns: Prior Period & YTD",
    contentMarkdown: `### Standard Date Dimension Prerequisite
DAX time intelligence functions (\`SAMEPERIODLASTYEAR\`, \`DATEADD\`, \`TOTALYTD\`) strictly require:
1. A contiguous Date dimension table marked as the official Date Table.
2. No duplicate dates or missing intervals.
3. 1-to-many relationship linking Date table to the Fact table.

### ⚡ Core Measure Formulas
- **Revenue YTD**:
  \`TOTALYTD([Total Revenue], 'DimDate'[Date])\`
- **Prior Year Variance %**:
  \`DIVIDE([Total Revenue] - [Revenue PY], [Revenue PY], 0)\``,
    codeSnippet: `Revenue PY = 
CALCULATE(
    [Total Revenue],
    SAMEPERIODLASTYEAR('DimDate'[Date])
)

YoY Growth % = 
VAR CurrentRev = [Total Revenue]
VAR PriorRev = [Revenue PY]
RETURN
    IF(
        NOT ISBLANK(PriorRev),
        DIVIDE(CurrentRev - PriorRev, PriorRev, 0),
        BLANK()
    )`,
    language: "dax",
    tags: ["Power BI", "DAX", "Time Intelligence", "Semantic Modeling"],
    area: "Power BI & Semantic Modeling",
    pinned: false,
    createdAt: "2026-10-12T10:00:00",
    updatedAt: "2026-10-13T11:45:00",
  },
  {
    id: "note-fin-04",
    title: "DCF Valuation Modeling: Free Cash Flow & Terminal Value",
    contentMarkdown: `### Discounted Cash Flow (DCF) Formula Framework
DCF values an enterprise based on its projected future unlevered free cash flows (UFCF) discounted back to today using the Weighted Average Cost of Capital (WACC).

### ⏳ Steps in the DCF Pipeline:
1. **Historical Analysis**: 3-5 years revenue growth, EBITDA margin, and working capital intensity.
2. **UFCF Forecast**: Projection period of 5 to 10 years.
   $$\\text{UFCF} = \\text{EBIT} \\times (1 - t) + \\text{D\\&A} - \\text{CapEx} - \\Delta \\text{NWC}$$
3. **Terminal Value (Gordon Growth)**:
   $$\\text{TV} = \\frac{\\text{FCF}_{n+1}}{\\text{WACC} - g}$$
4. **Enterprise to Equity Value Bridge**:
   $$\\text{Equity Value} = \\text{PV of FCFs} + \\text{PV of TV} + \\text{Cash} - \\text{Total Debt}$$`,
    codeSnippet: `// Standard Financial Model Metrics
WACC = (E/V * Re) + (D/V * Rd * (1 - Tc))
Enterprise_Value = Sum_PV_CashFlows + PV_Terminal_Value
Implied_Share_Price = (Enterprise_Value - Net_Debt) / Shares_Outstanding`,
    language: "markdown",
    tags: ["Finance", "Valuation", "DCF", "WACC", "Modeling"],
    area: "Finance & Markets",
    pinned: false,
    createdAt: "2026-10-12T15:20:00",
    updatedAt: "2026-10-13T09:15:00",
  },
  {
    id: "note-ai-05",
    title: "Gemini 3.8 Multi-Turn Structured Prompts & Agent Guardrails",
    contentMarkdown: `### Architectural Standard for AI Agents
When building agentic workflows with Gemini 3.8 Flash, separate the system instructions into four explicit architectural tiers:
1. **Persona & Role**: Clear technical authority boundaries.
2. **Context Schema**: Normalized JSON or Markdown structures representing domain state.
3. **Operational Constraints**: Deterministic negative constraints (e.g., "Never expose API tokens", "Always output valid markdown").
4. **Output Verification Format**: Clear markdown headings or schema definitions.

> [!TIP]
> In client-side chat streams, maintain an \`AbortController\` ref to cleanly cancel flight requests when switching routes or regenerating.`,
    codeSnippet: `const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: userQuery,
    systemInstruction: \`You are the SkillOS Knowledge Synthesizer. Output clean markdown.\`,
    mode: 'notes',
    model: 'gemini-3.8-flash'
  }),
  signal: abortController.signal
});`,
    language: "typescript",
    tags: ["AI", "Gemini", "Agents", "Prompting", "API"],
    area: "AI & Cloud Architecture",
    pinned: true,
    createdAt: "2026-10-13T08:30:00",
    updatedAt: "2026-10-13T17:45:00",
  },
  {
    id: "note-arch-06",
    title: "SkillOS Responsive Inset Shell & Spring Physics Boundaries",
    contentMarkdown: `### UI Mechanics & Rail Physics
When animating the collapsible sidebar alongside the inset main canvas:
- Use fixed spring damping (\`mass: 0.75, damping: 35\`) to prevent layout oscillation on fast window resizes.
- Ensure the inset container has \`min-w-0\` and \`flex-1\` with hidden horizontal overflow to avoid layout thrashing.
- Dark theme variables should always map through \`hsl(var(--card))\` and \`hsl(var(--background))\` for consistent obsidian styling.`,
    codeSnippet: `// Framer motion sidebar spring config
export const sidebarSpringTransition = {
  type: "spring",
  stiffness: 400,
  damping: 35,
  mass: 0.75,
};`,
    language: "typescript",
    tags: ["Architecture", "Tailwind", "Framer Motion", "Design System"],
    area: "Architecture",
    pinned: false,
    createdAt: "2026-10-10T12:00:00",
    updatedAt: "2026-10-12T18:00:00",
  },
];

interface NotesContextType {
  notes: KnowledgeNote[];
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  metrics: NoteMetrics;
  addNote: (note: Omit<KnowledgeNote, "id" | "createdAt" | "updatedAt">) => KnowledgeNote;
  updateNote: (id: string, note: Partial<KnowledgeNote>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  duplicateNote: (id: string) => KnowledgeNote;
  exportNoteMarkdown: (id: string) => void;
  exportAllNotesMarkdown: () => void;
  loadStarterTemplates: () => void;
  batchRenameTag: (oldName: string, newName: string) => void;
  batchRemoveTag: (tagName: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isDevUser = user?.id === "dev-user-001";
  const storageKey = user ? `skillos_knowledge_notes_${user.id}` : "skillos_knowledge_notes_guest";

  const [notes, setNotes] = useState<KnowledgeNote[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      if (isDevUser) {
        const legacy = localStorage.getItem("skillos_knowledge_notes_v1");
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return initialNotesSeed;
      }
    } catch (e) {
      console.warn("Failed to read knowledge notes from storage:", e);
    }
    // Regular users start with clean slate []
    return [];
  });

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    if (isDevUser) {
      return initialNotesSeed[0]?.id || null;
    }
    return null;
  });

  // Save to localStorage whenever notes update
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    } catch (e) {
      console.error("Failed to save knowledge notes to storage:", e);
    }
  }, [notes, storageKey]);

  // Ensure valid selection if selected note gets deleted
  useEffect(() => {
    if (selectedNoteId && !notes.some((n) => n.id === selectedNoteId)) {
      setSelectedNoteId(notes[0]?.id || null);
    }
  }, [notes, selectedNoteId]);

  // Hook into Central Tag System for automatic rename and delete sync
  const { registerTagRenameListener, registerTagDeleteListener } = useTags();

  const batchRenameTag = useCallback((oldName: string, newName: string) => {
    setNotes((prev) =>
      prev.map((n) => ({
        ...n,
        tags: n.tags.map((t) =>
          t.toLowerCase() === oldName.toLowerCase() ? newName : t
        ),
      }))
    );
  }, []);

  const batchRemoveTag = useCallback((tagName: string) => {
    setNotes((prev) =>
      prev.map((n) => ({
        ...n,
        tags: n.tags.filter(
          (t) => t.toLowerCase() !== tagName.toLowerCase()
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

  // Real-time Metrics
  const metrics = useMemo<NoteMetrics>(() => {
    const total = notes.length;
    const pinned = notes.filter((n) => n.pinned).length;
    const withCode = notes.filter((n) => Boolean(n.codeSnippet?.trim())).length;

    const byArea: Record<NoteTrack, number> = {
      "SQL & Databases": 0,
      "Python & Analytics": 0,
      "Power BI & Semantic Modeling": 0,
      "Finance & Markets": 0,
      "AI & Cloud Architecture": 0,
      "Projects & Portfolio": 0,
      "Architecture": 0,
      "General": 0,
    };

    const tagCounts: Record<string, number> = {};

    notes.forEach((note) => {
      if (byArea[note.area] !== undefined) {
        byArea[note.area] += 1;
      } else {
        byArea["General"] += 1;
      }

      note.tags.forEach((tag) => {
        const normalized = tag.trim();
        if (normalized) {
          tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
        }
      });
    });

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    return { total, pinned, withCode, byArea, topTags };
  }, [notes]);

  // CRUD Actions
  const addNote = (
    noteData: Omit<KnowledgeNote, "id" | "createdAt" | "updatedAt">
  ): KnowledgeNote => {
    const now = new Date().toISOString();
    const newNote: KnowledgeNote = {
      ...noteData,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: now,
      updatedAt: now,
    };

    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    return newNote;
  };

  const updateNote = (id: string, noteData: Partial<KnowledgeNote>) => {
    const now = new Date().toISOString();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...noteData, updatedAt: now } : n))
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const togglePinNote = (id: string) => {
    const now = new Date().toISOString();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: now } : n))
    );
  };

  const duplicateNote = (id: string): KnowledgeNote => {
    const target = notes.find((n) => n.id === id);
    if (!target) throw new Error("Note not found");

    const now = new Date().toISOString();
    const cloned: KnowledgeNote = {
      ...target,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `${target.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
      pinned: false,
    };

    setNotes((prev) => [cloned, ...prev]);
    setSelectedNoteId(cloned.id);
    return cloned;
  };

  const exportNoteMarkdown = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    let md = `# ${target.title}\n\n`;
    md += `**Track:** ${target.area}  \n`;
    md += `**Tags:** ${target.tags.join(", ")}  \n`;
    md += `**Last Updated:** ${new Date(target.updatedAt).toLocaleString()}  \n\n`;
    md += `---\n\n`;
    md += `${target.contentMarkdown}\n\n`;

    if (target.codeSnippet?.trim()) {
      md += `\n\`\`\`${target.language || "text"}\n${target.codeSnippet}\n\`\`\`\n`;
    }

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${target.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAllNotesMarkdown = () => {
    if (notes.length === 0) return;

    let md = `# SkillOS Knowledge Base Export\n`;
    md += `Generated: ${new Date().toLocaleString()}  \n`;
    md += `Total Notes: ${notes.length}\n\n`;
    md += `---\n\n`;

    notes.forEach((note, index) => {
      md += `## ${index + 1}. ${note.title}\n\n`;
      md += `- **Track:** ${note.area}\n`;
      md += `- **Tags:** ${note.tags.join(", ")}\n`;
      md += `- **Updated:** ${new Date(note.updatedAt).toLocaleDateString()}\n\n`;
      md += `${note.contentMarkdown}\n\n`;
      if (note.codeSnippet?.trim()) {
        md += `\`\`\`${note.language || "text"}\n${note.codeSnippet}\n\`\`\`\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `skillos-knowledge-base-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load starter templates
  const loadStarterTemplates = () => {
    setNotes(initialNotesSeed);
    setSelectedNoteId(initialNotesSeed[0]?.id || null);
  };

  const value = {
    notes,
    selectedNoteId,
    setSelectedNoteId,
    metrics,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    duplicateNote,
    exportNoteMarkdown,
    exportAllNotesMarkdown,
    loadStarterTemplates,
    batchRenameTag,
    batchRemoveTag,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}
