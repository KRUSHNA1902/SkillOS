import {
  SearchDocument,
  SearchEntityType,
  SearchResultItem,
  SearchHighlightChunk,
  ParsedSearchQuery,
  SearchFilterState,
  SearchStats,
  SearchAction,
} from "./search-types";
import { WorkflowTask } from "@/components/tasks/task-types";
import { Project } from "@/components/projects/project-types";
import { KnowledgeNote } from "@/components/notes/note-types";
import { Tag } from "@/components/tags/tag-types";

/**
 * Parses raw search input into clean query terms and structured query operators.
 * Examples supported:
 * - "urgent backend"
 * - "type:task status:in_progress"
 * - "type:note has:code #frontend"
 * - "is:urgent is:pinned"
 * - "priority:high status:completed"
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const trimmed = (query || "").trim();
  if (!trimmed) {
    return {
      raw: "",
      cleanText: "",
      terms: [],
      entityTypes: [],
      priorities: [],
      statuses: [],
      tags: [],
    };
  }

  const tokens = trimmed.split(/\s+/);
  const terms: string[] = [];
  const entityTypes: Exclude<SearchEntityType, "all">[] = [];
  const priorities: string[] = [];
  const statuses: string[] = [];
  const tags: string[] = [];
  let isPinned: boolean | undefined = undefined;
  let isOverdue: boolean | undefined = undefined;
  let hasCode: boolean | undefined = undefined;

  for (const token of tokens) {
    const lower = token.toLowerCase();

    // Type operator: type:task, type:project, type:note, type:tag, type:action
    if (lower.startsWith("type:") || lower.startsWith("in:")) {
      const val = lower.split(":")[1];
      if (
        val === "task" ||
        val === "tasks" ||
        val === "project" ||
        val === "projects" ||
        val === "note" ||
        val === "notes" ||
        val === "tag" ||
        val === "tags" ||
        val === "action" ||
        val === "actions"
      ) {
        const singular = val.endsWith("s") ? val.slice(0, -1) : val;
        entityTypes.push(singular as Exclude<SearchEntityType, "all">);
        continue;
      }
    }

    // Priority operator: priority:urgent, p:high
    if (lower.startsWith("priority:") || lower.startsWith("p:")) {
      const val = lower.split(":")[1];
      if (["urgent", "high", "medium", "low"].includes(val)) {
        priorities.push(val);
        continue;
      }
    }

    // Status operator: status:completed, status:in_progress, status:blocked
    if (lower.startsWith("status:") || lower.startsWith("s:")) {
      const val = lower.split(":")[1];
      statuses.push(val);
      continue;
    }

    // Tag operator: tag:frontend, #frontend
    if (lower.startsWith("tag:")) {
      const val = token.substring(4);
      if (val) tags.push(val);
      continue;
    }
    if (token.startsWith("#") && token.length > 1) {
      tags.push(token.substring(1));
      continue;
    }

    // Flag operators: is:urgent, is:completed, is:pinned, is:overdue
    if (lower === "is:urgent") {
      priorities.push("urgent");
      continue;
    }
    if (lower === "is:completed") {
      statuses.push("completed");
      continue;
    }
    if (lower === "is:pinned") {
      isPinned = true;
      continue;
    }
    if (lower === "is:overdue") {
      isOverdue = true;
      continue;
    }

    // Code operator: has:code
    if (lower === "has:code" || lower === "has:snippet") {
      hasCode = true;
      continue;
    }

    terms.push(token);
  }

  return {
    raw: trimmed,
    cleanText: terms.join(" "),
    terms,
    entityTypes,
    priorities,
    statuses,
    tags,
    isPinned,
    isOverdue,
    hasCode,
  };
}

/**
 * Converts disparate SkillOS collections into a normalized, search-ready document index.
 */
