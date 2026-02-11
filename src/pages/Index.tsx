import { Link } from "react-router-dom";
import { FileText, Search, Users, Shield, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";

const Index = () => {
  const features = [
    {
      icon: FileText,
      title: "Submit Concerns",
      description: "Raise your concerns anonymously or with your identity. Your voice matters to us.",
    },
    {
      icon: Search,
      title: "Track Progress",
      description: "Get a unique concern number and track the status of your concern at any time.",
    },
    {
      icon: Users,
      title: "Multi-Level Review",
      description: "Concerns are reviewed by SSC and USC representatives for thorough assessment.",
    },
    {
      icon: Shield,
      title: "Confidential Process",
      description: "Your concerns are handled with utmost confidentiality and professionalism.",
    },
  ];

  const process = [
    { step: 1, title: "Submit", description: "Fill out the concern form" },
    { step: 2, title: "Assignment", description: "Assigned to SSC & USC reps" },
    { step: 3, title: "Review", description: "24-hour review period" },
    { step: 4, title: "Assessment", description: "Severity rating & decision" },
    { step: 5, title: "Resolution", description: "Escalation or resolution" },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="header-gradient py-20 lg:py-28">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
              Your Voice, Our Priority
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-8 leading-relaxed">
              The Student Council is dedicated to addressing student concerns and
              ensuring your voice is heard by the university management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="btn-gold text-base px-8">
                <Link to="/submit-concern">
                  Submit a Concern
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-white text-primary hover:bg-gray-100 border-none text-base px-8"
              >
                <Link to="/track-concern">Track Your Concern</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How We Serve You</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our streamlined process ensures every concern is heard, reviewed, and addressed
              with the attention it deserves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="concern-card text-center card-hover"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 lg:py-24 bg-secondary">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Review Process</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every concern goes through a systematic review to ensure fair and thorough assessment.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 lg:gap-0">
            {process.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center text-center p-4 lg:px-8">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-3">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-muted-foreground text-sm max-w-[140px]">{item.description}</p>
                </div>
                {index < process.length - 1 && (
                  <ArrowRight className="hidden lg:block h-6 w-6 text-muted-foreground/50 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-16 lg:py-20 header-gradient">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Have a Concern?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Don't hesitate to reach out. Your concerns help us improve the student experience for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="btn-gold text-base px-8">
              <Link to="/submit-concern">
                Submit Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-gray-100 border-none text-base px-8"
            >
              <Link to="/track-concern">
                <Search className="mr-2 h-5 w-5" />
                Track Existing Concern
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
