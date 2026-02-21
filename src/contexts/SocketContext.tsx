import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SegmentLock {
  segmentId: string;
  userId: string;
  userName: string;
  projectId: string;
  lockedAt: number;
}

interface SocketContextType {
  socket: Socket | null;
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

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [segmentLocks, setSegmentLocks] = useState<Map<string, SegmentLock>>(new Map());
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Socket.IO temporarily disabled - migrating to Supabase Realtime
    console.log('Socket.IO disabled - using Supabase Realtime instead');
    setConnected(false);
    
    // TODO: Implement Supabase Realtime for collaboration features
    
    /*
    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    // Listen for segment locks
    newSocket.on('segment-locked', (data: SegmentLock) => {
      console.log('Segment locked:', data);
      setSegmentLocks(prev => new Map(prev).set(data.segmentId, data));
    });

    // Listen for segment unlocks
    newSocket.on('segment-unlocked', (data: { segmentId: string }) => {
      console.log('Segment unlocked:', data.segmentId);
      setSegmentLocks(prev => {
        const next = new Map(prev);
        next.delete(data.segmentId);
        return next;
      });
    });

    // Listen for lock failures
    newSocket.on('lock-failed', (data: { segmentId: string; lockedBy: string; message: string }) => {
      console.log('Lock failed:', data);
      // You can emit a custom event or use a toast notification here
    });

    // Listen for current locks when joining a project
    newSocket.on('current-locks', (locks: SegmentLock[]) => {
      console.log('Received current locks:', locks);
      const locksMap = new Map<string, SegmentLock>();
      locks.forEach(lock => locksMap.set(lock.segmentId, lock));
      setSegmentLocks(locksMap);
    });

    // Listen for segment updates from other users
    newSocket.on('segment-updated', (data: { segmentId: string; userId: string; targetText: string }) => {
      // Emit custom event that components can listen to
      window.dispatchEvent(new CustomEvent('segment-updated', { detail: data }));
    });

    // Listen for segment saves from other users
    newSocket.on('segment-saved', (data: { segmentId: string; userId: string; targetText: string; status: string }) => {
      // Emit custom event that components can listen to
      window.dispatchEvent(new CustomEvent('segment-saved', { detail: data }));
    });

    // Listen for user joined
    newSocket.on('user-joined', (data: { userId: string; userName: string }) => {
      console.log('User joined:', data.userName);
    });

    // Listen for user left
    newSocket.on('user-left', (data: { userId: string; userName: string }) => {
      console.log('User left:', data.userName);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
    */
  }, [user]);

  const joinProject = (projectId: string) => {
    if (socket && user) {
      console.log('Joining project:', projectId);
      socket.emit('join-project', {
        projectId,
        userId: user.id,
        userName: user.name,
      });
      setCurrentProjectId(projectId);
    }
  };

  const leaveProject = (projectId: string) => {
    if (socket) {
      console.log('Leaving project:', projectId);
      socket.emit('leave-project', { projectId });
      setCurrentProjectId(null);
      setSegmentLocks(new Map());
    }
  };

  const lockSegment = (segmentId: string, projectId: string) => {
    if (socket && user) {
      console.log('Locking segment:', segmentId);
      socket.emit('lock-segment', {
        segmentId,
        projectId,
        userId: user.id,
        userName: user.name,
      });
    }
  };

  const unlockSegment = (segmentId: string, projectId: string) => {
    if (socket && user) {
      console.log('Unlocking segment:', segmentId);
      socket.emit('unlock-segment', {
        segmentId,
        projectId,
        userId: user.id,
      });
    }
  };

  const updateSegment = (segmentId: string, projectId: string, targetText: string) => {
    if (socket && user) {
      socket.emit('segment-update', {
        segmentId,
        projectId,
        userId: user.id,
        targetText,
      });
    }
  };

  const saveSegment = (segmentId: string, projectId: string, targetText: string, status: string) => {
    if (socket && user) {
      console.log('Saving segment:', segmentId);
      socket.emit('segment-saved', {
        segmentId,
        projectId,
        userId: user.id,
        targetText,
        status,
      });
    }
  };

  const sendHeartbeat = (segmentId: string) => {
    if (socket && user) {
      socket.emit('lock-heartbeat', {
        segmentId,
        userId: user.id,
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
        socket,
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
