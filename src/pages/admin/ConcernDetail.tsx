import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  Tag,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StatusBadge, SeverityBadge, ConcernStatus } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminUser {
  id: string;
  full_name: string;
  role: string;
  email: string;
}

interface AssignedAdmin {
  id: string;
  full_name: string;
  role: string;
  email: string;
}

const ConcernDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [role, setRole] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [concern, setConcern] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [assignedAdmins, setAssignedAdmins] = useState<AssignedAdmin[]>([]);
  const [allAdmins, setAllAdmins] = useState<AdminUser[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState("");

  const [sscReview, setSSCReview] = useState({
    validity: "",
    notes: "",
  });
  const [uscReview, setUSCReview] = useState({
    severity: "",
    escalate: "",
    notes: "",
  });

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
        setRole(userData.role);

        // 3. Fetch Concern Details
        const { data: concernData, error: concernError } = await supabase
          .from("concerns")
          .select("*")
          .filter("concern_number", "eq", id)
          .single();

        if (concernError || !concernData) {
          throw new Error("Concern not found or you don't have access.");
        }

        // Double check permissions (frontend guard)
        if (userData.role === 'faculty' && concernData.status !== 'escalated') {
          throw new Error("You only have access to escalated concerns.");
        }

        setConcern(concernData);

        // 2. Fetch Timeline
        const { data: timelineData, error: timelineError } = await supabase
          .from("concern_timeline")
          .select("*")
          .eq("concern_id", concernData.id)
          .order("created_at", { ascending: false });

        if (timelineError) throw timelineError;
        setTimeline(timelineData);

        // 3. Fetch Assigned Admins
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("concern_assignments")
          .select("admin_id, admin_users(*)")
          .eq("concern_id", concernData.id);

        if (assignmentError) throw assignmentError;
        const formattedAssigned = assignmentData.map((a: any) => ({
          id: a.admin_users.id,
          full_name: a.admin_users.full_name,
          role: a.admin_users.role,
          email: a.admin_users.email,
        }));
        setAssignedAdmins(formattedAssigned);

        // 4. Fetch All Admins (for assignment dropdown)
        const { data: adminData, error: adminError } = await supabase
          .from("admin_users")
          .select("*");

        if (adminError) throw adminError;
        setAllAdmins(adminData);

      } catch (error: any) {
        console.error("Error fetching concern details:", error);
        toast({
          title: "Error",
          description: "Failed to load concern details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAssignAdmin = async () => {
    if (!selectedAdminId) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("concern_assignments")
        .insert({
          concern_id: concern.id,
          admin_id: selectedAdminId,
        });

      if (error) throw error;

      toast({
        title: "Admin Assigned",
        description: "The representative has been successfully assigned to this concern.",
      });

      // Refresh assigned admins
      const { data: assignmentData } = await supabase
        .from("concern_assignments")
        .select("admin_id, admin_users(*)")
        .eq("concern_id", concern.id);

      const formattedAssigned = assignmentData?.map((a: any) => ({
        id: a.admin_users.id,
        full_name: a.admin_users.full_name,
        role: a.admin_users.role,
        email: a.admin_users.email,
      })) || [];
      setAssignedAdmins(formattedAssigned);
      setSelectedAdminId("");
    } catch (error: any) {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign admin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSSCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newStatus = sscReview.validity === "valid" ? "reviewing" : "resolved";

      const { error } = await supabase
        .from("concerns")
        .update({
          status: newStatus,
          // We can store notes in a separate field if we add it, for now we add to timeline
        })
        .eq("id", concern.id);

      if (error) throw error;

      // Add to timeline
      await supabase.from("concern_timeline").insert({
        concern_id: concern.id,
        title: `SSC Review: ${sscReview.validity.toUpperCase()}`,
        description: sscReview.notes,
      });

      toast({
        title: "Review Submitted",
        description: `Concern marked as ${sscReview.validity}. Status updated to ${newStatus}.`,
      });

      navigate(`/admin/dashboard?role=${role}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUSCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newStatus = uscReview.escalate === "yes" ? "escalated" : "resolved";

      const { error } = await supabase
        .from("concerns")
        .update({
          status: newStatus,
          severity: parseInt(uscReview.severity),
        })
        .eq("id", concern.id);

      if (error) throw error;

      // Add to timeline
      await supabase.from("concern_timeline").insert({
        concern_id: concern.id,
        title: `USC Assessment: ${uscReview.escalate === "yes" ? "ESCALATED" : "RESOLVED"}`,
        description: `Severity: ${uscReview.severity}. Notes: ${uscReview.notes}`,
      });

      toast({
        title: "Assessment Completed",
        description:
          uscReview.escalate === "yes"
            ? "Concern has been escalated to faculty."
            : "Concern marked as resolved.",
      });

      navigate(`/admin/dashboard?role=${role}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit assessment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!concern) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Concern not found</h2>
        <Button onClick={() => navigate(`/admin/dashboard?role=${role}`)}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container-wide py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/admin/dashboard?role=${role}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">Concern Details</p>
              <h1 className="text-xl font-semibold font-mono">{concern.id}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container-wide py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Concern Details Card */}
            <div className="bg-card rounded-lg border p-6 card-elevated">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-xl font-semibold text-foreground">{concern.subject}</h2>
                <StatusBadge status={concern.status as ConcernStatus} />
              </div>

              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  {concern.category}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(concern.created_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {concern.severity && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <SeverityBadge level={concern.severity as 1 | 2 | 3 | 4 | 5} />
                  </div>
                )}
              </div>

              <div className="prose prose-sm max-w-none">
                <h3 className="text-base font-semibold mb-2">Description</h3>
                <div className="bg-secondary rounded-lg p-4 whitespace-pre-wrap text-foreground/90">
                  {concern.description}
                </div>
              </div>

              {concern.image_url && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-base font-semibold mb-3">Evidence Photo</h3>
                  <div className="rounded-lg overflow-hidden border max-w-md">
                    <img
                      src={concern.image_url}
                      alt="Concern Evidence"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SSC Review Form */}
            {role === "ssc" && concern.status === "pending" && (
              <form onSubmit={handleSSCSubmit} className="bg-card rounded-lg border p-6 card-elevated">
                <h3 className="text-lg font-semibold mb-4">SSC Review</h3>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label>Validity Assessment *</Label>
                    <RadioGroup
                      value={sscReview.validity}
                      onValueChange={(value) =>
                        setSSCReview({ ...sscReview, validity: value })
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="valid" id="valid" />
                        <Label htmlFor="valid" className="flex items-center gap-2 cursor-pointer">
                          <CheckCircle className="h-4 w-4 text-success" />
                          Valid Concern
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="invalid" id="invalid" />
                        <Label htmlFor="invalid" className="flex items-center gap-2 cursor-pointer">
                          <XCircle className="h-4 w-4 text-destructive" />
                          Invalid Concern
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ssc-notes">Review Notes *</Label>
                    <Textarea
                      id="ssc-notes"
                      placeholder="Document your findings and assessment of this concern..."
                      rows={4}
                      value={sscReview.notes}
                      onChange={(e) =>
                        setSSCReview({ ...sscReview, notes: e.target.value })
                      }
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90"
                    disabled={!sscReview.validity || isSubmitting}
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Review to USC
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* USC Review Form */}
            {role === "usc" && concern.status === "reviewing" && (
              <form onSubmit={handleUSCSubmit} className="bg-card rounded-lg border p-6 card-elevated">
                <h3 className="text-lg font-semibold mb-4">USC Assessment</h3>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label>Severity Rating *</Label>
                    <RadioGroup
                      value={uscReview.severity}
                      onValueChange={(value) =>
                        setUSCReview({ ...uscReview, severity: value })
                      }
                      className="flex flex-wrap gap-3"
                    >
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div key={level} className="flex items-center space-x-2">
                          <RadioGroupItem value={String(level)} id={`severity-${level}`} />
                          <Label
                            htmlFor={`severity-${level}`}
                            className="cursor-pointer"
                          >
                            <SeverityBadge level={level as 1 | 2 | 3 | 4 | 5} />
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>Escalate to Faculty? *</Label>
                    <RadioGroup
                      value={uscReview.escalate}
                      onValueChange={(value) =>
                        setUSCReview({ ...uscReview, escalate: value })
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="escalate-yes" />
                        <Label
                          htmlFor="escalate-yes"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          Yes, Escalate
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="escalate-no" />
                        <Label
                          htmlFor="escalate-no"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <CheckCircle className="h-4 w-4 text-success" />
                          No, Mark Resolved
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usc-notes">Assessment Notes *</Label>
                    <Textarea
                      id="usc-notes"
                      placeholder="Document your assessment and decision rationale..."
                      rows={4}
                      value={uscReview.notes}
                      onChange={(e) =>
                        setUSCReview({ ...uscReview, notes: e.target.value })
                      }
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90"
                    disabled={!uscReview.severity || !uscReview.escalate || isSubmitting}
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Assessment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Timeline */}
            <div className="bg-card rounded-lg border p-6 card-elevated">
              <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
              <div className="space-y-0">
                {timeline.length > 0 ? (
                  timeline.map((event, index) => (
                    <div key={index} className="timeline-item">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-medium text-foreground">{event.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No activity recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Student Info */}
            {!concern.is_anonymous && (
              <div className="bg-card rounded-lg border p-5 card-elevated">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Student Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{concern.student_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{concern.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Student ID</p>
                    <p className="font-medium">{concern.student_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{concern.department}</p>
                  </div>
                </div>
              </div>
            )}

            {concern.is_anonymous && (
              <div className="bg-secondary rounded-lg p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Anonymous Submission
                </h3>
                <p className="text-sm text-muted-foreground">
                  This concern was submitted anonymously. Student identity is not available.
                </p>
              </div>
            )}

            {/* Assignments Management */}
            {(role === "ssc" || role === "usc") && (
              <div className="bg-card rounded-lg border p-5 card-elevated">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Management
                </h3>

                <div className="space-y-4">
                  {/* Assignment Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="assign-admin" className="text-xs text-muted-foreground uppercase tracking-wide">
                      Assign Representative
                    </Label>
                    <div className="flex gap-2">
                      <select
                        id="assign-admin"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedAdminId}
                        onChange={(e) => setSelectedAdminId(e.target.value)}
                      >
                        <option value="">Select an admin...</option>
                        {allAdmins.map((admin) => (
                          <option
                            key={admin.id}
                            value={admin.id}
                            disabled={assignedAdmins.some(a => a.id === admin.id)}
                          >
                            {admin.full_name} ({admin.role.toUpperCase()})
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        onClick={handleAssignAdmin}
                        disabled={!selectedAdminId || isSubmitting}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                      Assigned Representatives
                    </p>
                    <div className="space-y-3">
                      {assignedAdmins.length > 0 ? (
                        assignedAdmins.map((rep) => (
                          <div key={rep.id} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {rep.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{rep.full_name}</p>
                              <p className="text-xs text-muted-foreground uppercase italic">{rep.role}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No admins assigned.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcernDetail;
