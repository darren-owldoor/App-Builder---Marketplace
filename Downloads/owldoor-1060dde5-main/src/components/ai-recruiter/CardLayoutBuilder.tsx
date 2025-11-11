import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings2, Eye } from "lucide-react";
import { AILeadCard } from "./AILeadCard";

interface CardLayoutBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  viewType: 'kanban' | 'list';
}

const CARD_FIELDS = [
  { key: 'avatar', label: 'Avatar/Photo', category: 'basic' },
  { key: 'location', label: 'Location', category: 'basic' },
  { key: 'hot_badge', label: 'HOT Badge', category: 'basic' },
  { key: 'stage_badge', label: 'Stage Badge', category: 'basic' },
  { key: 'engagement_score', label: 'Engagement Score', category: 'scores' },
  { key: 'match_score', label: 'Match Score', category: 'scores' },
  { key: 'experience', label: 'Years Experience', category: 'stats' },
  { key: 'deals', label: 'Total Deals', category: 'stats' },
  { key: 'volume', label: 'Total Volume', category: 'stats' },
  { key: 'license_years', label: 'Licensed Years', category: 'stats' },
  { key: 'phone', label: 'Phone Number', category: 'contact' },
  { key: 'email', label: 'Email Address', category: 'contact' },
  { key: 'wants', label: 'Wants/Interests', category: 'details' },
  { key: 'service_areas', label: 'Service Areas', category: 'details' },
  { key: 'next_action', label: 'Next Action', category: 'activity' },
  { key: 'last_contact', label: 'Last Contact Time', category: 'activity' },
  { key: 'messages_count', label: 'Messages Count', category: 'activity' },
  { key: 'tasks_count', label: 'Tasks Count', category: 'activity' },
];

export const CardLayoutBuilder = ({ open, onOpenChange, clientId, viewType }: CardLayoutBuilderProps) => {
  const queryClient = useQueryClient();
  const [previewLayout, setPreviewLayout] = useState<any>({});

  // Load existing layout
  const { data: existingLayout } = useQuery({
    queryKey: ['card-layout', clientId, viewType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_card_layouts')
        .select('*')
        .eq('client_id', clientId)
        .eq('view_type', viewType)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: open,
  });

  // Sample lead data for preview
  const sampleLead = {
    id: 'sample',
    pros: {
      full_name: 'John Smith',
      cities: ['Miami'],
      states: ['FL'],
      experience: 8,
      transactions: 45,
      total_sales: 12500000,
      phone: '(555) 123-4567',
      email: 'john@example.com',
      wants: ['Leads', 'Training', 'High Splits'],
      image_url: null,
    },
    engagement_score: 85,
    match_score: 92,
    is_hot: true,
    next_action: 'Schedule follow-up call',
    ai_message_count: 12,
    last_message_at: new Date().toISOString(),
  };

  useEffect(() => {
    if (existingLayout) {
      setPreviewLayout(existingLayout);
    } else {
      // Set all to true by default
      const defaultLayout: any = {};
      CARD_FIELDS.forEach(field => {
        defaultLayout[`show_${field.key}`] = true;
      });
      setPreviewLayout(defaultLayout);
    }
  }, [existingLayout]);

  const saveLayoutMutation = useMutation({
    mutationFn: async (layout: any) => {
      const { error } = await supabase
        .from('ai_card_layouts')
        .upsert({
          client_id: clientId,
          view_type: viewType,
          ...layout,
        }, {
          onConflict: 'client_id,view_type'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-layout', clientId, viewType] });
      toast.success('Card layout saved successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to save card layout');
      console.error(error);
    },
  });

  const handleToggle = (field: string) => {
    setPreviewLayout((prev: any) => ({
      ...prev,
      [`show_${field}`]: !prev[`show_${field}`],
    }));
  };

  const handleSave = () => {
    saveLayoutMutation.mutate(previewLayout);
  };

  const categories = [
    { key: 'basic', label: 'Basic Info' },
    { key: 'scores', label: 'Scores' },
    { key: 'stats', label: 'Statistics' },
    { key: 'contact', label: 'Contact' },
    { key: 'details', label: 'Details' },
    { key: 'activity', label: 'Activity' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Customize {viewType === 'kanban' ? 'Kanban' : 'List'} Cards
          </DialogTitle>
          <DialogDescription>
            Choose which fields to display on your lead cards. Changes will be saved for your {viewType} view.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
          {/* Controls */}
          <ScrollArea className="pr-4">
            <div className="space-y-6">
              {categories.map(category => {
                const categoryFields = CARD_FIELDS.filter(f => f.category === category.key);
                return (
                  <div key={category.key}>
                    <h3 className="font-semibold text-sm mb-3">{category.label}</h3>
                    <div className="space-y-3">
                      {categoryFields.map(field => (
                        <div key={field.key} className="flex items-center justify-between">
                          <Label htmlFor={field.key} className="text-sm cursor-pointer">
                            {field.label}
                          </Label>
                          <Switch
                            id={field.key}
                            checked={previewLayout[`show_${field.key}`] !== false}
                            onCheckedChange={() => handleToggle(field.key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Preview */}
          <div className="border-l pl-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Live Preview</h3>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <AILeadCard lead={sampleLead} layout={previewLayout} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveLayoutMutation.isPending}>
            {saveLayoutMutation.isPending ? 'Saving...' : 'Save Layout'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
