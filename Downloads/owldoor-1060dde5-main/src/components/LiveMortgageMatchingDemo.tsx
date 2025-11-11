import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, Calendar, TrendingUp, MapPin, DollarSign } from "lucide-react";

const loanOfficers = [
  {
    name: "Michael Rodriguez",
    company: "Quicken Loans",
    location: "Phoenix, AZ",
    volume: "$24.5M",
    loans: 156,
    experience: "8 Years",
    status: "hot",
    matchScore: 94
  },
  {
    name: "Jennifer Chen",
    company: "Rocket Mortgage",
    location: "Dallas, TX",
    volume: "$18.2M",
    loans: 124,
    experience: "5 Years",
    status: "warm",
    matchScore: 89
  },
  {
    name: "David Thompson",
    company: "United Wholesale",
    location: "Austin, TX",
    volume: "$31.8M",
    loans: 198,
    experience: "12 Years",
    status: "hot",
    matchScore: 96
  }
];

const stats = [
  {
    label: "Active Officers",
    value: "847",
    change: "+18.5%",
    icon: Users
  },
  {
    label: "Live Matches",
    value: "234",
    change: "+12.8%",
    icon: MessageSquare
  },
  {
    label: "Interviews Set",
    value: "89",
    change: "+28.3%",
    icon: Calendar
  },
  {
    label: "Placements",
    value: "34",
    change: "+22.1%",
    icon: TrendingUp
  }
];

const recentActivity = [
  { officer: "M.R.", action: "Matched with Freedom Mortgage", time: "2m ago", type: "match" },
  { officer: "J.C.", action: "Interview scheduled", time: "5m ago", type: "interview" },
  { officer: "D.T.", action: "Profile updated", time: "8m ago", type: "update" },
  { officer: "S.P.", action: "New branch interested", time: "12m ago", type: "interest" }
];

export const LiveMortgageMatchingDemo = () => {
  const [selectedOfficer, setSelectedOfficer] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedOfficer((prev) => (prev + 1) % loanOfficers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const activityInterval = setInterval(() => {
      setActivityIndex((prev) => (prev + 1) % recentActivity.length);
    }, 3000);
    return () => clearInterval(activityInterval);
  }, []);

  const officer = loanOfficers[selectedOfficer];

  return (
    <div className="py-16 bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Live Matching Activity
            </h2>
            <p className="text-muted-foreground text-lg">
              Watch real-time connections happening now
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className="p-4 animate-fade-in hover:shadow-lg transition-shadow"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs text-green-600 font-medium">{stat.change}</div>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Loan Officer Cards */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold mb-4">Top Candidates</h3>
              <div className="grid gap-4">
                {loanOfficers.map((item, index) => (
                  <Card
                    key={index}
                    className={`
                      p-6 cursor-pointer transition-all duration-500
                      ${index === selectedOfficer 
                        ? "ring-2 ring-primary shadow-lg scale-105" 
                        : "opacity-70 hover:opacity-100 hover:shadow-md"
                      }
                    `}
                    onClick={() => setSelectedOfficer(index)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                            {item.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.company}</p>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={item.status === 'hot' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {item.matchScore}% Match
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>{item.volume}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Loans:</span> {item.loans}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Exp:</span> {item.experience}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <Card
                    key={index}
                    className={`
                      p-4 transition-all duration-500
                      ${index === activityIndex 
                        ? "bg-primary/5 border-primary/20" 
                        : "bg-background"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {activity.officer}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-1">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      <div className={`
                        w-2 h-2 rounded-full flex-shrink-0 mt-2
                        ${activity.type === 'match' ? 'bg-green-500' : 
                          activity.type === 'interview' ? 'bg-blue-500' : 
                          activity.type === 'interest' ? 'bg-orange-500' : 
                          'bg-gray-500'}
                      `} />
                    </div>
                  </Card>
                ))}
              </div>

              {/* Selected Officer Highlight */}
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <h4 className="font-semibold mb-3">Featured Match</h4>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{officer.name}</p>
                  <p className="text-xs text-muted-foreground">{officer.company}</p>
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Match Score</span>
                      <span className="text-lg font-bold text-primary">{officer.matchScore}%</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
