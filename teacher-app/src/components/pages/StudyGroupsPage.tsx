import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  MapPin, 
  Clock, 
  BookOpen,
  Plus,
  Search,
  Video,
  Coffee,
  Calendar,
  Star,
  Trash2
} from "lucide-react";

interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  description: string;
  difficulty: string;
  type: string;
  location: string;
  meeting_schedule: string;
  max_members: number;
  current_members: number;
  created_by: string;
  tags: string[];
}

export const StudyGroupsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    description: "",
    difficulty: "intermediate",
    type: "virtual",
    location: "",
    meeting_schedule: "",
    max_members: 15,
    tags: ""
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchGroups();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('institution_id')
        .eq('user_id', user.id)
        .maybeSingle();
      setCurrentUser({ ...user, institution_id: profile?.institution_id });
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("study_groups")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching study groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!currentUser) {
      toast({ title: "Please sign in to create study groups", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("study_groups").insert({
        name: formData.name,
        subject: formData.subject,
        description: formData.description,
        difficulty: formData.difficulty,
        type: formData.type,
        location: formData.location,
        meeting_schedule: formData.meeting_schedule,
        max_members: formData.max_members,
        current_members: 1,
        created_by: currentUser.id,
        tags: formData.tags.split(",").map(tag => tag.trim()),
        is_active: true,
        institution_id: currentUser.institution_id
      });

      if (error) throw error;

      toast({ title: "Study group created successfully!" });
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        subject: "",
        description: "",
        difficulty: "intermediate",
        type: "virtual",
        location: "",
        meeting_schedule: "",
        max_members: 15,
        tags: ""
      });
      fetchGroups();
    } catch (error: any) {
      toast({ title: "Error creating study group", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from("study_groups")
        .delete()
        .eq("id", groupId)
        .eq("created_by", currentUser.id);

      if (error) throw error;

      toast({ title: "Study group deleted successfully!" });
      fetchGroups();
    } catch (error: any) {
      toast({ title: "Error deleting study group", description: error.message, variant: "destructive" });
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!currentUser) {
      toast({ title: "Please sign in to join study groups", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("group_memberships").insert({
        group_id: groupId,
        user_id: currentUser.id,
        role: "member"
      });

      if (error) throw error;

      // Update member count
      const group = groups.find(g => g.id === groupId);
      if (group) {
        await supabase
          .from("study_groups")
          .update({ current_members: group.current_members + 1 })
          .eq("id", groupId);
      }

      toast({ title: "Successfully joined the study group!" });
      fetchGroups();
    } catch (error: any) {
      toast({ title: "Error joining study group", description: error.message, variant: "destructive" });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "intermediate": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "advanced": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "virtual": return <Video className="h-4 w-4" />;
      case "in-person": return <Coffee className="h-4 w-4" />;
      case "hybrid": return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4">
            Study Groups
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join study groups, collaborate with peers, and ace your courses together
          </p>
        </div>

        {/* Search and Create */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search study groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Study Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Study Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Advanced Calculus Study Circle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your study group"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Meeting Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="in-person">In-person</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Library Room 201 or Zoom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule">Meeting Schedule</Label>
                  <Input
                    id="schedule"
                    value={formData.meeting_schedule}
                    onChange={(e) => setFormData({ ...formData, meeting_schedule: e.target.value })}
                    placeholder="e.g., Tuesdays 7 PM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_members">Max Members</Label>
                  <Input
                    id="max_members"
                    type="number"
                    value={formData.max_members}
                    onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g., calculus, problem-solving, exams"
                  />
                </div>
                <Button onClick={handleCreateGroup} className="w-full">
                  Create Study Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Study Groups Grid */}
        {loading ? (
          <div className="text-center py-8">Loading study groups...</div>
        ) : filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2">
                      <Badge className={getDifficultyColor(group.difficulty)}>
                        {group.difficulty}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        {getTypeIcon(group.type)}
                        {group.type}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <CardDescription className="font-medium">
                      {group.subject}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">{group.description}</p>

                  {/* Tags */}
                  {group.tags && group.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {group.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Group Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{group.current_members}/{group.max_members} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{group.location}</span>
                    </div>
                    {group.meeting_schedule && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{group.meeting_schedule}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleJoinGroup(group.id)}
                    >
                      Join Group
                    </Button>
                    {currentUser && group.created_by === currentUser.id && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No study groups found</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to create a study group!
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Study Group
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};