import { useState, useEffect } from 'react';
import { Users, GraduationCap, Calendar, FileText, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    activeEvents: 0,
    totalAnnouncements: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [studentsRes, facultyRes, eventsRes, announcementsRes, activityRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['teacher', 'authority', 'mentor']),
        supabase.from('campus_events').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('announcements').select('id', { count: 'exact', head: true }),
        supabase.from('announcements').select('title, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        totalStudents: studentsRes.count || 0,
        totalFaculty: facultyRes.count || 0,
        activeEvents: eventsRes.count || 0,
        totalAnnouncements: announcementsRes.count || 0,
      });

      setRecentActivity(activityRes.data || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'blue' },
    { label: 'Total Faculty', value: stats.totalFaculty, icon: GraduationCap, color: 'green' },
    { label: 'Active Events', value: stats.activeEvents, icon: Calendar, color: 'purple' },
    { label: 'Announcements', value: stats.totalAnnouncements, icon: FileText, color: 'orange' },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome to Colugee Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Live
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</h3>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Recent Announcements</h2>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm text-gray-700 truncate flex-1 mr-4">{item.title}</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No announcements yet</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <a href="/users" className="block w-full text-left px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium">
              👥 Manage Users
            </a>
            <a href="/attendance" className="block w-full text-left px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium">
              ✅ View Attendance
            </a>
            <a href="/reports" className="block w-full text-left px-4 py-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium">
              📊 Generate Reports
            </a>
            <a href="/fees" className="block w-full text-left px-4 py-3 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors font-medium">
              💰 Fee Management
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
