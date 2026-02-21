import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  GraduationCap,
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
  email: string;
  role: string;
  department: string;
  year_of_study?: number;
  bio?: string;
  profile_picture_url?: string;
  institution_id?: string;
  connections_count: number;
  daily_streak: number;
}

interface ProfileCardProps {
  profile: Profile;
  connectionStatus: 'none' | 'sent' | 'received' | 'connected';
  requestId?: string;
  onConnect: (userId: string, message?: string) => void;
  onCancelRequest: (requestId: string) => void;
  onRemoveConnection: (userId: string) => void;
  onViewProfile: (userId: string) => void;
}

export const ProfileCard = ({
  profile,
  connectionStatus,
  requestId,
  onConnect,
  onCancelRequest,
  onRemoveConnection,
  onViewProfile,
}: ProfileCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.profile_picture_url} />
            <AvatarFallback>
              {profile.full_name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle 
              className="text-base cursor-pointer hover:text-primary transition-colors"
              onClick={() => onViewProfile(profile.user_id)}
            >
              {profile.full_name}
            </CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4 mr-1" />
              {profile.year_of_study && `Year ${profile.year_of_study} • `}
              {profile.department}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {profile.bio && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {profile.bio}
          </p>
        )}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            {profile.connections_count} connections
          </div>
          <Badge variant="secondary">
            {profile.daily_streak} day streak
          </Badge>
        </div>
        <div className="flex space-x-2">
          {connectionStatus === 'connected' ? (
            <Button 
              size="sm" 
              className="flex-1" 
              variant="outline"
              onClick={() => onRemoveConnection(profile.user_id)}
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Remove
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
              targetUserName={profile.full_name}
              onSendRequest={(message) => onConnect(profile.user_id, message)}
            />
          )}
          <Button size="sm" variant="outline" onClick={() => onViewProfile(profile.user_id)}>
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
