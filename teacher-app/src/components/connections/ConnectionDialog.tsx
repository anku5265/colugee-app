import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

interface ConnectionDialogProps {
  targetUserName: string;
  onSendRequest: (message?: string) => void;
  triggerVariant?: "default" | "outline";
  compact?: boolean;
}

export const ConnectionDialog = ({
  targetUserName,
  onSendRequest,
  triggerVariant = "default",
  compact = false,
}: ConnectionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    await onSendRequest(message || undefined);
    setMessage("");
    setOpen(false);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={triggerVariant} className={compact ? "w-full" : "flex-1"}>
          <UserPlus className={compact ? "h-4 w-4" : "h-4 w-4 mr-2"} />
          {!compact && "Connect"}
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
            onClick={handleSend}
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
