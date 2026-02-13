import { Save, Loader2, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useEffect, useState, useRef } from 'react';
import type { GlossaryTerm } from '@/services/api';
import { highlightGlossaryTerms } from '@/utils/glossaryHighlight';

interface SegmentRowProps {
  segment: {
    id: string;
    project_id: string;
    source_text: string;
    target_text: string | null;
    status: 'draft' | 'confirmed' | 'reviewed';
    quality_score?: number | null;
    quality_violations?: string[] | null;
    quality_suggestions?: string[] | null;
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
  const { canEdit, canReview, user } = useAuth();
  const { lockSegment, unlockSegment, updateSegment, isSegmentLocked, getSegmentLock, sendHeartbeat } = useSocket();
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(segment.target_text || '');
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Check permissions
  const canEditSegment = canEdit(segment.project_id);
  const canReviewSegment = canReview();
  const isReviewerOnly = user?.primary_role === 'reviewer';

  // Check if segment is locked
  const locked = isSegmentLocked(segment.id);
  const lockInfo = getSegmentLock(segment.id);
  const isLockedByMe = lockInfo?.userId === user?.id;
  const isLockedByOther = locked && !isLockedByMe;

  useEffect(() => {
    setLocalText(segment.target_text || '');
  }, [segment.target_text]);

  // Listen for real-time updates from other users
  useEffect(() => {
    const handleSegmentUpdate = (event: CustomEvent) => {
      const { segmentId, userId, targetText } = event.detail;
      if (segmentId === segment.id && userId !== user?.id) {
        setLocalText(targetText);
        onUpdateTarget(targetText);
      }
    };

    const handleSegmentSaved = (event: CustomEvent) => {
      const { segmentId, userId, targetText, status } = event.detail;
      if (segmentId === segment.id && userId !== user?.id) {
        setLocalText(targetText);
        onUpdateTarget(targetText);
        // Trigger a refresh of the segment list
        window.dispatchEvent(new CustomEvent('refresh-segments'));
      }
    };

    window.addEventListener('segment-updated', handleSegmentUpdate as EventListener);
    window.addEventListener('segment-saved', handleSegmentSaved as EventListener);

    return () => {
      window.removeEventListener('segment-updated', handleSegmentUpdate as EventListener);
      window.removeEventListener('segment-saved', handleSegmentSaved as EventListener);
    };
  }, [segment.id, user?.id, onUpdateTarget]);

  // Handle focus - lock segment
  const handleFocus = () => {
    if (canEditSegment && !isReviewerOnly && !locked) {
      lockSegment(segment.id, segment.project_id);
      setIsEditing(true);

      // Start heartbeat to keep lock alive
      heartbeatInterval.current = setInterval(() => {
        sendHeartbeat(segment.id);
      }, 10000); // Send heartbeat every 10 seconds
    }
  };

  // Handle blur - unlock segment
  const handleBlur = () => {
    if (isLockedByMe) {
      unlockSegment(segment.id, segment.project_id);
      setIsEditing(false);

      // Stop heartbeat
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
    }
  };

  // Handle text change
  const handleTextChange = (text: string) => {
    setLocalText(text);
    onUpdateTarget(text);

    // Broadcast update to other users if we have the lock
    if (isLockedByMe) {
      updateSegment(segment.id, segment.project_id, text);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isLockedByMe) {
        unlockSegment(segment.id, segment.project_id);
      }
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, []);

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

  const getQualityColor = (score: number) => {
    if (score >= 95) return 'bg-green-500/15 text-green-600 border-green-500/20';
    if (score >= 85) return 'bg-blue-500/15 text-blue-600 border-blue-500/20';
    if (score >= 70) return 'bg-yellow-500/15 text-yellow-600 border-yellow-500/20';
    return 'bg-red-500/15 text-red-600 border-red-500/20';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 95) return 'Excellent';
    if (score >= 85) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Poor';
  };

  const highlightedSegments = highlightGlossaryTerms(segment.source_text, glossaryTerms);

  return (
    <div className="grid grid-cols-2">
      {/* Source Column */}
      <div className="px-6 py-4 border-r border-border bg-secondary/20">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(segment.status)}>
              {segment.status}
            </Badge>
            {segment.quality_score !== null && segment.quality_score !== undefined && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className={`${getQualityColor(segment.quality_score)} border cursor-help`}>
                      {segment.quality_score}/100
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <div className="space-y-2">
                      <p className="font-semibold">
                        Quality: {getQualityLabel(segment.quality_score)}
                      </p>
                      {segment.quality_violations && segment.quality_violations.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-500">Violations:</p>
                          <ul className="text-xs list-disc list-inside">
                            {segment.quality_violations.map((v, i) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {segment.quality_suggestions && segment.quality_suggestions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-blue-500">Suggestions:</p>
                          <ul className="text-xs list-disc list-inside">
                            {segment.quality_suggestions.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
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
        {isLockedByOther && lockInfo && (
          <Alert className="mb-3 bg-yellow-500/10 border-yellow-500/20">
            <Lock className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium">{lockInfo.userName}</span> is editing this segment
            </AlertDescription>
          </Alert>
        )}
        
        <div className="relative">
          {isLockedByMe && (
            <div className="absolute -top-6 right-0 flex items-center gap-1 text-xs text-accent">
              <User className="w-3 h-3" />
              <span>You are editing</span>
            </div>
          )}
          <Textarea
            value={localText}
            onChange={(e) => handleTextChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isReviewerOnly ? "Read-only (Reviewer role)" : isLockedByOther ? `Locked by ${lockInfo?.userName}` : "Translation will appear here..."}
            className="min-h-[80px] mb-3 resize-none"
            disabled={!canEditSegment || isReviewerOnly || isLockedByOther}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {canEditSegment && !isReviewerOnly && !isLockedByOther && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onTranslate}
                disabled={isTranslating || locked}
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
                disabled={!localText || isSaving || isLockedByOther}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                Save
              </Button>
            </>
          )}
          {canEditSegment && !isReviewerOnly && segment.status === 'draft' && localText && !isLockedByOther && (
            <Button
              size="sm"
              onClick={onConfirm}
              className="gap-2"
            >
              Confirm
            </Button>
          )}
          {canReviewSegment && segment.status === 'confirmed' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onConfirm}
              className="gap-2"
            >
              Mark as Reviewed
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
