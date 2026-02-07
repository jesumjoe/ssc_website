import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Bell,
  ChevronRight,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, SeverityBadge, ConcernStatus } from "@/components/ui/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Concern {
  id: string;
  dbId: string;
  subject: string;
  category: string;
  status: ConcernStatus;
  severity?: 1 | 2 | 3 | 4 | 5;
  submittedAt: string;
  assignments: {
    id: string;
    full_name: string;
    role: string;
  }[];
}

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [role, setRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "reviewed" | "all">("pending");
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      navigate("/admin");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  // Fetch concerns and assignments from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Get current user session
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/admin");
          return;
        }

        // 2. Fetch actual role from database
        const { data: userData, error: userError } = await supabase
          .from('admin_users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userError || !userData) throw new Error("Could not verify your role.");
        const userRole = userData.role;
        setRole(userRole);

        // 3. Build Concerns Query based on role
        let query = supabase.from('concerns').select('*');

        // Faculty should only see escalated concerns (Data security handled by RLS, but query filtering for UX)
        if (userRole === 'faculty') {
          query = query.eq('status', 'escalated');
        }

        const { data: concernsData, error: concernsError } = await query.order('created_at', { ascending: false });
        if (concernsError) throw concernsError;

        // 4. Fetch Assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('concern_assignments')
          .select('concern_id, admin_users(id, full_name, role)');

        if (assignmentsError) throw assignmentsError;

        if (concernsData) {
          const formattedConcerns: Concern[] = concernsData.map(c => {
            const concernAssignments = assignmentsData
              ?.filter(a => a.concern_id === c.id)
              .map((a: any) => ({
                id: a.admin_users.id,
                full_name: a.admin_users.full_name,
                role: a.admin_users.role
              })) || [];

            return {
              id: c.concern_number,
              dbId: c.id,
              subject: c.subject,
              category: c.category,
              status: c.status as ConcernStatus,
              severity: c.severity,
              submittedAt: c.created_at,
              assignments: concernAssignments
            };
          });
          setConcerns(formattedConcerns);
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Access Error",
          description: error.message || "Failed to load admin data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const filteredConcerns = concerns.filter((concern) => {
    if (activeTab === "pending") return concern.status === "pending";
    if (activeTab === "reviewed") return concern.status !== "pending";
    return true;
  });

  const stats = {
    total: concerns.length,
    pending: concerns.filter((c) => c.status === "pending").length,
    reviewing: concerns.filter((c) => c.status === "reviewing").length,
    resolved: concerns.filter((c) => c.status === "resolved").length,
  };

  const getRoleTitle = () => {
    if (!role) return "Portal Dashboard";
    switch (role) {
      case "ssc":
        return "SSC Representative Dashboard";
      case "usc":
        return "USC Representative Dashboard";
      case "faculty":
        return "Faculty Mentor Dashboard";
      default:
        return "Admin Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar fixed h-full hidden lg:block">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold">SC</span>
            </div>
            <div>
              <h1 className="text-sidebar-foreground font-semibold">Student Council</h1>
              <p className="text-sidebar-foreground/60 text-xs uppercase">{role} Portal</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button className="sidebar-link sidebar-link-active w-full">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>
            <button className="sidebar-link w-full">
              <FileText className="h-5 w-5" />
              All Concerns
            </button>
            <button className="sidebar-link w-full">
              <Clock className="h-5 w-5" />
              Pending Review
            </button>
            <button className="sidebar-link w-full">
              <CheckCircle className="h-5 w-5" />
              Resolved
            </button>
            {role === "usc" && (
              <button className="sidebar-link w-full">
                <AlertTriangle className="h-5 w-5" />
                Escalated
              </button>
            )}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-sidebar-border">
          <button onClick={handleSignOut} className="sidebar-link w-full text-left">
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="bg-card border-b sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-xl font-semibold text-foreground">{getRoleTitle()}</h1>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {stats.pending}
                </span>
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">JD</span>
                </div>
                <span className="text-sm font-medium hidden sm:block">John Doe</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="concern-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Assigned</p>
                </div>
              </div>
            </div>
            <div className="concern-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
            <div className="concern-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.reviewing}</p>
                  <p className="text-sm text-muted-foreground">Under Review</p>
                </div>
              </div>
            </div>
            <div className="concern-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.resolved}</p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            {[
              { key: "pending", label: "Pending Review" },
              { key: "reviewed", label: "Reviewed" },
              { key: "all", label: "All Concerns" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Concerns List */}
          <div className="space-y-4">
            {filteredConcerns.length > 0 ? (
              filteredConcerns.map((concern) => (
                <Link
                  key={concern.dbId}
                  to={`/admin/concern/${concern.id}?role=${role}`}
                  className="concern-card block"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">
                          {concern.id}
                        </span>
                        <StatusBadge status={concern.status} />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 truncate">
                        {concern.subject}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                        {concern.category} • {new Date(concern.submittedAt).toLocaleDateString()}
                      </p>

                      {/* Assigned Admins Row */}
                      {concern.assignments.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Assigned:</span>
                          <div className="flex -space-x-2">
                            {concern.assignments.map((admin) => (
                              <div
                                key={admin.id}
                                className="w-6 h-6 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center"
                                title={`${admin.full_name} (${admin.role.toUpperCase()})`}
                              >
                                <span className="text-[8px] font-bold text-primary">
                                  {admin.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-2">
                      {concern.severity && <SeverityBadge level={concern.severity} />}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-card rounded-lg border p-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No concerns in this category</h3>
                <p className="text-muted-foreground">
                  You're all caught up! Check back later for new concerns.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
