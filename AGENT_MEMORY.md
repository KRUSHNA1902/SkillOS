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
- **Documentation:** The project architecture is version-tracked in sequentially numbered text files inside `production_planning/` (e.g., `01_skillos_planning_and_architecture.txt`, `02_skillos_technical_architecture.txt`, `03_draggable_widget_grid_integration.txt`, and `04_gemini_ai_integration_and_data_summary.txt`).
- **Codebase Structure:** Monorepo under `code/` containing `code/client/` (React+Vite+TS+Tailwind+shadcn) and `code/server/` (Node+Express).
- **Current Milestone:** Integrated Google Gemini AI engine (`gemini-3.5-flash-lite`, `gemini-3.8-flash`) with backend REST routes (`/api/ai/chat`, `/api/ai/summarize-project`, `/api/ai/generate-roadmap`, `/api/ai/status`) and interactive UI (`ai-assistant-view.tsx`) providing instant synthesis of the 6 data tracks, 7-state topic progression, and 8 database tables.

## Agent Instructions for this Workspace
- Always refer to the numbered planning text files in `production_planning/` (`01_...`, `02_...`) for the source of truth on architecture.
- When creating new documentation or major architectural updates, save them in `production_planning/`, follow the numbered continuation format (e.g., `04_...`), carry forward prior content, and clearly mark deviations using `--- NEW & EXCLUSIVE IN THIS VERSION (XX) ---`.
- Prioritize high-density dashboard UI aesthetics with Tailwind CSS.
- Ensure strict TypeScript typing matching the defined schema (Areas, Paths, Modules, Topics, Sessions, Practice, Goals, Notes).
