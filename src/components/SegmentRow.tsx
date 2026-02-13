import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { GlossaryTerm } from '@/services/api';
import { highlightGlossaryTerms } from '@/utils/glossaryHighlight';

interface SegmentRowProps {
  segment: {
    id: string;
    source_text: string;
    target_text: string | null;
    status: 'draft' | 'confirmed' | 'reviewed';
  };
  glossaryTerms: GlossaryTerm[];
  isTranslating: boolean;
  isSaving: boolean;
  onTranslate: () => void;
  onSave: () => void;
  onConfirm: () => void;
  onUpdateTarget: (text: string) => void;
}

export function SegmentRow({
  segment,
  glossaryTerms,
  isTranslating,
  isSaving,
  onTranslate,
  onSave,
  onConfirm,
  onUpdateTarget,
}: SegmentRowProps) {
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

  const highlightedSegments = highlightGlossaryTerms(segment.source_text, glossaryTerms);

  return (
    <div className="grid grid-cols-2">
      {/* Source Column */}
      <div className="px-6 py-4 border-r border-border bg-secondary/20">
        <div className="flex items-start justify-between gap-3 mb-2">
          <Badge className={getStatusColor(segment.status)}>
            {segment.status}
          </Badge>
        </div>
        <div className="text-sm text-foreground leading-relaxed">
          <TooltipProvider>
            {highlightedSegments.map((seg, idx) =>
              seg.isGlossaryTerm && seg.term ? (
                <Tooltip key={idx}>
                  <TooltipTrigger asChild>
                    <span className="bg-accent/20 text-accent font-medium px-1 rounded cursor-help">
                      {seg.text}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-semibold">{seg.term.source_term} → {seg.term.target_term}</p>
                      {seg.term.description && (
                        <p className="text-xs text-muted-foreground">{seg.term.description}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span key={idx}>{seg.text}</span>
              )
            )}
          </TooltipProvider>
        </div>
      </div>

      {/* Target Column */}
      <div className="px-6 py-4">
        <Textarea
          value={segment.target_text || ''}
          onChange={(e) => onUpdateTarget(e.target.value)}
          placeholder="Translation will appear here..."
          className="min-h-[80px] mb-3 resize-none"
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onTranslate}
            disabled={isTranslating}
            className="gap-2"
          >
            {isTranslating ? (
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
            onClick={onSave}
            disabled={!segment.target_text || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            Save
          </Button>
          {segment.status === 'draft' && segment.target_text && (
            <Button
              size="sm"
              onClick={onConfirm}
              className="gap-2"
            >
              Confirm
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
