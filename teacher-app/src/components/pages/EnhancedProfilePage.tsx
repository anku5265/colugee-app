import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  GraduationCap,
  Award,
  Star,
  Plus,
  X,
  Edit,
  Save,
  Camera,
  MessageCircle,
  UserPlus,
  Share2,
  FileText,
  Heart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  phone_number?: string;
  connections_count: number;
  daily_streak: number;
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

interface Skill {
  id: string;
  skill_name: string;
  proficiency_level: string;
  endorsed_count: number;
}

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  github_url?: string;
  demo_url?: string;
  image_url?: string;
  status: string;
}

interface Post {
  id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_id: string;
}

interface EnhancedProfilePageProps {
  user: any;
  viewMode?: boolean;
  profileUserId?: string;
}

export const EnhancedProfilePage = ({ user, viewMode = false, profileUserId }: EnhancedProfilePageProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Form states
  const [newExperience, setNewExperience] = useState({
    title: "",
    company: "",
    description: "",
    start_date: "",
    end_date: "",
    is_current: false
  });
  const [newSkill, setNewSkill] = useState({
    skill_name: "",
    proficiency_level: "intermediate"
  });

  const targetUserId = profileUserId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchProfileData();
    }
  }, [targetUserId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchExperiences(),
        fetchSkills(),
        fetchProjects(),
        fetchPosts()
      ]);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (error) throw error;
    setProfile(data);
  };

  const fetchExperiences = async () => {
    const { data, error } = await supabase
      .from("experience")
      .select("*")
      .eq("user_id", targetUserId)
      .order("start_date", { ascending: false });

    if (error) throw error;
    setExperiences(data || []);
  };

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .eq("user_id", targetUserId)
      .order("endorsed_count", { ascending: false });

    if (error) throw error;
    setSkills(data || []);
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setProjects(data || []);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("author_id", targetUserId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setPosts(data || []);
  };

  const saveProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          department: profile.department,
          year_of_study: profile.year_of_study,
          bio: profile.bio,
          phone_number: profile.phone_number,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const addExperience = async () => {
    try {
      const { error } = await supabase
        .from("experience")
        .insert({
          ...newExperience,
          user_id: user.id
        });

      if (error) throw error;

      setNewExperience({
        title: "",
        company: "",
        description: "",
        start_date: "",
        end_date: "",
        is_current: false
      });

      fetchExperiences();
      toast({
        title: "Success",
        description: "Experience added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add experience",
        variant: "destructive",
      });
    }
  };

  const addSkill = async () => {
    try {
      const { error } = await supabase
        .from("skills")
        .insert({
          ...newSkill,
          user_id: user.id
        });

      if (error) throw error;

      setNewSkill({
        skill_name: "",
        proficiency_level: "intermediate"
      });

      fetchSkills();
      toast({
        title: "Success",
        description: "Skill added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add skill",
        variant: "destructive",
      });
    }
  };

  const endorseSkill = async (skillId: string) => {
    try {
      const skill = skills.find(s => s.id === skillId);
      if (!skill) return;

      const { error } = await supabase
        .from("skills")
        .update({ endorsed_count: skill.endorsed_count + 1 })
        .eq("id", skillId);

      if (error) throw error;

      setSkills(skills.map(s => 
        s.id === skillId 
          ? { ...s, endorsed_count: s.endorsed_count + 1 }
          : s
      ));

      toast({
        title: "Success",
        description: "Skill endorsed!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to endorse skill",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[1, 2].map((j) => (
                          <div key={j} className="h-4 bg-muted rounded"></div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="h-3 bg-muted rounded"></div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = !viewMode && user?.id === targetUserId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="relative overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/30"></div>
          <CardContent className="relative -mt-16 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={profile?.profile_picture_url} />
                <AvatarFallback className="text-2xl">
                  {profile?.full_name?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 md:ml-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {profile?.full_name}
                    </h1>
                    <p className="text-lg text-muted-foreground capitalize">
                      {profile?.role} at {profile?.department}
                    </p>
                    {profile?.year_of_study && (
                      <p className="text-sm text-muted-foreground">
                        Year {profile.year_of_study}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    {isOwner ? (
                      <Button 
                        onClick={() => setEditing(!editing)}
                        variant={editing ? "default" : "outline"}
                      >
                        {editing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                        {editing ? "Save" : "Edit Profile"}
                      </Button>
                    ) : (
                      <>
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                        <Button variant="outline">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                {profile?.email}
              </div>
              {profile?.phone_number && (
                <div className="flex items-center text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2" />
                  {profile.phone_number}
                </div>
              )}
              <div className="flex items-center text-muted-foreground">
                <Star className="h-4 w-4 mr-2" />
                {profile?.connections_count} connections
              </div>
            </div>
            
            {profile?.bio && (
              <div className="mt-4">
                {editing ? (
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                    placeholder="Tell others about yourself..."
                    className="mt-1"
                  />
                ) : (
                  <p className="text-muted-foreground">{profile.bio}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Experience Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Experience
                </CardTitle>
                {isOwner && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Experience</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Job Title"
                          value={newExperience.title}
                          onChange={(e) => setNewExperience({...newExperience, title: e.target.value})}
                        />
                        <Input
                          placeholder="Company"
                          value={newExperience.company}
                          onChange={(e) => setNewExperience({...newExperience, company: e.target.value})}
                        />
                        <Textarea
                          placeholder="Description"
                          value={newExperience.description}
                          onChange={(e) => setNewExperience({...newExperience, description: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            type="date"
                            placeholder="Start Date"
                            value={newExperience.start_date}
                            onChange={(e) => setNewExperience({...newExperience, start_date: e.target.value})}
                          />
                          <Input
                            type="date"
                            placeholder="End Date"
                            value={newExperience.end_date}
                            onChange={(e) => setNewExperience({...newExperience, end_date: e.target.value})}
                            disabled={newExperience.is_current}
                          />
                        </div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newExperience.is_current}
                            onChange={(e) => setNewExperience({...newExperience, is_current: e.target.checked})}
                          />
                          <span>Currently working here</span>
                        </label>
                        <Button onClick={addExperience} className="w-full">
                          Add Experience
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {experiences.length > 0 ? (
                  <div className="space-y-6">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="border-l-2 border-primary/20 pl-4">
                        <h3 className="font-semibold text-lg">{exp.title}</h3>
                        <p className="text-primary font-medium">{exp.company}</p>
                        <p className="text-sm text-muted-foreground">
                          {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                        </p>
                        {exp.description && (
                          <p className="mt-2 text-muted-foreground">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No experience added yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Projects Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                      <Card key={project.id} className="border border-border">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <Badge variant="outline" className="w-fit capitalize">
                            {project.status}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            {project.description}
                          </p>
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {project.technologies.slice(0, 4).map((tech, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                              {project.technologies.length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{project.technologies.length - 4}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No projects to display
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Posts Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <Card key={post.id} className="border border-border">
                        <CardContent className="p-4">
                          <p className="text-sm text-foreground mb-3">
                            {post.content}
                          </p>
                          {post.image_url && (
                            <div className="mb-3">
                              <img 
                                src={post.image_url} 
                                alt="Post image" 
                                className="rounded-lg w-full max-h-64 object-cover"
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {post.likes_count} likes
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {post.comments_count} comments
                              </span>
                            </div>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No posts to display
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Skills
                </CardTitle>
                {isOwner && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Skill</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Skill name"
                          value={newSkill.skill_name}
                          onChange={(e) => setNewSkill({...newSkill, skill_name: e.target.value})}
                        />
                        <Select 
                          value={newSkill.proficiency_level} 
                          onValueChange={(value) => setNewSkill({...newSkill, proficiency_level: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={addSkill} className="w-full">
                          Add Skill
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {skills.length > 0 ? (
                  <div className="space-y-3">
                    {skills.map((skill) => (
                      <div key={skill.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{skill.skill_name}</span>
                            <Badge variant="outline" className="capitalize text-xs">
                              {skill.proficiency_level}
                            </Badge>
                          </div>
                          <div className="flex items-center mt-1 text-sm text-muted-foreground">
                            <Star className="h-3 w-3 mr-1" />
                            {skill.endorsed_count} endorsements
                          </div>
                        </div>
                        {!isOwner && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => endorseSkill(skill.id)}
                            className="ml-2"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Endorse
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No skills added yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Activity Section */}
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Daily streak</span>
                    <Badge variant="secondary">
                      {profile?.daily_streak || 0} days
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connections</span>
                    <Badge variant="secondary">
                      {profile?.connections_count || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};