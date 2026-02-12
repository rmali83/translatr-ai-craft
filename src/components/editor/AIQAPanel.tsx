import { AlertTriangle, CheckCircle, Info, Shield, Loader2 } from "lucide-react";
import type { QAResult, RiskResult } from "@/hooks/useAITranslation";

interface AIQAPanelProps {
  qaResult: QAResult | null;
  riskResult: RiskResult | null;
  loading: string | null;
  onRunQA: () => void;
  onRunRisk: () => void;
}

const severityIcon = {
  error: <AlertTriangle className="w-3 h-3 text-destructive" />,
  warning: <AlertTriangle className="w-3 h-3 text-warning" />,
  info: <Info className="w-3 h-3 text-info" />,
};

const riskColors: Record<string, string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-destructive",
  critical: "text-destructive",
};

export default function AIQAPanel({ qaResult, riskResult, loading, onRunQA, onRunRisk }: AIQAPanelProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">AI QA & Risk</h3>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onRunQA}
          disabled={loading === "qa"}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
        >
          {loading === "qa" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
          QA Check
        </button>
        <button
          onClick={onRunRisk}
          disabled={loading === "risk"}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
        >
          {loading === "risk" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
          Risk Score
        </button>
      </div>

      {/* QA Results */}
      {qaResult && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">QA Score</span>
            <span className={`text-sm font-bold ${qaResult.score >= 80 ? "text-success" : qaResult.score >= 50 ? "text-warning" : "text-destructive"}`}>
              {qaResult.score}/100
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${qaResult.score >= 80 ? "bg-success" : qaResult.score >= 50 ? "bg-warning" : "bg-destructive"}`}
              style={{ width: `${qaResult.score}%` }}
            />
          </div>
          {qaResult.issues.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {qaResult.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/50 text-xs">
                  {severityIcon[issue.severity]}
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{issue.message}</span>
                    {issue.suggestion && (
                      <p className="text-muted-foreground mt-0.5">→ {issue.suggestion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {qaResult.issues.length === 0 && (
            <p className="text-xs text-success flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> No issues found
            </p>
          )}
        </div>
      )}

      {/* Risk Results */}
      {riskResult && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Risk Level</span>
            <span className={`text-sm font-bold uppercase ${riskColors[riskResult.riskLevel]}`}>
              {riskResult.riskLevel} ({riskResult.riskScore}/100)
            </span>
          </div>
          {riskResult.factors.length > 0 && (
            <div className="space-y-1">
              {riskResult.factors.map((f, i) => (
                <div key={i} className="text-xs p-1.5 rounded bg-secondary/50">
                  <span className="font-medium text-foreground">{f.factor}</span>
                  <span className="text-muted-foreground"> — {f.detail}</span>
                </div>
              ))}
            </div>
          )}
          {riskResult.recommendation && (
            <p className="text-xs text-accent italic">{riskResult.recommendation}</p>
          )}
        </div>
      )}
    </div>
  );
}
