import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  X, 
  UserPlus, 
  Check, 
  MessageCircle,
  Users,
  Calendar,
  Heart,
  FileText,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
  read: boolean;
  action_type?: string;
  action_id?: string;
  created_by?: string;
  user_name?: string;
  user_avatar?: string;
}

interface NotificationSystemProps {
  currentUser: any;
}

export const NotificationSystem = ({ currentUser }: NotificationSystemProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      
      // Set up real-time subscription for notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUser.id}`
          },
          (payload) => {
            fetchNotifications();
            toast({
              title: payload.new.title,
              description: payload.new.description,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    if (!currentUser) return;

    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        // Fetch user details for notification creators
        const userIds = data
          .map(n => n.created_by)
          .filter((id): id is string => id !== null && id !== undefined);
        
        const { data: users } = await supabase
          .from('profiles')
          .select('user_id, full_name, profile_picture_url')
          .in('user_id', userIds);

        const usersMap = new Map(users?.map(u => [u.user_id, u]) || []);

        const enrichedNotifications = data.map(notification => ({
          ...notification,
          user_name: notification.created_by ? usersMap.get(notification.created_by)?.full_name : undefined,
          user_avatar: notification.created_by ? usersMap.get(notification.created_by)?.profile_picture_url : undefined
        }));

        setNotifications(enrichedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const respondToConnectionRequest = async (notificationId: string, requestId: string, accept: boolean) => {
    setLoading(true);
    try {
      if (accept) {
        const { error } = await supabase.rpc('accept_connection_request', {
          request_id: requestId
        });
        
        if (error) throw error;
        
        toast({
          title: "Connection accepted",
          description: "You are now connected!",
        });
      } else {
        const { error } = await supabase
          .from('connection_requests')
          .update({ status: 'rejected' })
          .eq('id', requestId);
        
        if (error) throw error;
        
        toast({
          title: "Connection declined",
          description: "Request has been declined.",
        });
      }

      // Mark notification as read
      await markAsRead(notificationId);
      fetchNotifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to request",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection_request':
        return UserPlus;
      case 'connection_accepted':
        return Check;
      case 'new_message':
        return Mail;
      default:
        return Bell;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {unreadCount === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No new notifications</p>
              </div>
            ) : (
              <ScrollArea className="h-80">
                <div className="space-y-1 p-2">
                  {notifications.map((notification) => {
                    const IconComponent = getNotificationIcon(notification.type);
                    const isConnectionRequest = notification.type === 'connection_request' && notification.action_id;
                    
                    return (
                      <div 
                        key={notification.id} 
                        className={`p-3 rounded-lg border transition-colors ${
                          notification.read ? 'bg-muted/50' : 'bg-card hover:bg-accent/50'
                        }`}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={notification.user_avatar || ''} />
                            <AvatarFallback>
                              {notification.user_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <IconComponent className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">
                                {notification.title}
                              </span>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="text-sm text-foreground">
                              {notification.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </p>
                            
                            {isConnectionRequest && (
                              <div className="flex space-x-2 mt-3">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    respondToConnectionRequest(notification.id, notification.action_id!, true);
                                  }}
                                  disabled={loading}
                                  className="flex-1"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    respondToConnectionRequest(notification.id, notification.action_id!, false);
                                  }}
                                  disabled={loading}
                                  className="flex-1"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};