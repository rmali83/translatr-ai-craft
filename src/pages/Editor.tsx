import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { mockSegments, type TranslationSegment } from "@/lib/mockData";
import { api, type Project, type Segment as ApiSegment } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Check,
  AlertTriangle,
  Copy,
  BookOpen,
  Database,
  MessageSquare,
  FileText,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import type { TranslationResult, QAResult, RiskResult, RewriteResult } from "@/hooks/useAITranslation";
import AISuggestionsPanel from "@/components/editor/AISuggestionsPanel";
import AIQAPanel from "@/components/editor/AIQAPanel";
import AIAssistantChat from "@/components/editor/AIAssistantChat";

const GLOSSARY = [
  { en: "Enterprise-grade", de: "auf Unternehmensniveau" },
  { en: "Security", de: "Sicherheit" },
  { en: "Data", de: "Daten" },
  { en: "Platform", de: "Plattform" },
  { en: "Workflow", de: "Arbeitsablauf" },
];

export default function Editor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const projectId = searchParams.get('project');
  
  const [project, setProject] = useState<Project | null>(null);
  const [segments, setSegments] = useState<TranslationSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [activeSegment, setActiveSegment] = useState<number>(3);
  const [showChat, setShowChat] = useState(false);
  const [aiResult, setAiResult] = useState<TranslationResult | null>(null);
  const [rewriteResult, setRewriteResult] = useState<RewriteResult | null>(null);
  const [qaResult, setQaResult] = useState<QAResult | null>(null);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  
  // Load project data
  useEffect(() => {
    if (projectId) {
      loadProjectData();
    } else {
      // Use mock data if no project ID
      setSegments(mockSegments);
      setLoading(false);
    }
  }, [projectId]);
  
  const loadProjectData = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const [projectData, segmentsData] = await Promise.all([
        api.getProject(projectId),
        api.getSegments(projectId),
      ]);
      
      setProject(projectData);
      
      // Convert API segments to TranslationSegment format
      const convertedSegments: TranslationSegment[] = segmentsData.map((seg, index) => ({
        id: index + 1,
        source: seg.source_text,
        target: seg.target_text || '',
        status: seg.status === 'confirmed' ? 'confirmed' : seg.target_text ? 'draft' : 'untranslated',
        tmMatch: undefined,
        aiConfidence: undefined,
        _apiId: seg.id, // Store the real API ID
      }));
      
      setSegments(convertedSegments);
      if (convertedSegments.length > 0) {
        setActiveSegment(1);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project data',
        variant: 'destructive',
      });
      // Fallback to mock data
      setSegments(mockSegments);
    } finally {
      setLoading(false);
    }
  };
  
  const active = segments.find((s) => s.id === activeSegment);

  const handleTargetChange = (id: number, value: string) => {
    setSegments((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, target: value, status: value ? "draft" : "untranslated" } : s
      )
    );
  };

  const confirmSegment = async (id: number) => {
    const segment = segments.find(s => s.id === id);
    if (!segment) return;
    
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "confirmed" } : s))
    );
    
    // Save to database if we have a real project
    if (projectId && segment._apiId) {
      try {
        await api.updateSegment(segment._apiId, {
          target_text: segment.target,
          status: 'confirmed',
        });
        toast({
          title: 'Segment confirmed',
          description: 'Segment saved and confirmed successfully',
        });
      } catch (error) {
        console.error('Failed to save segment:', error);
        toast({
          title: 'Error',
          description: 'Failed to save segment',
          variant: 'destructive',
        });
      }
    }
  };

  const applyTranslation = (text: string) => {
    if (!active) return;
    handleTargetChange(active.id, text);
    toast({ title: "Translation applied", description: "AI suggestion applied to segment." });
  };

  const handleTranslate = async () => {
    if (!active || !project) return;
    setRewriteResult(null);
    setAiResult(null);
    
    try {
      setTranslating(true);
      
      // Use the real translation API
      const response = await api.translate({
        source_text: active.source,
        source_lang: project.source_language,
        target_lang: project.target_language,
        project_id: project.id,
        use_glossary: true,
      });
      
      if (response.success) {
        // Update the segment with translation
        handleTargetChange(active.id, response.data.translated_text);
        
        // Show success message
        toast({
          title: 'Translation Complete',
          description: `Source: ${response.data.source}${response.data.glossary_terms_used ? ` (${response.data.glossary_terms_used} glossary terms)` : ''}`,
        });
        
        // Set AI result for display
        setAiResult({
          translation: response.data.translated_text,
          confidence: 85,
          alternatives: [],
        });
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: 'Translation Failed',
        description: 'Could not translate. Please check your API configuration.',
        variant: 'destructive',
      });
    } finally {
      setTranslating(false);
    }
  };

  const handleRewrite = async () => {
    toast({
      title: 'Feature Coming Soon',
      description: 'AI Rewrite feature will be available in the next update.',
    });
  };

  const handleQA = async () => {
    toast({
      title: 'Feature Coming Soon', 
      description: 'AI QA Check feature will be available in the next update.',
    });
  };

  const handleRisk = async () => {
    toast({
      title: 'Feature Coming Soon',
      description: 'Risk Scoring feature will be available in the next update.',
    });
  };

  // Reset AI results when switching segments
  const selectSegment = (id: number) => {
    setActiveSegment(id);
    setAiResult(null);
    setRewriteResult(null);
    setQaResult(null);
    setRiskResult(null);
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-gradient-accent animate-pulse mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {projectId && (
            <button
              onClick={() => navigate('/projects')}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="Back to Projects"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">CAT Editor</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {project ? (
                `${project.name} · ${project.source_language} → ${project.target_language} · ${segments.length} segments`
              ) : (
                `Marketing Website v3.2 · EN → DE · ${segments.length} segments`
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {projectId && (
            <button
              onClick={() => navigate(`/projects/${projectId}/statistics`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">Statistics</span>
            </button>
          )}
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            {segments.filter((s) => s.status === "confirmed").length} confirmed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-warning" />
            {segments.filter((s) => s.status === "draft").length} draft
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            {segments.filter((s) => s.status === "untranslated").length} untranslated
          </span>
          <button
            onClick={() => setShowChat((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showChat
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            <Sparkles className="w-3 h-3" /> AI Assistant
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Editor */}
        <div className={`${showChat ? "lg:col-span-2" : "lg:col-span-3"} bg-card rounded-xl border border-border overflow-hidden`}>
          <div className="grid grid-cols-[40px_1fr_1fr_80px] border-b border-border bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="px-3 py-2.5">#</div>
            <div className="px-3 py-2.5">Source (EN)</div>
            <div className="px-3 py-2.5">Target (DE)</div>
            <div className="px-3 py-2.5 text-center">Status</div>
          </div>
          <div className="divide-y divide-border">
            {segments.map((seg) => (
              <div
                key={seg.id}
                className={`grid grid-cols-[40px_1fr_1fr_80px] group cursor-pointer transition-colors ${
                  activeSegment === seg.id ? "bg-accent/5" : "hover:bg-secondary/30"
                }`}
                onClick={() => selectSegment(seg.id)}
              >
                <div className="px-3 py-3 text-xs text-muted-foreground flex items-start pt-4">
                  {seg.id}
                </div>
                <div className="px-3 py-3 text-sm text-foreground border-r border-border">
                  {seg.source}
                  {seg.tmMatch && (
                    <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-semibold text-accent">
                      <Database className="w-3 h-3" /> {seg.tmMatch}%
                    </span>
                  )}
                </div>
                <div className="px-3 py-3">
                  {activeSegment === seg.id ? (
                    <textarea
                      className="w-full text-sm text-foreground bg-transparent resize-none focus:outline-none min-h-[60px]"
                      value={seg.target}
                      onChange={(e) => handleTargetChange(seg.id, e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <p className={`text-sm ${seg.target ? "text-foreground" : "text-muted-foreground italic"}`}>
                      {seg.target || "Untranslated"}
                    </p>
                  )}
                  {seg.aiConfidence && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-accent mt-1">
                      <Sparkles className="w-3 h-3" /> AI {seg.aiConfidence}%
                    </span>
                  )}
                </div>
                <div className="px-3 py-3 flex items-start justify-center pt-4">
                  <SegmentStatus status={seg.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* AI Suggestions Panel */}
          <AISuggestionsPanel
            active={active ? { source: active.source, target: active.target } : null}
            aiResult={aiResult}
            rewriteResult={rewriteResult}
            loading={translating}
            onTranslate={handleTranslate}
            onRewrite={handleRewrite}
            onApply={applyTranslation}
          />

          {/* AI QA & Risk Panel */}
          {active?.target && (
            <AIQAPanel
              qaResult={qaResult}
              riskResult={riskResult}
              loading={false}
              onRunQA={handleQA}
              onRunRisk={handleRisk}
            />
          )}

          {/* TM Matches */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">TM Matches</h3>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-secondary text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-success">100% match</span>
                  <button className="text-xs text-accent hover:underline">Apply</button>
                </div>
                <p className="text-xs text-muted-foreground">Unternehmensweite Sicherheit gewährleistet den Schutz Ihrer Daten.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-warning">62% match</span>
                  <button className="text-xs text-accent hover:underline">Apply</button>
                </div>
                <p className="text-xs text-muted-foreground">Datensicherheit auf höchstem Niveau für Ihr Unternehmen.</p>
              </div>
            </div>
          </div>

          {/* Glossary */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Glossary</h3>
            </div>
            <div className="space-y-1.5">
              {GLOSSARY.map((term, i) => (
                <div key={i} className="flex justify-between text-xs py-1">
                  <span className="text-muted-foreground">{term.en}</span>
                  <span className="text-foreground font-medium">{term.de}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {active && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => confirmSegment(activeSegment)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Check className="w-4 h-4" /> Confirm Segment
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                <Copy className="w-4 h-4" /> Copy Source
              </button>
            </div>
          )}
        </div>

        {/* AI Assistant Chat */}
        {showChat && (
          <div className="lg:col-span-1">
            <AIAssistantChat
              context={active ? { source: active.source, target: active.target } : undefined}
              onClose={() => setShowChat(false)}
            />
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}

function SegmentStatus({ status }: { status: string }) {
  const config: Record<string, { icon: React.ElementType; color: string }> = {
    confirmed: { icon: Check, color: "text-success" },
    draft: { icon: FileText, color: "text-warning" },
    untranslated: { icon: AlertTriangle, color: "text-muted-foreground" },
    review: { icon: MessageSquare, color: "text-info" },
  };
  const { icon: Icon, color } = config[status] || config.untranslated;
  return <Icon className={`w-4 h-4 ${color}`} />;
}
