import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import FeedScreen from './screens/FeedScreen';
import ConnectScreen from './screens/ConnectScreen';
import ProfileScreen from './screens/ProfileScreen';
import DashboardScreen from './screens/DashboardScreen';
import BottomNav from './components/BottomNav';
import { GraduationCap } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  institution_roll_number: string;
  daily_streak: number;
  connections_count: number;
  profile_picture_url?: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      setProfile(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <p className="text-indigo-600 font-medium">Colugee</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginScreen />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen profile={profile} />;
      case 'feed': return <FeedScreen user={user} />;
      case 'connect': return <ConnectScreen user={user} />;
      case 'dashboard': return <DashboardScreen user={user} profile={profile} />;
      case 'profile': return <ProfileScreen user={user} profile={profile} onLogout={handleLogout} />;
      default: return <HomeScreen profile={profile} />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white relative flex flex-col shadow-xl">
      {/* Status bar spacer */}
      <div className="safe-top bg-indigo-600" />

      {/* Top bar */}
      <header className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          <span className="font-bold text-lg">Colugee</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
            🔥 {profile.daily_streak || 0}
          </span>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
            {profile.full_name?.charAt(0)}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {renderScreen()}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="safe-bottom bg-white" />
    </div>
  );
}
