import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  BookOpen, 
  Flame, 
  CheckCircle,
  Plus,
  Users,
  UserPlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GoalManager } from "@/components/goals/GoalManager";
import { StudyHourTracker } from "@/components/study/StudyHourTracker";
import { AchievementManager } from "@/components/achievements/AchievementManager";

interface DashboardProps {
  user: any;
}

export const Dashboard = ({ user }: DashboardProps) => {
  const [streakCount, setStreakCount] = useState(0);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [connections, setConnections] = useState(0);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchConnectionsData();
      checkStreakStatus();
    }
  }, [user]);

  const fetchConnectionsData = async () => {
    try {
      // Fetch user's profile for connection count
      const { data: profile } = await supabase
        .from('profiles')
        .select('connections_count')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setConnections(profile.connections_count || 0);
      }

      // Fetch connected users (recent connections)
      const { data: connectionsData } = await supabase
        .from('connections')
        .select(`
          *,
          user1:profiles!connections_user1_id_fkey(full_name, profile_picture_url),
          user2:profiles!connections_user2_id_fkey(full_name, profile_picture_url)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(3);

      if (connectionsData) {
        const users = connectionsData.map(conn => {
          const otherUser = conn.user1_id === user.id ? conn.user2 : conn.user1;
          return otherUser;
        }).filter(Boolean);
        setConnectedUsers(users);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const checkStreakStatus = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_streak, last_activity_date')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setStreakCount(profile.daily_streak || 0);
        
        // Check if user already checked in today
        const today = new Date().toISOString().split('T')[0];
        const lastActivity = profile.last_activity_date;
        setTodayCheckedIn(lastActivity === today);
      }
    } catch (error) {
      console.error('Error checking streak status:', error);
    }
  };

  const handleDailyCheckIn = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_streak, last_activity_date')
        .eq('user_id', user.id)
        .single();

      let newStreak = 1;
      if (profile?.last_activity_date === yesterday) {
        // Consecutive day - increment streak
        newStreak = (profile.daily_streak || 0) + 1;
      } else if (profile?.last_activity_date === today) {
        // Already checked in today
        return;
      }

      // Update profile with new streak
      const { error } = await supabase
        .from('profiles')
        .update({
          daily_streak: newStreak,
          last_activity_date: today
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setStreakCount(newStreak);
      setTodayCheckedIn(true);
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  // Mock data for planner and projects
  const upcomingTasks = [
    { id: 1, title: "Complete React assignment", dueDate: "Today", priority: "high" },
    { id: 2, title: "Study for Database exam", dueDate: "Tomorrow", priority: "medium" },
    { id: 3, title: "Team project meeting", dueDate: "Friday", priority: "low" },
  ];

  const recentProjects = [
    { id: 1, title: "E-commerce Website", progress: 85, status: "active" },
    { id: 2, title: "Mobile App Design", progress: 60, status: "active" },
    { id: 3, title: "Data Analysis Tool", progress: 100, status: "completed" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary/5 via-background to-accent/5 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.user_metadata?.full_name || "Student"}! 👋
          </h2>
          <p className="text-muted-foreground">Here's what's happening with your college life</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Daily Check-in Streak - Compact */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10" />
            <CardHeader className="relative pb-2">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>Streak</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative pt-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground mb-1">{streakCount}</div>
                <p className="text-xs text-muted-foreground mb-3">days</p>
                {!todayCheckedIn ? (
                  <Button 
                    onClick={handleDailyCheckIn}
                    className="w-full"
                    size="sm"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Check in
                  </Button>
                ) : (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
                    ✓ Done!
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* My Classmates */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
            <CardHeader className="relative pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span>Classmates</span>
                </div>
                <Button variant="ghost" size="sm">
                  <UserPlus className="h-3 w-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative pt-0">
              <div className="space-y-2">
                {connectedUsers.length > 0 ? (
                  connectedUsers.map((connectedUser, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                        {connectedUser?.full_name?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm text-foreground">{connectedUser?.full_name || 'Unknown'}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">No connections yet</p>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View all
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* My Planner */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-primary/10" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>My Planner</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-3">
                {upcomingTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{task.dueDate}</p>
                    </div>
                    <Badge variant={getPriorityColor(task.priority)} className="ml-2">
                      {task.priority}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-3">
                  View all tasks
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* My Projects */}
          <Card className="relative overflow-hidden col-span-2">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-accent/10" />
            <CardHeader className="relative pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  <span>My Projects</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Plus className="h-3 w-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative pt-0">
              <div className="grid grid-cols-2 gap-3">
                {recentProjects.slice(0, 2).map((project) => (
                  <div key={project.id} className="p-3 bg-card/50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {project.title}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {project.progress}%
                      </span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-3">
                View all projects
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <GoalManager />
          <StudyHourTracker />
          
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Connections</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-2">{connections}</div>
                <p className="text-sm text-muted-foreground mb-4">total connections</p>
                <Button size="sm" variant="outline" className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Find more
                </Button>
              </div>
            </CardContent>
          </Card>

          <AchievementManager />
        </div>

      </div>
    </div>
  );
};