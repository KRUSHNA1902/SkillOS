import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { Tag, TagColorKey, TAG_COLOR_CONFIG } from "./tag-types";

export const INITIAL_TAGS_SEED: Tag[] = [
  { id: "tag-sql", name: "SQL", color: "blue", description: "Structured Query Language & relational DBs", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-postgres", name: "PostgreSQL", color: "cyan", description: "Advanced open-source relational database", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-window-fn", name: "Window Functions", color: "indigo", description: "Analytical ranking and cumulative aggregations", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-analytics", name: "Analytics", color: "emerald", description: "Business analytics and statistical metrics", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-python", name: "Python", color: "amber", description: "Data science and backend automation", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-pandas", name: "Pandas", color: "orange", description: "Data manipulation and tabular structures", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-numpy", name: "NumPy", color: "teal", description: "Fast vectorized multidimensional math", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-optimization", name: "Optimization", color: "rose", description: "Performance profiling & low-latency execution", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-powerbi", name: "Power BI", color: "amber", description: "Interactive executive reporting dashboards", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-dax", name: "DAX", color: "purple", description: "Data Analysis Expressions & calculated measures", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-finance", name: "Finance", color: "emerald", description: "Valuation, DCF modeling, and portfolio risk", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-ai", name: "AI", color: "rose", description: "Artificial Intelligence, LLMs, and agents", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-frontend", name: "Frontend UI", color: "blue", description: "React, Tailwind, animations, and layouts", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-backend", name: "Backend", color: "emerald", description: "Server APIs, middleware, and microservices", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-security", name: "Security", color: "rose", description: "Auth tokens, RLS, rate limiting, and audits", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-devops", name: "DevOps", color: "slate", description: "CI/CD, Docker containers, and cloud deployment", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
  { id: "tag-architecture", name: "Architecture", color: "cyan", description: "System design patterns, contracts, and dataflow", createdAt: "2026-10-10T09:00:00Z", updatedAt: "2026-10-10T09:00:00Z" },
];

export type TagRenameListener = (oldName: string, newName: string) => void;
export type TagDeleteListener = (tagName: string) => void;

interface TagContextType {
  tags: Tag[];
  createTag: (input: { name: string; color?: TagColorKey; description?: string }) => Tag;
  updateTag: (tagId: string, updates: { name?: string; color?: TagColorKey; description?: string }) => void;
  deleteTag: (tagId: string) => void;
  getTagByName: (name: string) => Tag | undefined;
  getTagColor: (name: string) => TagColorKey;
  getTagClass: (name: string, isActive?: boolean) => string;
  registerTagRenameListener: (listener: TagRenameListener) => () => void;
  registerTagDeleteListener: (listener: TagDeleteListener) => () => void;
  isManagerOpen: boolean;
  openTagManager: (initialSelectedTag?: string) => void;
  closeTagManager: () => void;
}

const TagContext = createContext<TagContextType | null>(null);

export function TagProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isDevUser = user?.id === "dev-user-001";
  const storageKey = user ? `skillos_tags_${user.id}` : "skillos_tags_guest";

  // Observer listeners
  const renameListenersRef = useRef<Set<TagRenameListener>>(new Set());
  const deleteListenersRef = useRef<Set<TagDeleteListener>>(new Set());

  // Modal open state
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  // Initialize tags state with user-isolated local cache
  const [tags, setTags] = useState<Tag[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_TAGS_SEED;
  });

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tags));
    } catch {}
  }, [tags, storageKey]);

  // Background Cloud Sync with Supabase / Express API
  useEffect(() => {
    if (isDevUser || !user) return;

    let active = true;
    const syncFromCloud = async () => {
      try {
        const res = await fetch("/api/tags", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.tags && Array.isArray(data.tags) && data.tags.length > 0 && active) {
          setTags((prev) => {
            // Merge cloud tags with local tags (cloud takes precedence for matching IDs)
            const map = new Map<string, Tag>();
            prev.forEach((t) => map.set(t.name.toLowerCase(), t));
            data.tags.forEach((t: Tag) => map.set(t.name.toLowerCase(), t));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn("[TagContext] Background cloud sync notice:", err);
      }
    };

    syncFromCloud();
    return () => {
      active = false;
    };
  }, [user, isDevUser]);

  // Observer registration helpers
  const registerTagRenameListener = useCallback((listener: TagRenameListener) => {
    renameListenersRef.current.add(listener);
    return () => {
      renameListenersRef.current.delete(listener);
    };
  }, []);

  const registerTagDeleteListener = useCallback((listener: TagDeleteListener) => {
    deleteListenersRef.current.add(listener);
    return () => {
      deleteListenersRef.current.delete(listener);
    };
  }, []);

  // Create Tag
  const createTag = useCallback(
    ({ name, color = "blue", description = "" }: { name: string; color?: TagColorKey; description?: string }) => {
      const cleanName = name.trim().replace(/^#/, "");
      if (!cleanName) {
        throw new Error("Tag name cannot be empty");
      }

      // Check if tag already exists (case-insensitive)
      const existing = tags.find((t) => t.name.toLowerCase() === cleanName.toLowerCase());
      if (existing) {
        return existing;
      }

      const newTag: Tag = {
        id: `tag-${Date.now()}-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        name: cleanName,
        color,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTags((prev) => [...prev, newTag]);

      // Push to backend API in background
      if (!isDevUser && user) {
        fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTag),
          credentials: "include",
        }).catch(() => {});
      }

      return newTag;
    },
    [tags, isDevUser, user]
  );

  // Update Tag (Rename, Recolor, Update Description)
  const updateTag = useCallback(
    (tagId: string, updates: { name?: string; color?: TagColorKey; description?: string }) => {
      setTags((prev) => {
        const target = prev.find((t) => t.id === tagId);
        if (!target) return prev;

        const oldName = target.name;
        const newName = updates.name ? updates.name.trim().replace(/^#/, "") : oldName;
        const newColor = updates.color || target.color;
        const newDesc = updates.description !== undefined ? updates.description : target.description;

        const updatedTag: Tag = {
          ...target,
          name: newName,
          color: newColor,
          description: newDesc,
          updatedAt: new Date().toISOString(),
        };

        // If name changed, notify all registered listeners across notes, tasks, projects
        if (oldName.toLowerCase() !== newName.toLowerCase()) {
          renameListenersRef.current.forEach((listener) => {
            try {
              listener(oldName, newName);
            } catch (err) {
              console.error("[TagContext] Error in rename listener:", err);
            }
          });
        }

        // Push update to backend in background
        if (!isDevUser && user) {
          fetch(`/api/tags/${tagId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedTag),
            credentials: "include",
          }).catch(() => {});
        }

        return prev.map((t) => (t.id === tagId ? updatedTag : t));
      });
    },
    [isDevUser, user]
  );

  // Delete Tag
  const deleteTag = useCallback(
    (tagId: string) => {
      const target = tags.find((t) => t.id === tagId);
      if (!target) return;

      const tagName = target.name;

      // Notify all registered listeners across notes, tasks, projects
      deleteListenersRef.current.forEach((listener) => {
        try {
          listener(tagName);
        } catch (err) {
          console.error("[TagContext] Error in delete listener:", err);
        }
      });

      setTags((prev) => prev.filter((t) => t.id !== tagId));

      // Push delete to backend in background
      if (!isDevUser && user) {
        fetch(`/api/tags/${tagId}`, {
          method: "DELETE",
          credentials: "include",
        }).catch(() => {});
      }
    },
    [tags, isDevUser, user]
  );

  // Lookup helpers
  const getTagByName = useCallback(
    (name: string) => {
      const clean = name.trim().replace(/^#/, "").toLowerCase();
      return tags.find((t) => t.name.toLowerCase() === clean);
    },
    [tags]
  );

  const getTagColor = useCallback(
    (name: string): TagColorKey => {
      const found = getTagByName(name);
      if (found) return found.color;

      // Deterministic fallback color based on name hash if tag not yet registered
      const palette: TagColorKey[] = [
        "blue",
        "emerald",
        "purple",
        "amber",
        "rose",
        "cyan",
        "indigo",
        "orange",
        "teal",
      ];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return palette[Math.abs(hash) % palette.length];
    },
    [getTagByName]
  );

  const getTagClass = useCallback(
    (name: string, isActive: boolean = false): string => {
      const colorKey = getTagColor(name);
      const style = TAG_COLOR_CONFIG[colorKey] || TAG_COLOR_CONFIG.blue;
      return isActive ? style.activeBadge : style.badge;
    },
    [getTagColor]
  );

  const openTagManager = useCallback((_initialSelectedTag?: string) => {
    setIsManagerOpen(true);
  }, []);

  const closeTagManager = useCallback(() => {
    setIsManagerOpen(false);
  }, []);

  const value = {
    tags,
    createTag,
    updateTag,
    deleteTag,
    getTagByName,
    getTagColor,
    getTagClass,
    registerTagRenameListener,
    registerTagDeleteListener,
    isManagerOpen,
    openTagManager,
    closeTagManager,
  };

  return <TagContext.Provider value={value}>{children}</TagContext.Provider>;
}

export function useTags() {
  const context = useContext(TagContext);
  if (!context) {
    throw new Error("useTags must be used within a TagProvider");
  }
  return context;
}
