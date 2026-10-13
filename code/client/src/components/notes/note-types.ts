export type NoteTrack =
  | "SQL & Databases"
  | "Python & Analytics"
  | "Power BI & Semantic Modeling"
  | "Finance & Markets"
  | "AI & Cloud Architecture"
  | "Projects & Portfolio"
  | "Architecture"
  | "General";

export type CodeLanguage =
  | "sql"
  | "python"
  | "typescript"
  | "javascript"
  | "dax"
  | "bash"
  | "json"
  | "markdown"
  | "html"
  | "css";

export interface KnowledgeNote {
  id: string;
  title: string;
  contentMarkdown: string;
  codeSnippet?: string;
  language?: CodeLanguage;
  tags: string[];
  area: NoteTrack;
  topicId?: string;
  pinned: boolean;
  createdAt: string; // ISO string e.g. "2026-10-13T10:00:00"
  updatedAt: string; // ISO string e.g. "2026-10-13T18:00:00"
}

export interface NoteFilterOptions {
  search: string;
  area: "all" | NoteTrack;
  tag: "all" | string;
  pinnedOnly: boolean;
  sortBy: "updatedAt" | "createdAt" | "title" | "pinnedFirst";
}

export interface NoteMetrics {
  total: number;
  pinned: number;
  withCode: number;
  byArea: Record<NoteTrack, number>;
  topTags: { tag: string; count: number }[];
}
