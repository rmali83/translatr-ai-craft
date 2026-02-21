import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SegmentLock {
  segmentId: string;
  userId: string;
  userName: string;
  projectId: string;
  lockedAt: number;
}

interface SocketContextType {
  socket: RealtimeChannel | null;
  connected: boolean;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  lockSegment: (segmentId: string, projectId: string) => void;
  unlockSegment: (segmentId: string, projectId: string) => void;
  updateSegment: (segmentId: string, projectId: string, targetText: string) => void;
  saveSegment: (segmentId: string, projectId: string, targetText: string, status: string) => void;
  sendHeartbeat: (segmentId: string) => void;
  segmentLocks: Map<string, SegmentLock>;
  isSegmentLocked: (segmentId: string) => boolean;
  getSegmentLock: (segmentId: string) => SegmentLock | undefined;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [connected, setConnected] = useState(false);
  const [segmentLocks, setSegmentLocks] = useState<Map<string, SegmentLock>>(new Map());
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    console.log('✅ Supabase Realtime initialized');
    setConnected(true);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  const joinProject = (projectId: string) => {
    if (!user) return;

    // Leave previous project if any
    if (channel) {
      supabase.removeChannel(channel);
    }

    console.log('🔌 Joining project:', projectId);

    // Create new channel for this project
    const newChannel = supabase.channel(`project:${projectId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: user.id },
      },
    });

    // Track presence (who's online)
    newChannel
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState();
        console.log('👥 Users online:', Object.keys(state).length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined:', key);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', key);
      })
      // Listen for segment locks
      .on('broadcast', { event: 'segment-locked' }, ({ payload }) => {
        console.log('🔒 Segment locked:', payload);
        setSegmentLocks(prev => new Map(prev).set(payload.segmentId, payload as SegmentLock));
      })
      // Listen for segment unlocks
      .on('broadcast', { event: 'segment-unlocked' }, ({ payload }) => {
        console.log('🔓 Segment unlocked:', payload.segmentId);
        setSegmentLocks(prev => {
          const next = new Map(prev);
          next.delete(payload.segmentId);
          return next;
        });
      })
      // Listen for segment updates
      .on('broadcast', { event: 'segment-updated' }, ({ payload }) => {
        console.log('📝 Segment updated:', payload);
        window.dispatchEvent(new CustomEvent('segment-updated', { detail: payload }));
      })
      // Listen for segment saves
      .on('broadcast', { event: 'segment-saved' }, ({ payload }) => {
        console.log('💾 Segment saved:', payload);
        window.dispatchEvent(new CustomEvent('segment-saved', { detail: payload }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to project channel');
          // Track presence
          await newChannel.track({
            userId: user.id,
            userName: user.name || user.email,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(newChannel);
    setCurrentProjectId(projectId);
  };

  const leaveProject = (projectId: string) => {
    if (channel) {
      console.log('👋 Leaving project:', projectId);
      supabase.removeChannel(channel);
      setChannel(null);
      setCurrentProjectId(null);
      setSegmentLocks(new Map());
    }
  };

  const lockSegment = (segmentId: string, projectId: string) => {
    if (channel && user) {
      console.log('🔒 Locking segment:', segmentId);
      channel.send({
        type: 'broadcast',
        event: 'segment-locked',
        payload: {
          segmentId,
          projectId,
          userId: user.id,
          userName: user.name || user.email,
          lockedAt: Date.now(),
        },
      });
    }
  };

  const unlockSegment = (segmentId: string, projectId: string) => {
    if (channel && user) {
      console.log('🔓 Unlocking segment:', segmentId);
      channel.send({
        type: 'broadcast',
        event: 'segment-unlocked',
        payload: {
          segmentId,
          projectId,
          userId: user.id,
        },
      });
    }
  };

  const updateSegment = (segmentId: string, projectId: string, targetText: string) => {
    if (channel && user) {
      channel.send({
        type: 'broadcast',
        event: 'segment-updated',
        payload: {
          segmentId,
          projectId,
          userId: user.id,
          targetText,
        },
      });
    }
  };

  const saveSegment = (segmentId: string, projectId: string, targetText: string, status: string) => {
    if (channel && user) {
      console.log('💾 Saving segment:', segmentId);
      channel.send({
        type: 'broadcast',
        event: 'segment-saved',
        payload: {
          segmentId,
          projectId,
          userId: user.id,
          targetText,
          status,
        },
      });
    }
  };

  const sendHeartbeat = (segmentId: string) => {
    if (channel && user) {
      channel.send({
        type: 'broadcast',
        event: 'lock-heartbeat',
        payload: {
          segmentId,
          userId: user.id,
        },
      });
    }
  };

  const isSegmentLocked = (segmentId: string): boolean => {
    return segmentLocks.has(segmentId);
  };

  const getSegmentLock = (segmentId: string): SegmentLock | undefined => {
    return segmentLocks.get(segmentId);
  };

  return (
    <SocketContext.Provider
      value={{
        socket: channel,
        connected,
        joinProject,
        leaveProject,
        lockSegment,
        unlockSegment,
        updateSegment,
        saveSegment,
        sendHeartbeat,
        segmentLocks,
        isSegmentLocked,
        getSegmentLock,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
