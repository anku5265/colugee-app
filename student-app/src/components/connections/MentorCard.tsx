import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Star,
  UserPlus,
  Clock,
  CheckCircle,
  UserMinus,
  XCircle
} from "lucide-react";
import { ConnectionDialog } from "./ConnectionDialog";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  department: string;
  bio?: string;
  profile_picture_url?: string;
  connections_count: number;
}

interface MentorCardProps {
  mentor: Profile;
  connectionStatus: 'none' | 'sent' | 'received' | 'connected';
  requestId?: string;
  onConnect: (userId: string, message?: string) => void;
  onCancelRequest: (requestId: string) => void;
  onRemoveConnection: (userId: string) => void;
  onRequestMentorship: (mentorId: string) => void;
  onStartChat: (userId: string) => void;
  onViewProfile: (userId: string) => void;
}

export const MentorCard = ({
  mentor,
  connectionStatus,
  requestId,
  onConnect,
  onCancelRequest,
  onRemoveConnection,
  onRequestMentorship,
  onStartChat,
  onViewProfile,
}: MentorCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={mentor.profile_picture_url} />
            <AvatarFallback>
              {mentor.full_name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle 
              className="text-xl cursor-pointer hover:text-primary transition-colors"
              onClick={() => onViewProfile(mentor.user_id)}
            >
              {mentor.full_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground capitalize">{mentor.role}</p>
            <p className="text-sm font-medium text-primary">{mentor.department}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mentor.bio && (
          <p className="text-sm text-muted-foreground mb-4">{mentor.bio}</p>
        )}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-sm font-medium">4.8</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {mentor.connections_count} connections
            </div>
          </div>
          <Badge variant="outline">{mentor.role}</Badge>
        </div>
        
        {/* Connection Status Actions */}
        <div className="flex space-x-2 mb-2">
          {connectionStatus === 'connected' ? (
            <Button 
              size="sm" 
              className="flex-1" 
              variant="outline"
              onClick={() => onRemoveConnection(mentor.user_id)}
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Remove Connection
            </Button>
          ) : connectionStatus === 'sent' ? (
            <Button 
              size="sm" 
              className="flex-1" 
              variant="outline"
              onClick={() => requestId && onCancelRequest(requestId)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Request
            </Button>
          ) : connectionStatus === 'received' ? (
            <Button size="sm" className="flex-1" disabled variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Pending Response
            </Button>
          ) : (
            <ConnectionDialog
              targetUserName={mentor.full_name}
              onSendRequest={(message) => onConnect(mentor.user_id, message)}
            />
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => onRequestMentorship(mentor.user_id)}
            disabled={connectionStatus !== 'connected'}
            title={connectionStatus !== 'connected' ? 'Connect first to request mentorship' : ''}
          >
            Request Mentorship
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onStartChat(mentor.user_id)}
            disabled={connectionStatus !== 'connected'}
            title={connectionStatus !== 'connected' ? 'Connect first to start chat' : ''}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
