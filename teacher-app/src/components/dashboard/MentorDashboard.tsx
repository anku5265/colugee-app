import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  MessageCircle, 
  CheckCircle2, 
  Clock,
  Star,
  BookOpen,
  Award,
  UserCheck,
  X,
  Flame
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GoalManager } from "@/components/goals/GoalManager";
import { AchievementManager } from "@/components/achievements/AchievementManager";
import { TeacherScheduleWidget } from "@/components/erp/TeacherScheduleWidget";

interface Profile {
  id: string;
  user_id: string;
  role: 'student' | 'mentor' | 'teacher' | 'authority';
  institution_id: string;
  institution_roll_number: string;
  full_name: string;
  email: string;
  daily_streak: number;
  connections_count: number;
}

interface MentorDashboardProps {
  user: any;
  profile: Profile;
}

export const MentorDashboard = ({ user, profile }: MentorDashboardProps) => {
  const [mentoringRequests, setMentoringRequests] = useState([]);
  const [activeMentees, setActiveMentees] = useState([]);
  const [workTasks, setWorkTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streakCount, setStreakCount] = useState(0);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    checkStreakStatus();
  }, [user]);

  const checkStreakStatus = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('daily_streak, last_activity_date')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setStreakCount(profileData.daily_streak || 0);
        
        // Check if user already checked in today
        const today = new Date().toISOString().split('T')[0];
        const lastActivity = profileData.last_activity_date;
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
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('daily_streak, last_activity_date')
        .eq('user_id', user.id)
        .single();

      let newStreak = 1;
      if (profileData?.last_activity_date === yesterday) {
        // Consecutive day - increment streak
        newStreak = (profileData.daily_streak || 0) + 1;
      } else if (profileData?.last_activity_date === today) {
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

  const fetchDashboardData = async () => {
    try {
      // Fetch mentoring requests
      const { data: requestsData } = await supabase
        .from('mentoring_relationships')
        .select(`
          *,
          mentee:profiles!mentoring_relationships_mentee_id_fkey(*)
        `)
        .eq('mentor_id', profile.id)
        .eq('status', 'pending');

      // Fetch active mentees
      const { data: menteesData } = await supabase
        .from('mentoring_relationships')
        .select(`
          *,
          mentee:profiles!mentoring_relationships_mentee_id_fkey(*)
        `)
        .eq('mentor_id', profile.id)
        .eq('status', 'active');

      // Fetch work assignments
      const { data: workData } = await supabase
        .from('work_assignments')
        .select('*')
        .eq('assigned_to', profile.id)
        .limit(5);

      setMentoringRequests(requestsData || []);
      setActiveMentees(menteesData || []);
      setWorkTasks(workData || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMentoringRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const status = action === 'accept' ? 'active' : 'rejected';
      
      const { error } = await supabase
        .from('mentoring_relationships')
        .update({ status })
        .eq('id', requestId);

      if (!error) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error handling mentoring request:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      case "urgent": return "destructive";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Mentor Dashboard 🌟
        </h1>
        <p className="text-muted-foreground text-lg">
          {profile.full_name} • Empowering the next generation
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-effect hover-lift">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-full mx-auto mb-2">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-500">{streakCount}</div>
            <div className="text-sm text-muted-foreground mb-2">Day Streak</div>
            {!todayCheckedIn ? (
              <Button 
                onClick={handleDailyCheckIn}
                size="sm"
                className="w-full text-xs"
              >
                Check In
              </Button>
            ) : (
              <Badge variant="default" className="bg-green-500 text-xs">
                ✓ Done!
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="glass-effect hover-lift">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full mx-auto mb-2">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-500">{activeMentees.length}</div>
            <div className="text-sm text-muted-foreground">Active Mentees</div>
          </CardContent>
        </Card>

        <Card className="glass-effect hover-lift">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-full mx-auto mb-2">
              <Clock className="h-6 w-6 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-500">{mentoringRequests.length}</div>
            <div className="text-sm text-muted-foreground">Pending Requests</div>
          </CardContent>
        </Card>

        <Card className="glass-effect hover-lift">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-full mx-auto mb-2">
              <Star className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-500">4.8</div>
            <div className="text-sm text-muted-foreground">Rating</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mentoring Requests */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Mentoring Requests ({mentoringRequests.length})
              </CardTitle>
              <CardDescription>Students seeking your guidance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mentoringRequests.length > 0 ? (
                  mentoringRequests.map((request: any) => (
                    <div key={request.id} className="p-4 border border-border/50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={request.mentee?.profile_picture_url} />
                            <AvatarFallback>{request.mentee?.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{request.mentee?.full_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {request.mentee?.department} • {request.mentee?.institution_roll_number}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleMentoringRequest(request.id, 'accept')}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMentoringRequest(request.id, 'reject')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending mentoring requests</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Work Management */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-accent" />
                Work Assignments
              </CardTitle>
              <CardDescription>Your tasks and responsibilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workTasks.length > 0 ? (
                  workTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No work assignments</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Active Mentees */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Active Mentees ({activeMentees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeMentees.length > 0 ? (
                  activeMentees.map((mentee: any) => (
                    <div key={mentee.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={mentee.mentee?.profile_picture_url} />
                          <AvatarFallback>{mentee.mentee?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{mentee.mentee?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{mentee.mentee?.department}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active mentees yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Mentor Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 border border-border/50 rounded-lg">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Mentor of the Month</p>
                    <p className="text-xs text-muted-foreground">Top rated mentor</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 border border-border/50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">10+ Mentees</p>
                    <p className="text-xs text-muted-foreground">Successfully mentored</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Teaching Schedule (if mentor teaches classes) */}
      <TeacherScheduleWidget user={user} profile={profile} />

      {/* Integrated Components */}
      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        <TabsContent value="goals" className="mt-6">
          <GoalManager />
        </TabsContent>
        <TabsContent value="achievements" className="mt-6">
          <AchievementManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};