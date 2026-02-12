import { mockProjects } from "@/lib/mockData";
import { Progress } from "@/components/ui/progress";
import { Plus, Filter, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Projects() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your translation projects</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" /> New Project
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Set up a new translation project with source and target languages.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input id="project-name" placeholder="e.g., Marketing Website v3.2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source-lang">Source Language</Label>
                  <Input id="source-lang" placeholder="e.g., English" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-langs">Target Languages</Label>
                  <Input id="target-langs" placeholder="e.g., French, German, Spanish" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="word-count">Word Count</Label>
                  <Input id="word-count" type="number" placeholder="e.g., 5000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input id="deadline" type="date" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Add project creation logic here
                    setIsDialogOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Create Project
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Languages</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Words</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deadline</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team</th>
            </tr>
          </thead>
          <tbody>
            {mockProjects.map((project) => (
              <tr key={project.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-4">
                  <Link to="/editor" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
                    {project.name}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-muted-foreground">
                    {project.sourceLang} → {project.targetLangs.join(", ")}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">
                  {project.wordCount.toLocaleString()}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 w-32">
                    <Progress value={project.progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-8 text-right">{project.progress}%</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={project.status} />
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{project.deadline}</td>
                <td className="px-5 py-4">
                  <div className="flex -space-x-2">
                    {project.assignees.map((name, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-bold text-foreground"
                        title={name}
                      >
                        {name.split(" ").map((n) => n[0]).join("")}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
