import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Search,
  Plus,
  BookOpen,
  Trophy,
  Music,
  Coffee,
  Gamepad2,
  Heart,
  Share2,
  Edit,
  Trash2
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  category: string;
  current_participants: number;
  max_participants: number;
  image_url?: string;
}

// Mock events to supplement database data
const mockEvents = [
  {
    id: "mock-1",
    title: "Spring Career Fair 2024",
    description: "Connect with top employers and explore internship and full-time opportunities across various industries.",
    event_date: "2024-03-15T10:00:00Z",
    location: "Student Union Ballroom",
    category: "career",
    current_participants: 245,
    max_participants: 500,
    image_url: null
  },
  {
    id: "mock-2", 
    title: "Hackathon: Code for Good",
    description: "48-hour coding marathon to develop solutions for social impact. Form teams and compete for amazing prizes!",
    event_date: "2024-03-22T18:00:00Z",
    location: "Engineering Building",
    category: "technology",
    current_participants: 89,
    max_participants: 150,
    image_url: null
  },
  {
    id: "mock-3",
    title: "International Food Festival",
    description: "Celebrate diversity with food from around the world. Cooking demonstrations, cultural performances, and tastings.",
    event_date: "2024-03-18T12:00:00Z",
    location: "Campus Quad",
    category: "cultural",
    current_participants: 312,
    max_participants: 1000,
    image_url: null
  },
  {
    id: "mock-4",
    title: "Research Symposium",
    description: "Undergraduate and graduate students present their research findings across all academic disciplines.",
    event_date: "2024-03-25T09:00:00Z",
    location: "Science Center",
    category: "academic",
    current_participants: 67,
    max_participants: 200,
    image_url: null
  },
  {
    id: "mock-5",
    title: "Basketball Championship Finals",
    description: "Cheer on our team in the season finale! Special halftime entertainment and fan giveaways.",
    event_date: "2024-03-20T19:00:00Z",
    location: "Sports Arena",
    category: "sports",
    current_participants: 1456,
    max_participants: 2000,
    image_url: null
  },
  {
    id: "mock-6",
    title: "Mental Health Awareness Workshop",
    description: "Learn stress management techniques, mindfulness practices, and available campus mental health resources.",
    event_date: "2024-03-14T14:00:00Z",
    location: "Wellness Center",
    category: "wellness",
    current_participants: 45,
    max_participants: 80,
    image_url: null
  },
  {
    id: "mock-7",
    title: "Startup Pitch Competition",
    description: "Student entrepreneurs present their business ideas to a panel of investors and industry experts.",
    event_date: "2024-03-28T17:00:00Z",
    location: "Business School Auditorium",
    category: "entrepreneurship",
    current_participants: 23,
    max_participants: 50,
    image_url: null
  },
  {
    id: "mock-8",
    title: "Art Gallery Opening: Student Showcase",
    description: "Exhibition featuring works from talented student artists across various mediums and styles.",
    event_date: "2024-03-16T18:30:00Z",
    location: "Campus Art Gallery",
    category: "arts",
    current_participants: 78,
    max_participants: 150,
    image_url: null
  }
];

export const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    category: "other",
    max_participants: 100
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchEvents();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("campus_events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true });

      if (error) throw error;
      
      // Combine database events with mock events
      const allEvents = [...(data || []), ...mockEvents];
      setEvents(allEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      // If database fails, just use mock events
      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "academic":
        return <BookOpen className="h-4 w-4" />;
      case "sports":
        return <Trophy className="h-4 w-4" />;
      case "technology":
        return <Gamepad2 className="h-4 w-4" />;
      case "cultural":
        return <Music className="h-4 w-4" />;
      case "career":
        return <Coffee className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academic":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "sports":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "technology":
        return "bg-purple-500/10 text-purple-700 border-purple-200";
      case "cultural":
        return "bg-pink-500/10 text-pink-700 border-pink-200";
      case "career":
        return "bg-orange-500/10 text-orange-700 border-orange-200";
      case "wellness":
        return "bg-teal-500/10 text-teal-700 border-teal-200";
      case "entrepreneurship":
        return "bg-indigo-500/10 text-indigo-700 border-indigo-200";
      case "arts":
        return "bg-rose-500/10 text-rose-700 border-rose-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      weekday: date.toLocaleDateString("en-US", { weekday: "short" })
    };
  };

  const handleCreateEvent = async () => {
    if (!currentUser) {
      toast({ title: "Please sign in to create events", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("campus_events").insert({
        ...formData,
        created_by: currentUser.id,
        current_participants: 0,
        is_active: true
      });

      if (error) throw error;

      toast({ title: "Event created successfully!" });
      setIsCreateDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        event_date: "",
        location: "",
        category: "other",
        max_participants: 100
      });
      fetchEvents();
    } catch (error: any) {
      toast({ title: "Error creating event", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from("campus_events")
        .delete()
        .eq("id", eventId)
        .eq("created_by", currentUser.id);

      if (error) throw error;

      toast({ title: "Event deleted successfully!" });
      fetchEvents();
    } catch (error: any) {
      toast({ title: "Error deleting event", description: error.message, variant: "destructive" });
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "academic", "sports", "technology", "cultural", "career", "wellness", "entrepreneurship", "arts"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Campus Events
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover and join exciting events happening around campus
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter event title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your event"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Event Date & Time</Label>
                    <Input
                      id="event_date"
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="cultural">Cultural</SelectItem>
                        <SelectItem value="career">Career</SelectItem>
                        <SelectItem value="wellness">Wellness</SelectItem>
                        <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                        <SelectItem value="arts">Arts</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                    placeholder="Event location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                    placeholder="100"
                  />
                </div>
                <Button onClick={handleCreateEvent} className="w-full">
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category === "all" ? "All Events" : category}
            </Button>
          ))}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const eventDate = formatEventDate(event.event_date);
              return (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(event.category)}
                        <Badge 
                          variant="outline" 
                          className={`capitalize ${getCategoryColor(event.category)}`}
                        >
                          {event.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {eventDate.date}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {eventDate.weekday}
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {eventDate.time}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        {event.current_participants}/{event.max_participants || "∞"} participants
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1">
                        Join Event
                      </Button>
                      {currentUser && event.id.startsWith("mock") === false && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No events found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || selectedCategory !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "No events are currently scheduled"}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create the First Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};