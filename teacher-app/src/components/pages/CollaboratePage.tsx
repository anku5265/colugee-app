import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Users, 
  Clock, 
  MessageCircle,
  Github,
  ExternalLink,
  Code,
  Palette,
  BarChart,
  Lightbulb,
  Heart,
  Star
} from "lucide-react";

const activeProjects = [
  {
    id: 1,
    title: "EcoTrack - Sustainability App",
    description: "Mobile app to help students track their carbon footprint and find eco-friendly alternatives on campus.",
    owner: "Sarah Johnson",
    members: [
      { name: "Sarah Johnson", role: "Project Lead", avatar: "/placeholder.svg" },
      { name: "Mike Chen", role: "Developer", avatar: "/placeholder.svg" },
      { name: "Emma Wilson", role: "Designer", avatar: "/placeholder.svg" }
    ],
    technologies: ["React Native", "Node.js", "MongoDB"],
    category: "Mobile App",
    progress: 65,
    seeking: ["Backend Developer", "UI/UX Designer"],
    github: "https://github.com/ecotrack",
    lastUpdate: "2 days ago"
  },
  {
    id: 2,
    title: "StudyBuddy - Peer Learning Platform",
    description: "Web platform connecting students for study groups, tutoring, and collaborative learning.",
    owner: "David Kim",
    members: [
      { name: "David Kim", role: "Full-Stack Developer", avatar: "/placeholder.svg" },
      { name: "Lisa Park", role: "Product Manager", avatar: "/placeholder.svg" }
    ],
    technologies: ["React", "Django", "PostgreSQL"],
    category: "Web Platform",
    progress: 40,
    seeking: ["Frontend Developer", "Data Scientist"],
    github: "https://github.com/studybuddy",
    lastUpdate: "1 day ago"
  },
  {
    id: 3,
    title: "Campus Events AR",
    description: "Augmented reality app for discovering and navigating campus events and locations.",
    owner: "Alex Rivera",
    members: [
      { name: "Alex Rivera", role: "AR Developer", avatar: "/placeholder.svg" }
    ],
    technologies: ["Unity", "ARCore", "C#"],
    category: "AR/VR",
    progress: 25,
    seeking: ["3D Artist", "Mobile Developer", "UX Designer"],
    github: "https://github.com/campus-ar",
    lastUpdate: "5 days ago"
  }
];

const projectIdeas = [
  {
    id: 1,
    title: "AI-Powered Course Scheduler",
    description: "Intelligent system to help students optimize their class schedules based on preferences, requirements, and availability.",
    suggestedBy: "Prof. Johnson",
    skills: ["Machine Learning", "Python", "Web Development"],
    complexity: "Medium",
    estimatedTime: "3-4 months",
    likes: 15
  },
  {
    id: 2,
    title: "Campus Food Waste Tracker",
    description: "IoT solution to monitor and reduce food waste in campus dining halls with real-time analytics.",
    suggestedBy: "Green Campus Initiative",
    skills: ["IoT", "Data Analytics", "Hardware"],
    complexity: "High",
    estimatedTime: "6 months",
    likes: 23
  },
  {
    id: 3,
    title: "Virtual Study Rooms",
    description: "VR application creating immersive study environments with collaboration tools for remote learning.",
    suggestedBy: "Emily Rodriguez",
    skills: ["VR Development", "Unity", "Networking"],
    complexity: "High",
    estimatedTime: "4-5 months",
    likes: 8
  }
];

export const CollaboratePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateProject, setShowCreateProject] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Mobile App":
        return <Code className="h-4 w-4" />;
      case "Web Platform":
        return <BarChart className="h-4 w-4" />;
      case "AR/VR":
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Low":
        return "bg-green-500";
      case "Medium":
        return "bg-yellow-500";
      case "High":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Collaborate on Projects
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join existing projects or start new ones. Build amazing things together.
          </p>
        </div>

        {/* Search and Create */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects by title, technology, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowCreateProject(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Start New Project
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="active">Active Projects</TabsTrigger>
            <TabsTrigger value="ideas">Project Ideas</TabsTrigger>
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(project.category)}
                        <Badge variant="secondary">{project.category}</Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Github className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Team Members</p>
                      <div className="flex -space-x-2">
                        {project.members.map((member, index) => (
                          <Avatar key={index} className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    {/* Technologies */}
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Technologies</p>
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Seeking */}
                    {project.seeking.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Looking for:</p>
                        <div className="flex flex-wrap gap-1">
                          {project.seeking.map((role, index) => (
                            <Badge key={index} variant="default" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        Updated {project.lastUpdate}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                        <Button size="sm">Join Project</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ideas">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectIdeas.map((idea) => (
                <Card key={idea.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge variant="outline">Idea</Badge>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-sm">{idea.likes}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{idea.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {idea.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Suggested by</p>
                        <p className="text-sm text-muted-foreground">{idea.suggestedBy}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Required Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {idea.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className={`w-2 h-2 rounded-full ${getComplexityColor(idea.complexity)}`}
                          />
                          <span className="text-sm text-muted-foreground">{idea.complexity}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{idea.estimatedTime}</span>
                      </div>

                      <Button className="w-full" size="sm">
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Start This Project
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-projects">
            <div className="text-center py-12">
              <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Your Projects</h3>
              <p className="text-muted-foreground mb-6">
                Manage and track your ongoing collaborative projects
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};