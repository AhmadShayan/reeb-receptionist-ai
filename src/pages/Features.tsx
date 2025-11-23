import { CheckCircle, Phone, UserCheck, Database, Brain, Clock, Shield, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Features = () => {
  const features = [
    {
      icon: <Phone className="w-8 h-8" />,
      title: "Unlimited Call Handling",
      description: "Process thousands of concurrent calls without delays or bottlenecks",
      benefits: [
        "No more busy signals",
        "Instant call routing",
        "Smart queue management",
        "Priority call handling"
      ]
    },
    {
      icon: <UserCheck className="w-8 h-8" />,
      title: "Advanced Face Recognition",
      description: "State-of-the-art AI identifies clients in real-time with industry-leading accuracy",
      benefits: [
        "99.9% recognition accuracy",
        "Works in various lighting",
        "Multi-angle detection",
        "Privacy-compliant processing"
      ]
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Intelligent Client Database",
      description: "Comprehensive client information management with instant retrieval",
      benefits: [
        "Instant client lookup",
        "Visit history tracking",
        "Preference management",
        "Secure data storage"
      ]
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Conversations",
      description: "Natural language processing for human-like interactions",
      benefits: [
        "Context-aware responses",
        "Multi-language support",
        "Sentiment analysis",
        "Personalized interactions"
      ]
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "24/7 Availability",
      description: "Round-the-clock service without breaks or downtime",
      benefits: [
        "No staffing gaps",
        "Consistent service quality",
        "Holiday coverage",
        "Global time zone support"
      ]
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance with global standards",
      benefits: [
        "End-to-end encryption",
        "GDPR compliant",
        "Secure cloud storage",
        "Regular security audits"
      ]
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Analytics & Insights",
      description: "Detailed reporting and actionable insights for business growth",
      benefits: [
        "Call volume analytics",
        "Client behavior patterns",
        "Performance metrics",
        "Custom reporting"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">
              Powerful Features for
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                Modern Businesses
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Reeb AI combines cutting-edge artificial intelligence with practical business solutions
              to transform how you handle client interactions.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-border hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, bidx) => (
                      <li key={bidx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Technical Specs */}
          <div className="bg-gradient-accent rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Technical Specifications</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">&lt;100ms</div>
                <div className="text-foreground font-medium mb-1">Response Time</div>
                <div className="text-sm text-muted-foreground">Lightning-fast AI processing</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">99.99%</div>
                <div className="text-foreground font-medium mb-1">Uptime SLA</div>
                <div className="text-sm text-muted-foreground">Enterprise reliability</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">50+</div>
                <div className="text-foreground font-medium mb-1">Languages</div>
                <div className="text-sm text-muted-foreground">Global communication</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Features;
