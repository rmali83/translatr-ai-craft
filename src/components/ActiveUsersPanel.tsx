import { Users, Circle } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface PresenceUser {
  userId: string;
  userName: string;
  online_at: string;
}

export function ActiveUsersPanel() {
  const { socket } = useSocket();
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!socket) return;

    const updatePresence = () => {
      const state = socket.presenceState();
      const users: PresenceUser[] = [];
      
      Object.entries(state).forEach(([key, presences]: [string, any]) => {
        if (presences && presences.length > 0) {
          const presence = presences[0];
          users.push({
            userId: presence.userId,
            userName: presence.userName,
            online_at: presence.online_at,
          });
        }
      });
      
      setActiveUsers(users);
    };

    // Initial update
    updatePresence();

    // Listen for presence changes
    const channel = socket
      .on('presence', { event: 'sync' }, updatePresence)
      .on('presence', { event: 'join' }, updatePresence)
      .on('presence', { event: 'leave' }, updatePresence);

    return () => {
      socket.unsubscribe();
    };
  }, [socket]);

  if (activeUsers.length === 0) return null;

  return (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">
          Active Users ({activeUsers.length})
        </h3>
      </div>
      
      <div className="space-y-2">
        {activeUsers.map((user) => (
          <div key={user.userId} className="flex items-center gap-2">
            <div className="relative">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-accent/20 text-accent">
                  {user.userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-green-500 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.userName}
              </p>
              <p className="text-xs text-muted-foreground">
                Online
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
