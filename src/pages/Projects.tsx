import { Progress } from "@/components/ui/progress";
import { Plus, Filter, Download, Search, Grid3X3, List, Calendar, Globe, FileText, Users, Clock, Zap, ArrowUpRight } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    source_language: '',
    target_language: '',
    description: '',
    deadline: '',
    tm_file: null as File | null,
    reference_file: null as File | null,
  });
  const [sourceLangSuggestions, setSourceLangSuggestions] = useState<string[]>([]);
  const [targetLangSuggestions, setTargetLangSuggestions] = useState<string[]>([]);
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [showTargetSuggestions, setShowTargetSuggestions] = useState(false);

  // Common languages for autocomplete
  const commonLanguages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 
    'Urdu', 'Turkish', 'Dutch', 'Polish', 'Swedish', 'Norwegian', 
    'Danish', 'Finnish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese'
  ];

  const handleSourceLanguageChange = (value: string) => {
    setFormData({...formData, source_language: value});
    if (value.length > 0) {
      const filtered = commonLanguages.filter(lang => 
        lang.toLowerCase().startsWith(value.toLowerCase())
      );
      setSourceLangSuggestions(filtered);
      setShowSourceSuggestions(true);
    } else {
      setShowSourceSuggestions(false);
    }
  };

  const handleTargetLanguageChange = (value: string) => {
    setFormData({...formData, target_language: value});
    if (value.length > 0) {
      const filtered = commonLanguages.filter(lang => 
        lang.toLowerCase().startsWith(value.toLowerCase())
      );
      setTargetLangSuggestions(filtered);
      setShowTargetSuggestions(true);
    } else {
      setShowTargetSuggestions(false);
    }
  };
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
      setFormData({ 
        name: '', 
        source_language: '', 
        target_language: '', 
        description: '',
        deadline: '',
        tm_file: null,
        reference_file: null
      });
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

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.source_language.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.target_language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-accent opacity-5 rounded-3xl blur-3xl"></div>
        <div className="relative glass-card p-8 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                Projects
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Manage and track your translation projects with AI-powered insights
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-20 h-20 rounded-full bg-gradient-accent flex items-center justify-center shadow-2xl">
                <FileText className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl glass border-glass-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-muted/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'grid' 
                    ? 'bg-accent text-white shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'list' 
                    ? 'bg-accent text-white shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover-glow transition-all duration-300">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filter</span>
            </button>

            {/* Export */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover-glow transition-all duration-300">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>

            {/* Create Project */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-accent text-white font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] glass-card border-glass-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-heading">Create New Project</DialogTitle>
                  <DialogDescription>
                    Set up a new translation project with AI-powered workflow optimization.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Project Name */}
                  <div className="space-y-2">
                    <Label htmlFor="project-name" className="text-sm font-medium">Project Name *</Label>
                    <Input 
                      id="project-name" 
                      placeholder="e.g., Marketing Website v3.2"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="glass border-glass-border"
                    />
                  </div>

                  {/* Languages with Autocomplete */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Source Language */}
                    <div className="space-y-2 relative">
                      <Label htmlFor="source-lang" className="text-sm font-medium">Source Language *</Label>
                      <Input 
                        id="source-lang" 
                        placeholder="Start typing..."
                        value={formData.source_language}
                        onChange={(e) => handleSourceLanguageChange(e.target.value)}
                        onFocus={() => formData.source_language && setShowSourceSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSourceSuggestions(false), 200)}
                        className="glass border-glass-border"
                        autoComplete="off"
                      />
                      {showSourceSuggestions && sourceLangSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 glass-card border-glass-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {sourceLangSuggestions.map((lang) => (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, source_language: lang});
                                setShowSourceSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-accent/10 transition-colors text-sm"
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Target Language */}
                    <div className="space-y-2 relative">
                      <Label htmlFor="target-lang" className="text-sm font-medium">Target Language *</Label>
                      <Input 
                        id="target-lang" 
                        placeholder="Start typing..."
                        value={formData.target_language}
                        onChange={(e) => handleTargetLanguageChange(e.target.value)}
                        onFocus={() => formData.target_language && setShowTargetSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowTargetSuggestions(false), 200)}
                        className="glass border-glass-border"
                        autoComplete="off"
                      />
                      {showTargetSuggestions && targetLangSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 glass-card border-glass-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {targetLangSuggestions.map((lang) => (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, target_language: lang});
                                setShowTargetSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-accent/10 transition-colors text-sm"
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Deadline
                    </Label>
                    <Input 
                      id="deadline" 
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                      className="glass border-glass-border"
                    />
                  </div>

                  {/* TM File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="tm-file" className="text-sm font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Translation Memory File (TMX)
                    </Label>
                    <div className="relative">
                      <Input 
                        id="tm-file" 
                        type="file"
                        accept=".tmx,.xliff,.xlf"
                        onChange={(e) => setFormData({...formData, tm_file: e.target.files?.[0] || null})}
                        className="glass border-glass-border file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload TMX or XLIFF files to pre-populate translation memory
                    </p>
                  </div>

                  {/* Reference File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="ref-file" className="text-sm font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Reference File
                    </Label>
                    <div className="relative">
                      <Input 
                        id="ref-file" 
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => setFormData({...formData, reference_file: e.target.files?.[0] || null})}
                        className="glass border-glass-border file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload reference documents for context and style guidelines
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                    <textarea
                      id="description" 
                      placeholder="Optional project description..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl glass border-glass-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300 min-h-[100px] resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
                  <button
                    onClick={() => setIsDialogOpen(false)}
                    className="px-6 py-2 rounded-xl glass hover-glow transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProject}
                    className="px-6 py-2 rounded-xl bg-gradient-accent text-white font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                  >
                    Create Project
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {loading ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <div className="w-6 h-6 rounded-full bg-gradient-accent animate-pulse"></div>
            <span className="text-lg font-medium">Loading projects...</span>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-accent/10 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-accent" />
          </div>
          <h3 className="text-subheading font-bold mb-2">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery 
              ? 'Try adjusting your search terms or create a new project.'
              : 'Create your first project to get started with AI-powered translation!'
            }
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsDialogOpen(true)}
              className="px-6 py-3 rounded-xl bg-gradient-accent text-white font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
            >
              Create First Project
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <ProjectTable projects={filteredProjects} />
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <div 
      className="group glass-card p-6 rounded-2xl hover-lift hover-glow transition-all duration-500 cursor-pointer"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Link to={`/projects/${project.id}`} className="block">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-subheading font-bold truncate group-hover:text-accent transition-colors">
              {project.name}
            </h3>
            <p className="text-caption mt-1">
              Created {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted/50">
              <Globe className="w-4 h-4 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">
              {project.source_language} → {project.target_language}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <StatusBadge status={project.status} />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Updated recently</span>
            </div>
          </div>

          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

function ProjectTable({ projects }: { projects: Project[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-glass-border bg-muted/20">
          <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
          <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Languages</th>
          <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
          <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
          <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project, index) => (
          <tr 
            key={project.id} 
            className="border-b border-glass-border/50 last:border-0 hover:bg-accent/5 transition-all duration-300 group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <td className="px-6 py-4">
              <div>
                <Link 
                  to={`/projects/${project.id}`} 
                  className="text-sm font-semibold text-foreground hover:text-accent transition-colors"
                >
                  {project.name}
                </Link>
                {project.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {project.description}
                  </p>
                )}
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">
                  {project.source_language} → {project.target_language}
                </span>
              </div>
            </td>
            <td className="px-6 py-4">
              <StatusBadge status={project.status} />
            </td>
            <td className="px-6 py-4 text-sm text-muted-foreground">
              {new Date(project.created_at).toLocaleDateString()}
            </td>
            <td className="px-6 py-4">
              <Link
                to={`/projects/${project.id}`}
                className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors opacity-0 group-hover:opacity-100"
              >
                Open <ArrowUpRight className="w-3 h-3" />
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/20 text-green-500 border-green-500/30",
    completed: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    review: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  };
  return (
    <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-lg border ${styles[status] || styles.active}`}>
      {status}
    </span>
  );
}
