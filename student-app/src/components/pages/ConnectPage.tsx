import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  UserPlus,
  Clock,
  CheckCircle,
  RefreshCw,
  Users,
  Sparkles
} from "lucide-react";
import { ProfileViewPage } from "./ProfileViewPage";
import { ProfileCard } from "@/components/connections/ProfileCard";
import { MentorCard } from "@/components/connections/MentorCard";
import { AuthorityCard } from "@/components/connections/AuthorityCard";
import { PendingRequestsCard } from "@/components/connections/PendingRequestsCard";
import { ConnectionStatsCard } from "@/components/connections/ConnectionStatsCard";
import { SuggestedConnectionsCard } from "@/components/connections/SuggestedConnectionsCard";
import { MyConnectionsGrid } from "@/components/connections/MyConnectionsGrid";
import { useConnections } from "@/hooks/useConnections";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const ConnectPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("my-connections");
  const [connectionFilter, setConnectionFilter] = useState<"all" | "connected" | "requested" | "not_connected">("all");
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    profiles,
    mentors,
    authorities,
    pendingRequests,
    myConnections,
    suggestedConnections,
    stats,
    loading,
    sendConnectionRequest,
    cancelConnectionRequest,
    removeConnection,
    respondToConnectionRequest,
    sendMentorRequest,
    getConnectionStatus,
    refreshData,
  } = useConnections();

  // Show profile view if selected
  if (selectedProfile) {
    return (
      <ProfileViewPage 
        profileId={selectedProfile} 
        onBack={() => setSelectedProfile(null)}
      />
    );
  }

  const applyFilters = <T extends { full_name: string; department: string; user_id: string }>(
    profilesList: T[]
  ) => {
    return profilesList.filter(profile => {
      // Apply search filter
      const matchesSearch = 
        profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Apply connection status filter
      const { status } = getConnectionStatus(profile.user_id);
      
      if (connectionFilter === "all") return true;
      if (connectionFilter === "connected") return status === "connected";
      if (connectionFilter === "requested") return status === "sent" || status === "received";
      if (connectionFilter === "not_connected") return status === "none";
      
      return true;
    });
  };

  const filteredProfiles = applyFilters(profiles);
  const filteredMentors = applyFilters(mentors);
  const filteredAuthorities = applyFilters(authorities);

  const handleStartChat = (userId: string) => {
    toast({
      title: "Opening chat...",
      description: "Redirecting to messages.",
    });
    navigate('/chat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Connect with Your Community
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find peers, mentors, and collaborators to enhance your college experience
          </p>
        </div>

        {/* Stats Card */}
        <ConnectionStatsCard
          totalConnections={stats.totalConnections}
          pendingRequests={stats.pendingRequests}
          sentRequests={stats.sentRequests}
          weeklyGrowth={stats.weeklyGrowth}
          connectionStreak={stats.connectionStreak}
        />

        {/* Pending Connection Requests */}
        <PendingRequestsCard
          requests={pendingRequests}
          onAccept={(requestId) => respondToConnectionRequest(requestId, true)}
          onDecline={(requestId) => respondToConnectionRequest(requestId, false)}
          onViewProfile={setSelectedProfile}
        />

        {/* Suggested Connections */}
        <SuggestedConnectionsCard
          suggestions={suggestedConnections}
          onConnect={sendConnectionRequest}
          onViewProfile={setSelectedProfile}
          onViewAll={() => setActiveTab("students")}
        />

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-6 space-y-4">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon" onClick={refreshData} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Connection Status Filters - only show in discovery tabs */}
          {activeTab !== "my-connections" && (
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                variant={connectionFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setConnectionFilter("all")}
              >
                All
              </Button>
              <Button
                variant={connectionFilter === "connected" ? "default" : "outline"}
                size="sm"
                onClick={() => setConnectionFilter("connected")}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Connected
              </Button>
              <Button
                variant={connectionFilter === "requested" ? "default" : "outline"}
                size="sm"
                onClick={() => setConnectionFilter("requested")}
              >
                <Clock className="h-4 w-4 mr-1" />
                Requested
              </Button>
              <Button
                variant={connectionFilter === "not_connected" ? "default" : "outline"}
                size="sm"
                onClick={() => setConnectionFilter("not_connected")}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Not Connected
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto mb-8">
            <TabsTrigger value="my-connections" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">My</span> ({myConnections.length})
            </TabsTrigger>
            <TabsTrigger value="students">
              Students ({filteredProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="mentors">
              Mentors ({filteredMentors.length})
            </TabsTrigger>
            <TabsTrigger value="authority">
              Authority ({filteredAuthorities.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-connections">
            <MyConnectionsGrid
              connections={myConnections}
              onRemoveConnection={removeConnection}
              onViewProfile={setSelectedProfile}
              onStartChat={handleStartChat}
            />
          </TabsContent>

          <TabsContent value="students">
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No students found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.map((profile) => {
                  const { status, requestId } = getConnectionStatus(profile.user_id);
                  
                  return (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      connectionStatus={status}
                      requestId={requestId}
                      onConnect={sendConnectionRequest}
                      onCancelRequest={cancelConnectionRequest}
                      onRemoveConnection={removeConnection}
                      onViewProfile={setSelectedProfile}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mentors">
            {filteredMentors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No mentors found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredMentors.map((mentor) => {
                  const { status, requestId } = getConnectionStatus(mentor.user_id);
                  
                  return (
                    <MentorCard
                      key={mentor.id}
                      mentor={mentor}
                      connectionStatus={status}
                      requestId={requestId}
                      onConnect={sendConnectionRequest}
                      onCancelRequest={cancelConnectionRequest}
                      onRemoveConnection={removeConnection}
                      onRequestMentorship={sendMentorRequest}
                      onStartChat={handleStartChat}
                      onViewProfile={setSelectedProfile}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="authority">
            {filteredAuthorities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No authorities found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAuthorities.map((authority) => {
                  const { status, requestId } = getConnectionStatus(authority.user_id);
                  
                  return (
                    <AuthorityCard
                      key={authority.id}
                      authority={authority}
                      connectionStatus={status}
                      requestId={requestId}
                      onConnect={sendConnectionRequest}
                      onCancelRequest={cancelConnectionRequest}
                      onRemoveConnection={removeConnection}
                      onStartChat={handleStartChat}
                      onViewProfile={setSelectedProfile}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};