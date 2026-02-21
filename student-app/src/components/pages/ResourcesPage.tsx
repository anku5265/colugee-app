import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Users
} from "lucide-react";

const resources = [
  {
    id: 1,
    title: "Advanced Calculus Notes",
    type: "document",
    subject: "Mathematics",
    author: "Sarah Chen",
    rating: 4.8,
    downloads: 1240,
    description: "Comprehensive notes covering derivatives, integrals, and applications",
    tags: ["calculus", "math", "derivatives", "integrals"],
    uploadDate: "2 days ago"
  },
  {
    id: 2,
    title: "React Development Masterclass",
    type: "video",
    subject: "Computer Science",
    author: "Alex Rodriguez",
    rating: 4.9,
    downloads: 890,
    description: "Complete guide to modern React development with hooks and context",
    tags: ["react", "javascript", "web development", "programming"],
    uploadDate: "1 week ago"
  },
  {
    id: 3,
    title: "Organic Chemistry Podcast Series",
    type: "audio",
    subject: "Chemistry",
    author: "Dr. Maria Johnson",
    rating: 4.7,
    downloads: 650,
    description: "Audio explanations of complex organic chemistry concepts",
    tags: ["chemistry", "organic", "molecules", "reactions"],
    uploadDate: "3 days ago"
  },
  {
    id: 4,
    title: "Physics Lab Report Template",
    type: "document",
    subject: "Physics",
    author: "David Kim",
    rating: 4.6,
    downloads: 2100,
    description: "Professional template for physics lab reports and experiments",
    tags: ["physics", "lab", "report", "template"],
    uploadDate: "1 day ago"
  }
];

export const ResourcesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4">
            Academic Resources
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover and share study materials, notes, and resources with your fellow students
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-primary/20 focus:border-primary"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button className="btn-gradient text-primary-foreground gap-2">
            <BookOpen className="h-4 w-4" />
            Share Resource
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-muted/50">
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <Card key={resource.id} className="card-glow hover-lift group">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge className={`${getTypeColor(resource.type)} gap-1`}>
                        {getTypeIcon(resource.type)}
                        {resource.type}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{resource.rating}</span>
                      </div>
                    </div>
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {resource.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
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
                        <span>{resource.downloads}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{resource.uploadDate}</span>
                      </div>
                    </div>

                    {/* Author */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-medium">
                          {resource.author.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{resource.author}</span>
                      </div>
                      <Button size="sm" className="btn-gradient text-primary-foreground">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Document Resources</h3>
              <p className="text-muted-foreground">Filtered view for documents coming soon!</p>
            </div>
          </TabsContent>

          <TabsContent value="videos">
            <div className="text-center py-12">
              <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Video Resources</h3>
              <p className="text-muted-foreground">Filtered view for videos coming soon!</p>
            </div>
          </TabsContent>

          <TabsContent value="audio">
            <div className="text-center py-12">
              <Headphones className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Audio Resources</h3>
              <p className="text-muted-foreground">Filtered view for audio coming soon!</p>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Template Resources</h3>
              <p className="text-muted-foreground">Filtered view for templates coming soon!</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};