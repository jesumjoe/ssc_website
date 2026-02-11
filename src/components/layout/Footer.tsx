import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-wide py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <img
                src="/logo-light.png?v=1"
                alt="The Student Council"
                className="w-auto object-contain"
                style={{ height: '70px' }}
              />
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-md">
              Working for the welfare of students by addressing concerns and
              representing student voices to the university management.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/submit-concern" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Submit a Concern
                </Link>
              </li>
              <li>
                <Link to="/track-concern" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Track Your Concern
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>studentcouncil@university.edu</li>
              <li>Student Center, Room 101</li>
              <li>Mon - Fri: 9:00 AM - 5:00 PM</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} The Student Council. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-primary-foreground/60">
            <Link to="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-primary-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
