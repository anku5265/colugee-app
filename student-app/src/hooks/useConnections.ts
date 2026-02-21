import { useState, useEffect, useCallback, useMemo } from "react";
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
  institution_id?: string;
  connections_count: number;
  daily_streak: number;
  matchReason?: string;
}

interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  message?: string;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
  sender_profile_picture?: string;
}

interface Connection {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

export const useConnections = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [mentors, setMentors] = useState<Profile[]>([]);
  const [authorities, setAuthorities] = useState<Profile[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setCurrentProfile(profile as Profile | null);
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    if (!currentProfile) return;
    
    try {
      const { data: discoveryProfiles, error } = await supabase
        .rpc('get_discovery_profiles', { search_term: '' });

      if (error) {
        console.error('Error fetching discovery profiles:', error);
        return;
      }

      if (discoveryProfiles) {
        const userIds = discoveryProfiles.map(p => p.user_id);
        const { data: profileStats } = await supabase
          .from('profiles')
          .select('user_id, connections_count, daily_streak')
          .in('user_id', userIds);
        
        const statsMap = new Map(profileStats?.map(s => [s.user_id, s]) || []);
        
        const formattedProfiles = discoveryProfiles.map(p => {
          const stats = statsMap.get(p.user_id);
          return {
            id: p.user_id,
            user_id: p.user_id,
            full_name: p.full_name || 'Unknown User',
            email: '',
            role: p.role || 'student',
            department: p.department || 'Unknown',
            year_of_study: p.year_of_study,
            bio: p.bio,
            profile_picture_url: p.profile_picture_url,
            institution_id: p.institution_id,
            connections_count: stats?.connections_count || 0,
            daily_streak: stats?.daily_streak || 0
          };
        });

        let filteredProfiles = formattedProfiles;
        if (currentProfile?.institution_id) {
          const sameInstitution = formattedProfiles.filter(p => p.institution_id === currentProfile.institution_id);
          const otherInstitutions = formattedProfiles.filter(p => p.institution_id !== currentProfile.institution_id);
          filteredProfiles = [...sameInstitution, ...otherInstitutions];
        }

        const students = filteredProfiles.filter(p => p.role === 'student');
        const mentorProfiles = filteredProfiles.filter(p => p.role === 'mentor' || p.role === 'teacher');
        const authorityProfiles = filteredProfiles.filter(p => p.role === 'authority');
        
        setProfiles(students);
        setMentors(mentorProfiles);
        setAuthorities(authorityProfiles);
      }
    } catch (error) {
      console.error('Error in fetchProfiles:', error);
    }
  }, [currentProfile]);

  const fetchConnectionRequests = useCallback(async () => {
    if (!currentUser) return;

    const { data: requestsData } = await supabase
      .from('connection_requests')
      .select('*')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false });

    if (requestsData) {
      const userIds = [...new Set([
        ...requestsData.map(req => req.sender_id),
        ...requestsData.map(req => req.receiver_id)
      ])];
      
      const { data: users } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url')
        .in('user_id', userIds);

      const usersMap = new Map(users?.map(u => [u.user_id, u]) || []);
      
      const requestsWithNames = requestsData.map(req => ({
        ...req,
        sender_name: usersMap.get(req.sender_id)?.full_name || 'Unknown',
        receiver_name: usersMap.get(req.receiver_id)?.full_name || 'Unknown',
        sender_profile_picture: usersMap.get(req.sender_id)?.profile_picture_url
      }));
      setConnectionRequests(requestsWithNames);
    }
  }, [currentUser]);

  const sendConnectionRequest = useCallback(async (receiverId: string, message?: string) => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('connection_requests')
        .insert({
          sender_id: currentUser.id,
          receiver_id: receiverId,
          message
        });

      if (error) throw error;

      toast({
        title: "Connection request sent",
        description: "Your request has been sent successfully!",
      });

      fetchConnectionRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive",
      });
    }
  }, [currentUser, fetchConnectionRequests]);

  const cancelConnectionRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request cancelled",
        description: "Your connection request has been cancelled.",
      });

      fetchConnectionRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel request",
        variant: "destructive",
      });
    }
  }, [fetchConnectionRequests]);

  const removeConnection = useCallback(async (targetUserId: string) => {
    if (!currentUser) return;
    
    try {
      // Remove from connections table
      const { error: connError } = await supabase
        .from('connections')
        .delete()
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${currentUser.id})`);

      if (connError) throw connError;

      // Update connection request status to allow reconnecting
      const { error: reqError } = await supabase
        .from('connection_requests')
        .delete()
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUser.id})`);

      // Decrement connection counts for both users
      await supabase.rpc('decrement_connections_count' as any, { user_id_param: currentUser.id });
      await supabase.rpc('decrement_connections_count' as any, { user_id_param: targetUserId });

      toast({
        title: "Connection removed",
        description: "You are no longer connected.",
      });

      fetchConnectionRequests();
      fetchProfiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove connection",
        variant: "destructive",
      });
    }
  }, [currentUser, fetchConnectionRequests, fetchProfiles]);

  const respondToConnectionRequest = useCallback(async (requestId: string, accept: boolean) => {
    try {
      if (accept) {
        const { error } = await supabase.rpc('accept_connection_request', {
          request_id: requestId
        });
        
        if (error) throw error;
        
        toast({
          title: "Connection accepted",
          description: "You are now connected!",
        });
      } else {
        const { error } = await supabase
          .from('connection_requests')
          .update({ status: 'rejected' })
          .eq('id', requestId);
        
        if (error) throw error;
        
        toast({
          title: "Connection declined",
          description: "Request has been declined.",
        });
      }

      fetchConnectionRequests();
      fetchProfiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to request",
        variant: "destructive",
      });
    }
  }, [fetchConnectionRequests, fetchProfiles]);

  const sendMentorRequest = useCallback(async (mentorId: string) => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('mentoring_relationships')
        .insert({
          mentor_id: mentorId,
          mentee_id: currentUser.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Mentor request sent",
        description: "Your mentorship request has been sent!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send mentor request",
        variant: "destructive",
      });
    }
  }, [currentUser]);

  const getConnectionStatus = useCallback((profileId: string): { status: 'none' | 'sent' | 'received' | 'connected'; requestId?: string } => {
    const existingRequest = connectionRequests.find(req => 
      (req.sender_id === currentUser?.id && req.receiver_id === profileId) ||
      (req.receiver_id === currentUser?.id && req.sender_id === profileId)
    );
    
    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return { status: 'connected', requestId: existingRequest.id };
      }
      if (existingRequest.status === 'pending') {
        const status = existingRequest.sender_id === currentUser?.id ? 'sent' : 'received';
        return { status, requestId: existingRequest.id };
      }
    }
    return { status: 'none' };
  }, [connectionRequests, currentUser]);

  const fetchConnections = useCallback(async () => {
    if (!currentUser) return;
    
    const { data: connectionsData } = await supabase
      .from('connections')
      .select('*')
      .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);
    
    if (connectionsData) {
      setConnections(connectionsData);
    }
  }, [currentUser]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfiles(),
        fetchConnectionRequests(),
        fetchConnections()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [fetchProfiles, fetchConnectionRequests, fetchConnections]);

  // Real-time subscriptions
  useEffect(() => {
    if (!currentUser) return;

    const connectionRequestsChannel = supabase
      .channel('connection-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connection_requests',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log('Connection request change:', payload);
          fetchConnectionRequests();
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Connection Request",
              description: "Someone wants to connect with you!",
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connection_requests',
          filter: `sender_id=eq.${currentUser.id}`,
        },
        () => {
          fetchConnectionRequests();
        }
      )
      .subscribe();

    const connectionsChannel = supabase
      .channel('connections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
        },
        () => {
          fetchConnections();
          fetchProfiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(connectionRequestsChannel);
      supabase.removeChannel(connectionsChannel);
    };
  }, [currentUser, fetchConnectionRequests, fetchConnections, fetchProfiles]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (currentUser && currentProfile) {
      fetchData();
    }
  }, [currentUser, currentProfile, fetchData]);

  const pendingRequests = connectionRequests.filter(req => 
    req.receiver_id === currentUser?.id && req.status === 'pending'
  );

  const sentRequests = connectionRequests.filter(req =>
    req.sender_id === currentUser?.id && req.status === 'pending'
  );

  // Get my connections as profiles
  const myConnections = useMemo(() => {
    if (!currentUser) return [];
    
    const connectedUserIds = connections.map(conn => 
      conn.user1_id === currentUser.id ? conn.user2_id : conn.user1_id
    );
    
    const allProfiles = [...profiles, ...mentors, ...authorities];
    return allProfiles.filter(p => connectedUserIds.includes(p.user_id));
  }, [connections, currentUser, profiles, mentors, authorities]);

  // Suggested connections based on department and year
  const suggestedConnections = useMemo(() => {
    if (!currentProfile || !currentUser) return [];
    
    const connectedIds = connections.map(c => 
      c.user1_id === currentUser.id ? c.user2_id : c.user1_id
    );
    const pendingIds = connectionRequests
      .filter(r => r.status === 'pending')
      .map(r => r.sender_id === currentUser.id ? r.receiver_id : r.sender_id);
    
    const excludeIds = new Set([...connectedIds, ...pendingIds, currentUser.id]);
    
    const notConnected = profiles.filter(p => !excludeIds.has(p.user_id));
    
    // Score and sort by relevance
    const scored = notConnected.map(profile => {
      let score = 0;
      let reasons: string[] = [];
      
      // Same department
      if (profile.department === currentProfile.department) {
        score += 30;
        reasons.push('Same department');
      }
      
      // Same year
      if (profile.year_of_study === currentProfile.year_of_study) {
        score += 20;
        reasons.push('Same year');
      }
      
      // Close year (within 1)
      if (profile.year_of_study && currentProfile.year_of_study && 
          Math.abs(profile.year_of_study - currentProfile.year_of_study) === 1) {
        score += 10;
      }
      
      // High connection count (popular)
      if (profile.connections_count > 10) {
        score += 5;
        reasons.push('Popular');
      }
      
      // Active streak
      if (profile.daily_streak > 5) {
        score += 5;
        reasons.push('Active');
      }
      
      return {
        ...profile,
        score,
        matchReason: reasons[0] || 'Suggested'
      };
    });
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [profiles, currentProfile, currentUser, connections, connectionRequests]);

  // Stats
  const stats = useMemo(() => ({
    totalConnections: myConnections.length,
    pendingRequests: pendingRequests.length,
    sentRequests: sentRequests.length,
    weeklyGrowth: connections.filter(c => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(c.created_at) > weekAgo;
    }).length,
    connectionStreak: currentProfile?.daily_streak || 0
  }), [myConnections, pendingRequests, sentRequests, connections, currentProfile]);

  return {
    profiles,
    mentors,
    authorities,
    connectionRequests,
    pendingRequests,
    sentRequests,
    connections,
    myConnections,
    suggestedConnections,
    stats,
    loading,
    currentUser,
    currentProfile,
    sendConnectionRequest,
    cancelConnectionRequest,
    removeConnection,
    respondToConnectionRequest,
    sendMentorRequest,
    getConnectionStatus,
    refreshData: fetchData,
  };
};
