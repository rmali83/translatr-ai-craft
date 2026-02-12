import { Sparkles, RefreshCw, Loader2, Wand2 } from "lucide-react";
import type { TranslationResult, RewriteResult } from "@/hooks/useAITranslation";

interface AISuggestionsPanelProps {
  active: { source: string; target: string } | null;
  aiResult: TranslationResult | null;
  rewriteResult: RewriteResult | null;
  loading: string | null;
  onTranslate: () => void;
  onRewrite: () => void;
  onApply: (text: string) => void;
}

export default function AISuggestionsPanel({
  active,
  aiResult,
  rewriteResult,
  loading,
  onTranslate,
  onRewrite,
  onApply,
}: AISuggestionsPanelProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 ai-glow">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">AI Translation Engine</h3>
      </div>

      {!active ? (
        <p className="text-xs text-muted-foreground">Select a segment to use AI features</p>
      ) : (
        <div className="space-y-3">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onTranslate}
              disabled={loading === "translate"}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading === "translate" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              AI Translate
            </button>
            <button
              onClick={onRewrite}
              disabled={loading === "rewrite" || !active.target}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
            >
              {loading === "rewrite" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3" />
              )}
              Rewrite
            </button>
          </div>

          {/* Translation Results */}
          {aiResult && (
            <div className="space-y-2">
              <div
                className="p-2.5 rounded-lg bg-ai-muted text-sm text-foreground cursor-pointer hover:ring-1 hover:ring-accent transition-all"
                onClick={() => onApply(aiResult.translation)}
              >
                <p className="text-xs text-accent font-medium mb-1">
                  Neural MT · {aiResult.confidence}%
                </p>
                {aiResult.translation}
              </div>
              {aiResult.alternatives?.map((alt, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-secondary text-sm text-foreground cursor-pointer hover:ring-1 hover:ring-border transition-all"
                  onClick={() => onApply(alt.text)}
                >
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Alternative · {alt.confidence}%
                  </p>
                  {alt.text}
                </div>
              ))}
            </div>
          )}

          {/* Rewrite Results */}
          {rewriteResult && (
            <div className="space-y-2">
              <div
                className="p-2.5 rounded-lg bg-ai-muted text-sm text-foreground cursor-pointer hover:ring-1 hover:ring-accent transition-all"
                onClick={() => onApply(rewriteResult.rewritten)}
              >
                <p className="text-xs text-accent font-medium mb-1">
                  <Wand2 className="w-3 h-3 inline mr-1" />
                  AI Rewrite
                </p>
                {rewriteResult.rewritten}
              </div>
              {rewriteResult.changes.length > 0 && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {rewriteResult.changes.map((c, i) => (
                    <p key={i}>• {c}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
