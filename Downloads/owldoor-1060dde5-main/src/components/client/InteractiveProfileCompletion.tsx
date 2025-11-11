import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InteractiveProfileCompletionProps {
  clientId: string;
  completion: number;
  onUpdate: () => void;
}

const SKILL_OPTIONS = [
  "Leads",
  "Referrals", 
  "Coaching",
  "CRM/Tech",
  "High Splits",
  "Training"
];

export const InteractiveProfileCompletion = ({ 
  clientId, 
  completion,
  onUpdate 
}: InteractiveProfileCompletionProps) => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSave = async () => {
    if (selectedSkills.length === 0) {
      toast({
        title: "Please select at least one skill",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ wants: JSON.stringify(selectedSkills) })
        .eq('id', clientId);

      if (error) throw error;

      setSaved(true);
      toast({
        title: "Profile updated!",
        description: "Your skills have been saved."
      });

      // Reset saved state after 2 seconds
      setTimeout(() => {
        setSaved(false);
        onUpdate();
      }, 2000);

    } catch (error) {
      console.error('Error saving skills:', error);
      toast({
        title: "Error saving",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {SKILL_OPTIONS.map((skill) => (
          <Button
            key={skill}
            variant={selectedSkills.includes(skill) ? "default" : "outline"}
            onClick={() => toggleSkill(skill)}
            className={`h-auto py-2.5 px-3 text-sm font-semibold transition-all ${
              selectedSkills.includes(skill) 
                ? "bg-white text-primary hover:bg-white/95 border-white shadow-md" 
                : "bg-white/20 text-white border-white/30 hover:bg-white/30"
            }`}
          >
            <span>{skill}</span>
            {selectedSkills.includes(skill) && (
              <Check className="h-3 w-3 ml-auto" />
            )}
          </Button>
        ))}
      </div>

      <Button 
        onClick={handleSave}
        disabled={saving || selectedSkills.length === 0}
        className="w-full bg-white text-primary hover:bg-white/95 font-bold py-3 shadow-md"
      >
        {saved ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Saved!
          </>
        ) : (
          <>
            Save & Continue
            <ChevronRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
};
