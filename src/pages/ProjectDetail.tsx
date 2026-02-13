import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api, type Project, type Segment as ApiSegment } from '@/services/api';

interface Segment extends Omit<ApiSegment, 'status'> {
  status: 'draft' | 'confirmed' | 'reviewed';
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [translatingSegments, setTranslatingSegments] = useState<Set<string>>(new Set());
  const [savingSegments, setSavingSegments] = useState<Set<string>>(new Set());
  const [sourceText, setSourceText] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [projectData, segmentsData] = await Promise.all([
        api.getProject(id),
        api.getSegments(id),
      ]);
      
      setProject(projectData);
      setSegments(segmentsData.map(s => ({ ...s, status: (s.status as any) || 'draft' })));
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

  const handleTranslate = async (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment || !project) return;

    setTranslatingSegments(prev => new Set(prev).add(segmentId));

    try {
      const response = await api.translate({
        source_text: segment.source_text,
        source_lang: project.source_language,
        target_lang: project.target_language,
        project_id: project.id,
        use_glossary: true,
      });

      if (response.success) {
        setSegments(prev =>
          prev.map(s =>
            s.id === segmentId
              ? { ...s, target_text: response.data.translated_text, status: 'draft' }
              : s
          )
        );

        toast({
          title: 'Translated',
          description: `Source: ${response.data.source}${response.data.glossary_terms_used ? ` (${response.data.glossary_terms_used} glossary terms)` : ''}`,
        });
      }
    } catch (error) {
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
    if (!segment) return;

    setSavingSegments(prev => new Set(prev).add(segmentId));

    try {
      await api.updateSegment(segmentId, {
        target_text: segment.target_text,
        status: segment.status,
      });

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
    setSegments(prev =>
      prev.map(s => (s.id === segmentId ? { ...s, status: 'confirmed' } : s))
    );

    try {
      await api.updateSegment(segmentId, { status: 'confirmed' });
    } catch (error) {
      console.error('Failed to update segment status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success/15 text-success';
      case 'reviewed':
        return 'bg-info/15 text-info';
      default:
        return 'bg-warning/15 text-warning';
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
            <h1 className="text-2xl font-bold text-foreground">{project?.name}</h1>
            <p className="text-muted-foreground mt-1">
              {project?.source_language} → {project?.target_language}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)} className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Text
        </Button>
      </div>

      {/* Upload Text Area */}
      {showUpload && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Upload Source Text</h3>
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
          <div className="px-6 py-4 border-r border-border">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Source ({project?.source_language})
            </h3>
          </div>
          <div className="px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Target ({project?.target_language})
            </h3>
          </div>
        </div>

        <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {segments.map((segment) => (
            <div key={segment.id} className="grid grid-cols-2">
              {/* Source Column */}
              <div className="px-6 py-4 border-r border-border bg-secondary/20">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <Badge className={getStatusColor(segment.status)}>
                    {segment.status}
                  </Badge>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {segment.source_text}
                </p>
              </div>

              {/* Target Column */}
              <div className="px-6 py-4">
                <Textarea
                  value={segment.target_text || ''}
                  onChange={(e) => handleUpdateSegment(segment.id, e.target.value)}
                  placeholder="Translation will appear here..."
                  className="min-h-[80px] mb-3 resize-none"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTranslate(segment.id)}
                    disabled={translatingSegments.has(segment.id)}
                    className="gap-2"
                  >
                    {translatingSegments.has(segment.id) ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Translating...
                      </>
                    ) : (
                      'Translate'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveSegment(segment.id)}
                    disabled={!segment.target_text || savingSegments.has(segment.id)}
                    className="gap-2"
                  >
                    {savingSegments.has(segment.id) ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    Save
                  </Button>
                  {segment.status === 'draft' && segment.target_text && (
                    <Button
                      size="sm"
                      onClick={() => handleConfirmSegment(segment.id)}
                      className="gap-2"
                    >
                      Confirm
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {segments.length === 0 && (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <p>No segments yet. Upload some text to get started.</p>
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
    </div>
  );
}
