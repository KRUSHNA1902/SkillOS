# PROJECT CONTEXT & AGENT MEMORY
**Project Name:** SkillOS
**Purpose:** Personal Learning & Progress Management Platform

## 1. Core Philosophy
SkillOS connects three pillars of learning:
1. **Plan:** Hierarchical roadmaps (Areas → Paths → Modules → Topics).
2. **Study:** Dated daily sessions with duration and activity outcomes.
3. **Complete:** Distinct topic progression (Not Started, In Progress, Practised, Completed, Needs Revision, Mastered, Blocked) and historical tracking.

## 2. Technical Stack
- **Frontend Engine:** React, Vite, TypeScript (Strict Mode) located in `code/client/`
- **Styling & UI Components:** Tailwind CSS, shadcn/ui, Lucide React (Icons)
- **Backend Runtime & Framework:** Node.js, Express.js located in `code/server/`
- **Database & Authentication:** PostgreSQL, Supabase (RLS enabled), Supabase Auth (JWT)
- **State Management:** Zustand (for global states like active sessions, auth)
- **Data Visualization & Dates:** Recharts, date-fns
- **Version Control:** Git + GitHub
- **Data Architecture:** Hybrid offline-first (IndexedDB/LocalStorage) syncing with Supabase backend.

## 3. UI/UX Architecture
- **Three-Part Layout:** 
  1. Left Navigation (Collapsible sidebar)
  2. Main Workspace Canvas (Dynamic dynamic module views)
  3. Persistent Right-Hand Calendar (Historical daily tracking, activity dots, day inspector)

## 4. Current State & History
- **Documentation:** The project architecture is version-tracked in sequentially numbered text files inside `production_planning/` (`01_...` through `06_task_operations_timeline_and_alert_architecture.txt`).
- **Codebase Structure:** Monorepo under `code/` containing `code/client/` (React+Vite+TS+Tailwind+shadcn) and `code/server/` (Node+Express).
- **Recent Milestones:**
  - **Milestone 04 & 05 (AI & Persistence):** Custom AI operational modes (Learning, Planning, Notes) and relational storage architecture. Upgraded primary model to Gemini 3.8 Flash across backend, client service, and UI. Seamless single-screen dark obsidian theme (`#0e0e10` / `#121214`), removing all dividing horizontal lines above the composer box.
  - **Milestone 06 (Advanced Task Operations & Timeline):** Full interactive task management engine (`TaskManagerProvider`), rich task creation/editing dialog (`TaskModal`), bulk completed task cleanup ("Clean Old Tasks"), chronological milestone timeline view (`TaskTimelineView`), deadline countdowns, overdue alert notification banner (`TaskAlertsBanner`), 1-click priority cycle switcher, and expandable technical notes scratchpad. Synchronized across Dashboard and dedicated Tasks workspace.
  - **Milestone 07 (Operational Notes & Knowledge Base):** Fully operational Knowledge Notes engine (`NotesProvider`, `useNotes`), dual viewing modes (Split-Pane Studio View and Gallery Card Grid View), rich Markdown reader with callouts and formulas, syntax-highlighted code snippet terminal with 1-click copy, interactive note creation/editing modal (`NoteModal`) with live markdown toolbar and preview, 1-click "AI Synthesizer" generating high-yield study notes via Gemini 3.8 Flash, Markdown export suite (.md file download and bulk export), and live cross-workspace synchronization with Dashboard and AI Assistant.
  - **Milestone 08 (Projects & Portfolio Workspace):** Production-grade Projects & Portfolio engine (`ProjectsProvider`, `useProjects`), 4 viewing perspectives (Showcase Grid View, Kanban Sprint Board, Chronological Roadmap Timeline with Gantt-style milestones, and High-Density Table List), deep-dive slide-over inspector (`ProjectDetailsInspector`) with live checkable deliverables and instant progress recalculation, bidirectional workflow task linking with `TaskManager` (`projectId` / `projectName`), connected notes with `NotesProvider`, interactive project editor (`ProjectModal`) with 1-click Gemini 3.8 Flash AI milestone generator, live "Portfolio Projects" widget on Dashboard, and multi-tier sidebar navigation routing.

## Agent Instructions for this Workspace
- Always refer to the numbered planning text files in `production_planning/` (`01_...`, `02_...`) for the source of truth on architecture.
- When creating new documentation or major architectural updates, save them in `production_planning/`, follow the numbered continuation format (e.g., `04_...`), carry forward prior content, and clearly mark deviations using `--- NEW & EXCLUSIVE IN THIS VERSION (XX) ---`.
- Prioritize high-density dashboard UI aesthetics with Tailwind CSS.
- Ensure strict TypeScript typing matching the defined schema (Areas, Paths, Modules, Topics, Sessions, Practice, Goals, Notes).
