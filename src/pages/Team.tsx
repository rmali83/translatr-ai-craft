import { Users, Plus, Mail, MoreVertical, Shield, Trash2, Edit, UserCheck, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeamUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  user_roles: Array<{
    id: string;
    role: string;
    project_id: string | null;
  }>;
}

export default function Team() {
  const { user: currentUser, isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TeamUser | null>(null);
  const [selectedRoleToDelete, setSelectedRoleToDelete] = useState<{ userId: string; roleId: string; role: string } | null>(null);
  
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'translator',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    newRole: 'translator',
  });

  useEffect(() => {
    if (isAdmin()) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Query database directly instead of using Edge Function
      const { data: usersData, error } = await supabase
        .from('users')
        .select(`
          *,
          user_roles (
            id,
            role,
            project_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(usersData || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteForm.name || !inviteForm.email || !inviteForm.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Call the invite-user Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/invite-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: inviteForm.email,
            name: inviteForm.name,
            role: inviteForm.role,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to invite user');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: result.user_existed 
          ? "Role assigned successfully" 
          : "Invitation sent! User will receive an email to set up their account."
      });
      
      setIsInviteDialogOpen(false);
      setInviteForm({ name: '', email: '', role: 'translator' });
      loadUsers();
    } catch (error) {
      console.error('Failed to invite user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to invite user",
        variant: "destructive"
      });
    }
  };

  const handleAssignRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role: role,
          project_id: null,
        }]);

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Info",
            description: "User already has this role",
          });
          return;
        }
        throw error;
      }
      
      toast({
        title: "Success",
        description: `Role ${role} assigned successfully`
      });
      
      loadUsers();
    } catch (error) {
      console.error('Failed to assign role:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign role",
        variant: "destructive"
      });
    }
  };

  const handleRemoveRole = async () => {
    if (!selectedRoleToDelete) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', selectedRoleToDelete.roleId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Role ${selectedRoleToDelete.role} removed successfully`
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedRoleToDelete(null);
      loadUsers();
    } catch (error) {
      console.error('Failed to remove role:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove role",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedUser || !editForm.name) return;

    try {
      // Update user name
      const { error: updateError } = await supabase
        .from('users')
        .update({ name: editForm.name })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;
      
      // Assign new role if specified
      if (editForm.newRole) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: selectedUser.id,
            role: editForm.newRole,
            project_id: null,
          }]);

        if (roleError && roleError.code !== '23505') {
          throw roleError;
        }
      }
      
      toast({
        title: "Success",
        description: "User profile updated successfully"
      });
      
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setEditForm({ name: '', newRole: 'translator' });
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user profile",
        variant: "destructive"
      });
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: "bg-red-500/15 text-red-500",
      project_manager: "bg-blue-500/15 text-blue-500",
      translator: "bg-green-500/15 text-green-500",
      reviewer: "bg-purple-500/15 text-purple-500",
    };
    return colors[role as keyof typeof colors] || "bg-gray-500/15 text-gray-500";
  };

  const getPrimaryRole = (userRoles: TeamUser['user_roles']) => {
    if (userRoles.length === 0) return 'No Role';
    
    // Prioritize global roles
    const globalRole = userRoles.find(r => r.project_id === null);
    if (globalRole) return globalRole.role;
    
    return userRoles[0].role;
  };

  const getProjectCount = (userId: string) => {
    // This would need to be implemented to count projects per user
    return Math.floor(Math.random() * 20); // Mock for now
  };

  if (!isAdmin()) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">
            You need admin privileges to view and manage team members.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-1">Manage team members, roles, and permissions</p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Invite Member
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to a new team member to join your workspace.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="member-name">Full Name</Label>
                <Input 
                  id="member-name" 
                  placeholder="e.g., John Doe"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-email">Email Address</Label>
                <Input 
                  id="member-email" 
                  type="email" 
                  placeholder="e.g., john@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-role">Role</Label>
                <select
                  id="member-role"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="translator">Translator</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsInviteDialogOpen(false)}
                className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteUser}
                className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Send Invitation
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 rounded-full bg-accent animate-pulse"></div>
            Loading team members...
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((member) => (
            <div key={member.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-foreground">
                  {member.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-secondary text-muted-foreground transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUser(member);
                        setEditForm({ name: member.name, newRole: 'translator' });
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAssignRole(member.id, 'translator')}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Assign Role
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-1 mb-3">
                <h3 className="text-sm font-semibold text-foreground">{member.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">
                  {getPrimaryRole(member.user_roles).replace('_', ' ')}
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Mail className="w-3 h-3" />
                {member.email}
              </div>

              {/* Roles */}
              <div className="space-y-2 mb-3">
                {member.user_roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${getRoleColor(role.role)}`}>
                      {role.role.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedRoleToDelete({
                          userId: member.id,
                          roleId: role.id,
                          role: role.role
                        });
                        setIsDeleteDialogOpen(true);
                      }}
                      className="p-1 rounded hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {getProjectCount(member.id)} projects
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-success/15 text-success">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>
              Update user information and assign new roles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input 
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Add New Role</Label>
              <select
                id="edit-role"
                value={editForm.newRole}
                onChange={(e) => setEditForm({...editForm, newRole: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="translator">Translator</option>
                <option value="reviewer">Reviewer</option>
                <option value="project_manager">Project Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsEditDialogOpen(false)}
              className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateProfile}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Update User
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the "{selectedRoleToDelete?.role.replace('_', ' ')}" role? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
