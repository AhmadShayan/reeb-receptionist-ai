import { Building2, Hotel, Briefcase, Hospital, ShoppingBag, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import hotelImage from "@/assets/industry-hotel.jpg";
import officeImage from "@/assets/industry-office.jpg";

const Industries = () => {
  const industries = [
    {
      icon: <Hotel className="w-12 h-12" />,
      title: "Hotels & Hospitality",
      description: "Deliver exceptional guest experiences with instant check-ins, personalized service, and 24/7 concierge support.",
      image: hotelImage,
      benefits: [
        "Faster check-in/check-out",
        "VIP guest recognition",
        "Multi-property management",
        "Guest preference tracking"
      ]
    },
    {
      icon: <Building2 className="w-12 h-12" />,
      title: "Corporate Offices",
      description: "Streamline visitor management, employee access, and reception operations in modern workplaces.",
      image: officeImage,
      benefits: [
        "Visitor pre-registration",
        "Employee recognition",
        "Security integration",
        "Meeting room coordination"
      ]
    },
    {
      icon: <Hospital className="w-12 h-12" />,
      title: "Healthcare Facilities",
      description: "Improve patient experience with efficient check-ins, appointment management, and emergency routing.",
      benefits: [
        "Patient identification",
        "Appointment reminders",
        "Emergency prioritization",
        "HIPAA compliance"
      ]
    },
    {
      icon: <ShoppingBag className="w-12 h-12" />,
      title: "Retail & Shopping",
      description: "Enhance customer service with loyalty recognition, personalized assistance, and queue management.",
      benefits: [
        "Loyalty member recognition",
        "Personalized shopping assistance",
        "Queue optimization",
        "Customer insights"
      ]
    },
    {
      icon: <Briefcase className="w-12 h-12" />,
      title: "Co-working Spaces",
      description: "Manage members, visitors, and bookings seamlessly in dynamic shared workspaces.",
      benefits: [
        "Member access control",
        "Space utilization tracking",
        "Visitor management",
        "Billing integration"
      ]
    },
    {
      icon: <GraduationCap className="w-12 h-12" />,
      title: "Educational Institutions",
      description: "Secure campuses with student/staff recognition, visitor tracking, and emergency management.",
      benefits: [
        "Student identification",
        "Parent visitor management",
        "Campus security",
        "Event check-ins"
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
              Industries We Serve
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Agentic REEB AI adapts to the unique needs of various industries, delivering
              tailored solutions that enhance operations and client experiences.
            </p>
          </div>

          {/* Featured Industries */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {industries.slice(0, 2).map((industry, idx) => (
              <Card key={idx} className="overflow-hidden border-border hover:shadow-glow transition-all duration-300">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={industry.image} 
                    alt={industry.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                      {industry.icon}
                    </div>
                    <h2 className="text-2xl font-bold">{industry.title}</h2>
                  </div>
                  <p className="text-muted-foreground mb-4">{industry.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {industry.benefits.map((benefit, bidx) => (
                      <div key={bidx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <span className="text-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Other Industries */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {industries.slice(2).map((industry, idx) => (
              <Card key={idx} className="border-border hover:shadow-card transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                    {industry.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{industry.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{industry.description}</p>
                  <ul className="space-y-2">
                    {industry.benefits.map((benefit, bidx) => (
                      <li key={bidx} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                        <span className="text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center bg-gradient-accent rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">
              Don't See Your Industry?
            </h2>
            <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
              Agentic REEB AI is highly customizable and can be adapted to meet the specific
              needs of any business that requires intelligent reception management.
            </p>
            <a href="/contact" className="inline-block">
              <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-glow transition-all">
                Contact Us for Custom Solutions
              </button>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Industries;
