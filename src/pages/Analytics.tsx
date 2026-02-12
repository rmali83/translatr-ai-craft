import { BarChart3, TrendingUp, Clock, Target } from "lucide-react";

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track performance and productivity metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Words", value: "124,580", icon: Target, color: "text-info" },
          { label: "Avg. Speed", value: "450 w/h", icon: TrendingUp, color: "text-success" },
          { label: "Projects Done", value: "23", icon: BarChart3, color: "text-accent" },
          { label: "Total Hours", value: "276", icon: Clock, color: "text-warning" },
        ].map((stat) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Productivity Trend</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <BarChart3 className="w-16 h-16 opacity-20" />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Language Distribution</h2>
          <div className="space-y-3">
            {[
              { lang: "French", count: 45, percentage: 45 },
              { lang: "German", count: 30, percentage: 30 },
              { lang: "Spanish", count: 15, percentage: 15 },
              { lang: "Italian", count: 10, percentage: 10 },
            ].map((item) => (
              <div key={item.lang}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-foreground">{item.lang}</span>
                  <span className="text-muted-foreground">{item.count} projects</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
