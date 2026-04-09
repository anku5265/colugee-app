import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { UserPlus, Loader2, Search } from 'lucide-react';

export default function ConnectScreen({ user }: { user: any }) {
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, department, role, profile_picture_url')
        .neq('user_id', user.id)
        .limit(30);
      setPeople(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (receiverId: string) => {
    try {
      await supabase.from('connection_requests').insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending',
      });
      setSent(prev => new Set([...prev, receiverId]));
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = people.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.department?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor: Record<string, string> = {
    student: 'bg-blue-100 text-blue-600',
    teacher: 'bg-green-100 text-green-600',
    mentor: 'bg-purple-100 text-purple-600',
    authority: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-white border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none border border-gray-100 focus:border-indigo-300"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <UserPlus className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No people found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((person) => (
              <div key={person.user_id} className="flex items-center gap-3 p-4 bg-white">
                <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                  {person.full_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{person.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{person.department}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 inline-block ${roleColor[person.role] || 'bg-gray-100 text-gray-600'}`}>
                    {person.role}
                  </span>
                </div>
                <button
                  onClick={() => handleConnect(person.user_id)}
                  disabled={sent.has(person.user_id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    sent.has(person.user_id)
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-indigo-600 text-white active:bg-indigo-700'
                  }`}
                >
                  {sent.has(person.user_id) ? 'Sent' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
