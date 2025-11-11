import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Sparkles, TrendingUp, Users, Zap, Megaphone, HeadphonesIcon, Home, Laptop, Heart, DollarSign, GraduationCap, Target } from "lucide-react";

interface WantsSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (selected: string[]) => Promise<void>;
  currentWants?: string[];
  isUpdating: boolean;
}

const WANTS_OPTIONS = [
  { value: "High Split", label: "High Commission Split", icon: TrendingUp, description: "80%+ splits" },
  { value: "Leads", label: "Free Leads", icon: Target, description: "Qualified buyer/seller leads" },
  { value: "Coaching", label: "Coaching & Training", icon: GraduationCap, description: "Mentorship & development" },
  { value: "Low Fees", label: "Low Fees", icon: DollarSign, description: "Minimal monthly costs" },
  { value: "CRM/Tech", label: "CRM & Tech", icon: Zap, description: "Advanced tools & systems" },
  { value: "Marketing", label: "Marketing Support", icon: Megaphone, description: "Marketing materials & ads" },
  { value: "Assistants", label: "Admin Support", icon: Users, description: "Transaction coordinators" },
  { value: "Office Space", label: "Office Space", icon: Home, description: "Physical office access" },
  { value: "Remote Work", label: "Remote Friendly", icon: Laptop, description: "Work from anywhere" },
  { value: "Culture", label: "Great Culture", icon: Heart, description: "Collaborative environment" },
  { value: "Referrals", label: "Referral Network", icon: Users, description: "Agent-to-agent referrals" },
  { value: "Top Team", label: "Top Producing Team", icon: Sparkles, description: "Join elite performers" }
];

export function WantsSelectionModal({ open, onClose, onSave, currentWants = [], isUpdating }: WantsSelectionModalProps) {
  const [selected, setSelected] = useState<string[]>(currentWants);

  const handleToggle = (value: string) => {
    setSelected(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const handleSave = async () => {
    await onSave(selected);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">What's Most Important to You?</DialogTitle>
          <DialogDescription className="text-base">
            Select all that matter to you in your ideal brokerage. This helps us find your perfect match.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 py-4">
          {WANTS_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selected.includes(option.value);
            
            return (
              <div
                key={option.value}
                className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleToggle(option.value)}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggle(option.value)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <Label className="cursor-pointer font-semibold text-sm">
                      {option.label}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selected.length} {selected.length === 1 ? 'item' : 'items'} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isUpdating || selected.length === 0}
              className="min-w-[100px]"
            >
              {isUpdating ? "Saving..." : "Save Selection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
