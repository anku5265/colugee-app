import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Calendar } from "lucide-react";
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

interface ScheduleCopyToolProps {
  user: any;
  institutionId: string;
  onCopyComplete: () => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const ScheduleCopyTool = ({ user, institutionId, onCopyComplete }: ScheduleCopyToolProps) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  
  // Target selection
  const [targetYear, setTargetYear] = useState<string>("all");
  const [targetSection, setTargetSection] = useState<string>("");
  const [targetBranch, setTargetBranch] = useState<string>("");

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

  const toggleSchedule = (id: string) => {
    setSelectedSchedules(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedSchedules.length === schedules.length) {
      setSelectedSchedules([]);
    } else {
      setSelectedSchedules(schedules.map(s => s.id));
    }
  };

  const handleCopy = async () => {
    if (selectedSchedules.length === 0) {
      toast.error("Please select at least one schedule to copy");
      return;
    }

    setCopying(true);
    try {
      const schedulesToCopy = schedules.filter(s => selectedSchedules.includes(s.id));
      
      const newSchedules = schedulesToCopy.map(s => ({
        title: s.title,
        subject: s.subject,
        teacher_name: s.teacher_name,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        room_location: s.room_location,
        target_year: targetYear === "all" ? null : parseInt(targetYear),
        target_section: targetSection || null,
        target_branch: targetBranch || null,
        target_department: s.target_department,
        institution_id: institutionId,
        created_by: user.id
      }));

      const { error } = await supabase
        .from('schedules')
        .insert(newSchedules);

      if (error) throw error;

      toast.success(`Copied ${selectedSchedules.length} schedules to new target`);
      setSelectedSchedules([]);
      onCopyComplete();
    } catch (error: any) {
      console.error('Error copying schedules:', error);
      toast.error(error.message || "Failed to copy schedules");
    } finally {
      setCopying(false);
    }
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
              <div key={i} className="h-12 bg-muted rounded" />
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
          <Copy className="h-5 w-5 text-primary" />
          Copy Schedules to Section
        </CardTitle>
        <CardDescription>
          Duplicate existing schedules to different years, sections, or branches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Target Selection */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <Label>Target Year</Label>
              <Select value={targetYear} onValueChange={setTargetYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
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
              <Select value={targetSection || "none"} onValueChange={(v) => setTargetSection(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Change</SelectItem>
                  <SelectItem value="A">Section A</SelectItem>
                  <SelectItem value="B">Section B</SelectItem>
                  <SelectItem value="C">Section C</SelectItem>
                  <SelectItem value="D">Section D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Branch</Label>
              <Select value={targetBranch || "none"} onValueChange={(v) => setTargetBranch(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Change</SelectItem>
                  <SelectItem value="CSE">CSE</SelectItem>
                  <SelectItem value="ECE">ECE</SelectItem>
                  <SelectItem value="EEE">EEE</SelectItem>
                  <SelectItem value="ME">ME</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Schedule Selection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedSchedules.length === schedules.length && schedules.length > 0}
                onCheckedChange={selectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedSchedules.length} of {schedules.length} selected
              </span>
            </div>
            <Button 
              onClick={handleCopy} 
              disabled={copying || selectedSchedules.length === 0}
            >
              {copying ? 'Copying...' : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Selected
                </>
              )}
            </Button>
          </div>

          <ScrollArea className="h-[300px] rounded-md border">
            <div className="p-4 space-y-2">
              {schedules.length > 0 ? (
                schedules.map((schedule) => (
                  <div 
                    key={schedule.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSchedules.includes(schedule.id) 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-accent/5'
                    }`}
                    onClick={() => toggleSchedule(schedule.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedSchedules.includes(schedule.id)}
                        onCheckedChange={() => toggleSchedule(schedule.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{schedule.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {DAYS[schedule.day_of_week]}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <span>{schedule.subject}</span>
                          <span>•</span>
                          <span>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {schedule.target_year && <Badge variant="secondary" className="text-xs">Y{schedule.target_year}</Badge>}
                          {schedule.target_section && <Badge variant="secondary" className="text-xs">Sec {schedule.target_section}</Badge>}
                          {schedule.target_branch && <Badge variant="secondary" className="text-xs">{schedule.target_branch}</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No schedules available to copy</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
