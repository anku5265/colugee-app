import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Calendar, Clock, MapPin, User } from 'lucide-react';

interface Schedule {
  id: string;
  title: string;
  subject: string;
  teacher_name: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_location: string | null;
  target_department: string | null;
  target_year: number | null;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AcademicsPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState(new Date().getDay());

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

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const filtered = schedules.filter(s => s.day_of_week === dayFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Academics</h1>
        <p className="text-gray-500">Class schedules and academic management</p>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-2 flex-wrap">
        {DAYS.map((day, i) => (
          <button
            key={i}
            onClick={() => setDayFilter(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dayFilter === i
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {day.substring(0, 3)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No classes scheduled for {DAYS[dayFilter]}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((schedule) => (
              <div key={schedule.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{schedule.title}</h3>
                    <p className="text-sm text-blue-600 font-medium mt-0.5">{schedule.subject}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(schedule.start_time)} – {formatTime(schedule.end_time)}
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
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    {schedule.target_department && <p>{schedule.target_department}</p>}
                    {schedule.target_year && <p>Year {schedule.target_year}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
