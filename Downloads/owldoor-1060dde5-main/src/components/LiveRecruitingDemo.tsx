import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { CheckCircle2, Users, Target, Award, MapPin, TrendingUp, Home, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import agentDavid from "@/assets/agent-david.jpg";
import agentPriya from "@/assets/agent-priya.jpg";
import agentAnthony from "@/assets/agent-anthony.jpg";
import agentSarah from "@/assets/agent-sarah.png";
const recruitingSteps = [{
  icon: Target,
  title: "A Few Questions. A Lot of Value",
  description: "We just need a minute or two to ask a couple questions that help us match any Agent a better brokerage using a variety of breakthrough technologies."
}, {
  icon: Users,
  title: "AI + Human Matching Engine",
  description: "OwlDoor's matching engine uses big-data scoring to align agents with brokerages that truly fit — then our recruiting experts fine-tune each match by hand."
}, {
  icon: Target,
  title: "Ranked Matches & Compatibility Insights",
  description: "Each match is scored across compatibility pillars: leads, systems, culture, and growth potential — giving you clear, data-backed insight before you connect."
}, {
  icon: Award,
  title: "Warm Introduction, Real Connection",
  description: "OwlDoor facilitates a warm, qualified intro between you and the agent — with key highlights that make the first conversation meaningful."
}];
const agentProfiles = [{
  name: "Sarah Mitchell",
  company: "RE/MAX",
  location: "San Diego",
  badge: "HOT",
  photo: agentSarah,
  grossYear: "$385k",
  salesYear: "$11.2M",
  salesTotal: 78,
  experience: "10 Years",
  buyers: "55%",
  sellers: "45%",
  skills: ["Staging Expert", "Investment Properties"],
  wants: ["Better Commission", "Marketing Support", "Mentorship"],
  motivation: 9,
  interest: 9
}, {
  name: "Priya Patel",
  company: "eXp Realty",
  location: "Austin",
  badge: "WARM",
  photo: agentPriya,
  grossYear: "$200k",
  salesYear: "$5.2M",
  salesTotal: 42,
  experience: "5 Years",
  buyers: "70%",
  sellers: "30%",
  skills: ["Social Media", "Marketing"],
  wants: ["Coaching", "Free Leads", "Remote Work"],
  motivation: 8,
  interest: 7
}, {
  name: "Anthony Nguyen",
  company: "Sotheby's",
  location: "Seattle",
  badge: "NEW",
  photo: agentAnthony,
  grossYear: "$275k",
  salesYear: "$8.1M",
  salesTotal: 64,
  experience: "8 Years",
  buyers: "55%",
  sellers: "45%",
  skills: ["Negotiations", "Virtual Tours"],
  wants: ["Better Splits", "Tech Stack", "Training"],
  motivation: 7,
  interest: 9
}, {
  name: "Marcus Johnson",
  company: "Keller Williams",
  location: "Denver",
  badge: "WARM",
  photo: agentDavid,
  grossYear: "$310k",
  salesYear: "$9.4M",
  salesTotal: 71,
  experience: "9 Years",
  buyers: "65%",
  sellers: "35%",
  skills: ["New Construction", "Relocation"],
  wants: ["Team Environment", "Advanced CRM", "Flexible Schedule"],
  motivation: 8,
  interest: 8
}];

const brokerageMatches = [
  {
    name: "Compass Real Estate",
    location: "San Diego, CA",
    matchScore: 94,
    leads: "Yes",
    salesPerAgent: "12-18",
    culture: "Collaborative",
    commission: "90/10",
    highlights: ["Top Marketing Budget", "Tech Stack Included", "Weekly Training"]
  },
  {
    name: "Keller Williams Coastal",
    location: "Austin, TX", 
    matchScore: 89,
    leads: "No",
    salesPerAgent: "7-14",
    culture: "Team-Oriented",
    commission: "80/20",
    highlights: ["Strong Mentorship", "Profit Share", "Free CRM"]
  },
  {
    name: "eXp Realty Northwest",
    location: "Seattle, WA",
    matchScore: 91,
    leads: "Yes",
    salesPerAgent: "15-21",
    culture: "Tech-Forward",
    commission: "100%",
    highlights: ["Cloud Platform", "Revenue Share", "Global Network"]
  },
  {
    name: "RE/MAX Mountain",
    location: "Denver, CO",
    matchScore: 87,
    leads: "No",
    salesPerAgent: "9-16",
    culture: "Independent",
    commission: "75/25",
    highlights: ["Brand Recognition", "Marketing Support", "Flexible Model"]
  }
];

export const LiveRecruitingDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStep(prev => {
          const next = (prev + 1) % recruitingSteps.length;
          if (prev === recruitingSteps.length - 1) {
            setCompletedSteps([]);
          } else {
            setCompletedSteps(steps => [...steps, prev]);
          }
          return next;
        });
        setIsVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const currentAgent = agentProfiles[currentStep % agentProfiles.length];
  const currentBrokerage = brokerageMatches[currentStep % brokerageMatches.length];
  
  return <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
        {/* Left side - Process Steps */}
        <div className="space-y-4">
          {recruitingSteps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index;
          return <Card key={index} className={`p-6 transition-all duration-500 ${isCompleted || isCurrent ? "opacity-100 translate-y-0" : "opacity-40 translate-y-2"} ${isCurrent ? "ring-2 ring-primary bg-primary/5" : ""}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isCompleted ? "bg-primary text-primary-foreground" : isCurrent ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <StepIcon className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2 text-lg">{step.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Card>;
        })}
        </div>

        {/* Right side - Agent Profile */}
        <div className="space-y-4">
          <Card className={`p-4 transition-all duration-300 animate-fade-in bg-primary/5 border-primary/20 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-4">
              <img src={currentAgent.photo} alt={currentAgent.name} className="w-20 h-20 rounded-full object-cover border-2 border-muted" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">{currentAgent.name}</h3>
                <div className="flex items-center gap-2 text-base text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  {currentAgent.location}
                </div>
              </div>
              
              {/* Motivation & Interest */}
              <div className="space-y-2 hidden md:block">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={`w-3 h-4 rounded-sm ${i < currentAgent.motivation ? "bg-primary" : "bg-muted"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">{currentAgent.motivation}/10</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={`w-3 h-4 rounded-sm ${i < currentAgent.interest ? "bg-primary" : "bg-muted"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">{currentAgent.interest}/10</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 rounded-lg p-2 bg-white/[0.31]">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Gross/yr</div>
                <div className="text-xl font-bold">{currentAgent.grossYear}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Sales/yr</div>
                <div className="text-xl font-bold">{currentAgent.salesYear}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Sales/total</div>
                <div className="text-xl font-bold">{currentAgent.salesTotal}</div>
              </div>
            </div>

            {/* Experience & Lead Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">Experience</h4>
                <div className="bg-primary text-primary-foreground px-3 py-2 rounded text-center font-semibold mb-3">
                  {currentAgent.experience}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Buyers</div>
                    <div className="text-xl font-bold">{currentAgent.buyers}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Sellers</div>
                    <div className="text-xl font-bold">{currentAgent.sellers}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm font-semibold mb-2">Wants</div>
                {currentAgent.wants.map((want, i) => <div key={i} className="text-sm text-muted-foreground mb-1">
                    • {want}
                  </div>)}
                
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground mb-1">Skills</div>
                  {currentAgent.skills.map((skill, i) => <div key={i} className="text-sm">
                      • {skill}
                    </div>)}
                </div>
              </div>
            </div>

          </div>
        </Card>

        {/* Brokerage Match Card */}
        <Card className={`p-4 transition-all duration-300 bg-primary text-primary-foreground border-primary ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Home className="h-5 w-5 text-primary-foreground/80" />
                  <h4 className="font-bold text-lg text-primary-foreground">{currentBrokerage.name}</h4>
                </div>
                <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
                  <MapPin className="h-4 w-4" />
                  {currentBrokerage.location}
                </div>
              </div>
              
              {/* Match Score Bars */}
              <div className="space-y-2 hidden md:block">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={`w-3 h-4 rounded-sm ${i < Math.floor(currentBrokerage.matchScore / 10) ? "bg-primary-foreground" : "bg-primary-foreground/20"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-primary-foreground">{currentBrokerage.matchScore}%</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 py-2">
              <div className="text-center">
                <div className="text-xs text-primary-foreground/70 mb-1">Leads</div>
                <div className="text-sm font-bold text-primary-foreground">{currentBrokerage.leads}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-primary-foreground/70 mb-1">Sales/Agent</div>
                <div className="text-sm font-semibold text-primary-foreground">{currentBrokerage.salesPerAgent}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-primary-foreground/70 mb-1">Culture</div>
                <div className="text-sm font-semibold text-primary-foreground">{currentBrokerage.culture}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-primary-foreground/70 mb-1">Split</div>
                <div className="text-sm font-bold text-primary-foreground">{currentBrokerage.commission}</div>
              </div>
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap gap-2">
              {currentBrokerage.highlights.map((highlight, i) => (
                <div key={i} className="flex items-center gap-1 text-xs bg-primary-foreground/20 text-primary-foreground px-2 py-1 rounded">
                  <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                  {highlight}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>;
};