import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Flame, Bell, Trophy, Loader2, Crown } from 'lucide-react';

export default function DashboardScreen({ user, profile }: { user: any; profile: any }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [streak, setStreak] = useState(profile.daily_streak || 0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('announcements').select('id, title, content, announcement_type, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('user_id, full_name, daily_streak, department').order('daily_streak', { ascending: false }).limit(10),
    ]).then(([ann, lb]) => {
      setAnnouncements(ann.data || []);
      setLeaderboard(lb.data || []);
      setLoading(false);
    });

    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    supabase.from('profiles').select('last_activity_date').eq('user_id', user.id).single()
      .then(({ data }) => { if (data?.last_activity_date === today) setCheckedIn(true); });
  }, []);

  const handleCheckIn = async () => {
    if (checkedIn) return;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const { data: p } = await supabase.from('profiles').select('daily_streak, last_activity_date').eq('user_id', user.id).single();
    const newStreak = p?.last_activity_date === yesterday ? (p.daily_streak || 0) + 1 : 1;

    await supabase.from('profiles').update({ daily_streak: newStreak, last_activity_date: today }).eq('user_id', user.id);
    setStreak(newStreak);
    setCheckedIn(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Streak Card */}
      <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6" />
              <span className="text-3xl font-bold">{streak}</span>
            </div>
            <p className="text-orange-100 text-sm mt-1">Day Streak</p>
          </div>
          <button
            onClick={handleCheckIn}
            disabled={checkedIn}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              checkedIn ? 'bg-white/20 text-white/70' : 'bg-white text-orange-500 active:scale-95'
            }`}
          >
            {checkedIn ? '✓ Done!' : 'Check In'}
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900">Top Streaks</h3>
        </div>
        <div className="space-y-2">
          {leaderboard.map((person, i) => (
            <div key={person.user_id} className={`flex items-center gap-3 p-2 rounded-xl ${person.user_id === user.id ? 'bg-indigo-50' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {person.full_name} {person.user_id === user.id && <span className="text-indigo-600 text-xs">(You)</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="h-3 w-3" />
                <span className="text-xs font-bold">{person.daily_streak}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-900">Announcements</h3>
        </div>
        {announcements.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No announcements yet</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="border-l-2 border-indigo-300 pl-3">
                <p className="text-sm font-medium text-gray-900">{ann.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ann.content}</p>
                <p className="text-[10px] text-gray-300 mt-1">{new Date(ann.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
