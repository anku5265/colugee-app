import { useState } from 'react';
import { supabase } from '../supabase';
import { LogOut, User, Mail, BookOpen, Hash, Flame, Users } from 'lucide-react';

export default function ProfileScreen({ user, profile, onLogout }: { user: any; profile: any; onLogout: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await onLogout();
    setLoading(false);
  };

  const roleColor: Record<string, string> = {
    student: 'bg-blue-100 text-blue-600',
    teacher: 'bg-green-100 text-green-600',
    mentor: 'bg-purple-100 text-purple-600',
    authority: 'bg-orange-100 text-orange-600',
  };

  const infoItems = [
    { icon: Mail, label: 'Email', value: profile.email },
    { icon: BookOpen, label: 'Department', value: profile.department },
    { icon: Hash, label: 'Roll Number', value: profile.institution_roll_number || '—' },
    { icon: Flame, label: 'Daily Streak', value: `${profile.daily_streak || 0} days` },
    { icon: Users, label: 'Connections', value: `${profile.connections_count || 0}` },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white text-center">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-bold">
          {profile.full_name?.charAt(0)}
        </div>
        <h2 className="text-xl font-bold">{profile.full_name}</h2>
        <span className={`text-xs px-3 py-1 rounded-full font-medium mt-2 inline-block bg-white/20`}>
          {profile.role}
        </span>
      </div>

      {/* Info Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 divide-y divide-gray-50">
        {infoItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <item.icon className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-sm font-medium text-gray-900 truncate">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 rounded-2xl font-semibold text-sm active:bg-red-100 transition-colors disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" />
        {loading ? 'Signing out...' : 'Sign Out'}
      </button>
    </div>
  );
}
