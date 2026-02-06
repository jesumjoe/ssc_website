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

type UserRole = "ssc" | "usc" | "faculty";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "" as UserRole | "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call - Replace with actual authentication
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo purposes, navigate to dashboard
    toast({
      title: "Login Successful",
      description: `Welcome back! Logged in as ${formData.role?.toUpperCase()} Representative.`,
    });

    // Navigate based on role
    navigate(`/admin/dashboard?role=${formData.role}`);
    setIsLoading(false);
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
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ssc">SSC Representative (Class Level)</SelectItem>
                    <SelectItem value="usc">USC Representative (Department Level)</SelectItem>
                    <SelectItem value="faculty">Faculty Mentor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
