import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface FilterCriteriaCardProps {
  icon: IconDefinition;
  label: string;
  description: string;
  onClick: () => void;
}

export const FilterCriteriaCard = ({ icon, label, description, onClick }: FilterCriteriaCardProps) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          onClick={onClick}
          className="bg-card/50 backdrop-blur border border-border rounded-lg p-4 hover:bg-card hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group"
        >
          <FontAwesomeIcon 
            icon={icon} 
            className="text-2xl mb-2 text-primary group-hover:scale-110 transition-transform" 
          />
          <p className="text-xs font-medium text-foreground">{label}</p>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{label}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs text-primary font-medium mt-2">Click to configure this filter</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
