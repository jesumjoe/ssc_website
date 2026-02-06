import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StatusBadge, SeverityBadge, ConcernStatus } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";

const ConcernDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const role = searchParams.get("role") || "ssc";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sscReview, setSSCReview] = useState({
    validity: "",
    notes: "",
  });
  const [uscReview, setUSCReview] = useState({
    severity: "",
    escalate: "",
    notes: "",
  });

  // Mock concern data - Replace with actual API fetch
  const concern = {
    id: id || "SC-M1234XY",
    subject: "Inadequate Library Hours During Exam Period",
    category: "Library",
    status: "pending" as ConcernStatus,
    isAnonymous: false,
    studentName: "Rahul Sharma",
    studentEmail: "rahul.sharma@university.edu",
    studentId: "CS2021001",
    department: "Computer Science",
    submittedAt: "2024-01-15T10:30:00Z",
    deadline: "2024-01-16T10:30:00Z",
    description: `During the exam period, the library closes at 8 PM which is not sufficient for students who need quiet study spaces. Many students rely on the library for focused study sessions, especially during exams.

I request the Student Council to consider extending library hours to at least 11 PM during exam periods. This would greatly benefit students who prefer studying in the library environment.

Additionally, the reading room on the 3rd floor has limited seating capacity. It would be helpful if more seating arrangements could be made during peak times.`,
    assignedSSC: [
      { name: "John Doe", email: "john.doe@university.edu" },
      { name: "Jane Smith", email: "jane.smith@university.edu" },
    ],
    assignedUSC: { name: "Dr. Michael Brown", email: "m.brown@university.edu" },
    timeline: [
      {
        date: "2024-01-15 10:30 AM",
        title: "Concern Submitted",
        user: "System",
      },
      {
        date: "2024-01-15 11:00 AM",
        title: "Assigned to Representatives",
        user: "System",
      },
    ],
  };

  const handleSSCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Review Submitted",
      description: `Concern marked as ${sscReview.validity}. Forwarded to USC for assessment.`,
    });

    navigate(`/admin/dashboard?role=${role}`);
    setIsSubmitting(false);
  };

  const handleUSCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Assessment Completed",
      description:
        uscReview.escalate === "yes"
          ? "Concern has been escalated to faculty."
          : "Concern assessment recorded.",
    });

    navigate(`/admin/dashboard?role=${role}`);
    setIsSubmitting(false);
  };

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
                <StatusBadge status={concern.status} />
              </div>

              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  {concern.category}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(concern.submittedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {concern.status === "pending" && (
                  <div className="flex items-center gap-2 text-warning">
                    <Clock className="h-4 w-4" />
                    Deadline: {new Date(concern.deadline).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="prose prose-sm max-w-none">
                <h3 className="text-base font-semibold mb-2">Description</h3>
                <div className="bg-secondary rounded-lg p-4 whitespace-pre-wrap text-foreground/90">
                  {concern.description}
                </div>
              </div>
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
                {concern.timeline.map((event, index) => (
                  <div key={index} className="timeline-item">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{event.date}</span>
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded">{event.user}</span>
                    </div>
                    <h4 className="font-medium text-foreground">{event.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Student Info */}
            {!concern.isAnonymous && (
              <div className="bg-card rounded-lg border p-5 card-elevated">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Student Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{concern.studentName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{concern.studentEmail}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Student ID</p>
                    <p className="font-medium">{concern.studentId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{concern.department}</p>
                  </div>
                </div>
              </div>
            )}

            {concern.isAnonymous && (
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

            {/* Assigned Representatives */}
            <div className="bg-card rounded-lg border p-5 card-elevated">
              <h3 className="font-semibold mb-4">Assigned Representatives</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    SSC Representatives
                  </p>
                  {concern.assignedSSC.map((rep, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {rep.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{rep.name}</p>
                        <p className="text-xs text-muted-foreground">{rep.email}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    USC Representative
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-xs font-medium text-accent-foreground">
                        {concern.assignedUSC.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{concern.assignedUSC.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {concern.assignedUSC.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcernDetail;
