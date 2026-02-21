import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  MessageCircle,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  Award,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ConnectionButton } from "@/components/connections/ConnectionButton";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  year_of_study?: number;
  bio?: string;
  profile_picture_url?: string;
  connections_count: number;
  daily_streak: number;
}

interface Skill {
  id: string;
  skill_name: string;
  proficiency_level: string;
  endorsed_count: number;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  demo_url?: string;
  github_url?: string;
  image_url?: string;
  status: string;
}

interface ProfileViewPageProps {
  profileId: string;
  onBack: () => void;
}

export const ProfileViewPage = ({ profileId, onBack }: ProfileViewPageProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'sent' | 'received' | 'connected'>('none');
  const [requestId, setRequestId] = useState<string | undefined>();

  useEffect(() => {
    fetchCurrentUser();
    fetchProfile();
  }, [profileId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // Fetch profile using the public profile function that bypasses RLS
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_public_profile_info', { profile_user_id: profileId });

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      if (profileData && profileData.length > 0) {
        // The function returns an array, so get the first item
        const profile = profileData[0];
        setProfile({
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: '', // Email is not exposed for privacy
          role: profile.role,
          department: profile.department,
          year_of_study: profile.year_of_study,
          bio: profile.bio,
          profile_picture_url: profile.profile_picture_url,
          connections_count: 0, // Not available in public view
          daily_streak: 0 // Not available in public view
        });

        // Check connection status
        if (currentUser) {
          const { data: connectionData } = await supabase
            .from('connection_requests')
            .select('*')
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${currentUser.id})`)
            .maybeSingle();

          if (connectionData) {
            setRequestId(connectionData.id);
            if (connectionData.status === 'accepted') {
              setConnectionStatus('connected');
            } else if (connectionData.status === 'pending') {
              setConnectionStatus(connectionData.sender_id === currentUser.id ? 'sent' : 'received');
            }
          }
        }

        // Fetch additional data
        await Promise.all([
          fetchSkills(profileId),
          fetchExperience(profileId),
          fetchProjects(profileId)
        ]);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async (userId: string) => {
    const { data } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', userId)
      .order('endorsed_count', { ascending: false });
    
    if (data) setSkills(data);
  };

  const fetchExperience = async (userId: string) => {
    const { data } = await supabase
      .from('experience')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });
    
    if (data) setExperience(data);
  };

  const fetchProjects = async (userId: string) => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) setProjects(data);
  };

  const handleConnectionUpdate = () => {
    // Refresh profile data to get updated connection status
    fetchProfile();
  };

  const startChat = async () => {
    if (!currentUser || !profile) return;

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant1_id.eq.${currentUser.id},participant2_id.eq.${profile.user_id}),and(participant1_id.eq.${profile.user_id},participant2_id.eq.${currentUser.id})`)
        .maybeSingle();

      if (!existingConv) {
        // Create new conversation
        await supabase
          .from('conversations')
          .insert({
            participant1_id: currentUser.id,
            participant2_id: profile.user_id
          });
      }

      // Navigate to messages page (you might want to implement this differently)
      toast({
        title: "Chat started",
        description: "Opening chat...",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start chat",
        variant: "destructive",
      });
    }
  };

  const getSkillColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'advanced': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'expert': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested profile could not be found.</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 h-32"></div>
          <CardContent className="relative -mt-16 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src={profile.profile_picture_url} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{profile.full_name}</h1>
                  <p className="text-lg text-muted-foreground capitalize">{profile.role} • {profile.department}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {profile.year_of_study && (
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      <span>Year {profile.year_of_study}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>{profile.connections_count} connections</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>{profile.daily_streak} day streak</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <ConnectionButton
                  targetUserId={profile.user_id}
                  targetUserName={profile.full_name}
                  status={connectionStatus}
                  requestId={requestId}
                  onUpdate={handleConnectionUpdate}
                />
                <Button onClick={startChat} variant="outline" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Button>
              </div>
            </div>
            {profile.bio && (
              <div className="mt-6">
                <p className="text-muted-foreground">{profile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Content */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium">{profile.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <Badge variant="secondary" className="capitalize">{profile.role}</Badge>
                  </div>
                  {profile.year_of_study && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Year of Study:</span>
                      <span className="font-medium">Year {profile.year_of_study}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Connections:</span>
                    <span className="font-medium">{profile.connections_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Streak:</span>
                    <span className="font-medium">{profile.daily_streak} days</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="experience" className="space-y-6">
            {experience.length > 0 ? (
              <div className="space-y-4">
                {experience.map((exp) => (
                  <Card key={exp.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">{exp.title}</h3>
                          <p className="text-primary font-medium">{exp.company}</p>
                          <p className="text-sm text-muted-foreground">
                            {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                          </p>
                          {exp.description && (
                            <p className="text-muted-foreground mt-2">{exp.description}</p>
                          )}
                        </div>
                        <Briefcase className="h-5 w-5 text-muted-foreground mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Experience Listed</h3>
                <p className="text-muted-foreground">This user hasn't added any work experience yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="overflow-hidden">
                    {project.image_url && (
                      <div className="h-48 bg-muted bg-cover bg-center" style={{ backgroundImage: `url(${project.image_url})` }}></div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {project.title}
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{project.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {project.demo_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                              Demo
                            </a>
                          </Button>
                        )}
                        {project.github_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                              GitHub
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projects Listed</h3>
                <p className="text-muted-foreground">This user hasn't added any projects yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            {skills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((skill) => (
                  <Card key={skill.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{skill.skill_name}</h3>
                          <Badge className={`mt-1 text-xs ${getSkillColor(skill.proficiency_level)}`}>
                            {skill.proficiency_level}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Endorsements</div>
                          <div className="font-bold text-primary">{skill.endorsed_count}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Skills Listed</h3>
                <p className="text-muted-foreground">This user hasn't added any skills yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};