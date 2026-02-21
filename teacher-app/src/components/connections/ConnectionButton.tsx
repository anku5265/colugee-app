import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserPlus, Check, X, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ConnectionButtonProps {
  targetUserId: string;
  targetUserName: string;
  status: 'none' | 'sent' | 'received' | 'connected';
  requestId?: string;
  onUpdate?: () => void;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export const ConnectionButton = ({ 
  targetUserId, 
  targetUserName, 
  status, 
  requestId,
  onUpdate,
  variant = 'default',
  size = 'default'
}: ConnectionButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState("");

  const sendConnectionRequest = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('connection_requests')
        .insert({
          sender_id: user.id,
          receiver_id: targetUserId,
          message: message || null
        });

      if (error) throw error;

      toast({
        title: "Connection request sent",
        description: `Request sent to ${targetUserName}`,
      });

      setDialogOpen(false);
      setMessage("");
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const acceptConnectionRequest = async () => {
    if (!requestId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.rpc('accept_connection_request', {
        request_id: requestId
      });
      
      if (error) throw error;
      
      toast({
        title: "Connection accepted",
        description: `You are now connected with ${targetUserName}`,
      });

      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept connection",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const declineConnectionRequest = async () => {
    if (!requestId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "Connection declined",
        description: "Request has been declined.",
      });

      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to decline connection",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Connected state
  if (status === 'connected') {
    return (
      <Button size={size} variant="outline" disabled>
        <CheckCircle className="h-4 w-4 mr-2" />
        Connected
      </Button>
    );
  }

  // Sent request state
  if (status === 'sent') {
    return (
      <Button size={size} variant="outline" disabled>
        <Clock className="h-4 w-4 mr-2" />
        Pending
      </Button>
    );
  }

  // Received request state (Accept/Decline)
  if (status === 'received') {
    return (
      <div className="flex gap-2">
        <Button
          size={size}
          onClick={acceptConnectionRequest}
          disabled={loading}
        >
          <Check className="h-4 w-4 mr-2" />
          Accept
        </Button>
        <Button
          size={size}
          variant="outline"
          onClick={declineConnectionRequest}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Decline
        </Button>
      </div>
    );
  }

  // No connection state (Connect button)
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant}>
          <UserPlus className="h-4 w-4 mr-2" />
          Connect
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect with {targetUserName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send a connection request to {targetUserName}
          </p>
          <div>
            <Label htmlFor="connection-message">Message (optional)</Label>
            <Textarea
              id="connection-message"
              placeholder="Hi! I'd like to connect with you..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>
          <Button 
            onClick={sendConnectionRequest}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Sending..." : "Send Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};