export function indexEntities(params: {
  tasks?: WorkflowTask[];
  projects?: Project[];
  notes?: KnowledgeNote[];
  tags?: Tag[];
  actions?: SearchAction[];
}): SearchDocument[] {
  const { tasks = [], projects = [], notes = [], tags = [], actions = [] } = params;
  const docs: SearchDocument[] = [];

  // Index Tasks
  for (const t of tasks) {
    const taskTags = t.tags || [];
    const isOverdue =
      t.status !== "completed" &&
      t.deadline &&
      new Date(t.deadline).getTime() < Date.now();

    docs.push({
      id: t.id,
      type: "task",
      title: t.title,
      subtitle: t.projectName ? `Project: ${t.projectName}` : t.category,
      content: `${t.title} ${t.notes || ""} ${t.category} ${t.projectName || ""} ${taskTags.join(" ")}`,
      category: t.category,
      status: t.status,
      priority: t.priority,
      tags: taskTags,
      date: t.deadline || t.createdAt,
      meta: {
        stage: t.timelineStage,
        dueDate: t.dueDate,
        isOverdue,
        reminderAlert: t.reminderAlert,
        completedAt: t.completedAt,
      },
      raw: t,
    });
  }

  // Index Projects
  for (const p of projects) {
    const projectTags = p.tags || [];
    const techStackStr = (p.techStack || []).join(" ");
    const milestonesStr = (p.milestones || []).map((m) => m.title).join(" ");

    docs.push({
      id: p.id,
      type: "project",
      title: p.title,
      subtitle: p.tagline || p.track,
      content: `${p.title} ${p.tagline} ${p.descriptionMarkdown} ${p.track} ${techStackStr} ${milestonesStr} ${projectTags.join(" ")}`,
      category: p.track,
      status: p.status,
      priority: p.priority,
      tags: projectTags,
      date: p.updatedAt || p.startDate,
      pinned: p.pinned,
      meta: {
        progress: p.progress,
        techStack: p.techStack || [],
        milestonesCount: p.milestones?.length || 0,
        repoUrl: p.repoUrl,
        demoUrl: p.demoUrl,
      },
      raw: p,
    });
  }

  // Index Knowledge Notes
  for (const n of notes) {
    const noteTags = n.tags || [];
    docs.push({
      id: n.id,
      type: "note",
      title: n.title,
      subtitle: `${n.area}${n.language ? ` · ${n.language.toUpperCase()}` : ""}`,
      content: `${n.title} ${n.contentMarkdown} ${n.codeSnippet || ""} ${n.area} ${noteTags.join(" ")}`,
      category: n.area,
      tags: noteTags,
      date: n.updatedAt || n.createdAt,
      pinned: n.pinned,
      meta: {
        language: n.language,
        hasCode: Boolean(n.codeSnippet),
        codeSnippet: n.codeSnippet,
      },
      raw: n,
    });
  }

  // Index Tags
  for (const tg of tags) {
    docs.push({
      id: tg.id,
      type: "tag",
      title: `#${tg.name}`,
      subtitle: tg.description || "Universal Cross-Entity Tag",
      content: `${tg.name} ${tg.description || ""} tag badge`,
      category: "Tag",
      tags: [tg.name],
      date: tg.updatedAt,
      meta: {
        color: tg.color,
      },
      raw: tg,
    });
  }

  // Index System Actions
  for (const a of actions) {
    docs.push({
      id: a.id,
      type: "action",
      title: a.title,
      subtitle: a.description,
      content: `${a.title} ${a.description} quick action navigation`,
      category: "Action",
      tags: [],
      meta: {
        actionType: a.actionType,
        shortcut: a.shortcut,
        icon: a.icon,
      },
      raw: a,
    });
  }

  return docs;
}

/**
 * Escapes regex special characters.
 */
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Computes highlighted text segments for matched query terms.
 */
export function highlightMatches(
  text: string,
  terms: string[]
): SearchHighlightChunk[] {
  if (!text) return [];
  const validTerms = terms
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .sort((a, b) => b.length - a.length);

  if (validTerms.length === 0) {
    return [{ text, isMatch: false }];
  }

  const pattern = new RegExp(
    `(${validTerms.map(escapeRegExp).join("|")})`,
    "gi"
  );

  const parts = text.split(pattern);
  const chunks: SearchHighlightChunk[] = [];

  for (const part of parts) {
    if (!part) continue;
    const isMatch = validTerms.some(
      (term) => term.toLowerCase() === part.toLowerCase()
    );
    chunks.push({ text: part, isMatch });
  }

  return chunks;
}

