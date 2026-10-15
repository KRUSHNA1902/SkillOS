import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTags } from "@/components/tags/tag-context";
import {
  Project,
  ProjectMilestone,
  ProjectStatus,
  ProjectMetrics,
  ProjectTrack,
} from "./project-types";

export const LEGACY_STORAGE_KEY = "skillos_projects_v1";

export const INITIAL_PROJECTS_SEED: Project[] = [
  {
    id: "proj-1",
    title: "Automated Stock Market Data Pipeline & Lakehouse",
    slug: "market-data-pipeline",
    tagline: "End-to-end streaming financial data lakehouse with DuckDB & Streamlit",
    descriptionMarkdown: `### Overview
A production-grade, automated financial analytics pipeline that streams equity and crypto quotes into a local columnar lakehouse using DuckDB, transforms indicators using Pandas and NumPy vectorization, and renders real-time Bollinger Bands & MACD volatility signals in Streamlit.

### Key Objectives
- Ingest 1-minute candle bars from AlphaVantage & Yahoo Finance.
- Partition parquet files by ticker symbol and date in a local lakehouse.
- Provide sub-second OLAP queries across 10M+ transaction rows.
- Run scheduled automated ingestion cron jobs via GitHub Actions.`,
    track: "Python & Analytics",
    status: "in_progress",
    priority: "high",
    progress: 68,
    estimatedHours: 45,
    loggedHours: 32,
    startDate: "2026-09-15",
    targetDate: "2026-10-30",
    pinned: true,
    repoUrl: "https://github.com/skillos-org/market-lakehouse-pipeline",
    demoUrl: "https://market-analytics.skillos.dev",
    docsUrl: "https://market-analytics.skillos.dev/docs",
    techStack: ["Python", "DuckDB", "Pandas", "FastAPI", "Streamlit", "Parquet", "GitHub Actions"],
    linkedTaskIds: ["task-2", "task-3"],
    linkedNoteIds: ["note-2"],
    architectureNotes: `### Architecture Spec
- **Ingestion**: Async HTTP polling with Exponential Backoff
- **Storage Layer**: Columnar Apache Parquet partition scheme (\`/data/year=YYYY/month=MM/\`)
- **Query Engine**: DuckDB embedded in-process SQL execution engine
- **Interface**: FastAPI REST endpoints + Streamlit interactive dashboard with caching`,
    createdAt: "2026-09-15T09:00:00.000Z",
    updatedAt: "2026-10-14T11:30:00.000Z",
    milestones: [
      {
        id: "m-1-1",
        title: "Phase 1: Ingestion Connectors & Schemas",
        description: "Set up API connectors, rate-limiting, and raw schema validation.",
        status: "completed",
        dueDate: "2026-09-22",
        completedAt: "2026-09-21T18:00:00.000Z",
        deliverables: [
          { id: "d-1-1", title: "AlphaVantage / Yahoo Finance async rate-limited client", completed: true },
          { id: "d-1-2", title: "Pydantic data models for Quote, Candle, and Metadata", completed: true },
          { id: "d-1-3", title: "Pytest unit test suite for raw payload parsing", completed: true },
        ],
      },
      {
        id: "m-1-2",
        title: "Phase 2: DuckDB Parquet Storage Engine",
        description: "Partitioning strategy, parquet compaction, and sub-second SQL queries.",
        status: "completed",
        dueDate: "2026-10-05",
        completedAt: "2026-10-04T16:00:00.000Z",
        deliverables: [
          { id: "d-2-1", title: "Automated daily partition creation and write pipeline", completed: true },
          { id: "d-2-2", title: "DuckDB SQL view layer over partitioned parquets", completed: true },
          { id: "d-2-3", title: "Vectorized technical indicators (RSI, EMA, Bollinger)", completed: true },
        ],
      },
      {
        id: "m-1-3",
        title: "Phase 3: Interactive Dashboard & Volatility Signals",
        description: "Streamlit UI with interactive candlestick charts and buy/sell signals.",
        status: "in_progress",
        dueDate: "2026-10-20",
        deliverables: [
          { id: "d-3-1", title: "Plotly candlestick charts with volume bars", completed: true },
          { id: "d-3-2", title: "Dynamic volatility threshold sliders & alerts", completed: false },
          { id: "d-3-3", title: "FastAPI REST microservice for live price streaming", completed: false },
        ],
      },
      {
        id: "m-1-4",
        title: "Phase 4: CI/CD Pipeline & GitHub Showcase",
        description: "Automated ingestion worker and portfolio documentation.",
        status: "pending",
        dueDate: "2026-10-30",
        deliverables: [
          { id: "d-4-1", title: "GitHub Actions hourly data ingestion workflow", completed: false },
          { id: "d-4-2", title: "Production Dockerfile with multi-stage build", completed: false },
          { id: "d-4-3", title: "Comprehensive architecture README with benchmark charts", completed: false },
        ],
      },
    ],
  },
  {
    id: "proj-2",
    title: "SkillOS Autonomous Copilot Engine",
    slug: "skillos-copilot-engine",
    tagline: "Gemini 3.8 Flash multi-turn agent with tool calling and markdown streaming",
    descriptionMarkdown: `### Overview
An autonomous developer assistant engine built on Google Gemini 3.8 Flash, featuring tool-assisted curriculum parsing, context-aware memory, and sub-200ms reactive UI streaming.

### Key Objectives
- Multi-turn conversation with system prompt guardrails.
- Dynamic tool orchestration for generating roadmaps, notes, and task alerts.
- Obsidian dark UI with code syntax highlighting and 1-click clipboard actions.`,
    track: "AI & Cloud Architecture",
    status: "in_progress",
    priority: "urgent",
    progress: 75,
    estimatedHours: 60,
    loggedHours: 46,
    startDate: "2026-09-20",
    targetDate: "2026-10-25",
    pinned: true,
    repoUrl: "https://github.com/skillos-org/skillos-agent-core",
    demoUrl: "https://copilot.skillos.dev",
    techStack: ["Gemini 3.8 Flash", "TypeScript", "Node.js", "Express", "WebSockets", "React"],
    linkedTaskIds: ["task-4"],
    linkedNoteIds: ["note-5"],
    architectureNotes: `### Architecture Spec
- **LLM**: Gemini 3.8 Flash with structured JSON output modes
- **Backend**: Express.js router with rate-limiting and session memory
- **Client**: Zustand + React Context with optimistic streaming updates`,
    createdAt: "2026-09-20T10:00:00.000Z",
    updatedAt: "2026-10-14T14:15:00.000Z",
    milestones: [
      {
        id: "m-2-1",
        title: "Phase 1: Gemini API Gateway & Cascade Fallbacks",
        description: "Establish robust backend proxy with model fallback protection.",
        status: "completed",
        dueDate: "2026-09-28",
        completedAt: "2026-09-27T19:30:00.000Z",
        deliverables: [
          { id: "d-21-1", title: "Gemini 3.8 Flash backend proxy integration", completed: true },
          { id: "d-21-2", title: "Cascading model fallback (Flash Lite -> Flash)", completed: true },
          { id: "d-21-3", title: "Security headers and API key masking in .env", completed: true },
        ],
      },
      {
        id: "m-2-2",
        title: "Phase 2: Structured Output & Tool Call Parser",
        description: "Enable roadmap generation, note synthesis, and milestone scaffolding.",
        status: "completed",
        dueDate: "2026-10-08",
        completedAt: "2026-10-07T12:00:00.000Z",
        deliverables: [
          { id: "d-22-1", title: "Roadmap generator with strict curriculum typing", completed: true },
          { id: "d-22-2", title: "Note synthesis engine with cheatsheet extraction", completed: true },
          { id: "d-22-3", title: "Project milestone JSON scaffolding schema", completed: true },
        ],
      },
      {
        id: "m-2-3",
        title: "Phase 3: Realtime UI Streaming & Obsidian Shell",
        description: "Seamless single-screen chat interface with no dividing horizontal lines.",
        status: "in_progress",
        dueDate: "2026-10-18",
        deliverables: [
          { id: "d-23-1", title: "Custom Obsidian dark mode styling (#0e0e10 / #121214)", completed: true },
          { id: "d-23-2", title: "Syntax highlighted terminal code block renderer", completed: true },
          { id: "d-23-3", title: "1-Click 'Save to Notes' & 'Add to Tasks' action pills", completed: false },
        ],
      },
      {
        id: "m-2-4",
        title: "Phase 4: Agent Benchmarking & Evaluation Suite",
        description: "Automated latency benchmarks and precision evaluation against curriculum queries.",
        status: "pending",
        dueDate: "2026-10-25",
        deliverables: [
          { id: "d-24-1", title: "Benchmark suite measuring TTFT (Time to First Token)", completed: false },
          { id: "d-24-2", title: "Curriculum prompt regression testing script", completed: false },
        ],
      },
    ],
  },
  {
    id: "proj-3",
    title: "Enterprise OLAP Warehouse & Analytical Queries",
    slug: "enterprise-olap-warehouse",
    tagline: "High-performance PostgreSQL analytics warehouse with Window Functions & dbt",
    descriptionMarkdown: `### Overview
A normalized OLAP data mart built in PostgreSQL, modeling 5M+ orders, users, and product dimensions using Star Schema architecture. Implements advanced SQL analytical patterns including rolling 7-day revenue, retention cohorts, LEAD/LAG order intervals, and recursive CTE organizational rollups.

### Key Objectives
- Star schema dimensional design with slowly changing dimensions (SCD Type 2).
- Optimize complex joins and aggregation queries using partial and composite indexes.
- Benchmark EXPLAIN ANALYZE execution plans to eliminate sequential scans.`,
    track: "SQL & Databases",
    status: "completed",
    priority: "high",
    progress: 100,
    estimatedHours: 35,
    loggedHours: 38,
    startDate: "2026-08-10",
    targetDate: "2026-09-18",
    completedDate: "2026-09-17",
    pinned: false,
    repoUrl: "https://github.com/skillos-org/enterprise-olap-dw",
    demoUrl: "https://analytics.skillos.dev/queries",
    techStack: ["PostgreSQL", "dbt", "SQL", "Docker", "Metabase", "Supabase"],
    linkedTaskIds: ["task-1"],
    linkedNoteIds: ["note-1"],
    architectureNotes: `### Architecture Spec
- **Database**: PostgreSQL 16 on Supabase
- **Data Modeling**: Fact_Orders, Dim_Customers, Dim_Products, Dim_Date
- **Indexes**: Composite B-Tree indexes on (customer_id, order_date DESC)
- **Transformations**: Modular dbt models with automated schema assertions`,
    createdAt: "2026-08-10T08:00:00.000Z",
    updatedAt: "2026-09-17T17:00:00.000Z",
    milestones: [
      {
        id: "m-3-1",
        title: "Phase 1: Star Schema & Ingestion DDLS",
        description: "Define DDL tables, foreign key constraints, and seed 1M test rows.",
        status: "completed",
        dueDate: "2026-08-22",
        completedAt: "2026-08-20T14:00:00.000Z",
        deliverables: [
          { id: "d-31-1", title: "Fact and Dimension DDL scripts with CHECK constraints", completed: true },
          { id: "d-31-2", title: "Faker data generator streaming 1M synthetic records", completed: true },
        ],
      },
      {
        id: "m-3-2",
        title: "Phase 2: Advanced Analytical Query Suite",
        description: "Author comprehensive query suite utilizing window functions and CTEs.",
        status: "completed",
        dueDate: "2026-09-05",
        completedAt: "2026-09-04T19:00:00.000Z",
        deliverables: [
          { id: "d-32-1", title: "Cohort retention analysis using DATE_TRUNC and DENSE_RANK", completed: true },
          { id: "d-32-2", title: "Customer churn prediction query via LAG interval differences", completed: true },
          { id: "d-32-3", title: "Recursive CTE employee hierarchy with salary rollups", completed: true },
        ],
      },
      {
        id: "m-3-3",
        title: "Phase 3: Index Tuning, EXPLAIN ANALYZE & Showcase",
        description: "Optimize query plan cost from 450,000 to <1,200 with indexes.",
        status: "completed",
        dueDate: "2026-09-18",
        completedAt: "2026-09-17T16:00:00.000Z",
        deliverables: [
          { id: "d-33-1", title: "EXPLAIN ANALYZE cost comparison report and charts", completed: true },
          { id: "d-33-2", title: "Metabase BI dashboard with live analytical KPIs", completed: true },
          { id: "d-33-3", title: "GitHub showcase documentation with reproducible Docker Compose", completed: true },
        ],
      },
    ],
  },
  {
    id: "proj-4",
    title: "Executive SaaS 3-Statement Financial Valuation & DCF Model",
    slug: "saas-valuation-dcf",
    tagline: "Dynamic 10-year discounted cash flow valuation model with scenario toggles",
    descriptionMarkdown: `### Overview
A comprehensive corporate valuation framework built for enterprise SaaS business models. Integrates dynamic Income Statement, Balance Sheet, and Cash Flow Statement schedules with Unlevered Free Cash Flow (UFCF) projections, Weighted Average Cost of Capital (WACC) calculations, and Monte Carlo sensitivity matrices.

### Key Objectives
- Model Recurring Revenue ARR expansion, net churn, and Gross Margin curves.
- Build dynamic Capex, D&A, and Working Capital schedules.
- Calculate Terminal Value using both Gordon Growth and Exit Multiple approaches.`,
    track: "Finance & Markets",
    status: "in_progress",
    priority: "medium",
    progress: 50,
    estimatedHours: 30,
    loggedHours: 15,
    startDate: "2026-09-25",
    targetDate: "2026-11-05",
    pinned: false,
    techStack: ["Power BI", "DAX", "Financial Modeling", "Excel", "Python"],
    linkedTaskIds: [],
    linkedNoteIds: ["note-4"],
    architectureNotes: `### Model Architecture
- **Financial Statements**: 3-Statement connected balance model
- **WACC Formula**: Cost of Equity (CAPM) + Cost of Debt (after-tax)
- **Scenarios**: Base Case, Bull Case, Bear Case switchable via dynamic parameter tables`,
    createdAt: "2026-09-25T11:00:00.000Z",
    updatedAt: "2026-10-12T16:30:00.000Z",
    milestones: [
      {
        id: "m-4-1",
        title: "Phase 1: Historical Financial Statement Integration",
        description: "Reconcile 3-year historical statements and GAAP revenue recognition.",
        status: "completed",
        dueDate: "2026-10-06",
        completedAt: "2026-10-05T18:00:00.000Z",
        deliverables: [
          { id: "d-41-1", title: "Historical Income Statement, Balance Sheet & Cash Flow integration", completed: true },
          { id: "d-41-2", title: "SaaS cohort retention & ARR bridge build", completed: true },
        ],
      },
      {
        id: "m-4-2",
        title: "Phase 2: 10-Year UFCF Forecast & Debt Schedule",
        description: "Project unlevered free cash flows and circular interest schedules.",
        status: "in_progress",
        dueDate: "2026-10-22",
        deliverables: [
          { id: "d-42-1", title: "Working capital change assumptions and D&A amortization", completed: true },
          { id: "d-42-2", title: "Dynamic WACC calculator with beta unlever/relever", completed: false },
          { id: "d-42-3", title: "Gordon Growth vs EV/EBITDA multiple sensitivity table", completed: false },
        ],
      },
      {
        id: "m-4-3",
        title: "Phase 3: Executive Dashboard & Investment Memo",
        description: "Power BI visual scenario dashboard and PDF investment memorandum.",
        status: "pending",
        dueDate: "2026-11-05",
        deliverables: [
          { id: "d-43-1", title: "Power BI sensitivity heatmap with DAX What-If parameters", completed: false },
          { id: "d-43-2", title: "Executive investment deck summarizing upside/downside thesis", completed: false },
        ],
      },
    ],
  },
  {
    id: "proj-5",
    title: "Cloud Infrastructure Security Auditor & CI/CD Gatekeeper",
    slug: "cloud-security-auditor",
    tagline: "Automated Terraform security auditing and policy-as-code enforcement",
    descriptionMarkdown: `### Overview
An automated cloud security auditor that scans Infrastructure as Code (Terraform) for misconfigurations, open S3 buckets, excessive IAM permissions, and unencrypted databases. Runs as a strict gatekeeper step in GitHub Actions before deployment.`,
    track: "Fullstack & Systems",
    status: "planning",
    priority: "high",
    progress: 15,
    estimatedHours: 40,
    loggedHours: 6,
    startDate: "2026-10-08",
    targetDate: "2026-11-15",
    pinned: false,
    techStack: ["Terraform", "Docker", "GitHub Actions", "AWS", "Bash", "Trivy", "OPA Rego"],
    linkedTaskIds: [],
    linkedNoteIds: [],
    architectureNotes: `### Security Spec
- **IaC Engine**: Terraform modules for AWS VPC, ECS, RDS, and S3
- **Auditing Tooling**: Trivy + Open Policy Agent (OPA) with Rego rules
- **Enforcement**: Zero-trust GitHub Action failing PRs with critical CVEs`,
    createdAt: "2026-10-08T09:30:00.000Z",
    updatedAt: "2026-10-14T08:00:00.000Z",
    milestones: [
      {
        id: "m-5-1",
        title: "Phase 1: Vulnerable Infrastructure Testbeds",
        description: "Create deliberately flawed Terraform templates representing common CVEs.",
        status: "in_progress",
        dueDate: "2026-10-20",
        deliverables: [
          { id: "d-51-1", title: "Vulnerable AWS S3, Security Group, and IAM Terraform modules", completed: true },
          { id: "d-51-2", title: "Automated local test harness with Docker container", completed: false },
        ],
      },
      {
        id: "m-5-2",
        title: "Phase 2: Rego Policy Authoring & Trivy Custom Checks",
        description: "Write OPA policies preventing public ingress and unencrypted storage.",
        status: "pending",
        dueDate: "2026-10-31",
        deliverables: [
          { id: "d-52-1", title: "Rego policy suite for CIS AWS Benchmark compliance", completed: false },
          { id: "d-52-2", title: "Automated remediation suggestion generator", completed: false },
        ],
      },
      {
        id: "m-5-3",
        title: "Phase 3: GitHub Actions CI/CD Integration & Reporting",
        description: "Author reusable action with PR comment summaries and security badges.",
        status: "pending",
        dueDate: "2026-11-15",
        deliverables: [
          { id: "d-53-1", title: "Composite GitHub Action with SARIF report upload", completed: false },
          { id: "d-53-2", title: "Interactive HTML security audit report generator", completed: false },
        ],
      },
    ],
  },
  {
    id: "proj-6",
    title: "Enterprise Semantic Model & Executive KPI Dashboard",
    slug: "executive-kpi-dashboard",
    tagline: "Enterprise Power BI semantic model with DAX time-intelligence and automated refresh",
    descriptionMarkdown: `### Overview
An enterprise-grade Power BI semantic model built over a multi-million record retail database. Features advanced DAX time-intelligence measures (YTD, MTD, SAMEPERIODLASTYEAR), dynamic calculation groups, and row-level security for regional sales directors.`,
    track: "Power BI & BI",
    status: "completed",
    priority: "medium",
    progress: 100,
    estimatedHours: 25,
    loggedHours: 26,
    startDate: "2026-08-01",
    targetDate: "2026-08-30",
    completedDate: "2026-08-29",
    pinned: false,
    demoUrl: "https://app.powerbi.com/view?r=demo-showcase",
    techStack: ["Power BI", "DAX", "SQL Server", "Power Query", "Tabular Editor"],
    linkedTaskIds: [],
    linkedNoteIds: ["note-3"],
    architectureNotes: `### Modeling Spec
- **Architecture**: Pure Star Schema with single-direction 1:* relationships
- **Measures**: Over 45 DAX business measures isolated in dedicated Measure Tables
- **Optimization**: Tabular Editor Best Practice Analyzer passed 100%`,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-29T18:00:00.000Z",
    milestones: [
      {
        id: "m-6-1",
        title: "Phase 1: Star Schema & Data Wrangling in Power Query",
        description: "Transform raw OLTP dumps into clean Fact and Dimension tables.",
        status: "completed",
        dueDate: "2026-08-10",
        completedAt: "2026-08-09T17:00:00.000Z",
        deliverables: [
          { id: "d-61-1", title: "Power Query M script transformations with query folding", completed: true },
          { id: "d-61-2", title: "Date dimension with fiscal calendar and holiday flags", completed: true },
        ],
      },
      {
        id: "m-6-2",
        title: "Phase 2: Advanced DAX Measures & Calculation Groups",
        description: "Build robust time-intelligence and dynamic currency converters.",
        status: "completed",
        dueDate: "2026-08-20",
        completedAt: "2026-08-19T20:00:00.000Z",
        deliverables: [
          { id: "d-62-1", title: "DAX Measures for Revenue YTD, YoY Growth %, and Rolling 90D", completed: true },
          { id: "d-62-2", title: "Calculation Groups for Time Intelligence without measure duplication", completed: true },
        ],
      },
      {
        id: "m-6-3",
        title: "Phase 3: Executive UI Design & Row-Level Security",
        description: "High-contrast dark executive canvas and RLS roles.",
        status: "completed",
        dueDate: "2026-08-30",
        completedAt: "2026-08-29T17:30:00.000Z",
        deliverables: [
          { id: "d-63-1", title: "Executive layout with synchronized slicers and drill-throughs", completed: true },
          { id: "d-63-2", title: "Dynamic RLS roles based on USERPRINCIPALNAME()", completed: true },
        ],
      },
    ],
  },
];

