import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Edit, Trash2, Clock, MapPin, User } from "lucide-react";
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

interface ScheduleManagerProps {
  user: any;
  institutionId: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const defaultForm = {
  title: '',
  subject: '',
  teacher_name: '',
  day_of_week: 1,
  start_time: '09:00',
  end_time: '10:00',
  room_location: '',
  target_year: '',
  target_section: '',
  target_branch: '',
  target_department: ''
};

export const ScheduleManager = ({ user, institutionId }: ScheduleManagerProps) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

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
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setForm({
        title: schedule.title,
        subject: schedule.subject,
        teacher_name: schedule.teacher_name || '',
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        room_location: schedule.room_location || '',
        target_year: schedule.target_year?.toString() || '',
        target_section: schedule.target_section || '',
        target_branch: schedule.target_branch || '',
        target_department: schedule.target_department || ''
      });
    } else {
      setEditingSchedule(null);
      setForm(defaultForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.subject.trim()) {
      toast.error('Title and Subject are required');
      return;
    }

    setSaving(true);
    try {
      const scheduleData = {
        title: form.title.trim(),
        subject: form.subject.trim(),
        teacher_name: form.teacher_name.trim() || null,
        day_of_week: Number(form.day_of_week),
        start_time: form.start_time,
        end_time: form.end_time,
        room_location: form.room_location.trim() || null,
        target_year: form.target_year ? parseInt(form.target_year) : null,
        target_section: form.target_section.trim() || null,
        target_branch: form.target_branch.trim() || null,
        target_department: form.target_department.trim() || null,
        institution_id: institutionId,
        created_by: user.id
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id);

        if (error) throw error;
        toast.success('Schedule updated successfully');
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert(scheduleData);

        if (error) throw error;
        toast.success('Schedule created successfully');
      }

      setDialogOpen(false);
      fetchSchedules();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast.error(error.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Schedule deleted');
      fetchSchedules();
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      toast.error(error.message || 'Failed to delete schedule');
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const groupedSchedules = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    schedules: schedules.filter(s => s.day_of_week === index)
  })).filter(g => g.schedules.length > 0);

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
    <>
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Schedule Management
              </CardTitle>
              <CardDescription>Create and manage class schedules</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {groupedSchedules.length > 0 ? (
            <div className="space-y-6">
              {groupedSchedules.map(({ day, schedules }) => (
                <div key={day}>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Badge variant="outline">{day}</Badge>
                    <span className="text-sm text-muted-foreground">({schedules.length} classes)</span>
                  </h3>
                  <div className="space-y-2">
                    {schedules.map((schedule) => (
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
                            <div className="flex flex-wrap gap-1 mt-2">
                              {schedule.target_year && (
                                <Badge variant="secondary" className="text-xs">Year {schedule.target_year}</Badge>
                              )}
                              {schedule.target_section && (
                                <Badge variant="secondary" className="text-xs">Sec {schedule.target_section}</Badge>
                              )}
                              {schedule.target_branch && (
                                <Badge variant="secondary" className="text-xs">{schedule.target_branch}</Badge>
                              )}
                              {schedule.target_department && (
                                <Badge variant="secondary" className="text-xs">{schedule.target_department}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenDialog(schedule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDelete(schedule.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No schedules created yet</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Schedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
            </DialogTitle>
            <DialogDescription>
              {editingSchedule ? 'Update the schedule details' : 'Add a new class schedule'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Title *</Label>
                <Input 
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Data Structures Lecture"
                />
              </div>
              
              <div className="col-span-2">
                <Label>Subject *</Label>
                <Input 
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g., Computer Science"
                />
              </div>
              
              <div>
                <Label>Day of Week</Label>
                <Select 
                  value={form.day_of_week.toString()}
                  onValueChange={(v) => setForm({ ...form, day_of_week: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Teacher Name</Label>
                <Input 
                  value={form.teacher_name}
                  onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
                  placeholder="e.g., Dr. Smith"
                />
              </div>
              
              <div>
                <Label>Start Time</Label>
                <Input 
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              
              <div>
                <Label>End Time</Label>
                <Input 
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
              
              <div className="col-span-2">
                <Label>Room/Location</Label>
                <Input 
                  value={form.room_location}
                  onChange={(e) => setForm({ ...form, room_location: e.target.value })}
                  placeholder="e.g., Room 101"
                />
              </div>
              
              <div>
                <Label>Target Year</Label>
                <Select 
                  value={form.target_year || "all"}
                  onValueChange={(v) => setForm({ ...form, target_year: v === "all" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                    <SelectItem value="4">Year 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Target Section</Label>
                <Input 
                  value={form.target_section}
                  onChange={(e) => setForm({ ...form, target_section: e.target.value })}
                  placeholder="e.g., A"
                />
              </div>
              
              <div>
                <Label>Target Branch</Label>
                <Input 
                  value={form.target_branch}
                  onChange={(e) => setForm({ ...form, target_branch: e.target.value })}
                  placeholder="e.g., CSE"
                />
              </div>
              
              <div>
                <Label>Target Department</Label>
                <Input 
                  value={form.target_department}
                  onChange={(e) => setForm({ ...form, target_department: e.target.value })}
                  placeholder="e.g., Engineering"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (editingSchedule ? 'Update' : 'Create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
