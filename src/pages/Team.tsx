import { Users, Plus, Mail, MoreVertical } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Team() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground mt-1">Manage team members and collaborators</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <Input id="member-name" placeholder="e.g., John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-email">Email Address</Label>
                <Input id="member-email" type="email" placeholder="e.g., john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-role">Role</Label>
                <select
                  id="member-role"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option>Translator</option>
                  <option>Reviewer</option>
                  <option>Project Manager</option>
                  <option>Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Add invitation logic here
                  setIsDialogOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Send Invitation
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: "Anna Klein", role: "Senior Translator", email: "anna.k@linguaflow.io", projects: 12, status: "active" },
          { name: "Hans Vogel", role: "Translator", email: "hans.v@linguaflow.io", projects: 8, status: "active" },
          { name: "Marie Dubois", role: "Reviewer", email: "marie.d@linguaflow.io", projects: 15, status: "active" },
          { name: "Carlos Garcia", role: "Translator", email: "carlos.g@linguaflow.io", projects: 6, status: "away" },
          { name: "Sofia Rossi", role: "Project Manager", email: "sofia.r@linguaflow.io", projects: 23, status: "active" },
          { name: "John Smith", role: "Translator", email: "john.s@linguaflow.io", projects: 4, status: "active" },
        ].map((member, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-foreground">
                {member.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <button className="p-1 rounded hover:bg-secondary text-muted-foreground transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1 mb-3">
              <h3 className="text-sm font-semibold text-foreground">{member.name}</h3>
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Mail className="w-3 h-3" />
              {member.email}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">{member.projects} projects</span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                member.status === "active" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
              }`}>
                {member.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
