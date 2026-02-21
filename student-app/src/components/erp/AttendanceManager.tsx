import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClipboardCheck, Calendar as CalendarIcon, Users, Check, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Schedule {
  id: string;
  title: string;
  subject: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
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


interface AttendanceManagerProps {
  user: any;
  institutionId: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AttendanceManager = ({ user, institutionId }: AttendanceManagerProps) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Map<string, string>>(new Map());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('institution_id', institutionId)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForSchedule = async (schedule: Schedule) => {
    try {
      let query = supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url, institution_roll_number, year_of_study, section, branch, department')
        .eq('institution_id', institutionId)
        .eq('role', 'student');

      // Filter by schedule's target criteria
      if (schedule.target_year) {
        query = query.eq('year_of_study', schedule.target_year);
      }
      if (schedule.target_section) {
        query = query.eq('section', schedule.target_section);
      }
      if (schedule.target_branch) {
        query = query.eq('branch', schedule.target_branch);
      }
      if (schedule.target_department) {
        query = query.eq('department', schedule.target_department);
      }

      const { data, error } = await query.order('full_name');

      if (error) throw error;
      setStudents(data || []);

      // Fetch existing attendance for this schedule and date
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('schedule_id', schedule.id)
        .eq('attendance_date', dateStr);

      // Initialize attendance map
      const attendanceMap = new Map<string, string>();
      (data || []).forEach(student => {
        const existing = existingAttendance?.find(a => a.student_id === student.user_id);
        attendanceMap.set(student.user_id, existing?.status || 'absent');
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleOpenDialog = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    fetchStudentsForSchedule(schedule);
    setDialogOpen(true);
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => new Map(prev).set(studentId, status));
  };

  const handleMarkAll = (status: string) => {
    const newAttendance = new Map<string, string>();
    students.forEach(student => {
      newAttendance.set(student.user_id, status);
    });
    setAttendance(newAttendance);
  };

  const handleSaveAttendance = async () => {
    if (!selectedSchedule) return;

    setSaving(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Prepare attendance records
      const records = Array.from(attendance.entries()).map(([studentId, status]) => ({
        schedule_id: selectedSchedule.id,
        student_id: studentId,
        attendance_date: dateStr,
        status,
        marked_by: user.id
      }));

      // Upsert attendance records
      const { error } = await supabase
        .from('attendance')
        .upsert(records, { 
          onConflict: 'schedule_id,student_id,attendance_date',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast.success(`Attendance marked for ${records.length} students`);
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast.error(error.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    attendance.forEach(status => {
      counts[status as keyof typeof counts]++;
    });
    return counts;
  };

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

  return (
    <>
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Mark Attendance
          </CardTitle>
          <CardDescription>Select a schedule to mark attendance</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length > 0 ? (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div 
                  key={schedule.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors cursor-pointer"
                  onClick={() => handleOpenDialog(schedule)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{schedule.title}</h4>
                      <p className="text-sm text-muted-foreground">{schedule.subject}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{DAYS[schedule.day_of_week]}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Mark
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No schedules available</p>
              <p className="text-sm">Create schedules first to mark attendance</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Marking Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
            {/* Date Picker */}
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(selectedDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        if (selectedSchedule) fetchStudentsForSchedule(selectedSchedule);
                      }
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleMarkAll('present')}
                >
                  <Check className="h-3 w-3 mr-1" /> All Present
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleMarkAll('absent')}
                >
                  <X className="h-3 w-3 mr-1" /> All Absent
                </Button>
              </div>
            </div>

            {/* Stats */}
            {students.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="default" className="bg-green-500">
                  Present: {getStatusCounts().present}
                </Badge>
                <Badge variant="destructive">
                  Absent: {getStatusCounts().absent}
                </Badge>
                <Badge variant="secondary">
                  Late: {getStatusCounts().late}
                </Badge>
                <Badge variant="outline">
                  Total: {students.length}
                </Badge>
              </div>
            )}

            {/* Student List */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {students.length > 0 ? (
                <div className="divide-y">
                  {students.map((student) => (
                    <div 
                      key={student.user_id}
                      className="p-3 flex items-center justify-between hover:bg-accent/5"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={student.profile_picture_url || undefined} />
                          <AvatarFallback>{student.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.institution_roll_number || 'No Roll No'}
                          </p>
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
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              Present
                            </span>
                          </SelectItem>
                          <SelectItem value="absent">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              Absent
                            </span>
                          </SelectItem>
                          <SelectItem value="late">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-500" />
                              Late
                            </span>
                          </SelectItem>
                          <SelectItem value="excused">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              Excused
                            </span>
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
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
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
