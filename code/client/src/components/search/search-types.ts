import { WorkflowTask } from "@/components/tasks/task-types";
import { Project } from "@/components/projects/project-types";
import { KnowledgeNote } from "@/components/notes/note-types";
import { Tag } from "@/components/tags/tag-types";

export type SearchEntityType =
  | "all"
  | "task"
  | "project"
  | "note"
  | "tag"
  | "action";

export interface SearchAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  actionType: "navigate" | "open_modal" | "theme" | "quick_action";
  target?: string;
  shortcut?: string;
  handler?: () => void;
}

export interface SearchDocument {
  id: string;
  type: Exclude<SearchEntityType, "all">;
  title: string;
  subtitle?: string;
  content: string;
  category?: string;
  status?: string;
  priority?: string;
  tags: string[];
  date?: string;
  pinned?: boolean;
  meta?: Record<string, any>;
  raw: WorkflowTask | Project | KnowledgeNote | Tag | SearchAction;
}

export interface SearchHighlightChunk {
  text: string;
  isMatch: boolean;
}

export interface SearchResultItem {
  document: SearchDocument;
  score: number;
  titleHighlights: SearchHighlightChunk[];
  snippet: string;
  snippetHighlights: SearchHighlightChunk[];
  matchedField: "title" | "tags" | "content" | "category" | "status" | "priority" | "none";
}

export interface ParsedSearchQuery {
  raw: string;
  cleanText: string;
  terms: string[];
  entityTypes: Exclude<SearchEntityType, "all">[];
  priorities: string[];
  statuses: string[];
  tags: string[];
  isPinned?: boolean;
  isOverdue?: boolean;
  hasCode?: boolean;
}

export type SearchSortOption = "relevance" | "updated" | "priority" | "title";

export interface SearchFilterState {
  entityType: SearchEntityType;
  status: "all" | string;
  priority: "all" | string;
  tag: "all" | string;
  sortBy: SearchSortOption;
}

export interface SearchStats {
  totalResults: number;
  elapsedMs: number;
  countsByType: Record<Exclude<SearchEntityType, "all">, number>;
}
