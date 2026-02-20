import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Languages,
  BookOpen,
  Database,
  BarChart3,
  Settings,
  Sparkles,
  Users,
  Zap,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", description: "Overview & insights" },
  { to: "/projects", icon: FolderKanban, label: "Projects", description: "Manage translations" },
  { to: "/editor", icon: Languages, label: "CAT Editor", description: "Translation workspace" },
  { to: "/tm", icon: Database, label: "Translation Memory", description: "Reuse translations" },
  { to: "/glossary", icon: BookOpen, label: "Glossary", description: "Term management" },
  { to: "/analytics", icon: BarChart3, label: "Analytics", description: "Performance metrics" },
  { to: "/team", icon: Users, label: "Team", description: "Collaboration hub" },
];

export default function AppSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground flex flex-col z-50 border-r border-sidebar-border">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-sidebar-foreground to-sidebar-primary bg-clip-text text-transparent">
              LinguaFlow
            </span>
            <div className="text-xs text-sidebar-foreground/60 font-medium">AI Translation Suite</div>
          </div>
        </div>
      </div>

      {/* AI Assistant Quick Access */}
      <div className="px-4 py-4">
        <button className="w-full p-3 rounded-xl bg-gradient-accent text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-medium">AI Assistant</span>
            <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary shadow-lg"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover-lift"
              }`}
            >
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-accent rounded-r-full"></div>
              )}
              
              <div className={`p-2 rounded-lg transition-all duration-300 ${
                isActive 
                  ? "bg-sidebar-primary/20 text-sidebar-primary" 
                  : "bg-sidebar-accent/30 group-hover:bg-sidebar-primary/10"
              }`}>
                <item.icon className="w-4 h-4 shrink-0" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-sidebar-foreground/50 truncate">{item.description}</div>
              </div>

              {/* Hover Arrow */}
              <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
              }`} />
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="px-4 py-4 border-t border-sidebar-border/50">
        {/* Settings */}
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-300 hover-lift group mb-3"
        >
          <div className="p-2 rounded-lg bg-sidebar-accent/30 group-hover:bg-sidebar-primary/10 transition-colors">
            <Settings className="w-4 h-4" />
          </div>
          <span>Settings</span>
          <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </NavLink>

        {/* User Info */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-accent/30">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center text-sm font-bold text-white shadow-lg">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar-background"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate capitalize">
              {user?.primary_role || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {user?.email || 'user@linguaflow.io'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
