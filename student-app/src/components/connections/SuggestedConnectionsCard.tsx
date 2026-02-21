import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb,
  ChevronRight,
  Users
} from "lucide-react";
import { ConnectionDialog } from "./ConnectionDialog";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  department: string;
  year_of_study?: number;
  bio?: string;
  profile_picture_url?: string;
  connections_count: number;
  matchReason?: string;
}

interface SuggestedConnectionsCardProps {
  suggestions: Profile[];
  onConnect: (userId: string, message?: string) => void;
  onViewProfile: (userId: string) => void;
  onViewAll: () => void;
}

export const SuggestedConnectionsCard = ({
  suggestions,
  onConnect,
  onViewProfile,
  onViewAll,
}: SuggestedConnectionsCardProps) => {
  if (suggestions.length === 0) return null;

  return (
    <Card className="mb-6 border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Suggested for You
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {suggestions.slice(0, 4).map((profile) => (
            <div 
              key={profile.user_id} 
              className="flex flex-col items-center p-4 bg-background/60 rounded-lg hover:bg-background/80 transition-colors"
            >
              <Avatar 
                className="h-16 w-16 mb-2 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
                onClick={() => onViewProfile(profile.user_id)}
              >
                <AvatarImage src={profile.profile_picture_url} />
                <AvatarFallback>
                  {profile.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h4 
                className="font-medium text-sm text-center cursor-pointer hover:text-primary transition-colors"
                onClick={() => onViewProfile(profile.user_id)}
              >
                {profile.full_name}
              </h4>
              <p className="text-xs text-muted-foreground text-center mb-1">
                {profile.department}
              </p>
              {profile.matchReason && (
                <Badge variant="secondary" className="text-xs mb-2">
                  {profile.matchReason}
                </Badge>
              )}
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <Users className="h-3 w-3 mr-1" />
                {profile.connections_count} connections
              </div>
              <ConnectionDialog
                targetUserName={profile.full_name}
                onSendRequest={(message) => onConnect(profile.user_id, message)}
                compact
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
