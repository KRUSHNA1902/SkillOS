import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import SignIn1 from "@/components/ui/modern-stunning-sign-in";
import {
  AnimatedSidebar,
  AnimatedSidebarClose,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarHeader,
  AnimatedSidebarInset,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarMenuSub,
  AnimatedSidebarMenuSubButton,
  AnimatedSidebarMenuSubItem,
  AnimatedSidebarProvider,
  AnimatedSidebarRail,
  AnimatedSidebarTrigger,
} from "@/components/ui/animated-sidebar";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { AIAssistantView } from "@/components/ai/ai-assistant-view";
import {
  Building2,
  ChevronsUpDown,
  CircleUserRound,
  Command,
  Inbox,
  LayoutGrid,
  ListTodo,
  Loader2,
  LogOut,
  NotebookTabs,
  PanelLeft,
  Search,
  Sparkles,
  Target,
  Workflow,
  X,
  Zap,
} from "lucide-react";

const navigationItems = [
  {
    label: "Dashboard",
    icon: LayoutGrid,
  },
  {
    label: "People",
    icon: CircleUserRound,
    children: ["All Members", "Recent Activity", "Segments"],
  },
  {
    label: "Workspaces",
    icon: Building2,
    children: ["Skill Projects", "Shared Resources"],
  },
  {
    label: "Opportunities",
    icon: Target,
    children: ["Pipeline", "Forecast"],
  },
  {
    label: "Tasks",
    icon: ListTodo,
  },
  {
    label: "Notes",
    icon: NotebookTabs,
  },
  {
    label: "Workflows",
    icon: Workflow,
    children: ["Automations", "Active Runs", "Templates"],
  },
];

