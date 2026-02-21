import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  UserPlus, 
  TrendingUp,
  Clock,
  Sparkles
} from "lucide-react";

interface ConnectionStatsCardProps {
  totalConnections: number;
  pendingRequests: number;
  sentRequests: number;
  weeklyGrowth: number;
  connectionStreak: number;
}

export const ConnectionStatsCard = ({
  totalConnections,
  pendingRequests,
  sentRequests,
  weeklyGrowth,
  connectionStreak,
}: ConnectionStatsCardProps) => {
  return (
    <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Your Network Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <Users className="h-6 w-6 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{totalConnections}</div>
            <div className="text-xs text-muted-foreground">Connections</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <Clock className="h-6 w-6 mx-auto mb-1 text-warning" />
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <UserPlus className="h-6 w-6 mx-auto mb-1 text-secondary-foreground" />
            <div className="text-2xl font-bold">{sentRequests}</div>
            <div className="text-xs text-muted-foreground">Sent</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <TrendingUp className="h-6 w-6 mx-auto mb-1 text-accent-foreground" />
            <div className="text-2xl font-bold flex items-center justify-center">
              {weeklyGrowth > 0 && "+"}
              {weeklyGrowth}
            </div>
            <div className="text-xs text-muted-foreground">This Week</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg col-span-2 md:col-span-1">
            <div className="text-2xl font-bold">{connectionStreak}🔥</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
