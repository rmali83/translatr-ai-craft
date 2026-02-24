import { useState, useRef } from 'react';
import { Globe, Upload, FileCode, FileJson, Download, Loader2, CheckCircle, Clock, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { parseHTML, rebuildHTML, TextSegment } from '@/utils/htmlParser';
import { parseI18nJSON, rebuildI18nJSON, I18nSegment } from '@/utils/i18nParser';
import { findBestMatch, calculateSimilarity } from '@/utils/translationMemory';

interface TranslationSegment {
  id: string;
  source_text: string;
  target_text: string;
  status: 'untranslated' | 'tm_match' | 'fuzzy_match' | 'ai_translated' | 'reviewed';
  match_score?: number;
  context?: string;
}

export default function WebsiteTranslationPro() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mode, setMode] = useState<'html' | 'json' | 'url'>('html');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Urdu');
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [segments, setSegments] = useState<TranslationSegment[]>([]);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [projectId, setProjectId] = useState<string | null>(null);

  const commonLanguages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi',
    'Urdu', 'Turkish', 'Dutch', 'Polish', 'Swedish',
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSegments([]);
    }
  };

  const handleProcess = async () => {
    if (mode === 'html' || mode === 'json') {
      if (!file) {
        toast({ title: 'Error', description: 'Please select a file', variant: 'destructive' });
        return;
      }
    } else if (mode === 'url') {
      if (!url.trim()) {
        toast({ title: 'Error', description: 'Please enter a URL', variant: 'destructive' });
        return;
      }
    }

    setLoading(true);
    try {
      let content = '';
      
      if (mode === 'url') {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        content = data.contents;
      } else if (file) {
        content = await file.text();
      }

      setOriginalContent(content);

      let extractedSegments: TranslationSegment[] = [];

      if (mode === 'html' || mode === 'url') {
        const { segments: htmlSegments } = parseHTML(content);
        extractedSegments = htmlSegments.map(seg => ({
          id: seg.id,
          source_text: seg.text,
          target_text: '',
          status: 'untranslated' as const,
          context: seg.context,
        }));
      } else if (mode === 'json') {
        const jsonSegments = parseI18nJSON(content);
        extractedSegments = jsonSegments.map(seg => ({
          id: seg.id,
          source_text: seg.text,
          target_text: '',
          status: 'untranslated' as const,
          context: seg.key,
        }));
      }

      setSegments(extractedSegments);
      
      toast({
        title: 'Success',
        description: `Extracted ${extractedSegments.length} segments`,
      });
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (segments.length === 0) return;

    setTranslating(true);
    setProgress(0);

    try {
      // Create project for this translation
      const project = await api.createProject({
        name: `Website Translation - ${new Date().toLocaleString()}`,
        source_language: sourceLang,
        target_language: targetLang,
        status: 'in_progress',
      });

      setProjectId(project.id);

      const updatedSegments = [...segments];
      const totalSegments = segments.length;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        
        try {
          // Translate using API
          const response = await api.translate({
            source_text: segment.source_text,
            source_lang: sourceLang,
            target_lang: targetLang,
            project_id: project.id,
            use_glossary: true,
          });

          if (response.success) {
            updatedSegments[i] = {
              ...segment,
              target_text: response.data.translated_text,
              status: response.data.source === 'TM' ? 'tm_match' : 'ai_translated',
              match_score: response.data.source === 'TM' ? 100 : undefined,
            };

            // Save to database
            await api.createSegment({
              project_id: project.id,
              source_text: segment.source_text,
              target_text: response.data.translated_text,
              status: 'confirmed',
            });
          }
        } catch (error) {
          console.error('Translation error:', error);
          updatedSegments[i] = {
            ...segment,
            target_text: `[${targetLang}] ${segment.source_text}`,
            status: 'ai_translated',
          };
        }

        setProgress(Math.round(((i + 1) / totalSegments) * 100));
        setSegments([...updatedSegments]);
      }

      toast({
        title: 'Success',
        description: `Translated ${totalSegments} segments`,
      });
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to translate content',
        variant: 'destructive',
      });
    } finally {
      setTranslating(false);
      setProgress(0);
    }
  };

  const handleExport = () => {
    if (segments.length === 0) return;

    const translations = new Map(
      segments.map(seg => [seg.id, seg.target_text])
    );

    let exportContent = '';
    let filename = '';
    let mimeType = '';

    if (mode === 'html' || mode === 'url') {
      const htmlSegments: TextSegment[] = segments.map(seg => ({
        id: seg.id,
        text: seg.source_text,
        context: seg.context || '',
        xpath: '',
        nodeType: 'text',
      }));
      
      exportContent = rebuildHTML(originalContent, htmlSegments, translations);
      filename = 'translated.html';
      mimeType = 'text/html';
    } else if (mode === 'json') {
      const i18nSegments = segments.map(seg => ({
        id: seg.id,
        key: seg.context || '',
        text: seg.source_text,
        context: '',
      }));
      
      exportContent = rebuildI18nJSON(i18nSegments, translations);
      filename = 'translated.json';
      mimeType = 'application/json';
    }

    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'File exported successfully',
    });
  };

  const getStatusBadge = (status: TranslationSegment['status']) => {
    const badges = {
      untranslated: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'Untranslated' },
      tm_match: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'TM Match' },
      fuzzy_match: { icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Fuzzy Match' },
      ai_translated: { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'AI Translated' },
      reviewed: { icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Reviewed' },
    };
    return badges[status];
  };

  const stats = {
    total: segments.length,
    untranslated: segments.filter(s => s.status === 'untranslated').length,
    tmMatch: segments.filter(s => s.status === 'tm_match').length,
    aiTranslated: segments.filter(s => s.status === 'ai_translated').length,
    reviewed: segments.filter(s => s.status === 'reviewed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-accent opacity-5 rounded-3xl blur-3xl"></div>
        <div className="relative glass-card p-8 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                Professional Website Translation
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                HTML, JSON i18n, or URL - with Translation Memory integration
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-20 h-20 rounded-full bg-gradient-accent flex items-center justify-center shadow-2xl">
                <Globe className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="glass-card p-6 rounded-2xl space-y-6">
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="html" className="gap-2">
              <FileCode className="w-4 h-4" />
              HTML File
            </TabsTrigger>
            <TabsTrigger value="json" className="gap-2">
              <FileJson className="w-4 h-4" />
              JSON i18n
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <Globe className="w-4 h-4" />
              Website URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="space-y-4">
            <div className="space-y-2">
              <Label>Upload HTML File</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".html,.htm"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  disabled={loading || translating}
                />
                <Button onClick={handleProcess} disabled={loading || translating || !file}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Process'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div className="space-y-2">
              <Label>Upload JSON i18n File</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  disabled={loading || translating}
                />
                <Button onClick={handleProcess} disabled={loading || translating || !file}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Process'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label>Website URL</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading || translating}
                />
                <Button onClick={handleProcess} disabled={loading || translating || !url}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Extract'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Source Language</Label>
            <Select value={sourceLang} onValueChange={setSourceLang} disabled={loading || translating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {commonLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Language</Label>
            <Select value={targetLang} onValueChange={setTargetLang} disabled={loading || translating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {commonLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {segments.length > 0 && !translating && (
          <div className="flex justify-end gap-2">
            <Button onClick={handleTranslate} className="gap-2">
              <Zap className="w-4 h-4" />
              Translate All
            </Button>
          </div>
        )}

        {translating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Translating with TM & AI...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
      </div>

      {/* Warning */}
      {segments.length > 0 && (
        <div className="glass-card p-4 rounded-xl border-l-4 border-yellow-500">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Note about AI Translation</p>
              <p className="text-xs text-muted-foreground mt-1">
                Currently using mock translations. Add OpenAI credits or configure Gemini API for real translations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {segments.length > 0 && (
        <div className="grid grid-cols-5 gap-4">
          <div className="glass-card p-4 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Untranslated</p>
            <p className="text-2xl font-bold text-gray-500">{stats.untranslated}</p>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">TM Match</p>
            <p className="text-2xl font-bold text-green-500">{stats.tmMatch}</p>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">AI Translated</p>
            <p className="text-2xl font-bold text-blue-500">{stats.aiTranslated}</p>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Reviewed</p>
            <p className="text-2xl font-bold text-purple-500">{stats.reviewed}</p>
          </div>
        </div>
      )}

      {/* Split Screen Translation View */}
      {segments.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="grid grid-cols-2 border-b border-border bg-secondary/50">
            <div className="px-6 py-4 border-r border-border">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Source ({sourceLang})
              </h3>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Target ({targetLang})
              </h3>
              {segments.some(s => s.target_text) && (
                <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
                  <Download className="w-3 h-3" />
                  Export
                </Button>
              )}
            </div>
          </div>

          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {segments.map((segment, index) => {
              const badge = getStatusBadge(segment.status);
              const Icon = badge.icon;
              
              return (
                <div key={segment.id} className="grid grid-cols-2 hover:bg-accent/5 transition-colors">
                  <div className="px-6 py-4 border-r border-border">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground mt-1">{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{segment.source_text}</p>
                        {segment.context && (
                          <p className="text-xs text-muted-foreground mt-1">{segment.context}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          {segment.target_text || <span className="text-muted-foreground italic">Not translated yet</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                          {segment.match_score && (
                            <span className="text-xs text-muted-foreground">
                              {segment.match_score}% match
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Project Link */}
      {projectId && (
        <div className="glass-card p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">
            Translation saved to project.{' '}
            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className="text-accent hover:underline"
            >
              View project →
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
