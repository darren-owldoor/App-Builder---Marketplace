import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MapPin } from "lucide-react";
import thumbsUpIcon from "@/assets/thumbs-up.svg";

interface BrokerageCard {
  id: number;
  initials: string;
  name: string;
  location: string;
  perk: string;
  status: string;
  match: string;
}

const brokerages: BrokerageCard[] = [
  { id: 1, initials: "KW", name: "Keller Williams", location: "Austin, TX", perk: "Free Leads & Coaching", status: "Hot!", match: "97" },
  { id: 2, initials: "EX", name: "eXp Realty", location: "Dallas, TX", perk: "Tech & High Splits", status: "Hot!", match: "96" },
  { id: 3, initials: "RM", name: "RE/MAX Premier", location: "Houston, TX", perk: "100% Approval", status: "Active", match: "95" },
  { id: 4, initials: "CB", name: "Coldwell Banker", location: "Phoenix, AZ", perk: "Top Producers", status: "Hot!", match: "94" },
  { id: 5, initials: "CP", name: "Compass Realty", location: "San Diego, CA", perk: "Zillow Flex", status: "Hot!", match: "97" },
  { id: 6, initials: "BR", name: "Berkshire Hathaway", location: "Denver, CO", perk: "Referrals + Leads", status: "Active", match: "93" },
  { id: 7, initials: "SO", name: "Sotheby's Realty", location: "Miami, FL", perk: "Luxury Brand", status: "Hot!", match: "96" },
  { id: 8, initials: "DH", name: "Douglas Elliman", location: "New York, NY", perk: "Million Dollar Closers", status: "Hot!", match: "95" },
  { id: 9, initials: "MT", name: "Mega Team Realty", location: "Los Angeles, CA", perk: "MEGA TEAM: Top 1%", status: "Active", match: "97" },
  { id: 10, initials: "RB", name: "Realty One Group", location: "Las Vegas, NV", perk: "Offering You 10% Bump", status: "Hot!", match: "94" },
  { id: 11, initials: "KW", name: "Keller Williams Elite", location: "Seattle, WA", perk: "Free Leads & Coaching", status: "Hot!", match: "96" },
  { id: 12, initials: "EX", name: "eXp World Holdings", location: "Portland, OR", perk: "Tech & High Splits", status: "Active", match: "95" },
  { id: 13, initials: "RM", name: "RE/MAX Advantage", location: "Boston, MA", perk: "100% Approval", status: "Hot!", match: "94" },
  { id: 14, initials: "CB", name: "Coldwell Banker Elite", location: "Atlanta, GA", perk: "Top Producers", status: "Hot!", match: "97" },
  { id: 15, initials: "CP", name: "Compass Luxury", location: "Chicago, IL", perk: "Zillow Flex", status: "Active", match: "93" },
  { id: 16, initials: "BR", name: "Berkshire Premier", location: "Nashville, TN", perk: "Referrals + Leads", status: "Hot!", match: "96" },
  { id: 17, initials: "SO", name: "Sotheby's Elite", location: "Scottsdale, AZ", perk: "Luxury Brand", status: "Hot!", match: "95" },
  { id: 18, initials: "DH", name: "Douglas Premier", location: "San Francisco, CA", perk: "Million Dollar Closers", status: "Active", match: "94" },
  { id: 19, initials: "MT", name: "Mega Elite Team", location: "Tampa, FL", perk: "MEGA TEAM: Top 1%", status: "Hot!", match: "97" },
  { id: 20, initials: "RB", name: "Realty One Elite", location: "Charlotte, NC", perk: "Offering You 10% Bump", status: "Hot!", match: "96" },
  { id: 21, initials: "KW", name: "Keller Williams Luxury", location: "Raleigh, NC", perk: "Free Leads & Coaching", status: "Active", match: "95" },
  { id: 22, initials: "EX", name: "eXp Luxury", location: "Columbus, OH", perk: "Tech & High Splits", status: "Hot!", match: "94" },
  { id: 23, initials: "RM", name: "RE/MAX Platinum", location: "Indianapolis, IN", perk: "100% Approval", status: "Hot!", match: "97" },
  { id: 24, initials: "CB", name: "Coldwell Banker Premier", location: "San Antonio, TX", perk: "Top Producers", status: "Active", match: "93" },
];

