import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Institution {
  id: string;
  code: string;
  name: string;
  address: string;
  contact_email: string;
  phone: string;
}

interface AuthFormProps {
  institution: Institution;
  onBack: () => void;
}

// Validation schema for sign in only
const signInSchema = z.object({
  email: z.string().min(1, "Email or roll number is required").max(255, "Too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const AuthForm = ({ institution, onBack }: AuthFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setLoading(true);

    try {
      console.log('Attempting login with:', values.email);
      
      // First authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        toast({
          title: "Login Failed",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      console.log('Auth successful, checking profile...');

      console.log('Auth successful, checking profile...');

      // Check if user belongs to this institution
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('institution_id, role, full_name')
        .eq('user_id', authData.user.id)
        .single();

      console.log('Profile data:', profile);
      console.log('Profile error:', profileError);
      console.log('Institution ID from form:', institution.id);

      if (profileError || !profile) {
        console.error('Profile not found');
        await supabase.auth.signOut();
        toast({
          title: "Profile Not Found",
          description: "Your profile could not be found. Please contact administrator.",
          variant: "destructive",
        });
        return;
      }

      if (profile.institution_id !== institution.id) {
        console.error('Institution mismatch:', profile.institution_id, 'vs', institution.id);
        // Sign out the user if they don't belong to this institution
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "You are not registered with this institution. Please use the correct institution code.",
          variant: "destructive",
        });
        return;
      }

      console.log('Login successful!');
      toast({
        title: "Welcome back! 👋",
        description: `Ready to connect with your community, ${profile.full_name}?`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 mesh-bg"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
      
      {/* Floating elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <Card className="w-full max-w-md glass-effect hover-lift relative z-10 border-primary/20">
        <CardHeader className="text-center space-y-4">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="absolute left-4 top-4 p-2 h-auto"
          >
            ← Back
          </Button>
          
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {institution.code}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              {institution.name}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Student Login</h2>
              <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
            </div>
            
            <Form {...signInForm}>
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <FormField
                  control={signInForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email / Roll Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your.email@domain.com or roll number"
                          className="bg-background/50 border-primary/20 focus:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signInForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          className="bg-background/50 border-primary/20 focus:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full btn-gradient text-primary-foreground font-semibold" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In to Your Account"
                  )}
                </Button>
              </form>
            </Form>
          </div>
          
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Need help? Contact your institution administrator
            </p>
            <a 
              href="/signup" 
              className="text-sm text-primary hover:underline block"
            >
              Create Test Account →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
