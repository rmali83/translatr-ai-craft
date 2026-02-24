import { Activity, Save, Lock, Unlock, Edit, CheckCircle } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityItem {
  id: string;
  type: 'lock' | 'unlock' | 'update' | 'save' | 'confirm';
  userName: string;
  segmentId: string;
  timestamp: number;
  message: string;
}

export function ActivityFeed() {
  const { socket } = useSocket();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!socket) return;

    const addActivity = (type: ActivityItem['type'], payload: any, message: string) => {
      const activity: ActivityItem = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        userName: payload.userName || 'Unknown',
        segmentId: payload.segmentId,
        timestamp: Date.now(),
        message,
      };

      setActivities(prev => [activity, ...prev].slice(0, 20)); // Keep last 20
    };

    socket
      .on('broadcast', { event: 'segment-locked' }, ({ payload }) => {
        addActivity('lock', payload, `locked a segment`);
      })
      .on('broadcast', { event: 'segment-unlocked' }, ({ payload }) => {
        addActivity('unlock', payload, `unlocked a segment`);
      })
      .on('broadcast', { event: 'segment-updated' }, ({ payload }) => {
        addActivity('update', payload, `is editing a segment`);
      })
      .on('broadcast', { event: 'segment-saved' }, ({ payload }) => {
        addActivity('save', payload, `saved a segment`);
      });

    return () => {
      socket.unsubscribe();
    };
  }, [socket]);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'lock':
        return <Lock className="w-3 h-3 text-yellow-500" />;
      case 'unlock':
        return <Unlock className="w-3 h-3 text-green-500" />;
      case 'update':
        return <Edit className="w-3 h-3 text-blue-500" />;
      case 'save':
        return <Save className="w-3 h-3 text-purple-500" />;
      case 'confirm':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (activities.length === 0) {
    return (
      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Activity Feed</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-4">
          No recent activity
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Activity Feed</h3>
      </div>
      
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/5 transition-colors">
              <div className="mt-0.5">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">
                  <span className="font-medium">{activity.userName}</span>{' '}
                  <span className="text-muted-foreground">{activity.message}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {getTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
