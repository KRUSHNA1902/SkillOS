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
  useAnimatedSidebar,
} from "@/components/ui/animated-sidebar";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { TasksView } from "@/components/tasks/tasks-view";
import { TaskManagerProvider } from "@/components/tasks/task-context";
import { NotesView } from "@/components/notes/notes-view";
import { NotesProvider } from "@/components/notes/note-context";
import { AIAssistantView } from "@/components/ai/ai-assistant-view";
import { ProfileSettingsDialog } from "@/components/profile/profile-settings-dialog";
import { UserAvatarIcon } from "@/components/profile/user-avatar-icon";
import { useTheme } from "@/context/ThemeContext";
import {
  Building2,
  ChevronsUpDown,
  CircleUserRound,
  Command,
  FolderKanban,
  Inbox,
  LayoutGrid,
  ListTodo,
  Loader2,
  LogOut,
  Moon,
  NotebookTabs,
  PanelLeft,
  Search,
  Sparkles,
  Sun,
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
    label: "Projects",
    icon: FolderKanban,
    children: ["All Projects", "In Progress", "Completed"],
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

function SidebarLogoToggle() {
  const { open, state, toggleSidebar } = useAnimatedSidebar();
  const isCollapsed = state === "collapsed" || !open;

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      title={isCollapsed ? "Expand sidebar (⌘B)" : "Collapse sidebar (⌘B)"}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="group/logo relative grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:scale-105 active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Command
        aria-hidden="true"
        className="size-4 transition-transform duration-200 group-hover/logo:scale-110"
      />
    </button>
  );
}

function App() {
  const { user, loading, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [active, setActive] = useState("Dashboard");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (loading) {
    return (
      <main className="w-full min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  // Unauthenticated users see the modern sign-in experience
  if (!user) {
    return (
      <main className="w-full min-h-screen bg-background">
        <SignIn1 />
      </main>
    );
  }

  // Authenticated users experience the full SkillOS application shell
  const isDevUser = user.id === "dev-user-001";
  const displayName =
    user.fullName || (user.email ? user.email.split("@")[0] : "Learner");
  const capitalizedName =
    displayName.charAt(0).toUpperCase() + displayName.slice(1);

  return (
    <TaskManagerProvider key={`tasks-${user.id}`}>
      <NotesProvider key={`notes-${user.id}`}>
        <div className="h-screen w-full bg-background text-foreground antialiased selection:bg-primary/20 overflow-hidden">
        <AnimatedSidebarProvider className="h-full w-full overflow-hidden">
        {/* Animated Desktop & Mobile Sidebar */}
        <AnimatedSidebar
          ariaLabel="SkillOS Workspace"
          collapsible="icon"
          className="h-full"
        >
          {/* Sidebar Header */}
          <AnimatedSidebarHeader className="p-3 pb-2 border-b border-border/40">
            <div className="flex min-h-11 items-center gap-3 overflow-hidden px-1">
              <SidebarLogoToggle />
              <div className="flex min-w-0 flex-1 items-center justify-between group-data-[state=collapsed]/sidebar:hidden">
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="block truncate text-sm font-semibold tracking-tight text-foreground">
                      SkillOS
                    </span>
                    {isDevUser && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-mono font-medium text-amber-300">
                        <Zap className="size-2.5 text-amber-400" />
                        Dev
                      </span>
                    )}
                  </div>
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

          {/* Sidebar Footer with Dev Bypass, User Profile, Theme Toggle, and Logout */}
          <AnimatedSidebarFooter className="gap-2 border-t border-border/40 p-2">
            {/* Dev Mode Bypass Indicator / Button */}
            {isDevUser && (
              <div
                className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-mono font-medium text-amber-300 transition-colors hover:bg-amber-500/15 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-1.5 group-data-[state=collapsed]/sidebar:py-2"
                title="Developer Bypass Active (Local Development Mode)"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Zap className="size-3.5 text-amber-400 shrink-0" />
                  <span className="truncate font-semibold group-data-[state=collapsed]/sidebar:hidden">
                    Dev Bypass
                  </span>
                </div>
                <span className="relative flex h-2 w-2 group-data-[state=collapsed]/sidebar:hidden">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              </div>
            )}

            <div className="flex w-full items-center justify-between gap-1 overflow-hidden rounded-xl p-1.5 transition-colors hover:bg-muted/50">
              {/* Profile click trigger: clicking icon OR name opens the profile section */}
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                title="Open profile & settings"
                aria-label="Open profile and settings"
                aria-haspopup="dialog"
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left outline-none rounded-lg p-0.5 -m-0.5 transition-all hover:opacity-95 focus-visible:ring-1 focus-visible:ring-ring cursor-pointer group/profile"
              >
                <UserAvatarIcon
                  name={capitalizedName}
                  email={user.email}
                  size="md"
                  accentColor={user.accentColor}
                  className="group-hover/profile:scale-105"
                />
                <div className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
                  <p className="truncate text-xs font-semibold text-foreground group-hover/profile:text-primary transition-colors">
                    {capitalizedName}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-0.5 group-data-[state=collapsed]/sidebar:hidden">
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
                  aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
                  className="grid size-7.5 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  {resolvedTheme === "dark" ? (
                    <Sun className="size-3.5 text-amber-400" />
                  ) : (
                    <Moon className="size-3.5 text-primary" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={logout}
                  title="Log out"
                  aria-label="Log out"
                  className="grid size-7.5 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                </button>
              </div>
            </div>
          </AnimatedSidebarFooter>

          {/* Desktop Rail Handle */}
          <AnimatedSidebarRail />
        </AnimatedSidebar>

        {/* Inset Main Container */}
        <AnimatedSidebarInset className="h-full min-h-0 flex flex-col overflow-hidden bg-background">
          {/* Mobile-Only Navigation Header (Hidden on desktop, perfectly formatted on phones) */}
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 bg-background/80 px-3 backdrop-blur-md md:hidden">
            <div className="flex items-center gap-2.5">
              <AnimatedSidebarTrigger className="size-8.5 rounded-lg border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground">
                <PanelLeft aria-hidden="true" className="size-4" />
              </AnimatedSidebarTrigger>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-foreground">SkillOS</span>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium text-muted-foreground">{active}</span>
              </div>
            </div>
            {isDevUser && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-400">
                <Zap className="size-2.5" />
                Dev
              </span>
            )}
          </div>

          {/* Inset Content Body */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {active === "Dashboard" ? (
              <DashboardView
                userName={capitalizedName}
                userEmail={user.email}
                isDevUser={isDevUser}
                onOpenAI={() => setActive("AI Assistant")}
                onOpenTasks={() => setActive("Tasks")}
                onOpenNotes={() => setActive("Notes")}
              />
            ) : active === "Tasks" ? (
              <TasksView onNavigateToAI={() => setActive("AI Assistant")} />
            ) : active === "Notes" ? (
              <NotesView onNavigateToAI={() => setActive("AI Assistant")} />
            ) : active === "AI Assistant" ? (
              <AIAssistantView userName={capitalizedName} />
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

      {/* Interactive Profile & Settings Modal */}
      <ProfileSettingsDialog
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
      </NotesProvider>
  </TaskManagerProvider>
  );
}

export default App;