function App() {
  const { user, loading, logout } = useAuth();
  const [active, setActive] = useState("Dashboard");
  const [openSection, setOpenSection] = useState<string | null>(null);

  if (loading) {
    return (
      <main className="w-full min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </main>
    );
  }

  // Unauthenticated users see the modern sign-in experience
  if (!user) {
    return (
      <main className="w-full min-h-screen bg-[#121212]">
        <SignIn1 />
      </main>
    );
  }

  // Authenticated users experience the full SkillOS application shell
  const isDevUser = user.id === "dev-user-001";
  const displayName = user.email ? user.email.split("@")[0] : "Learner";
  const capitalizedName =
    displayName.charAt(0).toUpperCase() + displayName.slice(1);

  return (
    <div className="min-h-screen w-full bg-background text-foreground antialiased selection:bg-primary/20">
      <AnimatedSidebarProvider className="min-h-screen w-full">
        {/* Animated Desktop & Mobile Sidebar */}
        <AnimatedSidebar
          ariaLabel="SkillOS Workspace"
          collapsible="icon"
          className="min-h-screen"
        >
          {/* Sidebar Header */}
          <AnimatedSidebarHeader className="p-3 pb-2 border-b border-border/40">
            <div className="flex min-h-11 items-center gap-3 overflow-hidden px-1">
              <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Command aria-hidden="true" className="size-4" />
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between group-data-[state=collapsed]/sidebar:hidden">
                <div className="truncate">
                  <span className="block truncate text-sm font-semibold tracking-tight text-foreground">
                    SkillOS
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    Engineering Org
                  </span>
                </div>
                <ChevronsUpDown
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
              </div>
              <AnimatedSidebarClose className="ml-auto text-muted-foreground hover:bg-muted md:hidden">
                <X aria-hidden="true" className="size-4" />
              </AnimatedSidebarClose>
            </div>
          </AnimatedSidebarHeader>

          {/* Sidebar Content */}
          <AnimatedSidebarContent className="px-2 pt-2">
            {/* Quick Actions Group */}
            <AnimatedSidebarGroup className="pb-2">
              <AnimatedSidebarGroupContent>
                <AnimatedSidebarMenu>
                  <AnimatedSidebarMenuItem>
                    <AnimatedSidebarMenuButton
                      icon={<Search className="size-4" />}
                      isActive={active === "Search"}
                      onSelect={() => setActive("Search")}
                    >
                      Search
                    </AnimatedSidebarMenuButton>
                  </AnimatedSidebarMenuItem>
                  <AnimatedSidebarMenuItem>
                    <AnimatedSidebarMenuButton
                      icon={<Sparkles className="size-4 text-amber-400" />}
                      isActive={active === "AI Assistant"}
                      onSelect={() => setActive("AI Assistant")}
                    >
                      AI Assistant
                    </AnimatedSidebarMenuButton>
                  </AnimatedSidebarMenuItem>
                  <AnimatedSidebarMenuItem>
                    <AnimatedSidebarMenuButton
                      icon={<Inbox className="size-4" />}
                      badge="4"
                      isActive={active === "Inbox"}
                      onSelect={() => setActive("Inbox")}
                    >
                      Inbox
                    </AnimatedSidebarMenuButton>
                  </AnimatedSidebarMenuItem>
                </AnimatedSidebarMenu>
              </AnimatedSidebarGroupContent>
            </AnimatedSidebarGroup>

            {/* Navigation Group */}
            <AnimatedSidebarGroup className="pt-1">
              <AnimatedSidebarGroupLabel>Platform</AnimatedSidebarGroupLabel>
              <AnimatedSidebarGroupContent>
                <AnimatedSidebarMenu>
                  {navigationItems.map(({ label, icon: Icon, children }) => (
                    <AnimatedSidebarMenuItem key={label}>
                      <AnimatedSidebarMenuButton
                        isActive={
                          active === label ||
                          children?.includes(active) === true
                        }
                        ariaExpanded={
                          children ? openSection === label : undefined
                        }
                        icon={<Icon className="size-4" />}
                        onSelect={() => {
                          if (!children) {
                            setActive(label);
                          } else {
                            setOpenSection((current) =>
                              current === label ? null : label
                            );
                          }
                        }}
                      >
                        {label}
                      </AnimatedSidebarMenuButton>
                      {children ? (
                        <AnimatedSidebarMenuSub open={openSection === label}>
                          {children.map((child) => (
                            <AnimatedSidebarMenuSubItem key={child}>
                              <AnimatedSidebarMenuSubButton
                                isActive={active === child}
                                onSelect={() => setActive(child)}
                              >
                                {child}
                              </AnimatedSidebarMenuSubButton>
                            </AnimatedSidebarMenuSubItem>
                          ))}
                        </AnimatedSidebarMenuSub>
                      ) : null}
                    </AnimatedSidebarMenuItem>
                  ))}
                </AnimatedSidebarMenu>
              </AnimatedSidebarGroupContent>
            </AnimatedSidebarGroup>
          </AnimatedSidebarContent>

          {/* Sidebar Footer with User Profile and Logout */}
          <AnimatedSidebarFooter className="gap-2 border-t border-border/40 p-2">
            <div className="flex w-full items-center justify-between gap-2 overflow-hidden rounded-xl p-1.5 transition-colors hover:bg-muted/50">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt={capitalizedName}
                  className="size-8 shrink-0 rounded-full object-cover border border-border"
                />
                <div className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {capitalizedName}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Log out"
                aria-label="Log out"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive group-data-[state=collapsed]/sidebar:hidden cursor-pointer"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </AnimatedSidebarFooter>

          {/* Desktop Rail Handle */}
          <AnimatedSidebarRail />
        </AnimatedSidebar>

        {/* Inset Main Container */}
        <AnimatedSidebarInset className="min-h-screen flex flex-col bg-background">
          {/* Top Inset Navigation Bar */}
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-md px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <AnimatedSidebarTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground">
                <PanelLeft aria-hidden="true" className="size-4.5" />
              </AnimatedSidebarTrigger>
              <div className="h-4 w-px bg-border/60" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  SkillOS
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  /
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {active}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isDevUser && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono font-medium text-amber-300">
                  <Zap className="size-3 text-amber-400" />
                  <span className="hidden sm:inline">Dev Bypass</span>
                </span>
              )}

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 px-2.5 py-1 text-xs text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

          {/* Inset Content Body */}
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {active === "Dashboard" ? (
              <DashboardView
                userName={capitalizedName}
                userEmail={user.email}
                isDevUser={isDevUser}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="max-w-md space-y-3 rounded-2xl border border-border/60 bg-card/40 p-8 backdrop-blur-sm">
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="size-6" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {active} View
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You are viewing the {active} workspace tab. Manage team
                    collaborators, skills, pipelines, and automations directly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActive("Dashboard")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}
          </main>
        </AnimatedSidebarInset>
      </AnimatedSidebarProvider>
    </div>
  );
}

export default App;
