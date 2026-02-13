import { User, Shield, UserCog, Languages, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_CONFIG = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-red-500/15 text-red-500' },
  project_manager: { label: 'Project Manager', icon: UserCog, color: 'bg-blue-500/15 text-blue-500' },
  translator: { label: 'Translator', icon: Languages, color: 'bg-green-500/15 text-green-500' },
  reviewer: { label: 'Reviewer', icon: Eye, color: 'bg-purple-500/15 text-purple-500' },
};

const TEST_USERS = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Admin User', role: 'admin' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Project Manager', role: 'project_manager' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Translator', role: 'translator' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Reviewer', role: 'reviewer' },
];

export function RoleSwitcher() {
  const { user, loading, setUserId } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
        <User className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const roleConfig = ROLE_CONFIG[user.primary_role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.translator;
  const RoleIcon = roleConfig.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <RoleIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{user.name}</span>
          <Badge className={roleConfig.color}>
            {roleConfig.label}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch User (Dev Mode)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TEST_USERS.map((testUser) => {
          const config = ROLE_CONFIG[testUser.role as keyof typeof ROLE_CONFIG];
          const Icon = config.icon;
          return (
            <DropdownMenuItem
              key={testUser.id}
              onClick={() => setUserId(testUser.id)}
              className="gap-2"
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{testUser.name}</span>
              {user.id === testUser.id && (
                <Badge variant="secondary" className="text-xs">Current</Badge>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
