# Real-Time Collaboration with WebSockets

## Overview

The application implements real-time collaboration using Socket.IO, allowing multiple users to work on the same project simultaneously with live updates and segment locking to prevent editing conflicts.

## Features

### 1. Real-Time Updates
- See changes made by other users instantly
- Live typing indicators
- Automatic segment refresh when others save

### 2. Segment Locking
- Automatic lock when user focuses on a segment
- Visual indicator showing who is editing
- Prevents concurrent editing conflicts
- Auto-release after 30 seconds of inactivity

### 3. Presence Awareness
- See when users join/leave the project
- Know who is currently editing which segment
- Real-time collaboration indicators

## Architecture

### Backend (Socket.IO Server)

#### Location
`server/services/socketService.ts`

#### Key Components

1. **SegmentLock Management**
   - Tracks which user has locked which segment
   - Automatic timeout after 30 seconds of inactivity
   - Heartbeat mechanism to keep locks alive

2. **User Connection Tracking**
   - Maps socket connections to users and projects
   - Handles disconnections gracefully
   - Releases locks when users disconnect

3. **Project Rooms**
   - Users join project-specific rooms
   - Events broadcast only to users in the same project
   - Isolated collaboration per project

#### Socket Events (Server)

**Incoming Events:**
- `join-project` - User joins a project room
- `lock-segment` - Request to lock a segment for editing
- `unlock-segment` - Release a segment lock
- `segment-update` - Broadcast typing changes
- `segment-saved` - Notify others of saved changes
- `lock-heartbeat` - Keep lock alive during editing

**Outgoing Events:**
- `user-joined` - Notify when user joins project
- `user-left` - Notify when user leaves project
- `segment-locked` - Segment locked by a user
- `segment-unlocked` - Segment lock released
- `lock-failed` - Lock request denied (already locked)
- `current-locks` - Send existing locks to new user
- `segment-updated` - Real-time typing updates
- `segment-saved` - Segment saved by another user

### Frontend (React + Socket.IO Client)

#### Location
`src/contexts/SocketContext.tsx`

#### Key Components

1. **SocketContext**
   - Manages WebSocket connection
   - Provides socket methods to components
   - Tracks segment locks globally

2. **SegmentRow Component**
   - Handles lock/unlock on focus/blur
   - Shows lock indicators
   - Disables editing when locked by others
   - Broadcasts real-time updates

3. **ProjectDetail Page**
   - Joins project room on mount
   - Leaves room on unmount
   - Refreshes segments on remote saves

## Usage

### For Users

#### Editing a Segment

1. Click on a segment's textarea to start editing
2. The segment automatically locks
3. Other users see "User X is editing this segment"
4. Type your translation - changes broadcast in real-time
5. Click "Save" to persist changes and release lock
6. Or click outside to release lock without saving

#### Lock Indicators

- **Yellow Alert Box**: Shows when another user is editing
- **"You are editing" Badge**: Confirms you have the lock
- **Disabled Textarea**: Segment locked by another user

#### Auto-Release

Locks automatically release after 30 seconds of inactivity to prevent abandoned locks.

### For Developers

#### Joining a Project

```typescript
import { useSocket } from '@/contexts/SocketContext';

function MyComponent() {
  const { joinProject, leaveProject } = useSocket();
  
  useEffect(() => {
    joinProject(projectId);
    return () => leaveProject(projectId);
  }, [projectId]);
}
```

#### Locking a Segment

```typescript
const { lockSegment, unlockSegment, isSegmentLocked, getSegmentLock } = useSocket();

// Lock on focus
const handleFocus = () => {
  lockSegment(segmentId, projectId);
};

// Unlock on blur
const handleBlur = () => {
  unlockSegment(segmentId, projectId);
};

// Check if locked
const locked = isSegmentLocked(segmentId);
const lockInfo = getSegmentLock(segmentId);
```

#### Broadcasting Updates

```typescript
const { updateSegment, saveSegment } = useSocket();

// Broadcast typing
const handleChange = (text: string) => {
  updateSegment(segmentId, projectId, text);
};

// Broadcast save
const handleSave = () => {
  saveSegment(segmentId, projectId, text, status);
};
```

#### Listening for Updates

```typescript
useEffect(() => {
  const handleUpdate = (event: CustomEvent) => {
    const { segmentId, userId, targetText } = event.detail;
    // Update local state
  };

  window.addEventListener('segment-updated', handleUpdate);
  return () => window.removeEventListener('segment-updated', handleUpdate);
}, []);
```

## Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5000
CLIENT_URL=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

### Socket.IO Options

#### Server
```typescript
{
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  }
}
```

#### Client
```typescript
{
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
}
```

## Lock Timeout Configuration

