import React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  DollarSign,
  Users,
  ShoppingBag,
  Package,
  Clock,
  TrendingUp,
  CheckCircle2,
  Bell,
  Smartphone,
  Laptop,
  Headphones,
  Tablet,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export type TrendType = "up" | "down" | "neutral";

export interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trendChange?: string;
  trendType?: TrendType;
  accentColor?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trendChange,
  trendType = "up",
  accentColor = "text-primary",
}: MetricCardProps) {
  const TrendIcon = trendType === "up" ? ArrowUp : trendType === "down" ? ArrowDown : Minus;
  const trendColorClass =
    trendType === "up"
      ? "text-emerald-400"
      : trendType === "down"
      ? "text-rose-400"
      : "text-muted-foreground";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 380, damping: 25 }}
      className="h-full"
    >
      <Card className="h-full border-border bg-card/60 backdrop-blur-sm transition-all hover:border-foreground/20 hover:shadow-lg hover:shadow-black/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="grid size-9 place-items-center rounded-xl bg-muted/60 text-foreground">
            <Icon className={`size-4.5 ${accentColor}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {value}
          </div>
          {trendChange && (
            <p className="mt-2 flex items-center text-xs font-medium text-muted-foreground">
              <span className={`mr-1 inline-flex items-center font-semibold ${trendColorClass}`}>
                <TrendIcon className="mr-0.5 size-3" />
                {trendChange}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface RecentActivityItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  icon: React.ElementType;
  iconColor: string;
}

const recentActivities: RecentActivityItem[] = [
  {
    id: "1",
    title: "New sale recorded",
    detail: "$120.00 from John Doe",
    time: "2 min ago",
    icon: DollarSign,
    iconColor: "text-emerald-400 bg-emerald-500/10",
  },
  {
    id: "2",
    title: "New user registered",
    detail: "sarah@example.com",
    time: "15 min ago",
    icon: Users,
    iconColor: "text-blue-400 bg-blue-500/10",
  },
  {
    id: "3",
    title: "Product updated",
    detail: "iPhone 15 Pro stock updated",
    time: "1 hour ago",
    icon: Package,
    iconColor: "text-amber-400 bg-amber-500/10",
  },
  {
    id: "4",
    title: "System maintenance",
    detail: "Scheduled downtime completed",
    time: "3 hours ago",
    icon: CheckCircle2,
    iconColor: "text-purple-400 bg-purple-500/10",
  },
  {
    id: "5",
    title: "New notification",
    detail: "Marketing campaign results",
    time: "5 hours ago",
    icon: Bell,
    iconColor: "text-cyan-400 bg-cyan-500/10",
  },
];

const topProducts = [
  { name: "iPhone 15 Pro", category: "Mobile", revenue: "$12,450", units: "42 sold", icon: Smartphone },
  { name: "MacBook Air M2", category: "Laptop", revenue: "$15,800", units: "18 sold", icon: Laptop },
  { name: "AirPods Pro", category: "Audio", revenue: "$3,200", units: "26 sold", icon: Headphones },
  { name: "iPad Air", category: "Tablet", revenue: "$7,100", units: "14 sold", icon: Tablet },
];

export interface DashboardViewProps {
  userName?: string;
  userEmail?: string;
  isDevUser?: boolean;
  onOpenAI?: () => void;
}

export function DashboardView({
  userName = "Ava Stone",
  userEmail = "ava@solace.app",
  isDevUser = false,
  onOpenAI,
}: DashboardViewProps) {
  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Dashboard
            </h1>
            {isDevUser && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono font-medium text-amber-300">
                <ShieldCheck className="size-3.5 text-amber-400" />
                Dev Mode
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back to your dashboard, <span className="text-foreground font-medium">{userName}</span> ({userEmail})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>Updated live</span>
          </div>
          <button
            type="button"
            onClick={onOpenAI}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
          >
            <TrendingUp className="size-3.5" />
            <span>AI Data Summary</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards from 21st.dev Component Spec */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Sales"
          value="$24,567"
          icon={DollarSign}
          trendChange="+12% from last week"
          trendType="up"
          accentColor="text-emerald-400"
        />
        <MetricCard
          title="Active Users"
          value="1,234"
          icon={Users}
          trendChange="+14% from last week"
          trendType="up"
          accentColor="text-blue-400"
        />
        <MetricCard
          title="Orders"
          value="456"
          icon={ShoppingBag}
          trendChange="+8% from yesterday"
          trendType="up"
          accentColor="text-amber-400"
        />
        <MetricCard
          title="Products"
          value="89"
          icon={Package}
          trendChange="+12 new this week"
          trendType="up"
          accentColor="text-purple-400"
        />
      </div>

      {/* Main Grid: Recent Activity & Quick Stats / Top Products */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column: Recent Activity (4 cols) */}
        <Card className="border-border bg-card/60 backdrop-blur-sm lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Recent Activity
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time transactions and audit updates
              </CardDescription>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <span>View all</span>
              <ChevronRight className="size-3" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="divide-y divide-border/60">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-3 transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`grid size-9 shrink-0 place-items-center rounded-xl ${activity.iconColor}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {activity.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {activity.detail}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Quick Stats & Top Products (3 cols) */}
        <div className="space-y-6 lg:col-span-3">
          {/* Quick Stats */}
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">
                Quick Stats
              </CardTitle>
              <CardDescription className="text-xs">
                Key conversion and acquisition metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-muted-foreground">Conversion Rate</span>
                  <span className="text-foreground font-semibold">3.2%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/80 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 w-[48%]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-muted-foreground">Bounce Rate</span>
                  <span className="text-foreground font-semibold">42%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/80 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 w-[42%]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-muted-foreground">Page Views</span>
                  <span className="text-foreground font-semibold">8.7k</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/80 overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500 w-[78%]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Top Products
                </CardTitle>
                <CardDescription className="text-xs">
                  Highest revenue contributors
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {topProducts.map((product) => {
                const Icon = product.icon;
                return (
                  <div
                    key={product.name}
                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-lg bg-muted text-foreground">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {product.units}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {product.revenue}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
