import { useEffect, useState } from "react";
import { TrendingUp, MapPin, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import agentDavid from "@/assets/agent-david.jpg";
import agentPriya from "@/assets/agent-priya.jpg";
import agentAnthony from "@/assets/agent-anthony.jpg";


const agents = [
  { 
    name: "David Thompson",
    photo: agentDavid,
    company: "Coldwell Banker", 
    location: "Orange County", 
    gross: "$420k",
    sales: "$12.5M",
    salesTotal: 85,
    experience: "12 Years",
    buyers: 60,
    sellers: 40,
    skills: ["Luxury", "First-Time Buyers"],
    wants: ["High Splits", "Free CRM & Tech", "Lead Generation"],
    motivation: 9,
    interest: 8,
    status: "hot" 
  },
  { 
    name: "Priya Patel",
    photo: agentPriya,
    company: "eXp Realty", 
    location: "Austin", 
    gross: "$200k",
    sales: "$5.2M",
    salesTotal: 42,
    experience: "5 Years",
    buyers: 70,
    sellers: 30,
    skills: ["Social Media", "Marketing"],
    wants: ["Coaching", "Free Leads", "Remote Work"],
    motivation: 8,
    interest: 7,
    status: "warm" 
  },
  { 
    name: "Anthony Nguyen",
    photo: agentAnthony,
    company: "Sotheby's", 
    location: "Seattle", 
    gross: "$275k",
    sales: "$8.1M",
    salesTotal: 64,
    experience: "8 Years",
    buyers: 55,
    sellers: 45,
    skills: ["Negotiations", "Virtual Tours"],
    wants: ["Better Splits", "Tech Stack", "Training"],
    motivation: 7,
    interest: 9,
    status: "new" 
  },
];

const matchingSteps = [
  { title: "Scanning Brokerages", detail: "Evaluating 247 brokerages" },
  { title: "Calculating Compatibility", detail: "Lead generation: 95% match" },
  { title: "Perfect Match Found!", detail: "98% Compatibility Score" },
];

export const LiveMatchingDemo = () => {
  const [currentAgent, setCurrentAgent] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showMatch, setShowMatch] = useState(false);

  useEffect(() => {
    const agentInterval = setInterval(() => {
      setCurrentAgent((prev) => (prev + 1) % agents.length);
      setCurrentStep(0);
      setShowMatch(false);
    }, 8000);

    return () => clearInterval(agentInterval);
  }, []);

  useEffect(() => {
    if (currentStep < matchingSteps.length - 1) {
      const stepTimeout = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 2000);
      return () => clearTimeout(stepTimeout);
    } else {
      const matchTimeout = setTimeout(() => {
        setShowMatch(true);
      }, 500);
      return () => clearTimeout(matchTimeout);
    }
  }, [currentStep]);

  const agent = agents[currentAgent];

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
      {/* Left side - Agent Profile */}
      <Card className="p-6 animate-fade-in">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <img 
              src={agent.photo} 
              alt={agent.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-muted"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{agent.name}</h3>
                  <p className="text-muted-foreground">{agent.company}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{agent.location}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  agent.status === 'hot' ? 'bg-primary/20 text-primary' : 
                  agent.status === 'warm' ? 'bg-orange-500/20 text-orange-500' : 
                  'bg-muted text-muted-foreground'
                }`}>
                  {agent.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Gross/yr</p>
              <p className="text-lg font-bold">{agent.gross}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Sales/yr</p>
              <p className="text-lg font-bold">{agent.sales}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Sales/total</p>
              <p className="text-lg font-bold">{agent.salesTotal}</p>
            </div>
          </div>

          {/* Experience & Lead Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-3">Experience</h4>
              <div className="bg-muted/50 px-3 py-2 rounded text-center font-semibold mb-3">
                {agent.experience}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Buyers</p>
                  <p className="text-xl font-bold">{agent.buyers}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sellers</p>
                  <p className="text-xl font-bold">{agent.sellers}%</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Skills</p>
                {agent.skills.map((skill, i) => (
                  <p key={i} className="text-sm">• {skill}</p>
                ))}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-3">Lead Details</h4>
              <p className="text-sm font-semibold mb-2">Wants</p>
              {agent.wants.map((want, i) => (
                <p key={i} className="text-sm text-muted-foreground mb-1">• {want}</p>
              ))}
            </div>
          </div>

          {/* Motivation & Interest */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Motivation</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-4 rounded-sm ${
                        i < agent.motivation ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold">{agent.motivation}/10</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Interest</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-4 rounded-sm ${
                        i < agent.interest ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold">{agent.interest}/10</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Right side - Matching Process */}
      <div className="space-y-4">
        {matchingSteps.map((step, index) => (
          <Card
            key={index}
            className={`p-6 transition-all duration-500 ${
              index <= currentStep
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            } ${index === currentStep ? "ring-2 ring-primary" : ""}`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                index < currentStep ? "bg-primary text-primary-foreground" : 
                index === currentStep ? "bg-primary/20 text-primary" : "bg-muted"
              }`}>
                {index < currentStep ? <Check className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.detail}</p>
              </div>
            </div>
          </Card>
        ))}

        {showMatch && (
          <Card className="p-6 bg-primary/5 border-primary animate-scale-in">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <p className="text-sm text-muted-foreground">Perfect match for your brokerage!</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
