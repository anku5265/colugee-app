import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle,
  UserMinus,
  Search,
  Users,
  GraduationCap,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Connection {
  id: string;
  user_id: string;
  full_name: string;
  department: string;
  year_of_study?: number;
  bio?: string;
  profile_picture_url?: string;
  role: string;
  connections_count: number;
  connected_at?: string;
}

interface MyConnectionsGridProps {
  connections: Connection[];
  onRemoveConnection: (userId: string) => void;
  onViewProfile: (userId: string) => void;
  onStartChat: (userId: string) => void;
}

export const MyConnectionsGrid = ({
  connections,
  onRemoveConnection,
  onViewProfile,
}: MyConnectionsGridProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filteredConnections = connections.filter(conn =>
    conn.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (connections.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Connections Yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Start building your network by connecting with students, mentors, and faculty members.
        </p>
      </div>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'mentor':
      case 'teacher':
        return 'default';
      case 'authority':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your connections..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        {filteredConnections.length} of {connections.length} connections
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConnections.map((connection) => (
          <Card key={connection.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <Avatar 
                    className="h-12 w-12 cursor-pointer"
                    onClick={() => onViewProfile(connection.user_id)}
                  >
                    <AvatarImage src={connection.profile_picture_url} />
                    <AvatarFallback>
                      {connection.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 
                      className="font-medium text-sm truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => onViewProfile(connection.user_id)}
                    >
                      {connection.full_name}
                    </h4>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      <span className="truncate">{connection.department}</span>
                    </div>
                    <Badge 
                      variant={getRoleBadgeVariant(connection.role)} 
                      className="text-xs mt-1 capitalize"
                    >
                      {connection.role}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewProfile(connection.user_id)}>
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/chat')}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Message
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onRemoveConnection(connection.user_id)}
                      className="text-destructive"
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove Connection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('/chat')}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="flex-1"
                  onClick={() => onViewProfile(connection.user_id)}
                >
                  Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
