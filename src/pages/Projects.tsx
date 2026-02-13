import { Progress } from "@/components/ui/progress";
import { Plus, Filter, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { api, Project } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    source_language: '',
    target_language: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await api.getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.name || !formData.source_language || !formData.target_language) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const project = await api.createProject(formData);
      toast({
        title: "Success",
        description: "Project created successfully"
      });
      setIsDialogOpen(false);
      setFormData({ name: '', source_language: '', target_language: '', description: '' });
      loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive"
      });
    }
  };

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
                  <Label htmlFor="project-name">Project Name *</Label>
                  <Input 
                    id="project-name" 
                    placeholder="e.g., Marketing Website v3.2"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source-lang">Source Language *</Label>
                  <Input 
                    id="source-lang" 
                    placeholder="e.g., English"
                    value={formData.source_language}
                    onChange={(e) => setFormData({...formData, source_language: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-lang">Target Language *</Label>
                  <Input 
                    id="target-lang" 
                    placeholder="e.g., French"
                    value={formData.target_language}
                    onChange={(e) => setFormData({...formData, target_language: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
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
                  onClick={handleCreateProject}
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
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No projects yet. Create your first project to get started!
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Languages</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-4">
                    <Link to={`/projects/${project.id}`} className="text-sm font-medium text-foreground hover:text-accent transition-colors">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-muted-foreground">
                      {project.source_language} → {project.target_language}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {new Date(project.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
