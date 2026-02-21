import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, Clock, BookOpen, Trophy, User, TrendingUp, Lightbulb, GraduationCap, Target } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  category: string;
  current_participants: number;
  max_participants: number;
}

export const HomePage = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("campus_events")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .eq("is_active", true)
        .order("event_date", { ascending: true })
        .limit(3);

      if (error) throw error;
      setUpcomingEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
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
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Connect. Learn. <span className="text-primary">Grow.</span>
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Join Colleaguee - the ultimate college networking platform where students connect, 
            collaborate on projects, and build meaningful relationships that last beyond graduation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="px-8" onClick={() => window.location.href = '#features'}>
              Explore Features
            </Button>
            <Button size="lg" variant="outline" className="px-8" onClick={() => window.location.href = '#how-it-works'}>
              How It Works
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover tools and features designed specifically for college students to enhance their academic and social experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: Users, title: "Connect", description: "Find your seniors, juniors, and peers from your college" },
              { icon: Calendar, title: "Discover", description: "Stay updated on campus events and activities" },
              { icon: BookOpen, title: "Collaborate", description: "Work on projects together and share knowledge" },
              { icon: Target, title: "Goal Tracking", description: "Set and achieve your academic and personal goals" },
              { icon: GraduationCap, title: "Academic Growth", description: "Track your achievements and certifications" },
              { icon: Lightbulb, title: "Project Showcase", description: "Display your work and get feedback from peers" }
            ].map((feature, index) => (
              <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <feature.icon className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                  <CardDescription className="group-hover:text-foreground transition-colors">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Interactive Stats Section */}
        <section className="py-12 bg-muted/30 rounded-xl mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-8">
            {[
              { number: "10K+", label: "Active Students", icon: Users },
              { number: "500+", label: "Projects Shared", icon: BookOpen },
              { number: "50+", label: "Universities", icon: GraduationCap },
              { number: "95%", label: "Success Rate", icon: TrendingUp }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Events */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center">
            <Calendar className="h-8 w-8 text-primary mr-3" />
            Upcoming Events
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
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
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        {getCategoryIcon(event.category)}
                        <span className="capitalize">{event.category}</span>
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {event.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatEventDate(event.event_date)}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        {event.current_participants}/{event.max_participants || "∞"} participants
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No upcoming events</h3>
                <p className="text-muted-foreground">Check back later for new campus events!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 mb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How Colleaguee Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in just a few simple steps and unlock your college networking potential.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                step: "01",
                title: "Create Your Profile",
                description: "Set up your profile with academic details, interests, and goals to help others find you.",
                icon: User
              },
              {
                step: "02", 
                title: "Connect & Discover",
                description: "Find classmates, join study groups, and discover projects that match your interests.",
                icon: Users
              },
              {
                step: "03",
                title: "Collaborate & Grow",
                description: "Work on projects together, attend events, and build lasting professional relationships.",
                icon: Lightbulb
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6">
                    <step.icon className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <div className="text-primary font-bold text-lg mb-2">Step {step.step}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent transform translate-x-[-50%]" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            Complete your profile and start connecting with your campus community
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" className="flex items-center" onClick={() => window.location.href = '/connect'}>
              <Users className="h-5 w-5 mr-2" />
              Browse Directory
            </Button>
            <Button size="lg" variant="outline" className="flex items-center" onClick={() => window.location.href = '/events'}>
              <Calendar className="h-5 w-5 mr-2" />
              View All Events
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};