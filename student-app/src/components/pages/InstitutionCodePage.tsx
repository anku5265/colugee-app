import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, School, GraduationCap, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Institution {
  id: string;
  code: string;
  name: string;
  address: string;
  contact_email: string;
  phone: string;
}

interface InstitutionCodePageProps {
  onInstitutionSelected: (institution: Institution) => void;
}

export const InstitutionCodePage = ({ onInstitutionSelected }: InstitutionCodePageProps) => {
  const [institutionCode, setInstitutionCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const { toast } = useToast();

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionCode.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("institutions")
        .select("*")
        .eq("code", institutionCode.toUpperCase())
        .single();

      if (error || !data) {
        toast({
          title: "Institution not found",
          description: "Please check your institution code and try again.",
          variant: "destructive",
        });
        return;
      }

      setInstitution(data);
      toast({
        title: "Institution found!",
        description: `Welcome to ${data.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (institution) {
      onInstitutionSelected(institution);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-accent/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-secondary/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 right-10 w-16 h-16 bg-primary/10 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
      </div>

      <Card className="w-full max-w-lg relative z-10 border-primary/20 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <School className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome to Colugee
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-2">
              Your all-in-one educational platform
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!institution ? (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institutionCode" className="text-base font-medium">
                  Enter Institution Code
                </Label>
                <Input
                  id="institutionCode"
                  type="text"
                  placeholder="e.g., IITD, MIT, NITK"
                  value={institutionCode}
                  onChange={(e) => setInstitutionCode(e.target.value)}
                  className="text-lg h-12 border-primary/20 focus:border-primary"
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300"
                disabled={loading || !institutionCode.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-5 w-5" />
                    Find Institution
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {institution.code}
                </Badge>
                <h3 className="text-xl font-bold text-foreground">
                  {institution.name}
                </h3>
                <p className="text-muted-foreground">
                  {institution.address}
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setInstitution(null);
                    setInstitutionCode("");
                  }}
                >
                  Change
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  onClick={handleProceed}
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Continue
                </Button>
              </div>
            </div>
          )}

          <div className="text-center pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Don't see your institution? Contact your admin to get it added.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};