import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, Eye, EyeOff } from "lucide-react";
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

const signInSchema = z.object({
  email: z.string().min(1, "Email is required").max(255, "Too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Role → App URL mapping
// Uses env vars in production, falls back to localhost ports for dev
const TEACHER_APP_URL = import.meta.env.VITE_TEACHER_APP_URL || "http://localhost:5174";
const ADMIN_APP_URL   = import.meta.env.VITE_ADMIN_APP_URL   || "http://localhost:5175";

const TEACHER_ROLES  = ['teacher', 'authority'];
const ADMIN_ROLES    = ['institute_admin', 'super_admin'];

export const AuthForm = ({ institution, onBack }: AuthFormProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setLoading(true);
    try {
      // Step 1: Authenticate
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) {
        toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
        return;
      }

      // Step 2: Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('institution_id, role, full_name')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        toast({ title: "Profile Not Found", description: "Contact your administrator.", variant: "destructive" });
        return;
      }

      // Step 3: Tenant check — user must belong to this institution
      // super_admin has no institution_id, allow them through admin panel only
      if (profile.role !== 'super_admin' && profile.institution_id !== institution.id) {
        await supabase.auth.signOut();
        toast({
          title: "Invalid credentials for this institute",
          description: `This account is not registered with ${institution.code}. Please use the correct institution code.`,
          variant: "destructive",
        });
        return;
      }

      // Step 4: Role-based redirect
      if (ADMIN_ROLES.includes(profile.role)) {
        // Redirect to admin panel
        toast({ title: "Redirecting to Admin Panel...", description: `Welcome, ${profile.full_name}` });
        setTimeout(() => { window.location.href = ADMIN_APP_URL; }, 800);
        return;
      }

      if (TEACHER_ROLES.includes(profile.role)) {
        // Redirect to teacher app
        toast({ title: "Redirecting to Teacher Dashboard...", description: `Welcome, ${profile.full_name}` });
        setTimeout(() => { window.location.href = TEACHER_APP_URL; }, 800);
        return;
      }

      // Step 5: Student — stay in this app
      toast({ title: "Welcome back! 👋", description: `Ready to go, ${profile.full_name}?` });

    } catch {
      toast({ title: "Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 mesh-bg"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <Card className="w-full max-w-md glass-effect hover-lift relative z-10 border-primary/20">
        <CardHeader className="text-center space-y-4">
          <Button variant="ghost" onClick={onBack} className="absolute left-4 top-4 p-2 h-auto">
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
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-foreground">Login</h2>
              <p className="text-sm text-muted-foreground">
                Enter your credentials — you'll be directed to the right dashboard automatically
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your.email@domain.com"
                          className="bg-background/50 border-primary/20 focus:border-primary"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="bg-background/50 border-primary/20 focus:border-primary pr-10"
                            autoComplete="current-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full btn-gradient text-primary-foreground font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Need help? Contact your institution administrator
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
