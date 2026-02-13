import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { supabase } from './supabaseClient';

interface SegmentLock {
  segmentId: string;
  userId: string;
  userName: string;
  projectId: string;
  lockedAt: number;
  timeout?: NodeJS.Timeout;
}

interface UserConnection {
  userId: string;
  userName: string;
  socketId: string;
  projectId: string;
}

class SocketService {
  private io: Server | null = null;
  private segmentLocks: Map<string, SegmentLock> = new Map();
  private userConnections: Map<string, UserConnection> = new Map();
  private readonly LOCK_TIMEOUT = 30000; // 30 seconds of inactivity

  initialize(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      // Handle user joining a project
      socket.on('join-project', async (data: { projectId: string; userId: string; userName: string }) => {
        const { projectId, userId, userName } = data;
        
        // Join the project room
        socket.join(`project:${projectId}`);
        
        // Store user connection
        this.userConnections.set(socket.id, { userId, userName, socketId: socket.id, projectId });
        
        console.log(`User ${userName} joined project ${projectId}`);
        
        // Notify others in the project
        socket.to(`project:${projectId}`).emit('user-joined', {
          userId,
          userName,
          timestamp: Date.now(),
        });

        // Send current locks to the newly joined user (without timeout objects)
        const projectLocks = Array.from(this.segmentLocks.values())
          .filter(lock => lock.projectId === projectId)
          .map(lock => ({
            segmentId: lock.segmentId,
            userId: lock.userId,
            userName: lock.userName,
            projectId: lock.projectId,
            lockedAt: lock.lockedAt,
          }));
        
        socket.emit('current-locks', projectLocks);
      });

      // Handle segment lock request
      socket.on('lock-segment', async (data: { segmentId: string; projectId: string; userId: string; userName: string }) => {
        const { segmentId, projectId, userId, userName } = data;
        
        // Check if segment is already locked
        const existingLock = this.segmentLocks.get(segmentId);
        
        if (existingLock && existingLock.userId !== userId) {
          // Segment is locked by another user
          socket.emit('lock-failed', {
            segmentId,
            lockedBy: existingLock.userName,
            message: `This segment is being edited by ${existingLock.userName}`,
          });
          return;
        }

        // Clear existing timeout if user is re-locking
        if (existingLock?.timeout) {
          clearTimeout(existingLock.timeout);
        }

        // Create lock with auto-release timeout
        const timeout = setTimeout(() => {
          this.releaseSegmentLock(segmentId, projectId);
        }, this.LOCK_TIMEOUT);

        const lock: SegmentLock = {
          segmentId,
          userId,
          userName,
          projectId,
          lockedAt: Date.now(),
          timeout,
        };

        this.segmentLocks.set(segmentId, lock);

        // Notify all users in the project about the lock
        this.io!.to(`project:${projectId}`).emit('segment-locked', {
          segmentId,
          userId,
          userName,
          timestamp: Date.now(),
        });

        console.log(`Segment ${segmentId} locked by ${userName}`);
      });

      // Handle segment unlock request
      socket.on('unlock-segment', (data: { segmentId: string; projectId: string; userId: string }) => {
        const { segmentId, projectId, userId } = data;
        const lock = this.segmentLocks.get(segmentId);

        // Only allow the lock owner to unlock
        if (lock && lock.userId === userId) {
          this.releaseSegmentLock(segmentId, projectId);
        }
      });

      // Handle segment update (typing)
      socket.on('segment-update', (data: { segmentId: string; projectId: string; userId: string; targetText: string }) => {
        const { segmentId, projectId, userId, targetText } = data;
        const lock = this.segmentLocks.get(segmentId);

        // Only broadcast if user has the lock
        if (lock && lock.userId === userId) {
          // Reset the timeout
          if (lock.timeout) {
            clearTimeout(lock.timeout);
          }
          lock.timeout = setTimeout(() => {
            this.releaseSegmentLock(segmentId, projectId);
          }, this.LOCK_TIMEOUT);
          lock.lockedAt = Date.now();

          // Broadcast to others in the project (except sender)
          socket.to(`project:${projectId}`).emit('segment-updated', {
            segmentId,
            userId,
            targetText,
            timestamp: Date.now(),
          });
        }
      });

      // Handle segment save
      socket.on('segment-saved', (data: { segmentId: string; projectId: string; userId: string; targetText: string; status: string }) => {
        const { segmentId, projectId, userId, targetText, status } = data;
        
        // Release the lock
        this.releaseSegmentLock(segmentId, projectId);

        // Broadcast to all users in the project
        this.io!.to(`project:${projectId}`).emit('segment-saved', {
          segmentId,
          userId,
          targetText,
          status,
          timestamp: Date.now(),
        });

        console.log(`Segment ${segmentId} saved by user ${userId}`);
      });

      // Handle heartbeat to keep lock alive
      socket.on('lock-heartbeat', (data: { segmentId: string; userId: string }) => {
        const { segmentId, userId } = data;
        const lock = this.segmentLocks.get(segmentId);

        if (lock && lock.userId === userId) {
          // Reset the timeout
          if (lock.timeout) {
            clearTimeout(lock.timeout);
          }
          lock.timeout = setTimeout(() => {
            this.releaseSegmentLock(segmentId, lock.projectId);
          }, this.LOCK_TIMEOUT);
          lock.lockedAt = Date.now();
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        const userConnection = this.userConnections.get(socket.id);
        
        if (userConnection) {
          const { userId, userName, projectId } = userConnection;
          
          // Release all locks held by this user
          this.segmentLocks.forEach((lock, segmentId) => {
            if (lock.userId === userId) {
              this.releaseSegmentLock(segmentId, projectId);
            }
          });

          // Notify others in the project
          socket.to(`project:${projectId}`).emit('user-left', {
            userId,
            userName,
            timestamp: Date.now(),
          });

          // Remove user connection
          this.userConnections.delete(socket.id);
        }
      });
    });

    console.log('Socket.IO initialized');
  }

  private releaseSegmentLock(segmentId: string, projectId: string) {
    const lock = this.segmentLocks.get(segmentId);
    
    if (lock) {
      // Clear timeout
      if (lock.timeout) {
        clearTimeout(lock.timeout);
      }

      // Remove lock
      this.segmentLocks.delete(segmentId);

      // Notify all users in the project
      this.io!.to(`project:${projectId}`).emit('segment-unlocked', {
        segmentId,
        timestamp: Date.now(),
      });

      console.log(`Segment ${segmentId} unlocked`);
    }
  }

  getIO(): Server | null {
    return this.io;
  }

  // Get all locks for a project
  getProjectLocks(projectId: string): SegmentLock[] {
    return Array.from(this.segmentLocks.values())
      .filter(lock => lock.projectId === projectId);
  }

  // Check if segment is locked
  isSegmentLocked(segmentId: string): boolean {
    return this.segmentLocks.has(segmentId);
  }

  // Get lock info
  getLockInfo(segmentId: string): SegmentLock | undefined {
    return this.segmentLocks.get(segmentId);
  }
}

export const socketService = new SocketService();
