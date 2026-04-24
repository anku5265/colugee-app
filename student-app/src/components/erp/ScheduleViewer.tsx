import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

interface ScheduleViewerProps {
  profile: {
    user_id?: string;
    year_of_study?: number;
    section?: string;
    branch?: string;
    department: string;
  };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  present: { label: 'Present', className: 'bg-green-500 text-white' },
  absent: { label: 'Absent', className: 'bg-red-500 text-white' },
  late: { label: 'Late', className: 'bg-yellow-500 text-white' },
  excused: { label: 'Excused', className: 'bg-blue-500 text-white' },
};

export const ScheduleViewer = ({ profile }: ScheduleViewerProps) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  // Map of scheduleId -> status for today's attendance
  const [todayAttendance, setTodayAttendance] = useState<Map<string, string>>(new Map());
  const today = new Date().getDay();

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;

      const filteredSchedules = (data || []).filter((schedule: Schedule) => {
        const matchesYear = !schedule.target_year || schedule.target_year === profile.year_of_study;
        const matchesSection = !schedule.target_section || schedule.target_section === profile.section;
        const matchesBranch = !schedule.target_branch || schedule.target_branch === profile.branch;
        const matchesDept = !schedule.target_department || schedule.target_department === profile.department;
        return matchesYear && matchesSection && matchesBranch && matchesDept;
      });

      setSchedules(filteredSchedules);

      // Fetch today's attendance for these schedules
      if (profile.user_id && filteredSchedules.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const scheduleIds = filteredSchedules.map(s => s.id);
        const { data: attData } = await supabase
          .from('attendance')
          .select('schedule_id, status')
          .eq('student_id', profile.user_id)
          .eq('attendance_date', todayStr)
          .in('schedule_id', scheduleIds);

        const attMap = new Map<string, string>();
        (attData || []).forEach((a: any) => attMap.set(a.schedule_id, a.status));
        setTodayAttendance(attMap);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSchedulesForDay = (dayIndex: number) => {
    return schedules.filter(s => s.day_of_week === dayIndex);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          My Class Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={today.toString()} className="w-full">
          <TabsList className="grid grid-cols-7 w-full mb-4">
            {DAYS.map((day, index) => (
              <TabsTrigger 
                key={index} 
                value={index.toString()}
                className="text-xs px-1"
              >
                {day.substring(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {DAYS.map((day, index) => {
            const daySchedules = getSchedulesForDay(index);
            return (
              <TabsContent key={index} value={index.toString()}>
                <div className="space-y-3">
                  {daySchedules.length > 0 ? (
                    daySchedules.map((schedule) => (
                      <div 
                        key={schedule.id}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold">{schedule.title}</h4>
                            <p className="text-sm text-muted-foreground">{schedule.subject}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </span>
                              {schedule.room_location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {schedule.room_location}
                                </span>
                              )}
                              {schedule.teacher_name && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {schedule.teacher_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {formatTime(schedule.start_time)}
                            </Badge>
                            {/* Show today's attendance status */}
                            {index === today && todayAttendance.has(schedule.id) && (() => {
                              const status = todayAttendance.get(schedule.id)!;
                              const style = STATUS_STYLES[status] || { label: status, className: 'bg-gray-500 text-white' };
                              return (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.className}`}>
                                  {style.label}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No classes scheduled for {day}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
};
