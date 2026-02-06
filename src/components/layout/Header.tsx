import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/submit-concern", label: "Submit Concern" },
    { href: "/track-concern", label: "Track Status" },
    { href: "/admin", label: "Admin Portal" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="header-gradient sticky top-0 z-50 shadow-md">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-lg">SC</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-primary-foreground font-semibold text-lg leading-tight">
                The Student Council
              </h1>
              <p className="text-primary-foreground/70 text-xs">
                Voice of the Students
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`nav-link ${isActive(link.href) ? "nav-link-active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-primary-foreground/20 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-3 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "text-primary-foreground/80 hover:bg-primary-foreground/10"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
