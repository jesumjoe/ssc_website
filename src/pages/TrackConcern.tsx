import { useState } from "react";
import { Search, Clock, CheckCircle, AlertCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MainLayout from "@/components/layout/MainLayout";
import { StatusBadge, SeverityBadge, ConcernStatus } from "@/components/ui/status-badge";

interface ConcernDetails {
  id: string;
  subject: string;
  category: string;
  status: ConcernStatus;
  severity?: 1 | 2 | 3 | 4 | 5;
  submittedAt: string;
  timeline: {
    date: string;
    title: string;
    description: string;
  }[];
}

const TrackConcern = () => {
  const [concernNumber, setConcernNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchedOnce, setSearchedOnce] = useState(false);
  const [concernDetails, setConcernDetails] = useState<ConcernDetails | null>(null);

  // Mock data for demonstration - Replace with actual API call
  const mockConcernData: ConcernDetails = {
    id: "SC-M1234XY",
    subject: "Inadequate Library Hours During Exam Period",
    category: "Library",
    status: "reviewing",
    severity: 3,
    submittedAt: "2024-01-15T10:30:00Z",
    timeline: [
      {
        date: "2024-01-15 10:30 AM",
        title: "Concern Submitted",
        description: "Your concern has been successfully submitted and recorded.",
      },
      {
        date: "2024-01-15 11:00 AM",
        title: "Assigned to Representatives",
        description: "Assigned to 2 SSC representatives and 1 USC representative for review.",
      },
      {
        date: "2024-01-15 02:30 PM",
        title: "Initial Review Started",
        description: "SSC representatives have begun reviewing your concern.",
      },
      {
        date: "2024-01-16 09:00 AM",
        title: "Under USC Review",
        description: "Concern validated by SSC and forwarded to USC for severity assessment.",
      },
    ],
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setSearchedOnce(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo, show mock data if any number is entered
    if (concernNumber.trim()) {
      setConcernDetails({ ...mockConcernData, id: concernNumber.toUpperCase() });
    } else {
      setConcernDetails(null);
    }

    setIsSearching(false);
  };

  return (
    <MainLayout>
      {/* Header */}
      <section className="header-gradient py-12">
        <div className="container-narrow text-center">
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            Track Your Concern
          </h1>
          <p className="text-primary-foreground/80">
            Enter your concern number to check the current status
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-background">
        <div className="container-narrow">
          <form onSubmit={handleSearch} className="bg-card rounded-lg border p-6 card-elevated">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="concernNumber">Concern Number</Label>
                <Input
                  id="concernNumber"
                  placeholder="e.g., SC-M1234XY"
                  value={concernNumber}
                  onChange={(e) => setConcernNumber(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  size="lg"
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto px-8"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Track
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Results */}
          {searchedOnce && (
            <div className="mt-8 animate-fade-in">
              {concernDetails ? (
                <div className="space-y-6">
                  {/* Concern Overview Card */}
                  <div className="bg-card rounded-lg border p-6 card-elevated">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Concern Number</p>
                        <p className="text-xl font-mono font-bold text-primary">{concernDetails.id}</p>
                      </div>
                      <div className="flex gap-2">
                        <StatusBadge status={concernDetails.status} />
                        {concernDetails.severity && (
                          <SeverityBadge level={concernDetails.severity} />
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Subject</p>
                        <p className="font-medium">{concernDetails.subject}</p>
                      </div>
                      <div className="flex flex-wrap gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Category</p>
                          <p className="font-medium">{concernDetails.category}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Submitted</p>
                          <p className="font-medium">
                            {new Date(concernDetails.submittedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Card */}
                  <div className="bg-card rounded-lg border p-6 card-elevated">
                    <h2 className="text-lg font-semibold mb-6">Progress Timeline</h2>
                    <div className="space-y-0">
                      {concernDetails.timeline.map((event, index) => (
                        <div key={index} className="timeline-item">
                          <div className="mb-1">
                            <span className="text-sm text-muted-foreground">{event.date}</span>
                          </div>
                          <h3 className="font-medium text-foreground">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Legend */}
                  <div className="bg-secondary rounded-lg p-4">
                    <h3 className="font-medium mb-3 text-sm">Status Guide</h3>
                    <div className="flex flex-wrap gap-3">
                      <StatusBadge status="pending" />
                      <StatusBadge status="reviewing" />
                      <StatusBadge status="escalated" />
                      <StatusBadge status="resolved" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-lg border p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Concern Not Found</h3>
                  <p className="text-muted-foreground">
                    We couldn't find a concern with that number. Please check and try again.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Help Section */}
          {!searchedOnce && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg border p-5 text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">24-Hour Review</h3>
                <p className="text-sm text-muted-foreground">
                  Initial review is completed within 24 hours of submission.
                </p>
              </div>
              <div className="bg-card rounded-lg border p-5 text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Multi-Level Review</h3>
                <p className="text-sm text-muted-foreground">
                  Each concern is reviewed by SSC and USC representatives.
                </p>
              </div>
              <div className="bg-card rounded-lg border p-5 text-center">
                <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Track Anytime</h3>
                <p className="text-sm text-muted-foreground">
                  Check your concern status anytime using your concern number.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default TrackConcern;
