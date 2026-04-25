import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { InstitutionCodePage } from "@/components/pages/InstitutionCodePage";
import { AuthForm } from "@/components/auth/AuthForm";
import { HomePage } from "@/components/pages/HomePage";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { EnhancedProfilePage } from "@/components/pages/EnhancedProfilePage";
import { ConnectPage } from "@/components/pages/ConnectPage";
import { DiscoverPage } from "@/components/pages/DiscoverPage";
import { CollaboratePage } from "@/components/pages/CollaboratePage";
import { EventsPage } from "@/components/pages/EventsPage";
import { EnhancedResourcesPage } from "@/components/pages/EnhancedResourcesPage";
import { StudyGroupsPage } from "@/components/pages/StudyGroupsPage";
import { ChatPage } from "@/components/pages/ChatPage";
import { FeedPage } from "@/components/pages/FeedPage";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard, Rss, UserPlus, MessageCircle, Search,
  Handshake, Calendar, BookOpen, Users, GraduationCap,
  LogOut, Menu, X, Flame
} from "lucide-react";

interface Institution {
  id: string;
  code: string;
  name: string;
  address: string;
  contact_email: string;
  phone: string;
}

interface Profile {
  id: string;
  user_id: string;
  role: 'student' | 'mentor' | 'teacher' | 'authority' | 'super_admin' | 'institute_admin';
  institution_id: string;
  institution_roll_number: string;
  full_name: string;
  email: string;
  daily_streak: number;
  connections_count: number;
  department: string;
  profile_picture_url?: string;
}

type AuthStep = 'institution' | 'auth' | 'app';

const Index = () => {
  const [authStep, setAuthStep] = useState<AuthStep>('institution');
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Listen to auth state changes
  useEffect(() => {
    // Check existing session on mount FIRST
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoadingProfile(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setAuthStep('institution');
        setLoadingProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    setLoadingProfile(true);

    // 5 second timeout - agar profile nahi mili toh wapas bhejo
    const timeout = setTimeout(async () => {
      await supabase.auth.signOut();
      setAuthStep('institution');
      setLoadingProfile(false);
    }, 5000);

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      clearTimeout(timeout);

      if (!data) {
        await supabase.auth.signOut();
        setAuthStep('institution');
        return;
      }

      // Non-student roles should not be in this app
      // They get redirected from AuthForm, but handle session restore too
      const nonStudentRoles = ['teacher', 'authority', 'super_admin', 'institute_admin'];
      if (nonStudentRoles.includes(data.role)) {
        // Already redirected by AuthForm on fresh login
        // On session restore, just sign out so they go back to login
        await supabase.auth.signOut();
        setAuthStep('institution');
        return;
      }

      setProfile(data);
      setAuthStep('app');
    } catch (error) {
      clearTimeout(timeout);
      console.error('Error fetching profile:', error);
      await supabase.auth.signOut();
      setAuthStep('institution');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthStep('institution');
    setInstitution(null);
    setUser(null);
    setProfile(null);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "feed", label: "Feed", icon: Rss },
    { id: "connect", label: "Connect", icon: UserPlus },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "discover", label: "Discover", icon: Search },
    { id: "collaborate", label: "Collaborate", icon: Handshake },
    { id: "events", label: "Events", icon: Calendar },
    { id: "resources", label: "Resources", icon: BookOpen },
    { id: "study-groups", label: "Study Groups", icon: Users },
  ];

  const renderPage = () => {
    if (!user || !profile) return null;
    switch (currentPage) {
      case "profile": return <ProfilePage user={user} />;
      case "enhanced-profile": return <EnhancedProfilePage user={user} />;
      case "connect": return <ConnectPage />;
      case "messages": return <ChatPage />;
      case "feed": return <FeedPage />;
      case "discover": return <DiscoverPage />;
      case "collaborate": return <CollaboratePage />;
      case "events": return <EventsPage />;
      case "resources": return <EnhancedResourcesPage />;
      case "study-groups": return <StudyGroupsPage />;
      case "dashboard": return <StudentDashboard user={user} profile={profile} />;
      case "home": default: return <HomePage />;
    }
  };

  // Loading state while fetching profile
  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-2xl inline-block">
            <GraduationCap className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Step 1: Institution code
  if (authStep === 'institution') {
    return (
      <InstitutionCodePage
        onInstitutionSelected={(inst) => {
          setInstitution(inst);
          setAuthStep('auth');
        }}
      />
    );
  }

  // Step 2: Login/Signup
  if (authStep === 'auth' && institution) {
    return (
      <AuthForm
        institution={institution}
        onBack={() => setAuthStep('institution')}
      />
    );
  }

  // Step 3: Main App
  if (authStep === 'app' && user && profile) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside className={`fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            {sidebarOpen ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-lg font-bold">Colugee</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="h-8 w-8 mx-auto">
                <Menu className="h-4 w-4" />
              </Button>
            )}
          </div>

          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${!sidebarOpen && 'justify-center px-2'}`}
                  onClick={() => setCurrentPage(item.id)}
                >
                  <Icon className={`h-5 w-5 ${sidebarOpen && 'mr-3'}`} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Button>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            {sidebarOpen ? (
              <div className="space-y-3">
                <button
                  className="flex items-center space-x-3 w-full hover:bg-accent/10 rounded-lg p-2 transition-colors"
                  onClick={() => setCurrentPage('enhanced-profile')}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.profile_picture_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate capitalize">{profile.role}</p>
                  </div>
                </button>
                <Button variant="outline" className="w-full justify-start" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Avatar className="h-10 w-10 mx-auto cursor-pointer" onClick={() => setCurrentPage('enhanced-profile')}>
                <AvatarImage src={profile.profile_picture_url} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
            <div>
              <h1 className="text-xl font-semibold capitalize">
                {navItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
              </h1>
              <p className="text-sm text-muted-foreground">{profile.department}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-orange-500/10 rounded-full">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{profile.daily_streak || 0} day streak</span>
              </div>
            </div>
          </header>

          <div className="p-6">{renderPage()}</div>
          <Footer />
        </main>
      </div>
    );
  }

  return null;
};

export default Index;
