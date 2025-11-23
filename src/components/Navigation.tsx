import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Reeb AI
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </NavLink>
            <NavLink to="/features" className="text-foreground hover:text-primary transition-colors">
              Features
            </NavLink>
            <NavLink to="/industries" className="text-foreground hover:text-primary transition-colors">
              Industries
            </NavLink>
            <NavLink to="/about" className="text-foreground hover:text-primary transition-colors">
              About
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
          <div className="md:hidden py-4 space-y-4">
            <NavLink
              to="/"
              className="block text-foreground hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/features"
              className="block text-foreground hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Features
            </NavLink>
            <NavLink
              to="/industries"
              className="block text-foreground hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Industries
            </NavLink>
            <NavLink
              to="/about"
              className="block text-foreground hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              About
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
