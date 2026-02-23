import { useState } from "react";
import { User } from "@supabase/supabase-js";
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
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard,
  Rss,
  UserPlus,
  MessageCircle,
  Search,
  Handshake,
  Calendar,
  BookOpen,
  Users,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Flame,
  Trophy
} from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  role: 'student' | 'mentor' | 'teacher' | 'authority';
  institution_id: string;
  institution_roll_number: string;
  full_name: string;
  email: string;
  daily_streak: number;
  connections_count: number;
  department: string;
}

const Index = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // TEMPORARY BYPASS: Mock user and profile for testing
  const mockUser = {
    id: 'test-user-123',
    email: 'test@student.com',
  } as User;

  const mockProfile: Profile = {
    id: 'test-profile-123',
    user_id: 'test-user-123',
    role: 'student',
    institution_id: 'test-institution',
    institution_roll_number: 'TEST001',
    full_name: 'Test Student',
    email: 'test@student.com',
    daily_streak: 5,
    connections_count: 10,
    department: 'Computer Science',
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
    switch (currentPage) {
      case "profile":
        return <ProfilePage user={mockUser} />;
      case "enhanced-profile":
        return <EnhancedProfilePage user={mockUser} />;
      case "connect":
        return <ConnectPage />;
      case "messages":
        return <ChatPage />;
      case "feed":
        return <FeedPage />;
      case "discover":
        return <DiscoverPage />;
      case "collaborate":
        return <CollaboratePage />;
      case "events":
        return <EventsPage />;
      case "resources":
        return <EnhancedResourcesPage />;
      case "study-groups":
        return <StudyGroupsPage />;
      case "dashboard":
        return <StudentDashboard user={mockUser} profile={mockProfile} />;
      case "home":
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {sidebarOpen ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-bold">Colugee Student</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8 mx-auto"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
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

        {/* User Profile at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {mockProfile.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{mockProfile.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{mockProfile.institution_roll_number}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <Avatar className="h-10 w-10 mx-auto">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {mockProfile.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-semibold capitalize">
              {navItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground">{mockProfile.department}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-orange-500/10 rounded-full">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">{mockProfile.daily_streak} day streak</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {renderPage()}
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default Index;
