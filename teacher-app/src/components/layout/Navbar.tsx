import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { 
  GraduationCap, 
  Home, 
  Users, 
  Calendar, 
  User, 
  LogOut,
  Menu,
  X,
  BookOpen,
  Search,
  BarChart3,
  UserPlus,
  Handshake,
  Trophy,
  MessageCircle,
  Rss
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationSystem } from "@/components/notifications/NotificationSystem";

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

interface NavbarProps {
  user: any;
  profile?: Profile | null;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Navbar = ({ user, profile, currentPage, onPageChange }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Sign out error:', error);
        // Force clear local session even if server signout fails
        window.location.reload();
      } else {
        toast({
          title: "Signed out successfully",
          description: "See you next time!",
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear local session
      window.location.reload();
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "feed", label: "Feed", icon: Rss },
    { id: "connect", label: "Connect", icon: UserPlus },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "discover", label: "Discover", icon: Search },
    { id: "collaborate", label: "Collaborate", icon: Handshake },
    { id: "events", label: "Events", icon: Calendar },
    { id: "resources", label: "Resources", icon: BookOpen },
    { id: "study-groups", label: "Groups", icon: Users },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">Colugee</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  onClick={() => onPageChange(item.id)}
                  className="flex items-center space-x-2 whitespace-nowrap"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:block">{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationSystem currentUser={user} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                 <DropdownMenuLabel className="font-normal">
                   <div className="flex flex-col space-y-1">
                     <p className="text-sm font-medium leading-none">
                       {profile?.full_name || user?.user_metadata?.full_name || "User"}
                     </p>
                     <p className="text-xs leading-none text-muted-foreground">
                       {profile?.email || user?.email}
                     </p>
                     {profile?.role && (
                       <p className="text-xs leading-none text-primary font-medium capitalize">
                         {profile.role}
                       </p>
                     )}
                   </div>
                 </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onPageChange("profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    onClick={() => {
                      onPageChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};