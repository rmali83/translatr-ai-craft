import {
  FolderKanban,
  FileText,
  Database,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { mockProjects, dashboardStats } from "@/lib/mockData";
import { Progress } from "@/components/ui/progress";

const statCards = [
  { label: "Active Projects", value: dashboardStats.activeProjects, icon: FolderKanban, color: "text-info" },
  { label: "Words in Progress", value: dashboardStats.wordsInProgress.toLocaleString(), icon: FileText, color: "text-accent" },
  { label: "TM Entries", value: dashboardStats.tmEntries.toLocaleString(), icon: Database, color: "text-success" },
  { label: "Avg. Delivery", value: `${dashboardStats.avgDeliveryDays} days`, icon: Clock, color: "text-warning" },
];

export default function Index() {
  const activeProjects = mockProjects.filter((p) => p.status !== "completed").slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your translation workspace</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl border border-border p-5 flex items-start gap-4"
          >
            <div className={`p-2.5 rounded-lg bg-secondary ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights + Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights */}
        <div className="bg-card rounded-xl border border-border p-6 ai-glow">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">AI Insights</h2>
          </div>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-ai-muted">
              <p className="text-sm font-medium text-foreground">TM Match Opportunity</p>
              <p className="text-xs text-muted-foreground mt-1">
                &quot;Mobile App Strings&quot; has 340 segments with 80%+ TM matches. Auto-populate to save ~4 hours.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-ai-muted">
              <p className="text-sm font-medium text-foreground">Deadline Alert</p>
              <p className="text-xs text-muted-foreground mt-1">
                &quot;E-commerce Catalog&quot; is due in 2 days with 8% remaining. Assign an additional translator?
              </p>
            </div>
            <div className="p-3 rounded-lg bg-ai-muted">
              <p className="text-sm font-medium text-foreground">Consistency Issue</p>
              <p className="text-xs text-muted-foreground mt-1">
                3 glossary terms have conflicting translations across active projects. Review recommended.
              </p>
            </div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Active Projects</h2>
            <Link
              to="/projects"
              className="text-sm text-accent hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {project.sourceLang} → {project.targetLangs.join(", ")} · {project.wordCount.toLocaleString()} words
                  </p>
                </div>
                <div className="w-32 shrink-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{project.progress}%</span>
                    <span>{project.deadline}</span>
                  </div>
                  <Progress value={project.progress} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { action: "Anna K. confirmed 24 segments", project: "Marketing Website v3.2", time: "12 min ago" },
            { action: "AI auto-translated 156 segments", project: "Mobile App Strings", time: "1 hour ago" },
            { action: "Hans V. submitted for review", project: "E-commerce Catalog", time: "3 hours ago" },
            { action: "TM updated with 430 new entries", project: "Legal Documents Q1", time: "Yesterday" },
          ].map((activity, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm text-foreground">{activity.action}</p>
                <p className="text-xs text-muted-foreground">{activity.project}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-success/15 text-success",
    completed: "bg-muted text-muted-foreground",
    pending: "bg-warning/15 text-warning",
    review: "bg-info/15 text-info",
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[status] || styles.active}`}>
      {status}
    </span>
  );
}
