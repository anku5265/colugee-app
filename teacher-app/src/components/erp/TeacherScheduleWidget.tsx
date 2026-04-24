import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Users, BookOpen, ClipboardCheck, Check, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Schedule {
  id: string;
  title: string;
  subject: string;
  teacher_name: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_location: string | null;
  target_year: number | null;
  target_section: string | null;
  target_branch: string | null;
  target_department: string | null;
}

interface Student {
  user_id: string;
  full_name: string;
  profile_picture_url: string | null;
  institution_roll_number: string | null;
  year_of_study: number | null;
  section: string | null;
  branch: string | null;
  department: string;
}

interface TeacherScheduleWidgetProps {
  user: any;
  profile: any;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TeacherScheduleWidget = ({ user, profile }: TeacherScheduleWidgetProps) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(new Date().getDay().toString());

  // Attendance dialog state
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, string>>(new Map());
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMySchedules();
  }, [profile]);

  const fetchMySchedules = async () => {
    if (!profile?.full_name) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('teacher_name', profile.full_name)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForSchedule = async (schedule: Schedule, date: Date) => {
    setLoadingStudents(true);
    try {
      let query = supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url, institution_roll_number, year_of_study, section, branch, department')
        .eq('institution_id', profile.institution_id)
        .eq('role', 'student');

      if (schedule.target_year) query = query.eq('year_of_study', schedule.target_year);
      if (schedule.target_section) query = query.eq('section', schedule.target_section);
      if (schedule.target_branch) query = query.eq('branch', schedule.target_branch);
      if (schedule.target_department) query = query.eq('department', schedule.target_department);

      const { data: studentsData, error } = await query.order('full_name');
      if (error) throw error;

      const dateStr = format(date, 'yyyy-MM-dd');
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('schedule_id', schedule.id)
        .eq('attendance_date', dateStr);

      const attendanceMap = new Map<string, string>();
      (studentsData || []).forEach(student => {
        const existing = existingAttendance?.find(a => a.student_id === student.user_id);
        attendanceMap.set(student.user_id, existing?.status || 'absent');
      });

      setStudents(studentsData || []);
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenAttendance = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setSelectedDate(new Date());
    fetchStudentsForSchedule(schedule, new Date());
    setAttendanceDialogOpen(true);
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => new Map(prev).set(studentId, status));
  };

  const handleMarkAll = (status: string) => {
    const newMap = new Map<string, string>();
    students.forEach(s => newMap.set(s.user_id, status));
    setAttendance(newMap);
  };

  const handleSaveAttendance = async () => {
    if (!selectedSchedule || !user) return;
    setSaving(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const records = Array.from(attendance.entries()).map(([studentId, status]) => ({
        schedule_id: selectedSchedule.id,
        student_id: studentId,
        attendance_date: dateStr,
        status,
        marked_by: user.id
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'schedule_id,student_id,attendance_date', ignoreDuplicates: false });

      if (error) throw error;
      toast.success(`Attendance saved for ${records.length} students`);
      setAttendanceDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, late: 0 };
    attendance.forEach(s => { if (s in counts) counts[s as keyof typeof counts]++; });
    return counts;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTodaySchedules = () => {
    const today = new Date().getDay();
    return schedules.filter(s => s.day_of_week === today);
  };

  const getSchedulesByDay = (dayIndex: number) => {
    return schedules.filter(s => s.day_of_week === dayIndex);
  };

  const todaySchedules = getTodaySchedules();
  const totalClasses = schedules.length;
  const uniqueSubjects = [...new Set(schedules.map(s => s.subject))].length;

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (schedules.length === 0) {
    return (
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            My Teaching Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No teaching schedules assigned yet</p>
            <p className="text-sm mt-1">Check back later for updates</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className="glass-effect">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              My Teaching Schedule
            </CardTitle>
            <CardDescription>
              Your assigned classes and lectures
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {totalClasses} Classes
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              {uniqueSubjects} Subjects
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Today's Summary */}
        {todaySchedules.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              Today's Classes ({DAYS[new Date().getDay()]})
            </h4>
            <div className="flex flex-wrap gap-2">
              {todaySchedules.map(s => (
                <Badge key={s.id} variant="default" className="text-xs">
                  {formatTime(s.start_time)} - {s.subject}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Schedule Tabs */}
        <Tabs value={activeDay} onValueChange={setActiveDay}>
          <TabsList className="w-full flex-wrap h-auto gap-1">
            {DAYS.map((day, index) => {
              const daySchedules = getSchedulesByDay(index);
              return (
                <TabsTrigger 
                  key={index} 
                  value={index.toString()}
                  className="flex-1 min-w-[80px] relative"
                >
                  {day.slice(0, 3)}
                  {daySchedules.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                      {daySchedules.length}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {DAYS.map((day, index) => (
            <TabsContent key={index} value={index.toString()} className="mt-4">
              <ScrollArea className="h-[300px]">
                {getSchedulesByDay(index).length > 0 ? (
                  <div className="space-y-3">
                    {getSchedulesByDay(index).map((schedule) => (
                      <div 
                        key={schedule.id}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold">{schedule.title}</h4>
                            <p className="text-sm text-muted-foreground">{schedule.subject}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {schedule.room_location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {schedule.room_location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {schedule.target_year ? `Year ${schedule.target_year}` : 'All Years'}
                            {schedule.target_section && ` - Sec ${schedule.target_section}`}
                            {schedule.target_branch && ` (${schedule.target_branch})`}
                          </span>
                        </div>
                        <div className="mt-3">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleOpenAttendance(schedule)}
                          >
                            <ClipboardCheck className="h-4 w-4 mr-2" />
                            Mark Attendance
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No classes scheduled for {day}</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>

    {/* Attendance Marking Dialog */}
    <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {selectedSchedule?.title}
          </DialogTitle>
          <DialogDescription>
            {selectedSchedule?.subject} • {selectedSchedule && DAYS[selectedSchedule.day_of_week]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Date Picker + Bulk Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date && selectedSchedule) {
                      setSelectedDate(date);
                      fetchStudentsForSchedule(selectedSchedule, date);
                    }
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={() => handleMarkAll('present')}>
              <Check className="h-3 w-3 mr-1" /> All Present
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleMarkAll('absent')}>
              <X className="h-3 w-3 mr-1" /> All Absent
            </Button>
          </div>

          {/* Stats */}
          {students.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-green-500">Present: {getStatusCounts().present}</Badge>
              <Badge variant="destructive">Absent: {getStatusCounts().absent}</Badge>
              <Badge variant="secondary">Late: {getStatusCounts().late}</Badge>
              <Badge variant="outline">Total: {students.length}</Badge>
            </div>
          )}

          {/* Student List */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {loadingStudents ? (
              <div className="p-8 text-center text-muted-foreground">Loading students...</div>
            ) : students.length > 0 ? (
              <div className="divide-y">
                {students.map((student) => (
                  <div key={student.user_id} className="p-3 flex items-center justify-between hover:bg-accent/5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{student.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">{student.institution_roll_number || 'No Roll No'}</p>
                      </div>
                    </div>
                    <Select
                      value={attendance.get(student.user_id) || 'absent'}
                      onValueChange={(value) => handleStatusChange(student.user_id, value)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">
                          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" />Present</span>
                        </SelectItem>
                        <SelectItem value="absent">
                          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" />Absent</span>
                        </SelectItem>
                        <SelectItem value="late">
                          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500" />Late</span>
                        </SelectItem>
                        <SelectItem value="excused">
                          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" />Excused</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No students match this schedule's criteria</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAttendanceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAttendance} disabled={saving || students.length === 0}>
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
};
