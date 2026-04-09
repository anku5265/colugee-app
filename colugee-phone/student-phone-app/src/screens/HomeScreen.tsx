import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Calendar, MapPin, Users, BookOpen, Trophy, Lightbulb, GraduationCap } from 'lucide-react';

interface HomeScreenProps {
  profile: any;
}

export default function HomeScreen({ profile }: HomeScreenProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('campus_events')
      .select('*')
      .eq('is_active', true)
      .gte('event_date', new Date().toISOString())
      .order('event_date')
      .limit(3)
      .then(({ data }) => {
        setEvents(data || []);
        setLoading(false);
      });
  }, []);

  const features = [
    { icon: Users, label: 'Connect', color: 'bg-blue-100 text-blue-600' },
    { icon: Calendar, label: 'Events', color: 'bg-purple-100 text-purple-600' },
    { icon: BookOpen, label: 'Resources', color: 'bg-green-100 text-green-600' },
    { icon: Trophy, label: 'Achievements', color: 'bg-yellow-100 text-yellow-600' },
    { icon: Lightbulb, label: 'Collaborate', color: 'bg-orange-100 text-orange-600' },
    { icon: GraduationCap, label: 'Study Groups', color: 'bg-pink-100 text-pink-600' },
  ];

  return (
    <div className="p-4 space-y-5">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <p className="text-indigo-100 text-sm">Welcome back 👋</p>
        <h2 className="text-xl font-bold mt-1">{profile.full_name}</h2>
        <p className="text-indigo-200 text-xs mt-1">{profile.department} • {profile.institution_roll_number}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
            🔥 {profile.daily_streak || 0} day streak
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
            👥 {profile.connections_count || 0} connections
          </span>
        </div>
      </div>

      {/* Quick Features */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Quick Access</h3>
        <div className="grid grid-cols-3 gap-3">
          {features.map((f) => (
            <button key={f.label} className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-gray-50 active:scale-95 transition-transform">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-gray-600">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Upcoming Events</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{event.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{event.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg font-medium capitalize whitespace-nowrap">
                    {event.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
