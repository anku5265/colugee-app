import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { 
  FileText, 
  Users, 
  CheckCircle2, 
  TrendingUp,
  Zap,
  Shield,
  Calendar,
  X,
  Flame,
  Megaphone,
  GraduationCap,
  Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarTaskManager } from "./CalendarTaskManager";
import { SecureAdminPanel } from "./SecureAdminPanel";
import { AttendanceManager } from "@/components/erp/AttendanceManager";
import { TeacherScheduleWidget } from "@/components/erp/TeacherScheduleWidget";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

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

interface AuthorityDashboardProps {
  user: any;
  profile: Profile;
}

export const AuthorityDashboard = ({ user, profile }: AuthorityDashboardProps) => {
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [institutionStats, setInstitutionStats] = useState({
    totalStudents: 0,
    totalMentors: 0,
    totalTeachers: 0,
    activeEvents: 0
  });
  const [loading, setLoading] = useState(true);
  const [streakCount, setStreakCount] = useState(0);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    announcement_type: 'department_update',
    audience: ['all']
  });

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
      // Fetch approval requests assigned to this authority
      const { data: requestsData } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('assigned_to', profile.id)
        .eq('status', 'pending')
        .limit(10);

      // Fetch institution statistics using count
      const { count: studentsTotal } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('institution_id', profile.institution_id)
        .eq('role', 'student');

      const { count: mentorsTotal } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('institution_id', profile.institution_id)
        .eq('role', 'mentor');

      const { count: teachersTotal } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('institution_id', profile.institution_id)
        .eq('role', 'teacher');

      const { count: eventsTotal } = await supabase
        .from('campus_events')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      setApprovalRequests(requestsData || []);
      setInstitutionStats({
        totalStudents: studentsTotal || 0,
        totalMentors: mentorsTotal || 0,
        totalTeachers: teachersTotal || 0,
        activeEvents: eventsTotal || 0
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      
      const { error } = await supabase
        .from('approval_requests')
        .update({ status })
        .eq('id', requestId);

      if (!error) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error handling approval request:', error);
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

  const handleAudienceChange = (role: string, checked: boolean) => {
    if (role === 'all') {
      setAnnouncementForm(prev => ({
        ...prev,
        audience: checked ? ['all'] : []
      }));
    } else {
      setAnnouncementForm(prev => {
        const currentAudience = prev.audience.filter(a => a !== 'all');
        const newAudience = checked 
          ? [...currentAudience, role]
          : currentAudience.filter(a => a !== role);
        
        return {
          ...prev,
          audience: newAudience.length === 0 ? ['all'] : newAudience
        };
      });
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (announcementForm.audience.length === 0) {
      toast.error('Please select at least one audience');
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: announcementForm.title.trim(),
          content: announcementForm.content.trim(),
          announcement_type: announcementForm.announcement_type,
          audience: announcementForm.audience,
          created_by: user.id,
          institution_id: profile.institution_id
        });

      if (error) throw error;

      toast.success('Announcement created successfully');
      setAnnouncementDialogOpen(false);
      setAnnouncementForm({
        title: '',
        content: '',
        announcement_type: 'department_update',
        audience: ['all']
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
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
          Authority Dashboard 🏛️
        </h1>
        <p className="text-muted-foreground text-lg">
          {profile.full_name} • {profile.role === 'authority' ? 'Administrative Oversight' : 'Academic Leadership'}
        </p>
      </div>

      {/* Institution Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <div className="text-2xl font-bold text-blue-500">{institutionStats.totalStudents}</div>
            <div className="text-sm text-muted-foreground">Students</div>
          </CardContent>
        </Card>

        <Card className="glass-effect hover-lift">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-full mx-auto mb-2">
              <Shield className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-500">{institutionStats.totalMentors}</div>
            <div className="text-sm text-muted-foreground">Mentors</div>
          </CardContent>
        </Card>

        <Card className="glass-effect hover-lift">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-full mx-auto mb-2">
              <GraduationCap className="h-6 w-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-500">{institutionStats.totalTeachers}</div>
            <div className="text-sm text-muted-foreground">Teachers</div>
          </CardContent>
        </Card>

        <Card className="glass-effect hover-lift">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-500/10 rounded-full mx-auto mb-2">
              <Calendar className="h-6 w-6 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-500">{institutionStats.activeEvents}</div>
            <div className="text-sm text-muted-foreground">Active Events</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Approval Requests */}
        <div className="lg:col-span-2">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Pending Approvals ({approvalRequests.length})
              </CardTitle>
              <CardDescription>Requests requiring your approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvalRequests.length > 0 ? (
                  approvalRequests.map((request: any) => (
                    <div key={request.id} className="p-4 border border-border/50 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{request.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Type: {request.request_type}</span>
                            <span>•</span>
                            <span>Priority: {request.priority}</span>
                          </div>
                        </div>
                        <Badge variant={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprovalRequest(request.id, 'approve')}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleApprovalRequest(request.id, 'reject')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending approvals</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setAnnouncementDialogOpen(true)}
              >
                <Megaphone className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 border border-border/50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">5 new students enrolled</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 border border-border/50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Event approved</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 border border-border/50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New event created</p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* My Teaching Schedule (for teachers/authority who teach) */}
      <TeacherScheduleWidget user={user} profile={profile} />

      {/* ERP - Attendance Management */}
      <AttendanceManager user={user} institutionId={profile.institution_id} />

      {/* Task Calendar */}
      <CalendarTaskManager userId={user.id} />

      {/* Secure Admin Panel */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Secure Admin Panel
          </CardTitle>
          <CardDescription>
            Password-protected user management with audit logging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SecureAdminPanel user={user} profile={profile} />
        </CardContent>
      </Card>

      {/* Create Announcement Dialog */}
      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Create New Announcement
            </DialogTitle>
            <DialogDescription>
              Share important updates with your institution members
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Announcement title"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                maxLength={200}
              />
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Announcement details..."
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {announcementForm.content.length}/1000 characters
              </p>
            </div>

            <div>
              <Label htmlFor="type">Announcement Type</Label>
              <Select
                value={announcementForm.announcement_type}
                onValueChange={(value) => setAnnouncementForm(prev => ({ ...prev, announcement_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="department_update">Department Update</SelectItem>
                  <SelectItem value="college_circular">College Circular</SelectItem>
                  <SelectItem value="club_event">Club/Event Announcement</SelectItem>
                  <SelectItem value="authority_alert">Authority Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-3 block">Target Audience *</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="all"
                    checked={announcementForm.audience.includes('all')}
                    onCheckedChange={(checked) => handleAudienceChange('all', checked as boolean)}
                  />
                  <Label htmlFor="all" className="cursor-pointer font-normal">
                    All Users (Everyone in the institution)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="student"
                    checked={announcementForm.audience.includes('student')}
                    onCheckedChange={(checked) => handleAudienceChange('student', checked as boolean)}
                    disabled={announcementForm.audience.includes('all')}
                  />
                  <Label htmlFor="student" className="cursor-pointer font-normal">
                    Students
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mentor"
                    checked={announcementForm.audience.includes('mentor')}
                    onCheckedChange={(checked) => handleAudienceChange('mentor', checked as boolean)}
                    disabled={announcementForm.audience.includes('all')}
                  />
                  <Label htmlFor="mentor" className="cursor-pointer font-normal">
                    Mentors
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="teacher"
                    checked={announcementForm.audience.includes('teacher')}
                    onCheckedChange={(checked) => handleAudienceChange('teacher', checked as boolean)}
                    disabled={announcementForm.audience.includes('all')}
                  />
                  <Label htmlFor="teacher" className="cursor-pointer font-normal">
                    Teachers
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="authority"
                    checked={announcementForm.audience.includes('authority')}
                    onCheckedChange={(checked) => handleAudienceChange('authority', checked as boolean)}
                    disabled={announcementForm.audience.includes('all')}
                  />
                  <Label htmlFor="authority" className="cursor-pointer font-normal">
                    Authorities
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleCreateAnnouncement}
                className="flex-1"
              >
                <Megaphone className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
              <Button 
                variant="outline"
                onClick={() => setAnnouncementDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};