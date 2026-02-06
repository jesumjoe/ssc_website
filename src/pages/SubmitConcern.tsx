import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MainLayout from "@/components/layout/MainLayout";
import { useToast } from "@/hooks/use-toast";

const SubmitConcern = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [concernNumber, setConcernNumber] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
    department: "",
    category: "",
    subject: "",
    description: "",
  });

  const categories = [
    "Academic Issues",
    "Infrastructure",
    "Faculty Related",
    "Administrative",
    "Hostel/Accommodation",
    "Canteen/Mess",
    "Transportation",
    "Library",
    "Sports & Recreation",
    "Events & Activities",
    "Safety & Security",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call - Replace with actual backend integration
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate a mock concern number
    const mockConcernNumber = `SC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setConcernNumber(mockConcernNumber);
    setSubmitted(true);
    setIsSubmitting(false);

    toast({
      title: "Concern Submitted Successfully",
      description: `Your concern number is ${mockConcernNumber}`,
    });
  };

  if (submitted) {
    return (
      <MainLayout>
        <div className="py-16 lg:py-24 bg-background min-h-[60vh]">
          <div className="container-narrow">
            <div className="bg-card rounded-lg border p-8 text-center card-elevated animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Concern Submitted Successfully
              </h1>
              <p className="text-muted-foreground mb-6">
                Your concern has been recorded and will be reviewed shortly.
              </p>

              <div className="bg-secondary rounded-lg p-6 mb-6">
                <p className="text-sm text-muted-foreground mb-2">Your Concern Number</p>
                <p className="text-2xl font-mono font-bold text-primary">{concernNumber}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Save this number to track your concern status
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate("/track-concern")}
                  className="bg-primary hover:bg-primary/90"
                >
                  Track Your Concern
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: "",
                      email: "",
                      studentId: "",
                      department: "",
                      category: "",
                      subject: "",
                      description: "",
                    });
                  }}
                >
                  Submit Another Concern
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <section className="header-gradient py-12">
        <div className="container-narrow text-center">
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            Submit a Concern
          </h1>
          <p className="text-primary-foreground/80">
            Share your concerns with the Student Council. We're here to help.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 bg-background">
        <div className="container-narrow">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Anonymous Toggle */}
            <div className="bg-info/10 border border-info/20 rounded-lg p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                  />
                  <Label htmlFor="anonymous" className="font-medium cursor-pointer">
                    Submit Anonymously
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Your identity will be kept confidential. Only the concern details will be visible to reviewers.
                </p>
              </div>
            </div>

            {/* Personal Information */}
            {!isAnonymous && (
              <div className="form-section animate-fade-in">
                <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required={!isAnonymous}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@university.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required={!isAnonymous}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID *</Label>
                    <Input
                      id="studentId"
                      placeholder="Enter your student ID"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      required={!isAnonymous}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input
                      id="department"
                      placeholder="e.g., Computer Science"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required={!isAnonymous}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Concern Details */}
            <div className="form-section">
              <h2 className="text-lg font-semibold mb-4">Concern Details</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief subject of your concern"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Please describe your concern in detail. Include relevant dates, locations, and any other information that might help us understand and address your concern."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                className="bg-primary hover:bg-primary/90 px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Submit Concern
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </MainLayout>
  );
};

export default SubmitConcern;
