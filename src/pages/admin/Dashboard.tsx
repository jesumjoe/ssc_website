import { useState } from "react";
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

interface Concern {
  id: string;
  subject: string;
  category: string;
  status: ConcernStatus;
  severity?: 1 | 2 | 3 | 4 | 5;
  submittedAt: string;
  deadline: string;
  assignedSSC: string[];
  assignedUSC: string;
}

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "ssc";
  const [activeTab, setActiveTab] = useState<"pending" | "reviewed" | "all">("pending");

  // Mock data - Replace with actual API data
  const mockConcerns: Concern[] = [
    {
      id: "SC-M1234XY",
      subject: "Inadequate Library Hours During Exam Period",
      category: "Library",
      status: "pending",
      submittedAt: "2024-01-15T10:30:00Z",
      deadline: "2024-01-16T10:30:00Z",
      assignedSSC: ["John Doe", "Jane Smith"],
      assignedUSC: "Dr. Michael Brown",
    },
    {
      id: "SC-N5678AB",
      subject: "Air Conditioning Issues in Building C",
      category: "Infrastructure",
      status: "reviewing",
      severity: 3,
      submittedAt: "2024-01-14T14:00:00Z",
      deadline: "2024-01-15T14:00:00Z",
      assignedSSC: ["Alice Johnson", "Bob Williams"],
      assignedUSC: "Dr. Sarah Davis",
    },
    {
      id: "SC-P9012CD",
      subject: "Request for Extended Lab Access",
      category: "Academic Issues",
      status: "resolved",
      severity: 2,
      submittedAt: "2024-01-13T09:15:00Z",
      deadline: "2024-01-14T09:15:00Z",
      assignedSSC: ["Charlie Brown", "Diana Prince"],
      assignedUSC: "Dr. Robert Wilson",
    },
    {
      id: "SC-Q3456EF",
      subject: "Safety Concerns in Parking Lot",
      category: "Safety & Security",
      status: "escalated",
      severity: 5,
      submittedAt: "2024-01-12T16:45:00Z",
      deadline: "2024-01-13T16:45:00Z",
      assignedSSC: ["Eve Taylor", "Frank Miller"],
      assignedUSC: "Dr. Jennifer Lee",
    },
  ];

  const filteredConcerns = mockConcerns.filter((concern) => {
    if (activeTab === "pending") return concern.status === "pending";
    if (activeTab === "reviewed") return concern.status !== "pending";
    return true;
  });

  const stats = {
    total: mockConcerns.length,
    pending: mockConcerns.filter((c) => c.status === "pending").length,
    reviewing: mockConcerns.filter((c) => c.status === "reviewing").length,
    resolved: mockConcerns.filter((c) => c.status === "resolved").length,
  };

  const getRoleTitle = () => {
    switch (role) {
      case "ssc":
        return "SSC Representative Dashboard";
      case "usc":
        return "USC Representative Dashboard";
      case "faculty":
        return "Faculty Mentor Dashboard";
      default:
        return "Dashboard";
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
          <Link to="/admin" className="sidebar-link w-full">
            <LogOut className="h-5 w-5" />
            Sign Out
          </Link>
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
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
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
                  key={concern.id}
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
                        {concern.severity && <SeverityBadge level={concern.severity} />}
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 truncate">
                        {concern.subject}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {concern.category} • Submitted{" "}
                        {new Date(concern.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>

                  {concern.status === "pending" && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      <span className="text-sm text-warning">
                        Deadline: {new Date(concern.deadline).toLocaleString()}
                      </span>
                    </div>
                  )}
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
