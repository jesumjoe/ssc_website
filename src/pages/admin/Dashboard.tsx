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
  User,
  Phone,
  Mail,
  BookOpen,
  School,
  AlertCircle,
  Tag,
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
  const [userData, setUserData] = useState<any>(null);
  const [partnerData, setPartnerData] = useState<any>(null);
  const [subordinates, setSubordinates] = useState<any[]>([]);
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

        // 2. Fetch complete user data
        const { data: adminData, error: userError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userError || !adminData) throw new Error("Could not verify your role.");
        setRole(adminData.role);
        setUserData(adminData);

        // 3. Parallelize fetching concerns, assignments, and role-specific data
        let concernsQuery = supabase.from('concerns').select('*');

        if (adminData.role === 'faculty') {
          concernsQuery = concernsQuery.or('status.eq.escalated,is_flagship.eq.true,is_open_forum.eq.true');
        }

        const [concernsResult, assignmentsResult, supplementaryResult] = await Promise.all([
          concernsQuery.order('created_at', { ascending: false }),
          supabase.from('concern_assignments').select('concern_id, admin_users(id, full_name, role)'),
          (async () => {
            if (adminData.role === 'ssc' && adminData.partner_id) {
              return supabase.from('admin_users').select('*').eq('id', adminData.partner_id).single();
            } else if (adminData.role === 'usc' || adminData.role === 'faculty') {
              return supabase.from('admin_users').select('*').eq('parent_id', user.id);
            }
            return { data: null };
          })()
        ]);

        if (concernsResult.error) throw concernsResult.error;
        if (assignmentsResult.error) throw assignmentsResult.error;

        // Set supplementary data
        if (adminData.role === 'ssc') {
          setPartnerData(supplementaryResult.data);
        } else {
          setSubordinates((supplementaryResult.data as any) || []);
        }

        const concernsData = concernsResult.data;
        const assignmentsData = assignmentsResult.data;

        if (concernsData) {
          const formattedConcerns: Concern[] = concernsData.map(c => {
            const concernAssignments = (assignmentsData as any)
              ?.filter((a: any) => a.concern_id === c.id)
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
  }, [navigate, toast]);

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
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                  {userData?.avatar_url ? (
                    <img src={userData.avatar_url} alt={userData.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-foreground text-sm font-medium">
                      {userData?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'AD'}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:block">{userData?.full_name || 'Admin'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Role-Specific Profile Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Main User Profile */}
            <div className="bg-card rounded-xl border p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {userData?.avatar_url ? (
                    <img src={userData.avatar_url} alt={userData.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{userData?.full_name}</h2>
                  <p className="text-sm text-muted-foreground uppercase font-semibold">{role}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{userData?.email}</span>
                </div>
                {userData?.phone_number && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{userData.phone_number}</span>
                  </div>
                )}
                {userData?.class && (
                  <div className="flex items-center gap-3 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">Class: {userData.class}</span>
                  </div>
                )}
                {userData?.department && (
                  <div className="flex items-center gap-3 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">Dept: {userData.department}</span>
                  </div>
                )}
                {userData?.school && (
                  <div className="flex items-center gap-3 text-sm">
                    <School className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">School: {userData.school}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Role-Specific Secondary Profiles (Partner/Subordinates Summary) */}
            {role === 'ssc' && partnerData && (
              <div className="bg-card rounded-xl border p-6 shadow-sm border-primary/20 bg-primary/5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">SSC Partner</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {partnerData.avatar_url ? (
                      <img src={partnerData.avatar_url} alt={partnerData.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{partnerData.full_name}</h4>
                    <p className="text-xs text-muted-foreground">{partnerData.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{partnerData.phone_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                    <span>{partnerData.class || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {role === 'usc' && (
              <div className="bg-card rounded-xl border p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">SSCs Under Management</h3>
                <div className="flex flex-wrap gap-2">
                  {subordinates.map(ssc => (
                    <div key={ssc.id} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-xs">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {ssc.avatar_url ? (
                          <img src={ssc.avatar_url} className="w-full h-full object-cover" />
                        ) : ssc.full_name[0]}
                      </div>
                      <span>{ssc.full_name}</span>
                    </div>
                  ))}
                  {subordinates.length === 0 && <p className="text-xs text-muted-foreground">No SSCs assigned yet.</p>}
                </div>
              </div>
            )}

            {role === 'faculty' && (
              <div className="bg-card rounded-xl border p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">USCs Under Mentorship</h3>
                <div className="flex flex-wrap gap-2">
                  {subordinates.map(usc => (
                    <div key={usc.id} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-xs">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {usc.avatar_url ? (
                          <img src={usc.avatar_url} className="w-full h-full object-cover" />
                        ) : usc.full_name[0]}
                      </div>
                      <span>{usc.full_name}</span>
                    </div>
                  ))}
                  {subordinates.length === 0 && <p className="text-xs text-muted-foreground">No USCs assigned yet.</p>}
                </div>
              </div>
            )}
          </div>
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
            {role === 'ssc' ? (
              // SSC: Max 2 concerns
              concerns.slice(0, 2).map((concern) => (
                <div key={concern.dbId} className="concern-card flex items-center justify-between gap-4">
                  <Link
                    to={`/admin/concern/${concern.id}?role=${role}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-muted-foreground">{concern.id}</span>
                      <StatusBadge status={concern.status} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 truncate">{concern.subject}</h3>
                    <p className="text-sm text-muted-foreground">{concern.category}</p>
                  </Link>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <input
                        type="checkbox"
                        checked={concern.status === 'resolved'}
                        onChange={async () => {
                          const newStatus = concern.status === 'resolved' ? 'pending' : 'resolved';
                          const { error } = await supabase
                            .from('concerns')
                            .update({ status: newStatus })
                            .eq('id', concern.dbId);
                          if (!error) {
                            setConcerns(prev => prev.map(c => c.dbId === concern.dbId ? { ...c, status: newStatus as ConcernStatus } : c));
                          }
                        }}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-[10px] mt-1 text-muted-foreground">Solved</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))
            ) : role === 'usc' ? (
              // USC: Grouped by SSC
              subordinates.map(ssc => {
                const sscConcerns = concerns.filter(c => c.assignments.some(a => a.id === ssc.id));
                return (
                  <div key={ssc.id} className="mb-6">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase mb-3 px-2 flex items-center gap-2">
                      <User className="h-4 w-4" /> {ssc.full_name}'s Assigned Concerns
                    </h3>
                    <div className="space-y-3">
                      {sscConcerns.map(concern => (
                        <Link
                          key={concern.dbId}
                          to={`/admin/concern/${concern.id}?role=${role}`}
                          className="concern-card block bg-card/50 hover:bg-card transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs text-muted-foreground">{concern.id}</span>
                                <StatusBadge status={concern.status} />
                              </div>
                              <h4 className="font-medium text-foreground text-sm">{concern.subject}</h4>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Link>
                      ))}
                      {sscConcerns.length === 0 && <p className="text-xs text-muted-foreground italic px-4">No concerns assigned to this SSC.</p>}
                    </div>
                  </div>
                );
              })
            ) : role === 'faculty' ? (
              // Faculty: Huge Concerns (Flagship/Open Forum)
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-destructive uppercase mb-3 px-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Flagship Concerns (Immediate Action)
                  </h3>
                  <div className="space-y-3">
                    {concerns.filter(c => (c as any).is_flagship).map(concern => (
                      <Link
                        key={concern.dbId}
                        to={`/admin/concern/${concern.id}?role=${role}`}
                        className="concern-card block border-destructive/20 bg-destructive/5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-muted-foreground">{concern.id}</span>
                              <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Flagship</span>
                            </div>
                            <h4 className="font-bold text-foreground">{concern.subject}</h4>
                          </div>
                          <ChevronRight className="h-5 w-5 text-destructive" />
                        </div>
                      </Link>
                    ))}
                    {concerns.filter(c => (c as any).is_flagship).length === 0 && <p className="text-xs text-muted-foreground italic px-4">No flagship concerns at the moment.</p>}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-info uppercase mb-3 px-2 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Open Forum Discussions
                  </h3>
                  <div className="space-y-3">
                    {concerns.filter(c => (c as any).is_open_forum).map(concern => (
                      <Link
                        key={concern.dbId}
                        to={`/admin/concern/${concern.id}?role=${role}`}
                        className="concern-card block border-info/20 bg-info/5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-muted-foreground">{concern.id}</span>
                              <span className="bg-info text-info-foreground text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Open Forum</span>
                            </div>
                            <h4 className="font-bold text-foreground">{concern.subject}</h4>
                          </div>
                          <ChevronRight className="h-5 w-5 text-info" />
                        </div>
                      </Link>
                    ))}
                    {concerns.filter(c => (c as any).is_open_forum).length === 0 && <p className="text-xs text-muted-foreground italic px-4">No open forum concerns.</p>}
                  </div>
                </div>
              </div>
            ) : (
              // Default/All
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
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-2">
                      {concern.severity && <SeverityBadge level={concern.severity} />}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))
            )}

            {concerns.length === 0 && !isLoading && (
              <div className="bg-card rounded-lg border p-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No concerns found</h3>
                <p className="text-muted-foreground">
                  Everything is clear for now.
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
