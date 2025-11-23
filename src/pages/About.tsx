import { Target, Eye, Users, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">
              About
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                Reeb AI
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Pioneering the future of intelligent reception and client management
              through cutting-edge artificial intelligence.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="border-border">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-6">
                  <Target className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To revolutionize how businesses interact with their clients by providing
                  intelligent, scalable, and reliable AI-powered reception solutions that
                  enhance customer experience while reducing operational complexity.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-6">
                  <Eye className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To become the global standard for AI-powered reception systems,
                  empowering businesses worldwide to deliver exceptional client experiences
                  through seamless automation and intelligent recognition technology.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Leadership Team */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Leadership Team</h2>
              <p className="text-xl text-muted-foreground">
                Meet the visionaries behind Reeb AI
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="border-border hover:shadow-glow transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 bg-gradient-hero rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Users className="w-12 h-12 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Mian Khizar</h3>
                  <div className="text-primary font-medium mb-4">Founder</div>
                  <p className="text-muted-foreground">
                    Visionary entrepreneur with a passion for leveraging AI to solve
                    real-world business challenges and improve customer experiences.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border hover:shadow-glow transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 bg-gradient-hero rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Award className="w-12 h-12 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Meer Ali Abbas</h3>
                  <div className="text-primary font-medium mb-4">Chief Executive Officer</div>
                  <p className="text-muted-foreground">
                    Strategic leader driving innovation and growth, with extensive experience
                    in scaling technology solutions across diverse industries.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Values */}
          <div className="bg-gradient-accent rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Innovation",
                  description: "Continuously pushing boundaries with cutting-edge AI technology"
                },
                {
                  title: "Reliability",
                  description: "Delivering consistent, enterprise-grade solutions you can trust"
                },
                {
                  title: "Customer Focus",
                  description: "Putting client success at the heart of everything we do"
                }
              ].map((value, idx) => (
                <div key={idx} className="text-center">
                  <h3 className="text-xl font-bold mb-3 text-foreground">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Company Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "2024", label: "Founded" },
              { value: "50+", label: "Clients Served" },
              { value: "99.9%", label: "Client Satisfaction" },
              { value: "24/7", label: "Support Available" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
