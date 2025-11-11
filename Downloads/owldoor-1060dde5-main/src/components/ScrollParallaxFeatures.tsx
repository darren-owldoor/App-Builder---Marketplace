import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Target, TrendingUp, Shield, Heart, Users, Zap } from "lucide-react";
import precisionMatchingImg from "@/assets/precision-matching.svg";
import growthAccelerationImg from "@/assets/growth-acceleration.svg";
import verifiedTeamsImg from "@/assets/verified-teams.svg";
import cultureFirstImg from "@/assets/culture-first.svg";
import eliteNetworkImg from "@/assets/elite-network.svg";
import instantConnectionImg from "@/assets/instant-connection.svg";
const brokerageFeatures = [{
  icon: Target,
  image: precisionMatchingImg,
  title: "Precision Agent Matching",
  description: "Our AI analyzes 50+ data points to deliver agents who align perfectly with your team's culture, production goals, and growth trajectory."
}, {
  icon: TrendingUp,
  image: growthAccelerationImg,
  title: "Proven Track Records",
  description: "Access only top-performing agents with verified production history, ensuring quality additions to your team."
}, {
  icon: Shield,
  image: verifiedTeamsImg,
  title: "Pre-Qualified Talent",
  description: "Every agent is thoroughly vetted with background checks, production verification, and motivation assessments before reaching you."
}, {
  icon: Heart,
  image: cultureFirstImg,
  title: "Culture Compatibility",
  description: "We prioritize cultural alignment to ensure long-term retention and satisfaction for both your team and new recruits."
}, {
  icon: Users,
  image: eliteNetworkImg,
  title: "Elite Agent Pool",
  description: "Tap into the top 20% of producing agents across all markets who are actively seeking their next career move."
}, {
  icon: Zap,
  image: instantConnectionImg,
  title: "Real-Time Agent Interest",
  description: "Connect with interested agents instantly and schedule interviews within 24 hours of matching—no more cold recruiting calls."
}];
const agentFeatures = [{
  icon: Target,
  image: precisionMatchingImg,
  title: "Perfect Brokerage Matching",
  description: "Our AI analyzes your goals, experience, and preferences to connect you with brokerages that truly align with your career vision."
}, {
  icon: TrendingUp,
  image: growthAccelerationImg,
  title: "Competitive Compensation",
  description: "Discover brokerages offering top commission splits, bonuses, and financial incentives that reflect your true market value."
}, {
  icon: Shield,
  image: verifiedTeamsImg,
  title: "Verified Brokerages",
  description: "Every brokerage is thoroughly vetted for financial stability, support systems, and agent satisfaction before being featured."
}, {
  icon: Heart,
  image: cultureFirstImg,
  title: "Culture & Values Match",
  description: "Find teams where you'll thrive with compatible leadership styles, work-life balance, and shared professional values."
}, {
  icon: Users,
  image: eliteNetworkImg,
  title: "Growth-Focused Teams",
  description: "Connect with brokerages that invest in agent development through training, mentorship, and cutting-edge technology."
}, {
  icon: Zap,
  image: instantConnectionImg,
  title: "Instant Opportunities",
  description: "Get real-time notifications of brokerages actively seeking agents with your profile and schedule interviews within 24 hours."
}];
interface ScrollParallaxFeaturesProps {
  mode?: "agent" | "brokerage";
}
export const ScrollParallaxFeatures = ({
  mode = "brokerage"
}: ScrollParallaxFeaturesProps) => {
  const features = mode === "agent" ? agentFeatures : brokerageFeatures;
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const viewportHeight = window.innerHeight;

      // Find which section is most visible
      contentRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const sectionMiddle = rect.top + rect.height / 2;
          const distanceFromCenter = Math.abs(sectionMiddle - viewportHeight / 2);

          // If this section is close to viewport center
          if (distanceFromCenter < viewportHeight / 3) {
            setActiveIndex(index);
          }
        }
      });
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return <section ref={containerRef} className="relative py-20 px-6">
      
    </section>;
};