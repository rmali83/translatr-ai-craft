# Quick Start: Real-Time Collaboration

## 🚀 Getting Started in 5 Minutes

### 1. Start the Servers

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
npm run dev
```

### 2. Open Two Browser Windows

- Window 1: http://localhost:5173
- Window 2: http://localhost:5173 (incognito or different browser)

### 3. Switch Users

**Window 1:**
- Click user badge in top-right
- Select "Translator User"

**Window 2:**
- Click user badge in top-right
- Select "Project Manager"

### 4. Test Collaboration

1. Both windows: Open the same project
2. Window 1: Click on a segment to edit
3. Window 2: See lock indicator appear
4. Window 1: Start typing
5. Window 2: See changes appear in real-time
6. Window 1: Click Save
7. Window 2: See segment update automatically

## ✨ Key Features

### Automatic Locking
- Click textarea → Segment locks automatically
- Other users see "User X is editing"
- Click outside or Save → Lock releases

### Real-Time Updates
- See typing changes instantly
- Automatic refresh on save
- No manual refresh needed

### Conflict Prevention
- Only one user can edit at a time
- Visual indicators show who's editing
- Locks auto-release after 30 seconds

## 🎯 Common Scenarios

### Scenario 1: Collaborative Translation

**Translator** (Window 1):
1. Opens project
2. Starts translating Segment 1
3. Saves and moves to Segment 2

**Reviewer** (Window 2):
1. Opens same project
2. Sees Translator working on Segment 1
3. Reviews completed segments
4. Marks Segment 1 as reviewed after Translator saves

### Scenario 2: Project Manager Oversight

**Project Manager** (Window 1):
1. Opens project
2. Monitors team activity
3. Sees who's editing what
4. Can edit any segment when not locked

**Translator** (Window 2):
1. Translates segments
2. Sees Project Manager's changes in real-time
3. Continues with next segment

## 🔧 Troubleshooting

### Lock Not Working?

**Check:**
- ✅ Backend server running
- ✅ Frontend connected (check console)
- ✅ Both users in same project
- ✅ No browser errors

**Fix:**
```bash
# Restart backend
cd server
npm run dev
```

### Not Seeing Updates?

**Check:**
- ✅ WebSocket connected (green indicator)
- ✅ Both users logged in
- ✅ Same project open
- ✅ Network tab shows socket events

**Fix:**
- Refresh both windows
- Check browser console for errors
- Verify VITE_API_URL in .env

### Lock Stuck?

**Wait 30 seconds** - locks auto-release

**Or restart server:**
```bash
cd server
npm run dev
```

## 📊 Visual Indicators

### You Are Editing
```
👤 You are editing
[Active textarea with cursor]
```

### Someone Else Editing
```
⚠️ John Smith is editing this segment
[Disabled textarea, grayed out]
```

### Available to Edit
```
[Normal textarea]
Translation will appear here...
```

## 🎮 Test Commands

### Test Lock Timeout
```bash
# 1. Lock a segment
# 2. Wait 30 seconds
# 3. Lock should auto-release
```

### Test Disconnect
```bash
# 1. Lock multiple segments
# 2. Close browser tab
# 3. All locks should release
```

### Test Real-Time Updates
```bash
# 1. User A starts typing
# 2. User B should see changes
# 3. User A saves
# 4. User B should see update
```

## 📝 Environment Setup

### Backend (.env)
```env
PORT=5000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

## 🔍 Debug Mode

### Enable Socket Logs
```javascript
// Browser console
localStorage.debug = 'socket.io-client:socket';
```

### Check Connection
```javascript
// Browser console
window.socket // Should show socket object
```

### View Active Locks
```javascript
// Browser console
window.locks // Should show Map of locks
```

## 📚 Documentation

- **Full Guide**: `docs/WEBSOCKET_COLLABORATION.md`
- **Visual Guide**: `docs/COLLABORATION_VISUAL_GUIDE.md`
- **Implementation**: `docs/WEBSOCKET_IMPLEMENTATION_SUMMARY.md`

## 🆘 Need Help?

### Check Logs

**Backend:**
```bash
cd server
npm run dev
# Watch for socket events in console
```

**Frontend:**
```bash
# Open browser DevTools
# Check Console tab for errors
# Check Network tab for WebSocket
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Not connecting | Check VITE_API_URL |
| Lock not working | Restart backend |
| Updates not showing | Refresh both windows |
| Stuck lock | Wait 30s or restart |

## ✅ Success Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Two browser windows open
- [ ] Different users in each window
- [ ] Same project open in both
- [ ] Can see lock indicators
- [ ] Real-time updates working
- [ ] Locks auto-release

## 🎉 You're Ready!

Start collaborating with your team in real-time!

**Next Steps:**
1. Invite team members
2. Create projects
3. Start translating together
4. Watch changes happen live

**Pro Tips:**
- Save frequently to release locks
- Communicate with team about large changes
- Use role switcher to test different permissions
- Monitor lock indicators before editing
