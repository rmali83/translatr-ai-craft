import {
  FolderKanban,
  FileText,
  Database,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  Target,
  Activity,
  Users,
  Globe,
  BarChart3,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { mockProjects, dashboardStats } from "@/lib/mockData";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

const statCards = [
  { 
    label: "Active Projects", 
    value: dashboardStats.activeProjects, 
    icon: FolderKanban, 
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    change: "+12%",
    trend: "up"
  },
  { 
    label: "Words in Progress", 
    value: dashboardStats.wordsInProgress.toLocaleString(), 
    icon: FileText, 
    color: "text-accent",
    bgColor: "bg-accent/10",
    change: "+8.2%",
    trend: "up"
  },
  { 
    label: "TM Entries", 
    value: dashboardStats.tmEntries.toLocaleString(), 
    icon: Database, 
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    change: "+24%",
    trend: "up"
  },
  { 
    label: "Avg. Delivery", 
    value: `${dashboardStats.avgDeliveryDays} days`, 
    icon: Clock, 
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    change: "-15%",
    trend: "down"
  },
];

const aiInsights = [
  {
    type: "opportunity",
    icon: Target,
    title: "TM Match Opportunity",
    description: "\"Mobile App Strings\" has 340 segments with 80%+ TM matches. Auto-populate to save ~4 hours.",
    action: "Auto-populate",
    priority: "high",
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  {
    type: "alert",
    icon: Clock,
    title: "Deadline Alert",
    description: "\"E-commerce Catalog\" is due in 2 days with 8% remaining. Assign an additional translator?",
    action: "Assign translator",
    priority: "urgent",
    color: "text-red-500",
    bgColor: "bg-red-500/10"
  },
  {
    type: "quality",
    icon: Brain,
    title: "Consistency Issue",
    description: "3 glossary terms have conflicting translations across active projects. Review recommended.",
    action: "Review terms",
    priority: "medium",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10"
  },
];

export default function Index() {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
  const activeProjects = mockProjects.filter((p) => p.status !== "completed").slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header with AI Greeting */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-accent opacity-5 rounded-3xl blur-3xl"></div>
        <div className="relative glass-card p-8 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                Welcome back! 👋
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Your AI-powered translation workspace is ready. Here's what's happening today.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 rounded-full bg-gradient-accent flex items-center justify-center shadow-2xl">
                <Sparkles className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={stat.label}
            className="group glass-card p-6 rounded-2xl hover-lift hover-glow transition-all duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
              }`}>
                {stat.trend === 'up' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-caption font-medium uppercase tracking-wider">{stat.label}</p>
              <p className="text-heading font-bold mt-1 group-hover:text-accent transition-colors">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights + Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enhanced AI Insights */}
        <div className="glass-card p-6 rounded-2xl ai-glow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-accent">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-subheading font-bold">AI Insights</h2>
              <p className="text-caption">Intelligent recommendations</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  expandedInsight === index 
                    ? 'border-accent/50 bg-accent/5' 
                    : 'border-border/50 hover:border-accent/30 hover:bg-accent/5'
                }`}
                onClick={() => setExpandedInsight(expandedInsight === index ? null : index)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${insight.bgColor} shrink-0`}>
                    <insight.icon className={`w-4 h-4 ${insight.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold">{insight.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        insight.priority === 'urgent' ? 'bg-red-500/20 text-red-500' :
                        insight.priority === 'high' ? 'bg-orange-500/20 text-orange-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {insight.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                    {expandedInsight === index && (
                      <button className="mt-3 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors">
                        {insight.action}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Active Projects */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-subheading font-bold">Active Projects</h2>
              <p className="text-caption">Your current translation work</p>
            </div>
            <Link
              to="/projects"
              className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-xl text-sm font-medium hover:bg-accent/20 transition-all duration-300 hover-lift"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {activeProjects.map((project, index) => (
              <div
                key={project.id}
                className="group p-4 rounded-xl border border-border/50 hover:border-accent/30 hover:bg-accent/5 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Link 
                        to={`/projects/${project.id}`}
                        className="text-sm font-semibold text-foreground hover:text-accent transition-colors truncate"
                      >
                        {project.name}
                      </Link>
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {project.sourceLang} → {project.targetLangs.join(", ")}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {project.wordCount.toLocaleString()} words
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due {project.deadline}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-32 shrink-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span className="font-medium">{project.progress}%</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        project.progress >= 80 ? 'bg-green-500/20 text-green-500' :
                        project.progress >= 50 ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {project.progress >= 80 ? 'On track' : project.progress >= 50 ? 'At risk' : 'Delayed'}
                      </span>
                    </div>
                    <Progress 
                      value={project.progress} 
                      className="h-2 bg-muted"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Recent Activity */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-secondary">
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-subheading font-bold">Recent Activity</h2>
            <p className="text-caption">Latest updates across your workspace</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {[
            { 
              action: "Anna K. confirmed 24 segments", 
              project: "Marketing Website v3.2", 
              time: "12 min ago",
              type: "user",
              icon: Users,
              color: "text-blue-500"
            },
            { 
              action: "AI auto-translated 156 segments", 
              project: "Mobile App Strings", 
              time: "1 hour ago",
              type: "ai",
              icon: Zap,
              color: "text-accent"
            },
            { 
              action: "Hans V. submitted for review", 
              project: "E-commerce Catalog", 
              time: "3 hours ago",
              type: "user",
              icon: Users,
              color: "text-green-500"
            },
            { 
              action: "TM updated with 430 new entries", 
              project: "Legal Documents Q1", 
              time: "Yesterday",
              type: "system",
              icon: Database,
              color: "text-orange-500"
            },
          ].map((activity, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/5 transition-colors group">
              <div className={`p-2 rounded-lg bg-muted/50 group-hover:bg-accent/10 transition-colors`}>
                <activity.icon className={`w-4 h-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.action}</p>
                <p className="text-xs text-muted-foreground">{activity.project}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 font-medium">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/20 text-green-500 border-green-500/30",
    completed: "bg-muted text-muted-foreground border-muted",
    pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    review: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  };
  return (
    <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-lg border ${styles[status] || styles.active}`}>
      {status}
    </span>
  );
}
