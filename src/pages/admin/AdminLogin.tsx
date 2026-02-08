import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MainLayout from "@/components/layout/MainLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "ssc" | "usc" | "faculty";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = Date.now();
    console.log("[Login] Starting login process...");
    setIsLoading(true);

    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const authEmail = authData.user.email?.toLowerCase();
        const currentAuthId = authData.user.id;

        console.log("[Login] Successful Auth. Email:", authEmail, "ID:", currentAuthId);

        // 2. Fetch the user's role from admin_users table by EMAIL (case-insensitive)
        const { data: userData, error: userError } = await supabase
          .from("admin_users")
          .select("*")
          .ilike("email", authEmail || "");

        if (userError) {
          console.error("[Login] Database error during email lookup:", userError);
          throw new Error("Internal database error. Please check RLS policies.");
        }

        // Handle missing record
        if (!userData || userData.length === 0) {
          console.warn("[Login] No record found in admin_users for email:", authEmail);
          toast({
            title: "Admin Access Required",
            description: `No admin profile found for ${authEmail}. Please ensure your email is added to the admin_users table in Supabase.`,
            variant: "destructive",
          });
          return;
        }

        const adminProfile = userData[0];
        console.log("[Login] Found admin profile:", adminProfile);

        // 3. Auto-link the ID if it doesn't match the current Auth ID
        if (adminProfile.id !== currentAuthId) {
          console.log("[Login] Linking Auth ID to admin record...");
          const { error: updateError } = await supabase
            .from("admin_users")
            .update({ id: currentAuthId })
            .eq("email", adminProfile.email);

          if (updateError) {
            console.error("[Login] Failed to link ID:", updateError);
            // We don't throw here, just log it. They might still get access if RLS allows.
          }
        }

        const userRole = adminProfile.role;

        toast({
          title: "Login Successful",
          description: `Welcome back! Logged in as ${userRole.toUpperCase()} Representative.`,
        });

        // 4. Navigate to dashboard with the correct role
        navigate(`/admin/dashboard?role=${userRole}`);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during sign in.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[70vh] flex items-center justify-center py-12 bg-background">
        <div className="w-full max-w-md px-4">
          <div className="bg-card rounded-lg border p-8 card-elevated animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
              <p className="text-muted-foreground mt-2">
                Sign in to access the concern management system
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Having trouble logging in?{" "}
              <a href="#" className="text-primary hover:underline">
                Contact IT Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminLogin;
