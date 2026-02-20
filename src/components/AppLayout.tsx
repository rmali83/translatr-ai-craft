import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { RoleSwitcher } from "./RoleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { Bell, Search, Sparkles, Zap } from "lucide-react";
import { useState } from "react";

export default function AppLayout() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <AppSidebar />
      <div className="ml-64">
        {/* Futuristic Top Bar */}
        <header className="sticky top-0 z-50 glass backdrop-blur-xl border-b border-glass-border">
          <div className="flex items-center justify-between px-6 py-4">
            {/* AI-Enhanced Search */}
            <div className="relative w-96 group">
              <div className="absolute inset-0 bg-gradient-accent rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
              <div className="relative flex items-center">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                <Sparkles className="absolute right-12 top-1/2 -translate-y-1/2 w-4 h-4 text-accent opacity-60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="AI-powered search across projects, TM, glossary..."
                  className="w-full pl-12 pr-16 py-3 rounded-xl glass border-glass-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <kbd className="px-2 py-1 text-xs bg-muted/50 rounded border text-muted-foreground">⌘K</kbd>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3">
              {/* AI Assistant Button */}
              <button className="relative p-3 rounded-xl glass hover-glow transition-all duration-300 group">
                <Zap className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-accent rounded-full animate-pulse"></div>
              </button>

              {/* Notifications */}
              <button className="relative p-3 rounded-xl glass hover-glow transition-all duration-300 group">
                <Bell className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full animate-pulse"></span>
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Role Switcher */}
              <div className="glass-card p-1 rounded-xl">
                <RoleSwitcher />
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-accent opacity-60"></div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 min-h-[calc(100vh-80px)]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-40">
          <button className="w-14 h-14 rounded-full bg-gradient-accent shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group">
            <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
