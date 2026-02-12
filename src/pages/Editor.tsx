import { useState } from "react";
import { mockSegments, type TranslationSegment } from "@/lib/mockData";
import {
  Sparkles,
  Check,
  AlertTriangle,
  ChevronDown,
  Copy,
  RotateCcw,
  BookOpen,
  Database,
  MessageSquare,
  FileText,
} from "lucide-react";

export default function Editor() {
  const [segments, setSegments] = useState<TranslationSegment[]>(mockSegments);
  const [activeSegment, setActiveSegment] = useState<number>(3);

  const handleTargetChange = (id: number, value: string) => {
    setSegments((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, target: value, status: value ? "draft" : "untranslated" } : s
      )
    );
  };

  const confirmSegment = (id: number) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "confirmed" } : s))
    );
  };

  const active = segments.find((s) => s.id === activeSegment);

  return (
    <div className="space-y-4">
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CAT Editor</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Marketing Website v3.2 · EN → DE · {segments.length} segments
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Editor */}
        <div className="lg:col-span-3 bg-card rounded-xl border border-border overflow-hidden">
          {/* Column Headers */}
          <div className="grid grid-cols-[40px_1fr_1fr_80px] border-b border-border bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="px-3 py-2.5">#</div>
            <div className="px-3 py-2.5">Source (EN)</div>
            <div className="px-3 py-2.5">Target (DE)</div>
            <div className="px-3 py-2.5 text-center">Status</div>
          </div>

          {/* Segments */}
          <div className="divide-y divide-border">
            {segments.map((seg) => (
              <div
                key={seg.id}
                className={`grid grid-cols-[40px_1fr_1fr_80px] group cursor-pointer transition-colors ${
                  activeSegment === seg.id ? "bg-accent/5" : "hover:bg-secondary/30"
                }`}
                onClick={() => setActiveSegment(seg.id)}
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
          {/* AI Suggestions */}
          <div className="bg-card rounded-xl border border-border p-4 ai-glow">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">AI Suggestions</h3>
            </div>
            {active ? (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-ai-muted text-sm text-foreground cursor-pointer hover:ring-1 hover:ring-accent transition-all">
                  <p className="text-xs text-accent font-medium mb-1">Neural MT · 94%</p>
                  Sicherheit auf Unternehmensniveau stellt sicher, dass Ihre Daten immer geschützt sind.
                </div>
                <div className="p-2.5 rounded-lg bg-secondary text-sm text-foreground cursor-pointer hover:ring-1 hover:ring-border transition-all">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Alternative · 87%</p>
                  Sicherheit auf Enterprise-Niveau sorgt dafür, dass Ihre Daten stets geschützt bleiben.
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Select a segment to see suggestions</p>
            )}
          </div>

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
              {[
                { en: "Enterprise-grade", de: "auf Unternehmensniveau" },
                { en: "Security", de: "Sicherheit" },
                { en: "Data", de: "Daten" },
              ].map((term, i) => (
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
      </div>
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
