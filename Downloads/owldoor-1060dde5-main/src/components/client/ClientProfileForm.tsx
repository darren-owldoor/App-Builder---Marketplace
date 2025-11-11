import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ClientProfileFormProps {
  clientId: string;
  onComplete: () => void;
}

const COMMON_DESIGNATIONS = ["ABR", "CRS", "GRI", "SRS", "SRES", "PSA", "AHWD", "SFR", "CIPS", "GREEN"];
const COMMON_LANGUAGES = ["English", "Spanish", "Mandarin", "French", "German", "Italian", "Portuguese", "Russian", "Japanese", "Korean"];
const COMMON_SKILLS = ["Luxury Homes", "First-Time Buyers", "Investment Properties", "Commercial", "Short Sales", "Foreclosures", "New Construction", "Relocation", "Military", "Senior Housing"];

const ClientProfileForm = ({ clientId, onComplete }: ClientProfileFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    years_experience: "",
    yearly_sales: "",
    avg_sale: "",
    brokerage: "",
    license_type: "",
    wants: "",
    needs: "",
  });
  const [designations, setDesignations] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [customDesignation, setCustomDesignation] = useState("");
  const [customLanguage, setCustomLanguage] = useState("");
  const [customSkill, setCustomSkill] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddItem = (
    item: string,
    list: string[],
    setList: (list: string[]) => void,
    setCustom: (value: string) => void
  ) => {
    if (item && !list.includes(item)) {
      setList([...list, item]);
      setCustom("");
    }
  };

  const handleRemoveItem = (item: string, list: string[], setList: (list: string[]) => void) => {
    setList(list.filter((i) => i !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("clients")
        .update({
          years_experience: parseInt(formData.years_experience) || null,
          yearly_sales: parseFloat(formData.yearly_sales) || null,
          avg_sale: parseFloat(formData.avg_sale) || null,
          designations,
          languages,
          skills,
          wants: formData.wants || null,
          needs: formData.needs || null,
          brokerage: formData.brokerage || null,
          license_type: formData.license_type || null,
          profile_completed: true,
        })
        .eq("id", clientId);

      if (error) throw error;

      toast({
        title: "Profile completed!",
        description: "Your profile has been successfully set up.",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary p-4 flex items-center justify-center">
      <Card className="w-full max-w-4xl shadow-glow">
        <CardHeader>
          <CardTitle className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            Help us match you with the best real estate talent by providing more details about your brokerage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="years_experience">Years Experience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  placeholder="10"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_type">License Type *</Label>
                <Select
                  value={formData.license_type}
                  onValueChange={(value) => setFormData({ ...formData, license_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select license type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearly_sales">Yearly Sales ($)</Label>
                <Input
                  id="yearly_sales"
                  type="number"
                  placeholder="5000000"
                  value={formData.yearly_sales}
                  onChange={(e) => setFormData({ ...formData, yearly_sales: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avg_sale">Average Sale ($)</Label>
                <Input
                  id="avg_sale"
                  type="number"
                  placeholder="500000"
                  value={formData.avg_sale}
                  onChange={(e) => setFormData({ ...formData, avg_sale: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brokerage">Brokerage</Label>
              <Input
                id="brokerage"
                type="text"
                placeholder="RE/MAX, Keller Williams, etc."
                value={formData.brokerage}
                onChange={(e) => setFormData({ ...formData, brokerage: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Designations</Label>
              <div className="flex gap-2 mb-2">
                <Select onValueChange={(value) => handleAddItem(value, designations, setDesignations, setCustomDesignation)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select designations" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_DESIGNATIONS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Add custom designation"
                  value={customDesignation}
                  onChange={(e) => setCustomDesignation(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddItem(customDesignation, designations, setDesignations, setCustomDesignation);
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {designations.map((d) => (
                  <Badge key={d} variant="secondary" className="cursor-pointer">
                    {d}
                    <X
                      className="ml-1 h-3 w-3"
                      onClick={() => handleRemoveItem(d, designations, setDesignations)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Languages</Label>
              <div className="flex gap-2 mb-2">
                <Select onValueChange={(value) => handleAddItem(value, languages, setLanguages, setCustomLanguage)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select languages" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Add custom language"
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddItem(customLanguage, languages, setLanguages, setCustomLanguage);
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {languages.map((l) => (
                  <Badge key={l} variant="secondary" className="cursor-pointer">
                    {l}
                    <X
                      className="ml-1 h-3 w-3"
                      onClick={() => handleRemoveItem(l, languages, setLanguages)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex gap-2 mb-2">
                <Select onValueChange={(value) => handleAddItem(value, skills, setSkills, setCustomSkill)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select skills" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_SKILLS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Add custom skill"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddItem(customSkill, skills, setSkills, setCustomSkill);
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Badge key={s} variant="secondary" className="cursor-pointer">
                    {s}
                    <X
                      className="ml-1 h-3 w-3"
                      onClick={() => handleRemoveItem(s, skills, setSkills)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wants">What are you looking for in an agent?</Label>
              <Textarea
                id="wants"
                placeholder="Describe what you want in potential agents..."
                value={formData.wants}
                onChange={(e) => setFormData({ ...formData, wants: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="needs">What does your team need?</Label>
              <Textarea
                id="needs"
                placeholder="Describe your team's specific needs..."
                value={formData.needs}
                onChange={(e) => setFormData({ ...formData, needs: e.target.value })}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !formData.license_type}>
              {isLoading ? "Completing Profile..." : "Complete Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientProfileForm;
