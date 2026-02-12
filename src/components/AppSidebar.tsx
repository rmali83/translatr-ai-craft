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
  Bell,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/editor", icon: Languages, label: "CAT Editor" },
  { to: "/tm", icon: Database, label: "Translation Memory" },
  { to: "/glossary", icon: BookOpen, label: "Glossary" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/team", icon: Users, label: "Team" },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">LinguaFlow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-primary">
            PM
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Project Manager</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">pm@linguaflow.io</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
