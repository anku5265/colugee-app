import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AttendanceChartProps {
  userId: string;
}

interface AttendanceStats {
  total_classes: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_percentage: number;
}

interface SubjectAttendance {
  subject: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

const chartConfig = {
  present: { label: "Present", color: "hsl(var(--chart-1))" },
  absent: { label: "Absent", color: "hsl(var(--chart-2))" },
  late: { label: "Late", color: "hsl(var(--chart-3))" },
};

export const AttendanceChart = ({ userId }: AttendanceChartProps) => {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [subjectWise, setSubjectWise] = useState<SubjectAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
  }, [userId]);

  const fetchAttendanceData = async () => {
    try {
      // Fetch overall stats using RPC function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_attendance_stats', { p_student_id: userId, p_days: 30 });

      if (statsError) throw statsError;

      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // Fetch subject-wise attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          status,
          schedules:schedule_id (subject)
        `)
        .eq('student_id', userId);

      if (attendanceError) throw attendanceError;

      // Aggregate by subject
      const subjectMap = new Map<string, { present: number; absent: number; late: number }>();
      
      (attendanceData || []).forEach((record: any) => {
        const subject = record.schedules?.subject || 'Unknown';
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, { present: 0, absent: 0, late: 0 });
        }
        const current = subjectMap.get(subject)!;
        if (record.status === 'present') current.present++;
        else if (record.status === 'absent') current.absent++;
        else if (record.status === 'late') current.late++;
      });

      const subjectData: SubjectAttendance[] = Array.from(subjectMap.entries()).map(([subject, data]) => {
        const total = data.present + data.absent + data.late;
        return {
          subject,
          present: data.present,
          absent: data.absent,
          total,
          percentage: total > 0 ? Math.round(((data.present + data.late) / total) * 100) : 0
        };
      });

      setSubjectWise(subjectData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!stats) return <Minus className="h-4 w-4" />;
    if (stats.attendance_percentage >= 75) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (stats.attendance_percentage >= 50) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = () => {
    if (!stats) return "secondary";
    if (stats.attendance_percentage >= 75) return "default";
    if (stats.attendance_percentage >= 50) return "secondary";
    return "destructive";
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const pieData = stats ? [
    { name: 'Present', value: stats.present_count, fill: 'hsl(var(--chart-1))' },
    { name: 'Absent', value: stats.absent_count, fill: 'hsl(var(--chart-2))' },
    { name: 'Late', value: stats.late_count, fill: 'hsl(var(--chart-3))' },
  ] : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Overall Attendance Card */}
      <Card className="glass-effect">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            Attendance Overview
            <Badge variant={getStatusColor() as any}>
              {getStatusIcon()}
              <span className="ml-1">{stats?.attendance_percentage || 0}%</span>
            </Badge>
          </CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {stats && stats.total_classes > 0 ? (
            <ChartContainer config={chartConfig} className="h-48 w-full">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">No attendance data available</p>
            </div>
          )}
          
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="p-2 rounded-lg bg-green-500/10">
              <div className="text-lg font-bold text-green-500">{stats?.present_count || 0}</div>
              <div className="text-xs text-muted-foreground">Present</div>
            </div>
            <div className="p-2 rounded-lg bg-red-500/10">
              <div className="text-lg font-bold text-red-500">{stats?.absent_count || 0}</div>
              <div className="text-xs text-muted-foreground">Absent</div>
            </div>
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <div className="text-lg font-bold text-yellow-500">{stats?.late_count || 0}</div>
              <div className="text-xs text-muted-foreground">Late</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject-wise Attendance */}
      <Card className="glass-effect">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Subject-wise Attendance</CardTitle>
          <CardDescription>Breakdown by subject</CardDescription>
        </CardHeader>
        <CardContent>
          {subjectWise.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-48 w-full">
              <BarChart data={subjectWise} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="subject" width={80} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="percentage" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                  name="Attendance %"
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">No subject data available</p>
            </div>
          )}
          
          {/* Subject Legend */}
          <div className="space-y-2 mt-4 max-h-24 overflow-y-auto">
            {subjectWise.map((subject) => (
              <div key={subject.subject} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{subject.subject}</span>
                <Badge 
                  variant={subject.percentage >= 75 ? "default" : subject.percentage >= 50 ? "secondary" : "destructive"}
                  className="ml-2"
                >
                  {subject.percentage}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
