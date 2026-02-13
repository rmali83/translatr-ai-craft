# Role-Based Access Control (RBAC) Guide

## Overview

The application implements a comprehensive RBAC system with four distinct roles, each with specific permissions and capabilities.

## Roles

### 1. Admin
- Full access to all features
- Can manage users and assign roles
- Can create, edit, and delete projects
- Can edit and review all segments
- Can change project workflow status

### 2. Project Manager
- Can create and manage projects
- Can assign users to projects
- Can edit segments in assigned projects
- Can review segments
- Can change project workflow status
- Cannot manage user roles globally

### 3. Translator
- Can edit target segments in assigned projects
- Can translate and save segments
- Can confirm segments (mark as ready for review)
- Cannot change project status
- Cannot review segments

### 4. Reviewer
- Read-only access to segments
- Can mark confirmed segments as "reviewed"
- Cannot edit translations
- Cannot change project status

## Implementation

### Backend (Server)

#### Authentication Middleware
Located in `server/middleware/rbac.ts`:
- `authenticate()` - Validates user via x-user-id header
- `hasRole()` - Checks if user has specific role
- `hasProjectRole()` - Checks role for specific project
- `canEditSegment()` - Validates segment edit permission
- `canReview()` - Validates review permission

#### Protected Routes
- Project creation: Admin, Project Manager
- Segment editing: Admin, Project Manager, Translator
- Workflow status changes: Admin, Project Manager
- Segment review: Admin, Project Manager, Reviewer

### Frontend (Client)

#### Auth Context
Located in `src/contexts/AuthContext.tsx`:
- Manages current user state
- Provides permission checking functions
- Handles user switching (dev mode)

#### Role Switcher
Located in `src/components/RoleSwitcher.tsx`:
- Displays current user and role
- Allows switching between test users (dev mode)
- Shows role badge with color coding

#### Permission-Based UI
- Buttons hidden/disabled based on role
- Textarea disabled for reviewers
- Workflow actions restricted to managers
- Import/export available to all roles

## Test Users

For development and testing, the following users are available:

| User ID | Email | Role | Password |
|---------|-------|------|----------|
| 00000000-0000-0000-0000-000000000001 | admin@linguaflow.io | Admin | N/A (mock auth) |
| 00000000-0000-0000-0000-000000000002 | pm@linguaflow.io | Project Manager | N/A (mock auth) |
| 00000000-0000-0000-0000-000000000003 | translator@linguaflow.io | Translator | N/A (mock auth) |
| 00000000-0000-0000-0000-000000000004 | reviewer@linguaflow.io | Reviewer | N/A (mock auth) |

## Usage

### Switching Users (Dev Mode)

1. Click the user badge in the top-right header
2. Select a different user from the dropdown
3. The UI will update to reflect the new role's permissions

### API Authentication

All API requests include the `x-user-id` header:

```typescript
headers: {
  'Content-Type': 'application/json',
  'x-user-id': userId
}
```

The user ID is stored in localStorage and automatically included in all requests.

## Database Schema

### users table
- id (uuid, primary key)
- email (text, unique)
- name (text)
- created_at (timestamp)

### user_roles table
- id (uuid, primary key)
- user_id (uuid, foreign key)
- role (text: admin, project_manager, translator, reviewer)
- project_id (uuid, nullable) - null means global role
- created_at (timestamp)

## Permission Matrix

| Action | Admin | PM | Translator | Reviewer |
|--------|-------|----|-----------| ---------|
| Create Project | ✓ | ✓ | ✗ | ✗ |
| Edit Project Status | ✓ | ✓ | ✗ | ✗ |
| Translate Segments | ✓ | ✓ | ✓ | ✗ |
| Confirm Segments | ✓ | ✓ | ✓ | ✗ |
| Review Segments | ✓ | ✓ | ✗ | ✓ |
| Import/Export Files | ✓ | ✓ | ✓ | ✓ |
| Manage Users | ✓ | ✗ | ✗ | ✗ |
| View All Projects | ✓ | ✓ | Assigned | Assigned |

## Security Notes

1. Current implementation uses mock authentication (x-user-id header)
2. In production, replace with JWT tokens or session-based auth
3. User IDs are stored in localStorage (dev only)
4. Backend validates all permissions before executing actions
5. Frontend UI is permission-aware but backend is the source of truth

## Future Enhancements

- Real authentication with JWT tokens
- Project-specific role assignments
- Role hierarchy and inheritance
- Audit logging for role changes
- Fine-grained permissions (e.g., edit specific languages)
- Team-based access control
