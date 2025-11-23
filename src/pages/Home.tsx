import { ArrowRight, Phone, Users, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { NavLink } from "@/components/NavLink";
import heroImage from "@/assets/hero-bg.jpg";
import featureCalls from "@/assets/feature-calls.png";
import featureFace from "@/assets/feature-face.png";
import featureId from "@/assets/feature-id.png";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-accent opacity-50" />
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="AI Receptionist Technology" 
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              AI-Powered Receptionist
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                For The Modern Era
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Handle unlimited calls, recognize clients instantly, and revolutionize your reception with Agentic REEB AI's intelligent automation system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NavLink to="/contact">
                <Button size="lg" className="group">
                  Get Started
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </NavLink>
              <NavLink to="/features">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Calls Handled", value: "Unlimited" },
              { label: "Response Time", value: "<1s" },
              { label: "Recognition Rate", value: "99.9%" },
              { label: "Uptime", value: "24/7" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for modern reception management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: featureCalls,
                title: "High-Volume Call Management",
                description: "Handle unlimited concurrent calls with intelligent routing and prioritization.",
              },
              {
                icon: featureFace,
                title: "Face Recognition",
                description: "Instantly identify clients with advanced AI-powered facial recognition technology.",
              },
              {
                icon: featureId,
                title: "Client ID System",
                description: "Seamless client identification and personalized service delivery.",
              },
            ].map((feature, idx) => (
              <Card key={idx} className="border-border hover:shadow-glow transition-all duration-300">
                <CardContent className="p-6">
                  <img 
                    src={feature.icon} 
                    alt={feature.title}
                    className="w-16 h-16 mb-4"
                  />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-accent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple setup, powerful results
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
                {
                step: "1",
                title: "Connect",
                description: "Integrate Agentic REEB AI with your existing phone and security systems",
              },
              {
                step: "2",
                title: "Configure",
                description: "Set up client profiles, recognition parameters, and call routing rules",
              },
              {
                step: "3",
                title: "Automate",
                description: "Let AI handle calls and recognize clients while you focus on what matters",
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Why Choose Agentic REEB AI?
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: <Zap className="w-6 h-6" />,
                    title: "Lightning Fast",
                    description: "Respond to clients instantly with AI-powered automation",
                  },
                  {
                    icon: <Shield className="w-6 h-6" />,
                    title: "Secure & Reliable",
                    description: "Enterprise-grade security with 99.9% uptime guarantee",
                  },
                  {
                    icon: <Users className="w-6 h-6" />,
                    title: "Scalable Solution",
                    description: "Grow from handling dozens to thousands of calls effortlessly",
                  },
                  {
                    icon: <Phone className="w-6 h-6" />,
                    title: "24/7 Availability",
                    description: "Never miss a call or client, any time of day or night",
                  },
                ].map((benefit, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-hero rounded-2xl opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-6xl font-bold text-primary mb-4">99.9%</div>
                  <div className="text-xl text-foreground">Client Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Reception?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join leading hotels and workplaces using Agentic REEB AI to deliver exceptional client experiences
          </p>
          <NavLink to="/contact">
            <Button size="lg" variant="secondary" className="group">
              Schedule a Demo
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </NavLink>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