/**
 * Extracts a concise excerpt window surrounding the matched query keyword.
 */
export function extractSnippet(
  content: string,
  terms: string[],
  maxLength: number = 100
): { snippet: string; highlights: SearchHighlightChunk[] } {
  if (!content) return { snippet: "", highlights: [] };

  const validTerms = terms
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);

  if (validTerms.length === 0) {
    const clean = content.replace(/\s+/g, " ").trim();
    const snippet =
      clean.length > maxLength ? clean.slice(0, maxLength) + "..." : clean;
    return {
      snippet,
      highlights: [{ text: snippet, isMatch: false }],
    };
  }

  // Find the earliest match index
  const lowerContent = content.toLowerCase();
  let firstMatchIndex = -1;
  let matchedTermLength = 0;

  for (const term of validTerms) {
    const idx = lowerContent.indexOf(term);
    if (idx !== -1 && (firstMatchIndex === -1 || idx < firstMatchIndex)) {
      firstMatchIndex = idx;
      matchedTermLength = term.length;
    }
  }

  let snippet = "";
  if (firstMatchIndex === -1) {
    const clean = content.replace(/\s+/g, " ").trim();
    snippet =
      clean.length > maxLength ? clean.slice(0, maxLength) + "..." : clean;
  } else {
    // Window around the match
    const contextRadius = Math.floor((maxLength - matchedTermLength) / 2);
    let start = Math.max(0, firstMatchIndex - contextRadius);
    let end = Math.min(content.length, firstMatchIndex + matchedTermLength + contextRadius);

    // Snap to word boundaries if possible
    if (start > 0) {
      const spaceIdx = content.indexOf(" ", start);
      if (spaceIdx !== -1 && spaceIdx < firstMatchIndex) {
        start = spaceIdx + 1;
      }
    }
    if (end < content.length) {
      const spaceIdx = content.lastIndexOf(" ", end);
      if (spaceIdx !== -1 && spaceIdx > firstMatchIndex + matchedTermLength) {
        end = spaceIdx;
      }
    }

    const excerpt = content.slice(start, end).replace(/\s+/g, " ").trim();
    snippet = `${start > 0 ? "..." : ""}${excerpt}${
      end < content.length ? "..." : ""
    }`;
  }

  return {
    snippet,
    highlights: highlightMatches(snippet, terms),
  };
}

/**
 * Priority ordering for sorting.
 */
const PRIORITY_SCORES: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Executes high-performance clientside search across indexed documents.
 */
