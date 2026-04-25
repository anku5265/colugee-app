import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, BarChart3, Users, Calendar, Megaphone } from 'lucide-react';

export default function AdminReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [sR,tR,mR,aR,eR,pR,cR,anR] = await Promise.all([
        supabase.from('profiles').select('id',{count:'exact',head:true}).eq('role','student'),
        supabase.from('profiles').select('id',{count:'exact',head:true}).eq('role','teacher'),
        supabase.from('profiles').select('id',{count:'exact',head:true}).eq('role','mentor'),
        supabase.from('profiles').select('id',{count:'exact',head:true}).eq('role','authority'),
        supabase.from('campus_events').select('id',{count:'exact',head:true}),
        supabase.from('posts').select('id',{count:'exact',head:true}),
        supabase.from('connections').select('id',{count:'exact',head:true}),
        supabase.from('announcements').select('id',{count:'exact',head:true}),
      ]);
      setStats({ students:sR.count||0, teachers:tR.count||0, mentors:mR.count||0, authority:aR.count||0, events:eR.count||0, posts:pR.count||0, connections:cR.count||0, announcements:anR.count||0 });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  const total = (stats?.students||0)+(stats?.teachers||0)+(stats?.mentors||0)+(stats?.authority||0);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Reports</h1><p className="text-gray-500">Platform-wide statistics</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{label:'Students',value:stats?.students,color:'blue'},{label:'Teachers',value:stats?.teachers,color:'green'},{label:'Mentors',value:stats?.mentors,color:'purple'},{label:'Authority',value:stats?.authority,color:'orange'}].map(item=>(
          <div key={item.label} className={`bg-${item.color}-50 border border-${item.color}-100 rounded-xl p-5`}><div className={`text-3xl font-bold text-${item.color}-600`}>{item.value}</div><div className={`text-sm text-${item.color}-700 mt-1`}>{item.label}</div></div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{label:'Campus Events',value:stats?.events,icon:Calendar},{label:'Posts',value:stats?.posts,icon:BarChart3},{label:'Connections',value:stats?.connections,icon:Users},{label:'Announcements',value:stats?.announcements,icon:Megaphone}].map(item=>(
          <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"><item.icon className="h-6 w-6 text-gray-400 mb-2" /><div className="text-3xl font-bold text-gray-900">{item.value}</div><div className="text-sm text-gray-500 mt-1">{item.label}</div></div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">User Distribution</h2>
        <div className="space-y-3">
          {[{label:'Students',value:stats?.students,color:'bg-blue-500'},{label:'Teachers',value:stats?.teachers,color:'bg-green-500'},{label:'Mentors',value:stats?.mentors,color:'bg-purple-500'},{label:'Authority',value:stats?.authority,color:'bg-orange-500'}].map(item=>{
            const pct = total>0?Math.round((item.value/total)*100):0;
            return (<div key={item.label}><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{item.label}</span><span className="font-medium">{item.value} ({pct}%)</span></div><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${item.color} rounded-full transition-all`} style={{width:`${pct}%`}} /></div></div>);
          })}
        </div>
      </div>
    </div>
  );
}
