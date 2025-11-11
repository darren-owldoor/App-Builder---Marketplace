import { Card } from "@/components/ui/card";
import { MapPin, Users } from "lucide-react";
import { useEffect, useState } from "react";
const agents = [{
  name: "Sarah Mitchell",
  company: "Compass",
  location: "Austin",
  salary: "$200k",
  yearlySales: 17,
  score: "9/10",
  wants: ["Free Leads", "Coaching"],
  initials: "SM"
}, {
  name: "Anthony Nguyen",
  company: "Sotheby's",
  location: "Seattle",
  salary: "$275k",
  yearlySales: 23,
  score: "9/10",
  wants: ["High Splits", "Free Leads", "Coaching"],
  initials: "AN"
}, {
  name: "Jessica Park",
  company: "Keller Williams",
  location: "Denver",
  salary: "$225k",
  yearlySales: 19,
  score: "8/10",
  wants: ["Top Team", "Tech Provided"],
  initials: "JP"
}];
const brokerages = [{
  name: "Elite Realty",
  company: "Compass",
  location: "Austin",
  teamSize: 41,
  yearlySales: 1450,
  score: "9/10",
  offers: ["Top Team", "Tech Provided"],
  initials: "ERG",
  matchScore: 92
}, {
  name: "Success Group",
  company: "Sotheby's",
  location: "Seattle",
  teamSize: 29,
  yearlySales: 1190,
  score: "9/10",
  offers: ["Referrals", "Top Team", "Tech Provided"],
  initials: "SSG",
  matchScore: 86
}, {
  name: "Peak Realty",
  company: "eXp Realty",
  location: "Denver",
  teamSize: 35,
  yearlySales: 980,
  score: "8/10",
  offers: ["Coaching", "Free Leads"],
  initials: "MPR",
  matchScore: 89
}];
export const AnimatedMatchingCards = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % agents.length);
        setIsVisible(true);
      }, 333);
    }, 2667);
    return () => clearInterval(interval);
  }, []);
  const currentAgent = agents[currentIndex];
  const currentBrokerage = brokerages[currentIndex];
  return <div className="py-6 md:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 md:gap-6 items-center">
            {/* Agent Card */}
            <Card className={`p-2 sm:p-3 md:p-4 transition-all duration-[333ms] hover-lift ${isVisible ? "opacity-100 sm:translate-x-0" : "opacity-0 sm:-translate-x-12"}`}>
              <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
                {/* Left: Avatar + Info */}
                <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 flex-1">
                  <div className="hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-primary/10 items-center justify-center font-semibold text-primary flex-shrink-0 text-xs sm:text-sm md:text-base">
                    {currentAgent.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm sm:text-sm md:text-base">{currentAgent.name}</div>
                    <div className="text-xs sm:text-xs md:text-sm text-muted-foreground">{currentAgent.company}</div>
                    <div className="flex items-center gap-1 sm:gap-2 md:gap-3 text-xs sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {currentAgent.location}
                      </div>
                      <div>{currentAgent.salary}</div>
                    </div>
                  </div>
                </div>

                {/* Center: Yearly Sales */}
                <div className="hidden sm:flex sm:flex-col sm:flex-shrink-0 bg-muted/30 px-2 py-1.5 sm:px-3 sm:py-1.5 md:px-4 md:py-2 lg:px-6 lg:py-3 rounded-sm">
                  <div className="text-[9px] sm:text-[9px] md:text-[10px] lg:text-xs text-muted-foreground whitespace-nowrap text-center">Yearly</div>
                  <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-center">{currentAgent.yearlySales}</div>
                  <div className="text-[9px] sm:text-[9px] md:text-[10px] lg:text-xs text-muted-foreground whitespace-nowrap text-center">Sales</div>
                </div>

                {/* Right: Score + Wants */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-end mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm font-semibold">{currentAgent.score}</span>
                    <div className="flex gap-0.5">
                      {Array.from({
                      length: 10
                    }).map((_, i) => <div key={i} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${i < parseInt(currentAgent.score) ? "bg-primary" : "bg-muted"}`} />)}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {currentAgent.wants.map((want, i) => <div key={i} className="text-[10px] sm:text-xs text-muted-foreground">
                        • {want}
                      </div>)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Match Score */}
            <div className={`transition-all duration-[333ms] ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <div className="text-center text-white">
                  <div className="text-base sm:text-lg md:text-xl lg:text-3xl font-bold">{currentBrokerage.matchScore}%</div>
                </div>
              </div>
            </div>

            {/* Brokerage Card */}
            <Card className={`p-2 sm:p-3 md:p-4 transition-all duration-[333ms] hover-lift ${isVisible ? "opacity-100 sm:translate-x-0" : "opacity-0 sm:translate-x-12"}`}>
              <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
                {/* Left: Wants */}
                <div className="text-left flex-shrink-0 hidden sm:block">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <div className="flex gap-0.5">
                      {Array.from({
                      length: 10
                    }).map((_, i) => <div key={i} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${i < parseInt(currentBrokerage.score) ? "bg-primary" : "bg-muted"}`} />)}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold">{currentBrokerage.score}</span>
                  </div>
                  <div className="space-y-0.5">
                    {currentBrokerage.offers.map((offer, i) => <div key={i} className="text-[10px] sm:text-xs text-muted-foreground">
                        {offer} •
                      </div>)}
                  </div>
                </div>

                {/* Center: Yearly Sales */}
                <div className="hidden sm:flex sm:flex-col sm:flex-shrink-0 bg-muted/30 rounded-lg px-2 py-1.5 sm:px-3 sm:py-1.5 md:px-4 md:py-2 lg:px-6 lg:py-3">
                  <div className="text-[9px] sm:text-[9px] md:text-[10px] lg:text-xs text-muted-foreground whitespace-nowrap text-center">Yearly</div>
                  <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-center">{currentBrokerage.yearlySales}</div>
                  <div className="text-[9px] sm:text-[9px] md:text-[10px] lg:text-xs text-muted-foreground whitespace-nowrap text-center">Sales</div>
                </div>

                {/* Right: Info + Avatar */}
                <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 flex-1 justify-end">
                  <div className="min-w-0 text-right">
                    <div className="font-semibold text-sm sm:text-sm md:text-base">{currentBrokerage.name}</div>
                    <div className="text-xs sm:text-xs md:text-sm text-muted-foreground">{currentBrokerage.company}</div>
                    <div className="flex items-center justify-end gap-1 sm:gap-2 md:gap-3 text-xs sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {currentBrokerage.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {currentBrokerage.teamSize}
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 items-center justify-center font-semibold text-primary text-xs sm:text-sm md:text-xs flex-shrink-0">
                    {currentBrokerage.initials}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>;
};