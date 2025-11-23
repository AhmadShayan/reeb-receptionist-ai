import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
              Reeb AI
            </h3>
            <p className="text-muted-foreground">
              Next-generation AI receptionist solution for modern businesses
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">03090124039</span>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground break-all">khizarmian492@gmail.com</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Sharjah AL naidah</span>
              </div>
            </div>
          </div>

          {/* Leadership */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Leadership</h4>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Founder:</span> Mian Khizar
              </p>
              <p>
                <span className="font-medium text-foreground">CEO:</span> Meer Ali Abbas
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Reeb AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
