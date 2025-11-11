import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";

interface LeadValidationBadgeProps {
  motivation?: number | null;
  wants?: string[] | null;
  compact?: boolean;
}

export const LeadValidationBadge = ({ motivation, wants, compact = false }: LeadValidationBadgeProps) => {
  const hasMotivation = motivation !== null && motivation !== undefined && motivation > 0;
  const hasWants = wants && Array.isArray(wants) && wants.length > 0;
  const isValid = hasMotivation || hasWants;

  if (compact) {
    return isValid ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-600" />
    );
  }

  return isValid ? (
    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/50">
      <CheckCircle className="mr-1 h-3 w-3" />
      Ready for Sale
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/50">
      <AlertCircle className="mr-1 h-3 w-3" />
      Missing Required Data
    </Badge>
  );
};
