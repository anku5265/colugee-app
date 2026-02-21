import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Clock } from "lucide-react";

interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  message?: string;
  created_at: string;
  sender_name?: string;
  sender_profile_picture?: string;
}

interface PendingRequestsCardProps {
  requests: ConnectionRequest[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onViewProfile: (userId: string) => void;
}

export const PendingRequestsCard = ({
  requests,
  onAccept,
  onDecline,
  onViewProfile,
}: PendingRequestsCardProps) => {
  if (requests.length === 0) return null;

  return (
    <div className="mb-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Connection Requests ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests.slice(0, 5).map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-background">
                <div className="flex items-center gap-3">
                  <Avatar 
                    className="h-10 w-10 cursor-pointer" 
                    onClick={() => onViewProfile(request.sender_id)}
                  >
                    <AvatarImage src={request.sender_profile_picture} />
                    <AvatarFallback>
                      {request.sender_name?.split(' ').map(n => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p 
                      className="font-medium cursor-pointer hover:text-primary transition-colors"
                      onClick={() => onViewProfile(request.sender_id)}
                    >
                      {request.sender_name}
                    </p>
                    {request.message && (
                      <p className="text-sm text-muted-foreground line-clamp-1">"{request.message}"</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onAccept(request.id)}
                    className="h-8"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDecline(request.id)}
                    className="h-8"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
            {requests.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                +{requests.length - 5} more requests
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