export function executeSearch(
  query: string,
  docs: SearchDocument[],
  filterState?: Partial<SearchFilterState>
): { results: SearchResultItem[]; stats: SearchStats } {
  const startTime = performance.now();
  const parsed = parseSearchQuery(query);

  const targetEntityType = filterState?.entityType || "all";
  const statusFilter = filterState?.status || "all";
  const priorityFilter = filterState?.priority || "all";
  const tagFilter = filterState?.tag || "all";
  const sortBy = filterState?.sortBy || "relevance";

  const countsByType: Record<Exclude<SearchEntityType, "all">, number> = {
    task: 0,
    project: 0,
    note: 0,
    tag: 0,
    action: 0,
  };

  const results: SearchResultItem[] = [];

  for (const doc of docs) {
    // Count distribution before filter constraints
    countsByType[doc.type] = (countsByType[doc.type] || 0) + 1;

    // Filter by entity type
    if (targetEntityType !== "all" && doc.type !== targetEntityType) {
      continue;
    }
    if (parsed.entityTypes.length > 0 && !parsed.entityTypes.includes(doc.type)) {
      continue;
    }

    // Filter by priority
    if (priorityFilter !== "all" && doc.priority !== priorityFilter) {
      continue;
    }
    if (parsed.priorities.length > 0 && (!doc.priority || !parsed.priorities.includes(doc.priority.toLowerCase()))) {
      continue;
    }

    // Filter by status
    if (statusFilter !== "all" && doc.status !== statusFilter) {
      continue;
    }
    if (parsed.statuses.length > 0 && (!doc.status || !parsed.statuses.includes(doc.status.toLowerCase()))) {
      continue;
    }

    // Filter by tag
    if (tagFilter !== "all" && !doc.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase())) {
      continue;
    }
    if (parsed.tags.length > 0) {
      const docTagsLower = doc.tags.map((t) => t.toLowerCase());
      const hasAllTags = parsed.tags.every((qTag) =>
        docTagsLower.some((dt) => dt.includes(qTag.toLowerCase()))
      );
      if (!hasAllTags) continue;
    }

    // Filter by pinned flag
    if (parsed.isPinned !== undefined && doc.pinned !== parsed.isPinned) {
      continue;
    }

    // Filter by overdue flag
    if (parsed.isOverdue && !doc.meta?.isOverdue) {
      continue;
    }

    // Filter by hasCode flag
    if (parsed.hasCode && !doc.meta?.hasCode) {
      continue;
    }

    // Scoring & relevance
    let score = 0;
    let matchedField: SearchResultItem["matchedField"] = "none";

    const cleanQuery = parsed.cleanText.toLowerCase().trim();
    const docTitleLower = doc.title.toLowerCase();
    const docSubtitleLower = (doc.subtitle || "").toLowerCase();
    const docContentLower = doc.content.toLowerCase();
    const docCategoryLower = (doc.category || "").toLowerCase();

    if (!cleanQuery) {
      // No search keywords: baseline scoring
      score = 50;
      if (doc.pinned) score += 20;
      if (doc.priority === "urgent") score += 15;
      else if (doc.priority === "high") score += 10;
    } else {
      // 1. Exact match in title
      if (docTitleLower === cleanQuery) {
        score += 150;
        matchedField = "title";
      } else if (docTitleLower.startsWith(cleanQuery)) {
        score += 90;
        matchedField = "title";
      } else if (docTitleLower.includes(cleanQuery)) {
        score += 65;
        matchedField = "title";
      }

      // 2. Term matches in title
      let allTermsFound = true;
      for (const term of parsed.terms) {
        const termLower = term.toLowerCase();
        if (docTitleLower.includes(termLower)) {
          score += 30;
          if (matchedField === "none") matchedField = "title";
        } else if (doc.tags.some((t) => t.toLowerCase().includes(termLower))) {
          score += 40;
          if (matchedField === "none") matchedField = "tags";
        } else if (docSubtitleLower.includes(termLower)) {
          score += 20;
          if (matchedField === "none") matchedField = "category";
        } else if (docCategoryLower.includes(termLower)) {
          score += 20;
          if (matchedField === "none") matchedField = "category";
        } else if (docContentLower.includes(termLower)) {
          score += 15;
          if (matchedField === "none") matchedField = "content";
        } else {
          allTermsFound = false;
        }
      }

      // Require all free text terms to be present somewhere in document
      if (!allTermsFound) {
        continue;
      }

      // Boosts
      if (doc.pinned) score += 15;
      if (doc.priority === "urgent") score += 10;
      if (doc.meta?.isOverdue) score += 8;
    }

    const titleHighlights = highlightMatches(doc.title, parsed.terms);
    const { snippet, highlights: snippetHighlights } = extractSnippet(
      doc.content,
      parsed.terms,
      120
    );

    results.push({
      document: doc,
      score,
      titleHighlights,
      snippet,
      snippetHighlights,
      matchedField,
    });
  }

  // Sort results
  results.sort((a, b) => {
    if (sortBy === "relevance") {
      return b.score - a.score;
    }
    if (sortBy === "updated") {
      const dateA = a.document.date ? new Date(a.document.date).getTime() : 0;
      const dateB = b.document.date ? new Date(b.document.date).getTime() : 0;
      return dateB - dateA;
    }
    if (sortBy === "priority") {
      const pScoreA = PRIORITY_SCORES[a.document.priority || ""] || 0;
      const pScoreB = PRIORITY_SCORES[b.document.priority || ""] || 0;
      return pScoreB - pScoreA;
    }
    if (sortBy === "title") {
      return a.document.title.localeCompare(b.document.title);
    }
    return 0;
  });

  const elapsedMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    results,
    stats: {
      totalResults: results.length,
      elapsedMs,
      countsByType,
    },
  };
}
