import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Calendar, Clock, MapPin, User, Plus, Edit, Trash2, X } from 'lucide-react';

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
  target_section: string | null;
  target_branch: string | null;
  institution_id: string | null;
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
  target_department: '',
};

export default function AcademicsPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState(new Date().getDay());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedules();
    fetchInstitutionId();
  }, []);

  const fetchInstitutionId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('institution_id').eq('user_id', user.id).single();
    if (data?.institution_id) setInstitutionId(data.institution_id);
  };

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

  const handleEdit = (schedule: Schedule) => {
    setEditingId(schedule.id);
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
      target_department: schedule.target_department || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this schedule?')) return;
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (!error) fetchSchedules();
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.subject.trim()) {
      alert('Title and Subject are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
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
      };

      if (editingId) {
        await supabase.from('schedules').update(payload).eq('id', editingId);
      } else {
        await supabase.from('schedules').insert(payload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(defaultForm);
      fetchSchedules();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academics</h1>
          <p className="text-gray-500">Manage class schedules - visible to all students & teachers</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(defaultForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Schedule
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editingId ? 'Edit Schedule' : 'Add New Schedule'}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); }}>
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Data Structures Lecture"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g., Computer Science"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Name</label>
              <input
                type="text"
                value={form.teacher_name}
                onChange={e => setForm({ ...form, teacher_name: e.target.value })}
                placeholder="e.g., Dr. Sharma"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
              <select
                value={form.day_of_week}
                onChange={e => setForm({ ...form, day_of_week: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={e => setForm({ ...form, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room / Location</label>
              <input
                type="text"
                value={form.room_location}
                onChange={e => setForm({ ...form, room_location: e.target.value })}
                placeholder="e.g., Room 101"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Department</label>
              <input
                type="text"
                value={form.target_department}
                onChange={e => setForm({ ...form, target_department: e.target.value })}
                placeholder="e.g., Computer Science (leave blank for all)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Year</label>
              <select
                value={form.target_year}
                onChange={e => setForm({ ...form, target_year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                <option value="">All Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Section</label>
              <input
                type="text"
                value={form.target_section}
                onChange={e => setForm({ ...form, target_section: e.target.value })}
                placeholder="e.g., A (leave blank for all)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Branch</label>
              <input
                type="text"
                value={form.target_branch}
                onChange={e => setForm({ ...form, target_branch: e.target.value })}
                placeholder="e.g., CSE (leave blank for all)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 text-sm font-medium"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </div>
        </div>
      )}

      {/* Day Tabs */}
      <div className="flex gap-2 flex-wrap">
        {DAYS.map((day, i) => {
          const count = schedules.filter(s => s.day_of_week === i).length;
          return (
            <button
              key={i}
              onClick={() => setDayFilter(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                dayFilter === i ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {day.substring(0, 3)}
              {count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${dayFilter === i ? 'bg-white/20' : 'bg-blue-100 text-blue-600'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Schedule List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No classes scheduled for {DAYS[dayFilter]}</p>
            <button
              onClick={() => { setForm({ ...defaultForm, day_of_week: dayFilter }); setShowForm(true); setEditingId(null); }}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              + Add a class for {DAYS[dayFilter]}
            </button>
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
                    <div className="flex flex-wrap gap-1 mt-2">
                      {schedule.target_department && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{schedule.target_department}</span>
                      )}
                      {schedule.target_year && (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">Year {schedule.target_year}</span>
                      )}
                      {schedule.target_section && (
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">Sec {schedule.target_section}</span>
                      )}
                      {schedule.target_branch && (
                        <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded">{schedule.target_branch}</span>
                      )}
                      {!schedule.target_department && !schedule.target_year && !schedule.target_section && !schedule.target_branch && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">All Students</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
