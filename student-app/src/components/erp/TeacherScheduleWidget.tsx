import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, Users, BookOpen } from "lucide-react";
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

interface TeacherScheduleWidgetProps {
  user: any;
  profile: any;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TeacherScheduleWidget = ({ profile }: TeacherScheduleWidgetProps) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(new Date().getDay().toString());

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
    } finally {
      setLoading(false);
    }
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
                          <div>
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
  );
};
