import { useState } from "react";
import { Menu, X, Scan, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import logoIcon from "@/assets/logo-icon.png";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-2">
            <img src={logoIcon} alt="Agentic REEB AI" className="w-8 h-8" />
            <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Agentic REEB AI
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" className="text-foreground hover:text-primary transition-colors text-sm">
              Home
            </NavLink>
            <NavLink to="/features" className="text-foreground hover:text-primary transition-colors text-sm">
              Features
            </NavLink>
            <NavLink to="/industries" className="text-foreground hover:text-primary transition-colors text-sm">
              Industries
            </NavLink>
            <NavLink to="/about" className="text-foreground hover:text-primary transition-colors text-sm">
              About
            </NavLink>
            <NavLink to="/demo">
              <Button variant="outline" size="sm" className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
                <Scan className="w-3.5 h-3.5" />
                Live Demo
              </Button>
            </NavLink>
            <NavLink to="/admin">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <LayoutDashboard className="w-3.5 h-3.5" />
                Admin
              </Button>
            </NavLink>
            <NavLink to="/contact">
              <Button variant="default" size="sm">
                Get Started
              </Button>
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-border">
            <NavLink
              to="/"
              className="block text-foreground hover:text-primary transition-colors text-sm"
              onClick={() => setIsOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/features"
              className="block text-foreground hover:text-primary transition-colors text-sm"
              onClick={() => setIsOpen(false)}
            >
              Features
            </NavLink>
            <NavLink
              to="/industries"
              className="block text-foreground hover:text-primary transition-colors text-sm"
              onClick={() => setIsOpen(false)}
            >
              Industries
            </NavLink>
            <NavLink
              to="/about"
              className="block text-foreground hover:text-primary transition-colors text-sm"
              onClick={() => setIsOpen(false)}
            >
              About
            </NavLink>
            <NavLink to="/demo" onClick={() => setIsOpen(false)}>
              <Button variant="outline" size="sm" className="w-full gap-2 border-primary/40 text-primary">
                <Scan className="w-4 h-4" />
                Live Demo
              </Button>
            </NavLink>
            <NavLink to="/admin" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Admin
              </Button>
            </NavLink>
            <NavLink to="/contact" onClick={() => setIsOpen(false)}>
              <Button variant="default" size="sm" className="w-full">
                Get Started
              </Button>
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
