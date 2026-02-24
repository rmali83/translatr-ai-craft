import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActiveUsersPanel } from './ActiveUsersPanel';
import { ActivityFeed } from './ActivityFeed';

interface CollaborationSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function CollaborationSidebar({ open, onClose }: CollaborationSidebarProps) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`
        fixed right-0 top-0 bottom-0 w-80 bg-background border-l border-border z-50
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Collaboration</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <ActiveUsersPanel />
            <ActivityFeed />
          </div>
        </div>
      </div>
    </>
  );
}
