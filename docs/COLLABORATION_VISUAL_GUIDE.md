# Real-Time Collaboration - Visual Guide

## User Interface Elements

### 1. Lock Indicator (Locked by Another User)

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  John Smith is editing this segment                      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ [Locked by John Smith]                                      │
│                                                             │
│ (Textarea is disabled and grayed out)                      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Active Editing Indicator (You Have the Lock)

```
                                          👤 You are editing
┌─────────────────────────────────────────────────────────────┐
│ This is the translation text that I am currently editing... │
│                                                             │
│ (Textarea is active and editable)                          │
└─────────────────────────────────────────────────────────────┘
[Translate] [Save] [Confirm]
```

### 3. Available Segment (No Lock)

```
┌─────────────────────────────────────────────────────────────┐
│ Translation will appear here...                             │
│                                                             │
│ (Click to start editing)                                   │
└─────────────────────────────────────────────────────────────┘
[Translate] [Save] [Confirm]
```

## Collaboration Flow

### Scenario 1: Two Users Editing Different Segments

```
User A's View                    User B's View
┌──────────────────┐            ┌──────────────────┐
│ Segment 1        │            │ Segment 1        │
│ [EDITING] ✏️     │            │ [LOCKED] 🔒      │
│ "Hello world..." │            │ "Hello world..." │
└──────────────────┘            └──────────────────┘
┌──────────────────┐            ┌──────────────────┐
│ Segment 2        │            │ Segment 2        │
│ [LOCKED] 🔒      │            │ [EDITING] ✏️     │
│ "Bonjour..."     │            │ "Bonjour..."     │
└──────────────────┘            └──────────────────┘
```

### Scenario 2: Real-Time Typing Updates

```
Time: T0
User A types: "Hello"

User A's View                    User B's View
┌──────────────────┐            ┌──────────────────┐
│ 👤 You are       │            │ ⚠️ User A is     │
│    editing       │            │    editing       │
│                  │            │                  │
│ Hello|           │            │ Hello            │
└──────────────────┘            └──────────────────┘

Time: T1
User A types: " world"

User A's View                    User B's View
┌──────────────────┐            ┌──────────────────┐
│ 👤 You are       │            │ ⚠️ User A is     │
│    editing       │            │    editing       │
│                  │            │                  │
│ Hello world|     │            │ Hello world      │
└──────────────────┘            └──────────────────┘
```

### Scenario 3: Save and Lock Release

```
Time: T0 - User A clicks Save

User A's View                    User B's View
┌──────────────────┐            ┌──────────────────┐
│ Saving... ⏳     │            │ ⚠️ User A is     │
│                  │            │    editing       │
│ Hello world      │            │ Hello world      │
└──────────────────┘            └──────────────────┘

Time: T1 - Save complete, lock released

User A's View                    User B's View
┌──────────────────┐            ┌──────────────────┐
│ ✅ Saved         │            │ ✅ Updated       │
│                  │            │                  │
│ Hello world      │            │ Hello world      │
└──────────────────┘            └──────────────────┘
```

## Lock States Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Segment Lock States                       │
└─────────────────────────────────────────────────────────────┘

    UNLOCKED
       │
       │ User clicks textarea
       ▼
    LOCKING
       │
       │ Server confirms
       ▼
    LOCKED (by me)
       │
       ├─────────────────┐
       │                 │
       │ User types      │ 30s timeout
       │ (heartbeat)     │ (no activity)
       │                 │
       ▼                 ▼
    LOCKED           UNLOCKED
    (active)         (timeout)
       │
       │ User clicks Save
       │ or blurs textarea
       ▼
    UNLOCKED
```

## Timeline Example: Complete Editing Session

```
Time    User A Action              User B View
────────────────────────────────────────────────────────────
00:00   Opens project              Opens same project
        
00:05   Clicks Segment 1           Sees Segment 1 available
        
00:06   Starts typing              🔒 "User A is editing"
        "Hello"                    Sees "Hello" appear
        
00:10   Types " world"             Sees " world" appear
        
00:15   Clicks Save                ✅ Segment updates
        Lock released              Lock indicator disappears
        
00:16   Moves to Segment 2         Can now edit Segment 1
        
00:17   Clicks Segment 2           Clicks Segment 1
        Gets lock                  Gets lock
        
00:18   🔒 "User B is editing"     Starts editing Segment 1
        Segment 1                  
        
00:20   Types in Segment 2         Saves Segment 1
        
00:25   Sees Segment 1 update      Lock released
        from User B                
```

## Color Coding

### Lock Indicators

- 🟡 **Yellow Alert**: Segment locked by another user
  - Background: `bg-yellow-500/10`
  - Border: `border-yellow-500/20`
  - Icon: Lock 🔒

- 🔵 **Blue Badge**: You are editing
  - Text: `text-accent`
  - Icon: User 👤

- 🟢 **Green Badge**: Confirmed status
  - Background: `bg-success/15`
  - Text: `text-success`

- 🟠 **Orange Badge**: Draft status
  - Background: `bg-warning/15`
  - Text: `text-warning`

## Keyboard Shortcuts (Future Enhancement)

```
Ctrl/Cmd + S     Save current segment
Ctrl/Cmd + Enter Confirm segment
Esc              Release lock without saving
Tab              Move to next segment
Shift + Tab      Move to previous segment
```

## Mobile Considerations

On mobile devices:
- Lock on tap (instead of focus)
- Unlock on "Done" button
- Show lock status in segment header
- Simplified indicators for small screens

## Accessibility

- Lock status announced to screen readers
- Keyboard navigation supported
- Focus indicators visible
- Color not sole indicator (icons + text)

## Error States

### Connection Lost

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Connection lost. Reconnecting...                        │
└─────────────────────────────────────────────────────────────┘
```

### Lock Failed

```
┌─────────────────────────────────────────────────────────────┐
│ ❌ Could not lock segment. John Smith is editing.           │
└─────────────────────────────────────────────────────────────┘
```

### Save Failed

```
┌─────────────────────────────────────────────────────────────┐
│ ❌ Failed to save. Please try again.                        │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices for Users

### ✅ DO
- Save frequently to release locks
- Click outside textarea when done editing
- Wait for lock indicator before editing
- Communicate with team about large changes

### ❌ DON'T
- Leave segments locked unnecessarily
- Force refresh while editing
- Edit multiple segments simultaneously
- Ignore lock indicators

## Admin Features (Future)

### Force Unlock
```
┌─────────────────────────────────────────────────────────────┐
│ 🔒 Locked by John Smith (15 minutes ago)                   │
│                                                             │
│ [Force Unlock] (Admin only)                                │
└─────────────────────────────────────────────────────────────┘
```

### Lock History
```
Segment #42 Lock History:
- 14:30 - Locked by John Smith
- 14:35 - Unlocked (saved)
- 14:40 - Locked by Jane Doe
- 14:42 - Unlocked (timeout)
- 14:45 - Locked by John Smith (current)
```

## Performance Indicators

### Connection Status
```
Header: 🟢 Connected | 🔴 Disconnected | 🟡 Reconnecting
```

### Active Users
```
👥 3 users online: John, Jane, Bob
```

### Recent Activity
```
📝 John saved Segment 42 (2 minutes ago)
📝 Jane confirmed Segment 38 (5 minutes ago)
```
