import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { QualityResult, QualityCheck } from '@/utils/qualityChecker';
import { Progress } from '@/components/ui/progress';

interface QualityPanelProps {
  quality: QualityResult | null;
  compact?: boolean;
}

export function QualityPanel({ quality, compact = false }: QualityPanelProps) {
  if (!quality) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCheckIcon = (type: QualityCheck['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 text-sm font-medium ${getScoreColor(quality.score)}`}>
          {quality.passed ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{quality.score}%</span>
        </div>
        {quality.checks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {quality.checks.length} issue{quality.checks.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Quality Score</h3>
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-bold ${getScoreColor(quality.score)}`}>
              {quality.score}
            </span>
            <span className="text-muted-foreground">/100</span>
          </div>
        </div>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
          quality.passed ? 'bg-green-500/10' : 'bg-red-500/10'
        }`}>
          {quality.passed ? (
            <CheckCircle className="w-8 h-8 text-green-500" />
          ) : (
            <AlertCircle className="w-8 h-8 text-red-500" />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={quality.score} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {quality.passed ? 'Quality check passed' : 'Quality check failed - review needed'}
        </p>
      </div>

      {/* Issues */}
      {quality.checks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Issues Found</h4>
          <div className="space-y-2">
            {quality.checks.map((check, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  check.type === 'error'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : check.type === 'warning'
                    ? 'bg-yellow-500/10 border border-yellow-500/20'
                    : 'bg-blue-500/10 border border-blue-500/20'
                }`}
              >
                {getCheckIcon(check.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    {check.category}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {check.message}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {check.severity}/10
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {quality.suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Suggestions</h4>
          <ul className="space-y-1">
            {quality.suggestions.map((suggestion, idx) => (
              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