export const AnimatedAgentScroll = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showThumbsUp, setShowThumbsUp] = useState<number | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationFrameId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.8; // pixels per frame - slower for smooth movement

    const animate = () => {
      scrollPosition += scrollSpeed;
      
      // Reset when we've scrolled past one set of cards
      const cardWidth = 340; // approximate width including gap (308px + 32px gap)
      const totalWidth = cardWidth * brokerages.length;
      
      if (scrollPosition >= totalWidth) {
        scrollPosition = 0;
      }

      container.style.transform = `translateX(-${scrollPosition}px)`;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Random card expansion effect
  useEffect(() => {
    const expandRandomCard = () => {
      // Pick a random card from the first set (not duplicates)
      const randomIndex = Math.floor(Math.random() * brokerages.length);
      
      setExpandedCard(randomIndex);
      setShowThumbsUp(randomIndex);
      
      // Return to normal after 2.5 seconds
      setTimeout(() => {
        setShowThumbsUp(null);
        setExpandedCard(null);
      }, 2500);
    };

    // Start first expansion after 0.5 second
    const initialTimeout = setTimeout(expandRandomCard, 500);

    // Then continue with random intervals between 0.5-1 seconds (twice as frequent)
    const intervalId = setInterval(() => {
      expandRandomCard();
    }, Math.random() * 500 + 500); // Random between 0.5-1 seconds

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, []);

  // Duplicate cards for seamless loop
  const duplicatedBrokerages = [...brokerages, ...brokerages];

  return (
    <div className="relative w-full overflow-hidden py-12">
      {/* Left fade gradient */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      
      {/* Right fade gradient */}
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Scrolling container */}
      <div
        ref={scrollRef}
        className="flex gap-8"
        style={{ willChange: 'transform' }}
      >
        {duplicatedBrokerages.map((brokerage, index) => {
          // Check if this card should be expanded (either the selected card or its duplicate)
          const isExpanded = expandedCard !== null && (
            index === expandedCard || 
            index === expandedCard + brokerages.length
          );
          const shouldShowThumb = showThumbsUp !== null && (
            index === showThumbsUp || 
            index === showThumbsUp + brokerages.length
          );
          
          return (
          <div
            key={`${brokerage.id}-${index}`}
            ref={(el) => (cardRefs.current[index] = el)}
            className="flex-shrink-0 relative"
            style={{
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0s',
              transform: isExpanded ? 'scale(1.15)' : 'scale(1)',
              zIndex: isExpanded ? 20 : 1,
              transformOrigin: 'center center',
            }}
          >
            <Card className="p-4 bg-card backdrop-blur shadow-lg w-[308px] relative">
              {/* Thumbs up icon */}
              {shouldShowThumb && (
                <img
                  src={thumbsUpIcon}
                  alt="thumbs up"
                  className="absolute top-2 right-2 w-16 h-16 animate-fade-in z-30"
                  style={{
                    animation: 'fade-in 0.3s ease-out, scale-in 0.3s ease-out',
                  }}
                />
              )}

              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center font-bold text-base flex-shrink-0">
                  {brokerage.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-2 leading-tight line-clamp-2">{brokerage.name}</h3>
                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {brokerage.location}
                    </span>
                    <span className="truncate font-medium text-primary">{brokerage.perk}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={brokerage.status === "Hot!" ? "destructive" : "default"}
                      className="text-[9px] px-2 py-0.5 h-5"
                    >
                      {brokerage.status}
                    </Badge>
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-foreground">
                      <span className="text-xs font-semibold text-background">
                        {brokerage.match}%
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="text-[10px] h-6 px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVideoModalOpen(true);
                      }}
                    >
                      VIEW
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          );
        })}
      </div>

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src="https://player.vimeo.com/video/1130829041?autoplay=1&loop=1&fl=pl&fe=sh"
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Brokerage Overview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
