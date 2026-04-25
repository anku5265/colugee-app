import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface AttendanceRecord {
  id: string; attendance_date: string; status: string; student_id: string;
  profiles: { full_name: string; department: string } | null;
  schedules: { subject: string; title: string } | null;
}

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { fetchAttendance(); }, [dateFilter]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('attendance').select(`id, attendance_date, status, student_id, schedules:schedule_id (subject, title)`).eq('attendance_date', dateFilter).order('attendance_date', { ascending: false }).limit(100);
      if (error) throw error;
      const studentIds = [...new Set((data||[]).map(r=>r.student_id))];
      let profileMap: Record<string,any> = {};
      if (studentIds.length > 0) {
        const { data: pd } = await supabase.from('profiles').select('user_id, full_name, department').in('user_id', studentIds);
        (pd||[]).forEach(p => { profileMap[p.user_id] = p; });
      }
      setRecords((data||[]).map(r => ({ ...r, profiles: profileMap[r.student_id]||null })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const statusIcon = (s: string) => s==='present'?<CheckCircle className="h-4 w-4 text-green-500"/>:s==='absent'?<XCircle className="h-4 w-4 text-red-500"/>:<Clock className="h-4 w-4 text-yellow-500"/>;
  const statusColor = (s: string) => s==='present'?'bg-green-100 text-green-700':s==='absent'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700';
  const presentCount = records.filter(r=>r.status==='present').length;
  const absentCount = records.filter(r=>r.status==='absent').length;
  const lateCount = records.filter(r=>r.status==='late').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Attendance</h1><p className="text-gray-500">View student attendance records</p></div>
        <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center"><div className="text-3xl font-bold text-green-600">{presentCount}</div><div className="text-sm text-green-700 mt-1">Present</div></div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center"><div className="text-3xl font-bold text-red-600">{absentCount}</div><div className="text-sm text-red-700 mt-1">Absent</div></div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center"><div className="text-3xl font-bold text-yellow-600">{lateCount}</div><div className="text-sm text-yellow-700 mt-1">Late</div></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        : records.length === 0 ? <div className="text-center py-16 text-gray-400"><CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-40" /><p>No records for {dateFilter}</p></div>
        : <table className="w-full"><thead className="bg-gray-50 border-b border-gray-100"><tr><th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th><th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Subject</th><th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th><th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th></tr></thead>
          <tbody className="divide-y divide-gray-50">{records.map(r=>(
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.profiles?.full_name||'Unknown'}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{(r.schedules as any)?.subject||(r.schedules as any)?.title||'—'}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{r.profiles?.department||'—'}</td>
              <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(r.status)}`}>{statusIcon(r.status)}{r.status}</span></td>
            </tr>
          ))}</tbody></table>}
      </div>
    </div>
  );
}
