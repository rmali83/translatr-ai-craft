import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2, CheckCheck, Filter, Download, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { api, type Project, type Segment as ApiSegment, type GlossaryTerm } from '@/services/api';
import { SegmentRow } from '@/components/SegmentRow';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { downloadJSON, downloadCSV } from '@/utils/fileExporter';
import type { ParsedSegment } from '@/utils/fileParser';

interface Segment extends Omit<ApiSegment, 'status'> {
  status: 'draft' | 'confirmed' | 'reviewed';
  quality_score?: number | null;
  quality_violations?: string[] | null;
  quality_suggestions?: string[] | null;
}

const PROJECT_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500/15 text-gray-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500/15 text-blue-500' },
  { value: 'review', label: 'Review', color: 'bg-yellow-500/15 text-yellow-500' },
  { value: 'approved', label: 'Approved', color: 'bg-green-500/15 text-green-500' },
  { value: 'completed', label: 'Completed', color: 'bg-purple-500/15 text-purple-500' },
];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canEdit, isAdmin, user } = useAuth();
  const { joinProject, leaveProject, saveSegment, connected, socket } = useSocket();
  
  const [project, setProject] = useState<Project | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [filteredSegments, setFilteredSegments] = useState<Segment[]>([]);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [translatingSegments, setTranslatingSegments] = useState<Set<string>>(new Set());
  const [savingSegments, setSavingSegments] = useState<Set<string>>(new Set());
  const [sourceText, setSourceText] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Check permissions
  const canEditProject = canEdit(id);
  const canManageProject = isAdmin() || user?.primary_role === 'project_manager';

  // Join project room when component mounts
  useEffect(() => {
    if (id && connected) {
      joinProject(id);
      
      return () => {
        leaveProject(id);
      };
    }
  }, [id, connected, joinProject, leaveProject]);

  // Listen for segment refresh events
  useEffect(() => {
    const handleRefresh = () => {
      if (id) {
        loadProjectData();
      }
    };

    window.addEventListener('refresh-segments', handleRefresh);
    return () => window.removeEventListener('refresh-segments', handleRefresh);
  }, [id]);

  // Listen for socket events and update segments
  useEffect(() => {
    if (!socket || !connected) return;

    const handleSegmentSaved = (data: any) => {
      setSegments(prev =>
        prev.map(s =>
          s.id === data.segmentId
            ? { ...s, target_text: data.targetText, status: data.status as any }
            : s
        )
      );
    };

    socket.on('segment-saved', handleSegmentSaved);

    return () => {
      socket.off('segment-saved', handleSegmentSaved);
    };
  }, [socket, connected]);

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  useEffect(() => {
    filterSegments();
  }, [segments, statusFilter]);

  const loadProjectData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [projectData, segmentsData, workflowData] = await Promise.all([
        api.getProject(id),
        api.getSegments(id),
        api.getProjectWorkflowStatus(id),
      ]);
      
      setProject(projectData);
      setSegments(segmentsData.map(s => ({ ...s, status: (s.status as any) || 'draft' })));
      setWorkflowStatus(workflowData);

      // Load glossary terms for the language pair
      if (projectData.source_language && projectData.target_language) {
        const languagePair = `${projectData.source_language}-${projectData.target_language}`;
        const glossary = await api.getGlossaryTerms(languagePair);
        setGlossaryTerms(glossary);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSegments = () => {
    if (statusFilter === 'all') {
      setFilteredSegments(segments);
    } else {
      setFilteredSegments(segments.filter(s => s.status === statusFilter));
    }
  };

  const handleConfirmAll = async () => {
    if (!id) return;

    try {
      const result = await api.confirmAllSegments(id);
      
      toast({
        title: 'Success',
        description: result.message,
      });

      await loadProjectData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to confirm all segments',
        variant: 'destructive',
      });
    }
  };

  const handleMoveToReview = async () => {
    if (!id || !project) return;

    try {
      await api.updateProjectStatus(id, 'review');
      
      toast({
        title: 'Success',
        description: 'Project moved to review',
      });

      setShowReviewDialog(false);
      await loadProjectData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to move project to review',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;

    if (newStatus === 'review' && !workflowStatus?.can_move_to_review) {
      setShowReviewDialog(true);
      return;
    }

    try {
      await api.updateProjectStatus(id, newStatus);
      
      toast({
        title: 'Success',
        description: 'Project status updated',
      });

      await loadProjectData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update project status',
        variant: 'destructive',
      });
    }
  };

  const getProjectStatusBadge = (status: string) => {
    const statusConfig = PROJECT_STATUSES.find(s => s.value === status);
    return statusConfig || PROJECT_STATUSES[0];
  };

  const splitIntoSentences = (text: string): string[] => {
    // Split by sentence boundaries (., !, ?) followed by space or newline
    return text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const handleUploadText = async () => {
    if (!sourceText.trim() || !id) {
      toast({
        title: 'Error',
        description: 'Please enter some text to upload',
        variant: 'destructive',
      });
      return;
    }

    try {
      const sentences = splitIntoSentences(sourceText);
      
      // Create segments in backend
      const newSegments = await Promise.all(
        sentences.map(sentence =>
          api.createSegment({
            project_id: id,
            source_text: sentence,
            target_text: null,
            status: 'draft',
          })
        )
      );

      setSegments([...segments, ...newSegments.map(s => ({ ...s, status: 'draft' as const }))]);
      setSourceText('');
      setShowUpload(false);

      toast({
        title: 'Success',
        description: `Added ${sentences.length} segments`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create segments',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (parsedSegments: ParsedSegment[]) => {
    if (!id) return;

    try {
      // Create segments in backend
      const newSegments = await Promise.all(
        parsedSegments.map(segment =>
          api.createSegment({
            project_id: id,
            source_text: segment.source_text,
            target_text: segment.target_text || null,
            status: 'draft',
          })
        )
      );

      setSegments([...segments, ...newSegments.map(s => ({ ...s, status: 'draft' as const }))]);

      toast({
        title: 'Success',
        description: `Imported ${parsedSegments.length} segments from file`,
      });

      await loadProjectData();
    } catch (error) {
      throw new Error('Failed to import segments');
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    if (!project || segments.length === 0) {
      toast({
        title: 'Error',
        description: 'No segments to export',
        variant: 'destructive',
      });
      return;
    }

    const exportSegments = segments.map(s => ({
      source_text: s.source_text,
      target_text: s.target_text,
      status: s.status,
    }));

    if (format === 'json') {
      downloadJSON(exportSegments, project.name);
    } else {
      downloadCSV(exportSegments, project.name);
    }

    toast({
      title: 'Success',
      description: `Exported ${segments.length} segments as ${format.toUpperCase()}`,
    });
  };

  const handleTranslate = async (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment || !project) return;

    console.log('🔄 Starting translation for segment:', segmentId);
    console.log('📝 Source text:', segment.source_text);
    console.log('🌍 Languages:', project.source_language, '→', project.target_language);

    setTranslatingSegments(prev => new Set(prev).add(segmentId));

    try {
      const translateRequest = {
        source_text: segment.source_text,
        source_lang: project.source_language,
        target_lang: project.target_language,
        project_id: project.id,
        use_glossary: true,
      };
      
      console.log('📤 Sending translation request:', translateRequest);
      
      const response = await api.translate(translateRequest);
      
      console.log('📥 Translation response:', response);

      if (response.success) {
        console.log('✅ Translation successful:', response.data.translated_text);
        
        setSegments(prev =>
          prev.map(s =>
            s.id === segmentId
              ? { 
                  ...s, 
                  target_text: response.data.translated_text, 
                  status: 'draft',
                  quality_score: response.data.quality_score,
                  quality_violations: response.data.quality_violations,
                  quality_suggestions: response.data.quality_suggestions,
                }
              : s
          )
        );

        const qualityMessage = response.data.quality_score 
          ? ` (Quality: ${response.data.quality_score}/100${response.data.quality_passed ? ' ✓' : ' - Review needed'})`
          : '';

        toast({
          title: 'Translated',
          description: `Source: ${response.data.source}${response.data.glossary_terms_used ? ` (${response.data.glossary_terms_used} glossary terms)` : ''}${qualityMessage}`,
        });
      }
    } catch (error) {
      console.error('❌ Translation error:', error);
      toast({
        title: 'Translation failed',
        description: 'Could not connect to translation service',
        variant: 'destructive',
      });
    } finally {
      setTranslatingSegments(prev => {
        const next = new Set(prev);
        next.delete(segmentId);
        return next;
      });
    }
  };

  const handleUpdateSegment = (segmentId: string, targetText: string) => {
    setSegments(prev =>
      prev.map(s => (s.id === segmentId ? { ...s, target_text: targetText } : s))
    );
  };

  const handleSaveSegment = async (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment || !id) return;

    setSavingSegments(prev => new Set(prev).add(segmentId));

    try {
      await api.updateSegment(segmentId, {
        target_text: segment.target_text,
        status: segment.status,
        quality_score: segment.quality_score,
        quality_violations: segment.quality_violations,
        quality_suggestions: segment.quality_suggestions,
      });

      // Broadcast save to other users via WebSocket
      saveSegment(segmentId, id, segment.target_text || '', segment.status);

      toast({
        title: 'Saved',
        description: 'Segment saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save segment',
        variant: 'destructive',
      });
    } finally {
      setSavingSegments(prev => {
        const next = new Set(prev);
        next.delete(segmentId);
        return next;
      });
    }
  };

  const handleConfirmSegment = async (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    setSegments(prev =>
      prev.map(s => (s.id === segmentId ? { ...s, status: 'confirmed' } : s))
    );

    try {
      await api.updateSegment(segmentId, { status: 'confirmed' });
      
      // Emit socket event to notify other users
      if (socket && projectId) {
        socket.emit('segment-saved', {
          segmentId,
          projectId,
          userId: user?.id,
          targetText: segment.target_text,
          status: 'confirmed',
        });
      }
    } catch (error) {
      console.error('Failed to update segment status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/projects')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{project?.name}</h1>
              <Badge className={getProjectStatusBadge(project?.status || 'draft').color}>
                {getProjectStatusBadge(project?.status || 'draft').label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {project?.source_language} → {project?.target_language}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManageProject && (
            <Select value={project?.status || 'draft'} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canEditProject && (
            <>
              <Button onClick={() => setShowFileUpload(true)} variant="outline" className="gap-2">
                <FileUp className="w-4 h-4" />
                Import File
              </Button>
              <Button onClick={() => setShowUpload(!showUpload)} className="gap-2">
                <Upload className="w-4 h-4" />
                Add Text
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Workflow Actions */}
      {workflowStatus && (
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Segment Status</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm">
                    <span className="font-semibold text-warning">{workflowStatus.segment_counts.draft}</span> Draft
                  </span>
                  <span className="text-sm">
                    <span className="font-semibold text-success">{workflowStatus.segment_counts.confirmed}</span> Confirmed
                  </span>
                  <span className="text-sm">
                    <span className="font-semibold text-info">{workflowStatus.segment_counts.reviewed}</span> Reviewed
                  </span>
                </div>
              </div>
              {canEditProject && !workflowStatus.all_confirmed && workflowStatus.segment_counts.draft > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConfirmAll}
                  className="gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  Confirm All ({workflowStatus.segment_counts.draft})
                </Button>
              )}
            </div>
            {workflowStatus.all_confirmed && (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCheck className="w-4 h-4" />
                All segments confirmed
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Text Area */}
      {showUpload && canEditProject && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Add Source Text</h3>
          <Textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Paste your source text here. It will be automatically split into segments..."
            className="min-h-[200px] mb-4"
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadText}>
              Add Segments
            </Button>
          </div>
        </div>
      )}

      {/* Segments Editor */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-2 border-b border-border bg-secondary/50">
          <div className="px-6 py-4 border-r border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Source ({project?.source_language})
            </h3>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Target ({project?.target_language})
            </h3>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {filteredSegments.map((segment) => (
            <SegmentRow
              key={segment.id}
              segment={segment}
              glossaryTerms={glossaryTerms}
              isTranslating={translatingSegments.has(segment.id)}
              isSaving={savingSegments.has(segment.id)}
              targetLanguage={project?.target_language}
              onTranslate={() => handleTranslate(segment.id)}
              onSave={() => handleSaveSegment(segment.id)}
              onConfirm={() => handleConfirmSegment(segment.id)}
              onUpdateTarget={(text) => handleUpdateSegment(segment.id, text)}
            />
          ))}
        </div>

        {filteredSegments.length === 0 && (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <p>
              {statusFilter === 'all'
                ? 'No segments yet. Upload some text to get started.'
                : `No ${statusFilter} segments found.`}
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      {segments.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Segments</p>
            <p className="text-2xl font-bold text-foreground">{segments.length}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Draft</p>
            <p className="text-2xl font-bold text-warning">
              {segments.filter(s => s.status === 'draft').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Confirmed</p>
            <p className="text-2xl font-bold text-success">
              {segments.filter(s => s.status === 'confirmed').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="text-2xl font-bold text-accent">
              {Math.round((segments.filter(s => s.target_text).length / segments.length) * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* Review Dialog */}
      <AlertDialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cannot Move to Review</AlertDialogTitle>
            <AlertDialogDescription>
              All segments must be confirmed before moving the project to review status.
              <br /><br />
              Current status: {workflowStatus?.segment_counts.draft} draft segments remaining.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAll}>
              Confirm All Segments
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={showFileUpload}
        onOpenChange={setShowFileUpload}
        onUpload={handleFileUpload}
      />
    </div>
  );
}
