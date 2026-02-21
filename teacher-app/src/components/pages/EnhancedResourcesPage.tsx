import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BookOpen, 
  Download, 
  FileText, 
  Video, 
  Headphones,
  ExternalLink,
  Search,
  Filter,
  Star,
  Clock,
  Users,
  Upload,
  Plus,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Resource {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  subject: string;
  resource_type: string;
  file_url: string;
  file_size?: number;
  downloads_count: number;
  rating: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  author_name?: string;
}

export const EnhancedResourcesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    subject: "",
    resource_type: "document",
    tags: "",
    file: null as File | null
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchResources();
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

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data: resourcesData, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (resourcesData) {
        // Fetch author names
        const userIds = [...new Set(resourcesData.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const profilesMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

        const resourcesWithAuthors = resourcesData.map(resource => ({
          ...resource,
          author_name: profilesMap.get(resource.user_id) || 'Unknown User'
        }));

        setResources(resourcesWithAuthors);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadForm.file || !currentUser) return;

    setUploading(true);
    try {
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resources')
        .upload(fileName, uploadForm.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(fileName);

      // Save resource metadata
      const { error: insertError } = await supabase
        .from('resources')
        .insert({
          user_id: currentUser.id,
          title: uploadForm.title,
          description: uploadForm.description,
          subject: uploadForm.subject,
          resource_type: uploadForm.resource_type,
          file_url: publicUrl,
          file_size: uploadForm.file.size,
          tags: uploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
          institution_id: currentUser.institution_id
        });

      if (insertError) throw insertError;

      toast({
        title: "Resource uploaded",
        description: "Your resource has been shared successfully!",
      });

      // Reset form and close dialog
      setUploadForm({
        title: "",
        description: "",
        subject: "",
        resource_type: "document",
        tags: "",
        file: null
      });
      setUploadDialogOpen(false);
      fetchResources();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resource",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      // Increment download count
      await supabase
        .from('resources')
        .update({ downloads_count: resource.downloads_count + 1 })
        .eq('id', resource.id);

      // Open download link
      window.open(resource.file_url, '_blank');

      // Refresh resources to show updated count
      fetchResources();
    } catch (error) {
      console.error('Error downloading resource:', error);
    }
  };

  const deleteResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: "Resource deleted",
        description: "Resource has been removed successfully",
      });

      fetchResources();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete resource",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document": return <FileText className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      case "audio": return <Headphones className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "document": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "video": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "audio": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === "all" || resource.resource_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading resources...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Academic Resources
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover and share study materials, notes, and resources with your fellow students
          </p>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Share Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Share a Resource</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Resource title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={uploadForm.subject}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Mathematics, Physics, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select 
                      value={uploadForm.resource_type} 
                      onValueChange={(value) => setUploadForm(prev => ({ ...prev, resource_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="calculus, notes, exam"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    accept=".pdf,.doc,.docx,.txt,.mp4,.mp3,.wav"
                  />
                </div>
                <Button 
                  onClick={handleFileUpload} 
                  disabled={!uploadForm.title || !uploadForm.file || uploading}
                  className="w-full"
                >
                  {uploading ? "Uploading..." : "Share Resource"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <Badge className={`${getTypeColor(resource.resource_type)} gap-1`}>
                    {getTypeIcon(resource.resource_type)}
                    {resource.resource_type}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{resource.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div>
                  <CardTitle className="line-clamp-2">
                    {resource.title}
                  </CardTitle>
                  <CardDescription className="mt-2 line-clamp-3">
                    {resource.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {resource.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{resource.tags.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span>{resource.downloads_count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Author and Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-medium">
                      {resource.author_name?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{resource.author_name}</span>
                  </div>
                  <div className="flex gap-2">
                    {currentUser?.id === resource.user_id && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteResource(resource.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" onClick={() => handleDownload(resource)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Resources Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search terms" : "Be the first to share a resource!"}
            </p>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Share Resource
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
};