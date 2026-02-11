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
  Users,
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
    severity: 0,
    escalate: "",
    notes: "",
  });

  const [facultyReview, setFacultyReview] = useState({
    response: "",
    isOpenForum: false,
    isFlagship: false,
  });

  const [finalResolution, setFinalResolution] = useState("");

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
          .select("*")
          .eq("concern_number", id)
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

        // Filter out assignments where admin_users might be null (e.g. deleted user or RLS hidden)
        const formattedAssigned = assignmentData
          .filter((a: any) => a.admin_users)
          .map((a: any) => ({
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
          description: "Failed to load concern details. Check console for easier debugging.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, toast]); // Added missing dependencies

  // ... (rest of code)


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

      const formattedAssigned = assignmentData
        ?.filter((a: any) => a.admin_users)
        .map((a: any) => ({
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
          severity: uscReview.severity,
        })
        .eq("id", concern.id);

      if (error) throw error;

      if (uscReview.escalate === "yes") {
        if (!selectedAdminId) {
          throw new Error("Please select a faculty mentor to escalate to.");
        }

        // Assign Faculty
        const { error: assignError } = await supabase
          .from("concern_assignments")
          .insert({
            concern_id: concern.id,
            admin_id: selectedAdminId,
          });

        if (assignError) throw assignError;
      }

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

  const handleFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("concerns")
        .update({
          faculty_response: facultyReview.response,
          is_open_forum: facultyReview.isOpenForum,
          is_flagship: facultyReview.isFlagship,
        })
        .eq("id", concern.id);

      if (error) throw error;

      await supabase.from("concern_timeline").insert({
        concern_id: concern.id,
        title: "Faculty Remarks Added",
        description: `Faculty provided remarks. Open Forum: ${facultyReview.isOpenForum ? "Yes" : "No"}.`,
      });

      toast({
        title: "Remarks Sent",
        description: "Your remarks have been sent to the USC.",
      });

      // Update local state
      setConcern({ ...concern, faculty_response: facultyReview.response });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit remarks.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("concerns")
        .update({
          final_response: finalResolution,
          status: "resolved",
        })
        .eq("id", concern.id);

      if (error) throw error;

      await supabase.from("concern_timeline").insert({
        concern_id: concern.id,
        title: "Concern Resolved",
        description: "USC provided final resolution message.",
      });

      toast({
        title: "Resolved",
        description: "Concern marked as resolved and message sent.",
      });

      navigate(`/admin/dashboard?role=${role}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit final resolution.",
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
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setUSCReview({ ...uscReview, severity: level })}
                          className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all
                            ${uscReview.severity === level
                              ? "ring-2 ring-offset-2 ring-primary scale-110 shadow-md"
                              : "opacity-70 hover:opacity-100 hover:scale-105"
                            }
                            ${level === 1 ? "bg-green-100 text-green-700 border-green-200" : ""}
                            ${level === 2 ? "bg-lime-100 text-lime-700 border-lime-200" : ""}
                            ${level === 3 ? "bg-yellow-100 text-yellow-700 border-yellow-200" : ""}
                            ${level === 4 ? "bg-orange-100 text-orange-700 border-orange-200" : ""}
                            ${level === 5 ? "bg-red-100 text-red-700 border-red-200" : ""}
                          `}
                          title={`Severity Level ${level}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {uscReview.severity === 1 && "Low Impact - Minor inconvenience"}
                      {uscReview.severity === 2 && "Moderate - Needs attention"}
                      {uscReview.severity === 3 && "Significant - Updates required"}
                      {uscReview.severity === 4 && "High - Urgent response needed"}
                      {uscReview.severity === 5 && "Critical - Immediate action required"}
                    </p>
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

                  {uscReview.escalate === "yes" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="assign-faculty">Select Faculty Mentor *</Label>
                      <select
                        id="assign-faculty"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedAdminId}
                        onChange={(e) => setSelectedAdminId(e.target.value)}
                        required
                      >
                        <option value="">Select a faculty member...</option>
                        {allAdmins
                          .filter((a) => a.role === "faculty")
                          .map((admin) => (
                            <option key={admin.id} value={admin.id}>
                              {admin.full_name} ({admin.role.toUpperCase()})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

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

            {/* Faculty Review Form (For Faculty Only) */}
            {role === "faculty" && concern.status === "escalated" && !concern.faculty_response && (
              <form onSubmit={handleFacultySubmit} className="bg-card rounded-lg border p-6 card-elevated">
                <h3 className="text-lg font-semibold mb-4">Faculty Remarks</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="faculty-remarks">Remarks for USC *</Label>
                    <Textarea
                      id="faculty-remarks"
                      value={facultyReview.response}
                      onChange={e => setFacultyReview({ ...facultyReview, response: e.target.value })}
                      placeholder="Provide guidance or remarks for the USC describing the next steps..."
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <label className="flex items-center gap-2 cursor-pointer bg-secondary/50 p-3 rounded-lg hover:bg-secondary transition-colors">
                      <input
                        type="checkbox"
                        checked={facultyReview.isOpenForum}
                        onChange={e => setFacultyReview({ ...facultyReview, isOpenForum: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium">Recommend for Open Forum</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-destructive/10 p-3 rounded-lg hover:bg-destructive/20 transition-colors">
                      <input
                        type="checkbox"
                        checked={facultyReview.isFlagship}
                        onChange={e => setFacultyReview({ ...facultyReview, isFlagship: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-destructive focus:ring-destructive"
                      />
                      <span className="text-sm font-medium text-destructive">Mark as Flagship Concern</span>
                    </label>
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Sending..." : "Send Remarks to USC"}
                  </Button>
                </div>
              </form>
            )}

            {/* Faculty Remarks Display (Visible to Faculty & USC) */}
            {concern.faculty_response && (role === 'faculty' || role === 'usc') && (
              <div className="bg-card rounded-lg border p-6 card-elevated border-l-4 border-l-primary">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" /> Faculty Remarks
                </h3>
                <div className="bg-secondary/50 p-4 rounded-md mb-4 text-sm whitespace-pre-wrap">
                  {concern.faculty_response}
                </div>
                <div className="flex gap-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {concern.is_open_forum && (
                    <span className="flex items-center gap-1 text-info bg-info/10 px-2 py-1 rounded">
                      <Users className="h-3 w-3" /> Recommended for Open Forum
                    </span>
                  )}
                  {concern.is_flagship && (
                    <span className="flex items-center gap-1 text-destructive bg-destructive/10 px-2 py-1 rounded">
                      <AlertTriangle className="h-3 w-3" /> Flagship Concern
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* USC Final Resolution Form */}
            {role === "usc" && concern.status === "escalated" && concern.faculty_response && !concern.final_response && (
              <form onSubmit={handleFinalSubmit} className="bg-card rounded-lg border p-6 card-elevated animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-lg font-semibold mb-2">Final Resolution</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The faculty has provided their remarks above. Please formulate the final message to be sent to the student and stakeholders. This will close the concern.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="final-resolution">Final Message *</Label>
                    <Textarea
                      id="final-resolution"
                      value={finalResolution}
                      onChange={e => setFinalResolution(e.target.value)}
                      placeholder="Enter the official final resolution message..."
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full bg-success hover:bg-success/90">
                    {isSubmitting ? "Resolving..." : "Send Final Message & Resolve Concern"}
                  </Button>
                </div>
              </form>
            )}

            {/* Final Resolution Display (Visible to All) */}
            {concern.final_response && (
              <div className="bg-card rounded-lg border p-6 card-elevated border-l-4 border-l-success">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" /> Final Resolution
                </h3>
                <div className="bg-success/5 p-4 rounded-md text-sm whitespace-pre-wrap text-foreground">
                  {concern.final_response}
                </div>
                <div className="mt-2 text-xs text-muted-foreground italic text-right">
                  Resolved by Student Council
                </div>
              </div>
            )}
            {role === "usc" && concern.status === "escalated" && !assignedAdmins.some(a => a.role === 'faculty') && (
              <div className="bg-card rounded-lg border p-6 card-elevated border-l-4 border-l-warning">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Missing Faculty Assignment
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This concern is escalated but no faculty mentor is currently assigned. Please select one below.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="retro-assign-faculty">Select Faculty Mentor</Label>
                    <select
                      id="retro-assign-faculty"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedAdminId}
                      onChange={(e) => setSelectedAdminId(e.target.value)}
                    >
                      <option value="">Select a faculty member...</option>
                      {allAdmins
                        .filter((a) => a.role === "faculty")
                        .map((admin) => (
                          <option key={admin.id} value={admin.id}>
                            {admin.full_name} ({admin.role.toUpperCase()})
                          </option>
                        ))}
                    </select>
                  </div>
                  <Button
                    onClick={handleAssignAdmin}
                    disabled={!selectedAdminId || isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      "Assigning..."
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign Faculty
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
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

            {/* Assigned Team (Read Only) */}
            <div className="bg-card rounded-lg border p-5 card-elevated">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assigned Team
              </h3>

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
                  <p className="text-xs text-muted-foreground italic">No team assigned yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcernDetail;
