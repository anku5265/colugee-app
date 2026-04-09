import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, BarChart3, Users, Calendar, Megaphone } from 'lucide-react';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const [
        studentsRes, teachersRes, mentorsRes, authorityRes,
        eventsRes, postsRes, connectionsRes, announcementsRes
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'mentor'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'authority'),
        supabase.from('campus_events').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('connections').select('id', { count: 'exact', head: true }),
        supabase.from('announcements').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        students: studentsRes.count || 0,
        teachers: teachersRes.count || 0,
        mentors: mentorsRes.count || 0,
        authority: authorityRes.count || 0,
        events: eventsRes.count || 0,
        posts: postsRes.count || 0,
        connections: connectionsRes.count || 0,
        announcements: announcementsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500">Platform-wide statistics and insights</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Students', value: stats?.students, color: 'blue', icon: Users },
          { label: 'Teachers', value: stats?.teachers, color: 'green', icon: Users },
          { label: 'Mentors', value: stats?.mentors, color: 'purple', icon: Users },
          { label: 'Authority', value: stats?.authority, color: 'orange', icon: Users },
        ].map((item) => (
          <div key={item.label} className={`bg-${item.color}-50 border border-${item.color}-100 rounded-xl p-5`}>
            <div className={`text-3xl font-bold text-${item.color}-600`}>{item.value}</div>
            <div className={`text-sm text-${item.color}-700 mt-1`}>{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Campus Events', value: stats?.events, icon: Calendar },
          { label: 'Posts', value: stats?.posts, icon: BarChart3 },
          { label: 'Connections', value: stats?.connections, icon: Users },
          { label: 'Announcements', value: stats?.announcements, icon: Megaphone },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <item.icon className="h-6 w-6 text-gray-400 mb-2" />
            <div className="text-3xl font-bold text-gray-900">{item.value}</div>
            <div className="text-sm text-gray-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">User Distribution</h2>
        <div className="space-y-3">
          {[
            { label: 'Students', value: stats?.students, total: stats?.students + stats?.teachers + stats?.mentors + stats?.authority, color: 'bg-blue-500' },
            { label: 'Teachers', value: stats?.teachers, total: stats?.students + stats?.teachers + stats?.mentors + stats?.authority, color: 'bg-green-500' },
            { label: 'Mentors', value: stats?.mentors, total: stats?.students + stats?.teachers + stats?.mentors + stats?.authority, color: 'bg-purple-500' },
            { label: 'Authority', value: stats?.authority, total: stats?.students + stats?.teachers + stats?.mentors + stats?.authority, color: 'bg-orange-500' },
          ].map((item) => {
            const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
            return (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium">{item.value} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