Default: 30 seconds

To change, modify `LOCK_TIMEOUT` in `server/services/socketService.ts`:

```typescript
private readonly LOCK_TIMEOUT = 30000; // milliseconds
```

## Heartbeat Configuration

Default: 10 seconds

To change, modify interval in `src/components/SegmentRow.tsx`:

```typescript
heartbeatInterval.current = setInterval(() => {
  sendHeartbeat(segment.id);
}, 10000); // milliseconds
```

## Testing

### Test Scenario 1: Basic Locking

1. Open project in two browser windows
2. Log in as different users in each window
3. Click on same segment in both windows
4. First user gets the lock
5. Second user sees lock indicator

### Test Scenario 2: Real-Time Updates

1. User A starts editing a segment
2. User B sees "User A is editing this segment"
3. User A types - User B sees changes in real-time
4. User A saves - User B's view updates automatically

### Test Scenario 3: Auto-Release

1. User A starts editing
2. Wait 30 seconds without typing
3. Lock automatically releases
4. User B can now edit

### Test Scenario 4: Disconnect Handling

1. User A starts editing multiple segments
2. Close User A's browser/tab
3. All locks held by User A are released
4. Other users can now edit those segments

## Troubleshooting

### Connection Issues

**Problem**: Socket not connecting

**Solutions**:
- Check VITE_API_URL in frontend .env
- Verify backend server is running
- Check CORS configuration
- Inspect browser console for errors

### Lock Not Releasing

**Problem**: Segment stays locked after user leaves

**Solutions**:
- Check disconnect handler in socketService.ts
- Verify heartbeat is working
- Check timeout configuration
- Restart server to clear all locks

### Updates Not Broadcasting

**Problem**: Changes not visible to other users

**Solutions**:
- Verify users are in same project room
- Check socket connection status
- Inspect network tab for socket events
- Verify event names match between client/server

## Performance Considerations

### Scalability

Current implementation stores locks in memory. For production:

1. **Use Redis** for distributed lock storage
2. **Implement sticky sessions** for load balancing
3. **Add rate limiting** to prevent spam
4. **Optimize event payloads** to reduce bandwidth

### Memory Management

- Locks are automatically cleaned up on disconnect
- Timeouts prevent memory leaks from abandoned locks
- User connections map is cleared on disconnect

## Security Considerations

1. **Authentication**: Currently uses x-user-id header (dev only)
2. **Authorization**: Verify user has access to project before joining
3. **Rate Limiting**: Add limits to prevent DoS attacks
4. **Input Validation**: Sanitize all socket event data
5. **CORS**: Configure properly for production

## Future Enhancements

1. **Cursor Position Sharing**: Show where other users are typing
2. **User Avatars**: Display profile pictures in lock indicators
3. **Chat Integration**: Add project-level chat
4. **Conflict Resolution**: Handle simultaneous edits gracefully
5. **Offline Support**: Queue changes when disconnected
6. **Activity Feed**: Show recent project activity
7. **Typing Indicators**: Show "User X is typing..." status
8. **Lock Stealing**: Allow admins to force-unlock segments

## API Reference

### Socket Methods

#### joinProject(projectId: string)
Join a project room to receive updates.

#### leaveProject(projectId: string)
Leave a project room.

#### lockSegment(segmentId: string, projectId: string)
Request lock on a segment.

#### unlockSegment(segmentId: string, projectId: string)
Release lock on a segment.

#### updateSegment(segmentId: string, projectId: string, targetText: string)
Broadcast typing changes.

#### saveSegment(segmentId: string, projectId: string, targetText: string, status: string)
Broadcast segment save.

#### sendHeartbeat(segmentId: string)
Keep lock alive during editing.

### Socket State

#### connected: boolean
WebSocket connection status.

#### segmentLocks: Map<string, SegmentLock>
Current segment locks.

#### isSegmentLocked(segmentId: string): boolean
Check if segment is locked.

#### getSegmentLock(segmentId: string): SegmentLock | undefined
Get lock information for a segment.

## Monitoring

### Server Logs

Socket events are logged to console:
- Client connections/disconnections
- Lock acquisitions/releases
- User joins/leaves

### Client Logs

Enable debug logging:
```typescript
localStorage.debug = 'socket.io-client:socket';
```

## Production Deployment

### Checklist

- [ ] Configure proper CORS origins
- [ ] Use Redis for lock storage
- [ ] Enable SSL/TLS for WebSocket
- [ ] Add authentication middleware
- [ ] Implement rate limiting
- [ ] Set up monitoring/alerting
- [ ] Configure load balancer with sticky sessions
- [ ] Test failover scenarios
- [ ] Document scaling strategy
- [ ] Set up backup/recovery procedures