interface ProjectsContextType {
  projects: Project[];
  selectedProjectId: string | null;
  selectedProject: Project | null;
  metrics: ProjectMetrics;
  setSelectedProjectId: (id: string | null) => void;
  addProject: (projectData: Omit<Project, "id" | "createdAt" | "updatedAt" | "progress"> & { progress?: number }) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  togglePinProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  advanceProjectStatus: (id: string) => void;
  toggleMilestoneStatus: (projectId: string, milestoneId: string) => void;
  toggleDeliverable: (projectId: string, milestoneId: string, deliverableId: string) => void;
  addMilestone: (projectId: string, milestone: Omit<ProjectMilestone, "id">) => void;
  deleteMilestone: (projectId: string, milestoneId: string) => void;
  linkTaskToProject: (projectId: string, taskId: string) => void;
  unlinkTaskFromProject: (projectId: string, taskId: string) => void;
  linkNoteToProject: (projectId: string, noteId: string) => void;
  unlinkNoteFromProject: (projectId: string, noteId: string) => void;
  exportProjectMarkdown: (project: Project) => void;
  exportAllProjectsMarkdown: () => void;
  resetToInitialProjects: () => void;
  batchRenameTag: (oldName: string, newName: string) => void;
  batchRemoveTag: (tagName: string) => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

function calculateAutoProgress(milestones: ProjectMilestone[]): number {
  if (!milestones || milestones.length === 0) return 0;
  
  let totalDeliverables = 0;
  let completedDeliverables = 0;

  for (const m of milestones) {
    if (m.deliverables && m.deliverables.length > 0) {
      for (const d of m.deliverables) {
        totalDeliverables++;
        if (d.completed) completedDeliverables++;
      }
    } else {
      totalDeliverables++;
      if (m.status === "completed") completedDeliverables += 1;
      else if (m.status === "in_progress") completedDeliverables += 0.5;
    }
  }

  if (totalDeliverables === 0) return 0;
  return Math.round((completedDeliverables / totalDeliverables) * 100);
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isDevUser = user?.id === "dev-user-001";
  const storageKey = user ? `skillos_projects_${user.id}` : "skillos_projects_guest";

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      if (isDevUser) {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy !== null) {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.warn("[ProjectsProvider] Error loading projects from localStorage:", e);
    }
    return INITIAL_PROJECTS_SEED;
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Sync to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(projects));
    } catch (e) {
      console.warn("[ProjectsProvider] Error saving projects to localStorage:", e);
    }
  }, [projects, storageKey]);

  // Hook into Central Tag System for automatic rename and delete sync
  const { registerTagRenameListener, registerTagDeleteListener } = useTags();

  const batchRenameTag = useCallback((oldName: string, newName: string) => {
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        tags: p.tags?.map((tag) =>
          tag.toLowerCase() === oldName.toLowerCase() ? newName : tag
        ),
      }))
    );
  }, []);

  const batchRemoveTag = useCallback((tagName: string) => {
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        tags: p.tags?.filter(
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

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Real-time calculated metrics
  const metrics = useMemo<ProjectMetrics>(() => {
    let inProgress = 0;
    let planning = 0;
    let review = 0;
    let completed = 0;
    let archived = 0;
    let totalEstimatedHours = 0;
    let totalLoggedHours = 0;
    let progressSum = 0;

    const byTrack: Record<ProjectTrack, number> = {
      "SQL & Databases": 0,
      "Python & Analytics": 0,
      "Power BI & BI": 0,
      "Finance & Markets": 0,
      "AI & Cloud Architecture": 0,
      "Fullstack & Systems": 0,
    };

    for (const p of projects) {
      if (p.status === "in_progress") inProgress++;
      else if (p.status === "planning") planning++;
      else if (p.status === "review") review++;
      else if (p.status === "completed") completed++;
      else if (p.status === "archived") archived++;

      totalEstimatedHours += p.estimatedHours || 0;
      totalLoggedHours += p.loggedHours || 0;
      progressSum += p.progress || 0;

      if (byTrack[p.track] !== undefined) {
        byTrack[p.track]++;
      }
    }

    const averageProgress = projects.length > 0 ? Math.round(progressSum / projects.length) : 0;

    return {
      total: projects.length,
      inProgress,
      planning,
      review,
      completed,
      archived,
      totalEstimatedHours,
      totalLoggedHours,
      averageProgress,
      byTrack,
    };
  }, [projects]);

  // Add project
  const addProject = (
    projectData: Omit<Project, "id" | "createdAt" | "updatedAt" | "progress"> & { progress?: number }
  ): Project => {
    const now = new Date().toISOString();
    const id = typeof crypto !== "undefined" && crypto.randomUUID
      ? `proj-${crypto.randomUUID()}`
      : `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const calculatedProgress = projectData.progress ?? calculateAutoProgress(projectData.milestones || []);

    const newProject: Project = {
      ...projectData,
      id,
      progress: calculatedProgress,
      createdAt: now,
      updatedAt: now,
    };

    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  };

  // Update project
  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        // Recalculate progress if milestones were modified and progress wasn't explicitly provided
        if (updates.milestones && updates.progress === undefined) {
          updated.progress = calculateAutoProgress(updates.milestones);
          if (updated.progress === 100 && updated.status !== "completed") {
            updated.status = "completed";
            updated.completedDate = new Date().toISOString().split("T")[0];
          }
        }

        return updated;
      })
    );
  };

  // Delete project
  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
  };

  // Toggle pin
  const togglePinProject = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned, updatedAt: new Date().toISOString() } : p))
    );
  };

  // Duplicate project
  const duplicateProject = (id: string) => {
    const original = projects.find((p) => p.id === id);
    if (!original) return;

    const now = new Date().toISOString();
    const duplicated: Project = {
      ...original,
      id: `proj-${Date.now()}`,
      title: `${original.title} (Copy)`,
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };

    setProjects((prev) => [duplicated, ...prev]);
  };

  // Advance status: planning -> in_progress -> review -> completed
  const advanceProjectStatus = (id: string) => {
    const statusCycle: Record<ProjectStatus, ProjectStatus> = {
      planning: "in_progress",
      in_progress: "review",
      review: "completed",
      completed: "in_progress",
      archived: "planning",
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextStatus = statusCycle[p.status];
        return {
          ...p,
          status: nextStatus,
          completedDate: nextStatus === "completed" ? new Date().toISOString().split("T")[0] : undefined,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Toggle milestone status
  const toggleMilestoneStatus = (projectId: string, milestoneId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const updatedMilestones: ProjectMilestone[] = p.milestones.map((m) => {
          if (m.id !== milestoneId) return m;
          const nextStatus: "pending" | "in_progress" | "completed" =
            m.status === "completed" ? "pending" : m.status === "pending" ? "in_progress" : "completed";
          const isCompleted = nextStatus === "completed";

          // If milestone is toggled to completed, mark all its deliverables completed too
          const updatedDeliverables = m.deliverables.map((d) => ({
            ...d,
            completed: isCompleted ? true : d.completed,
          }));

          return {
            ...m,
            status: nextStatus,
            completedAt: isCompleted ? new Date().toISOString() : undefined,
            deliverables: updatedDeliverables,
          };
        });

        const newProgress = calculateAutoProgress(updatedMilestones);
        return {
          ...p,
          milestones: updatedMilestones,
          progress: newProgress,
          status: newProgress === 100 ? "completed" : p.status,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Toggle individual deliverable
  const toggleDeliverable = (projectId: string, milestoneId: string, deliverableId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const updatedMilestones: ProjectMilestone[] = p.milestones.map((m) => {
          if (m.id !== milestoneId) return m;
          const updatedDeliverables = m.deliverables.map((d) =>
            d.id === deliverableId ? { ...d, completed: !d.completed } : d
          );
          const allDone = updatedDeliverables.length > 0 && updatedDeliverables.every((d) => d.completed);
          const nextStatus: "pending" | "in_progress" | "completed" = allDone
            ? "completed"
            : updatedDeliverables.some((d) => d.completed)
            ? "in_progress"
            : "pending";

          return {
            ...m,
            deliverables: updatedDeliverables,
            status: nextStatus,
            completedAt: allDone ? new Date().toISOString() : undefined,
          };
        });

        const newProgress = calculateAutoProgress(updatedMilestones);
        return {
          ...p,
          milestones: updatedMilestones,
          progress: newProgress,
          status: newProgress === 100 ? "completed" : p.status,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Add milestone
  const addMilestone = (projectId: string, milestone: Omit<ProjectMilestone, "id">) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const newMilestone: ProjectMilestone = {
          ...milestone,
          id: `m-${Date.now()}`,
        };
        const updatedMilestones = [...p.milestones, newMilestone];
        return {
          ...p,
          milestones: updatedMilestones,
          progress: calculateAutoProgress(updatedMilestones),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Delete milestone
  const deleteMilestone = (projectId: string, milestoneId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const updatedMilestones = p.milestones.filter((m) => m.id !== milestoneId);
        return {
          ...p,
          milestones: updatedMilestones,
          progress: calculateAutoProgress(updatedMilestones),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Link task to project
  const linkTaskToProject = (projectId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId && !p.linkedTaskIds.includes(taskId)
          ? { ...p, linkedTaskIds: [...p.linkedTaskIds, taskId], updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  // Unlink task from project
  const unlinkTaskFromProject = (projectId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, linkedTaskIds: p.linkedTaskIds.filter((id) => id !== taskId), updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  // Link note to project
  const linkNoteToProject = (projectId: string, noteId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId && !p.linkedNoteIds.includes(noteId)
          ? { ...p, linkedNoteIds: [...p.linkedNoteIds, noteId], updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  // Unlink note from project
  const unlinkNoteFromProject = (projectId: string, noteId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, linkedNoteIds: p.linkedNoteIds.filter((id) => id !== noteId), updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  // Export single project as markdown
  const exportProjectMarkdown = (project: Project) => {
    const md = `# ${project.title}
**Tagline:** ${project.tagline}
**Domain:** ${project.track}
**Status:** ${project.status.toUpperCase()} (${project.progress}% Complete)
**Priority:** ${project.priority.toUpperCase()}
**Time Invested:** ${project.loggedHours}h / ${project.estimatedHours}h estimated
${project.repoUrl ? `**Repository:** [${project.repoUrl}](${project.repoUrl})\n` : ""}${project.demoUrl ? `**Live Demo:** [${project.demoUrl}](${project.demoUrl})\n` : ""}${project.docsUrl ? `**Documentation:** [${project.docsUrl}](${project.docsUrl})\n` : ""}
**Tech Stack:** ${project.techStack.join(", ")}

---

## Architecture Spec
${project.architectureNotes || "No architecture notes provided."}

---

## Detailed Overview
${project.descriptionMarkdown}

---

## Milestones & Deliverables
${project.milestones
  .map(
    (m, idx) => `### ${idx + 1}. ${m.title} [${m.status.toUpperCase()}] (Due: ${m.dueDate})
${m.description ? `${m.description}\n` : ""}${m.deliverables.map((d) => `- [${d.completed ? "x" : " "}] ${d.title}`).join("\n")}
`
  )
  .join("\n")}
`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.slug || "project"}-portfolio-spec.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export all projects markdown
  const exportAllProjectsMarkdown = () => {
    const md = `# SkillOS Portfolio Projects Compilation
*Generated: ${new Date().toLocaleString()}*
*Total Projects: ${projects.length} | Completed: ${metrics.completed} | In Progress: ${metrics.inProgress}*

---

${projects.map((p) => `## ${p.title} (${p.track})
- **Status:** ${p.status} | **Progress:** ${p.progress}% | **Hours:** ${p.loggedHours}h
- **Tech Stack:** ${p.techStack.join(", ")}
${p.repoUrl ? `- **Repo:** ${p.repoUrl}` : ""}
${p.demoUrl ? `- **Demo:** ${p.demoUrl}` : ""}

${p.tagline}

${p.descriptionMarkdown}

---
`).join("\n")}`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `skillos-all-portfolio-projects.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset to initial seed
  const resetToInitialProjects = () => {
    setProjects(INITIAL_PROJECTS_SEED);
    setSelectedProjectId(null);
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        selectedProjectId,
        selectedProject,
        metrics,
        setSelectedProjectId,
        addProject,
        updateProject,
        deleteProject,
        togglePinProject,
        duplicateProject,
        advanceProjectStatus,
        toggleMilestoneStatus,
        toggleDeliverable,
        addMilestone,
        deleteMilestone,
        linkTaskToProject,
        unlinkTaskFromProject,
        linkNoteToProject,
        unlinkNoteFromProject,
        exportProjectMarkdown,
        exportAllProjectsMarkdown,
        resetToInitialProjects,
        batchRenameTag,
        batchRemoveTag,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return context;
}
