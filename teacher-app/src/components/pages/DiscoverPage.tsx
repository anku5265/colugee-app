import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Briefcase, 
  Trophy, 
  BookOpen,
  Lightbulb,
  Heart,
  Zap,
  Star,
  Clock
} from "lucide-react";

const opportunities = [
  {
    id: 1,
    title: "Summer Software Engineering Internship",
    company: "Tech Corp",
    location: "San Francisco, CA",
    type: "internship",
    deadline: "March 15, 2024",
    description: "Join our team to work on cutting-edge projects in AI and machine learning.",
    requirements: ["Computer Science", "Python", "React"],
    category: "Technology"
  },
  {
    id: 2,
    title: "Research Assistant Position",
    company: "University Research Lab",
    location: "Cambridge, MA",
    type: "research",
    deadline: "February 28, 2024",
    description: "Assist in groundbreaking research on sustainable energy solutions.",
    requirements: ["Engineering", "Research Experience", "Lab Skills"],
    category: "Research"
  },
  {
    id: 3,
    title: "Marketing Intern",
    company: "StartupXYZ",
    location: "Austin, TX",
    type: "internship",
    deadline: "March 20, 2024",
    description: "Help grow our social media presence and develop marketing strategies.",
    requirements: ["Marketing", "Social Media", "Communication"],
    category: "Business"
  }
];

const scholarships = [
  {
    id: 1,
    title: "STEM Excellence Scholarship",
    amount: "$5,000",
    deadline: "April 1, 2024",
    description: "Supporting outstanding students in Science, Technology, Engineering, and Math.",
    eligibility: ["3.5+ GPA", "STEM Major", "Community Service"],
    category: "Academic"
  },
  {
    id: 2,
    title: "Diversity in Tech Scholarship",
    amount: "$3,000",
    deadline: "March 10, 2024",
    description: "Promoting diversity and inclusion in technology fields.",
    eligibility: ["Underrepresented Groups", "Computer Science", "Financial Need"],
    category: "Diversity"
  }
];

const competitions = [
  {
    id: 1,
    title: "Hackathon 2024",
    date: "March 15-17, 2024",
    location: "University Campus",
    prize: "$10,000",
    description: "48-hour coding competition to solve real-world problems.",
    tags: ["Programming", "Innovation", "Teamwork"],
    participants: 250
  },
  {
    id: 2,
    title: "Business Plan Competition",
    date: "April 5, 2024",
    location: "Business School",
    prize: "$5,000",
    description: "Present your startup idea to industry professionals.",
    tags: ["Entrepreneurship", "Business", "Presentation"],
    participants: 75
  }
];

export const DiscoverPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "internship":
        return <Briefcase className="h-4 w-4" />;
      case "research":
        return <BookOpen className="h-4 w-4" />;
      case "scholarship":
        return <Star className="h-4 w-4" />;
      case "competition":
        return <Trophy className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Discover Opportunities
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find internships, scholarships, competitions, and research opportunities
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">All Categories</Button>
            <Button variant="outline" size="sm">Technology</Button>
            <Button variant="outline" size="sm">Business</Button>
            <Button variant="outline" size="sm">Research</Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="internships" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-8">
            <TabsTrigger value="internships">Internships</TabsTrigger>
            <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
            <TabsTrigger value="competitions">Competitions</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
          </TabsList>

          <TabsContent value="internships">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {opportunities.map((opportunity) => (
                <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(opportunity.type)}
                        <Badge variant="secondary">{opportunity.type}</Badge>
                      </div>
                      <Badge variant="outline">{opportunity.category}</Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{opportunity.title}</CardTitle>
                    <p className="text-sm font-medium text-primary">{opportunity.company}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {opportunity.description}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {opportunity.location}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        Deadline: {opportunity.deadline}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {opportunity.requirements.slice(0, 3).map((req, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1">Apply Now</Button>
                      <Button size="sm" variant="outline">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scholarships">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scholarships.map((scholarship) => (
                <Card key={scholarship.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <Badge variant="secondary">Scholarship</Badge>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {scholarship.amount}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{scholarship.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {scholarship.description}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                      <Clock className="h-4 w-4 mr-2" />
                      Deadline: {scholarship.deadline}
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium text-foreground">Eligibility:</p>
                      <div className="flex flex-wrap gap-1">
                        {scholarship.eligibility.map((req, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full">Apply for Scholarship</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="competitions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {competitions.map((competition) => (
                <Card key={competition.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <Badge variant="secondary">Competition</Badge>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {competition.prize}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{competition.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {competition.description}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {competition.date}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {competition.location}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        {competition.participants} participants registered
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {competition.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button className="w-full">Register Now</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="research">
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Research Opportunities</h3>
              <p className="text-muted-foreground mb-6">
                Discover research positions and academic opportunities
              </p>
              <Button>
                <Zap className="h-4 w-4 mr-2" />
                Browse Research Positions
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};