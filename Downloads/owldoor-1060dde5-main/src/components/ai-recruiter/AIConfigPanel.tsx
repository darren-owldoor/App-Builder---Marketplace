import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, Sparkles, MessageSquare, AlertCircle, Zap } from 'lucide-react';
import { EscalationRulesBuilder } from './EscalationRulesBuilder';
import { Separator } from '@/components/ui/separator';

interface AIConfigPanelProps {
  clientId?: string;
}

export function AIConfigPanel({ clientId }: AIConfigPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load AI config
  const { data: config, isLoading } = useQuery({
    queryKey: ['ai-config', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data } = await supabase
        .from('ai_config')
        .select('*')
        .eq('client_id', clientId)
        .single();
      return data;
    },
    enabled: !!clientId,
  });

  const [formData, setFormData] = useState({
    ai_enabled: false,
    company_name: '',
    brokerage_info: '',
    offer_details: '',
    team_special: '',
    key_benefits: [] as string[],
    ai_response_tone: 'Professional & Friendly',
    ai_personality: '',
    twilio_phone_number: '',
    calendly_link: '',
    escalate_after_messages: 5,
    escalate_on_commission_questions: true,
    escalate_on_objections: true,
    escalate_on_callback_requests: true,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        ai_enabled: config.ai_enabled || false,
        company_name: config.company_name || '',
        brokerage_info: config.brokerage_info || '',
        offer_details: config.offer_details || '',
        team_special: config.team_special || '',
        key_benefits: config.key_benefits || [],
        ai_response_tone: config.ai_response_tone || 'Professional & Friendly',
        ai_personality: config.ai_personality || '',
        twilio_phone_number: config.twilio_phone_number || '',
        calendly_link: config.calendly_link || '',
        escalate_after_messages: config.escalate_after_messages || 5,
        escalate_on_commission_questions: config.escalate_on_commission_questions ?? true,
        escalate_on_objections: config.escalate_on_objections ?? true,
        escalate_on_callback_requests: config.escalate_on_callback_requests ?? true,
      });
    }
  }, [config]);

  const updateConfigMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!clientId) throw new Error('No client ID');

      const { error } = await supabase
        .from('ai_config')
        .upsert({
          client_id: clientId,
          ...data,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config', clientId] });
      toast({
        title: 'Configuration saved',
        description: 'AI settings have been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to save configuration',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    updateConfigMutation.mutate(formData);
  };

  const handleAddBenefit = () => {
    setFormData({
      ...formData,
      key_benefits: [...formData.key_benefits, ''],
    });
  };

  const handleUpdateBenefit = (index: number, value: string) => {
    const updated = [...formData.key_benefits];
    updated[index] = value;
    setFormData({ ...formData, key_benefits: updated });
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData({
      ...formData,
      key_benefits: formData.key_benefits.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="text-center text-gray-400">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      {/* Header with AI Toggle */}
      <div className="flex justify-between items-center mb-6 pb-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Training & Configuration</h2>
            <p className="text-sm text-gray-600">Configure your AI assistant's behavior</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">AI Enabled</span>
          <Switch
            checked={formData.ai_enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, ai_enabled: checked })}
          />
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">Update Brokerage Info</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">Edit Offer Details</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">Set AI Personality</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">Escalation Rules</span>
        </Button>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Company/Team Name */}
        <div>
          <Label htmlFor="company_name">Company/Team Name</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="Owldoor Real Estate"
            className="mt-1.5"
          />
        </div>

        {/* What Makes Your Team Special */}
        <div>
          <Label htmlFor="team_special">What Makes Your Team Special? (AI will use this in conversations)</Label>
          <Textarea
            id="team_special"
            value={formData.team_special}
            onChange={(e) => setFormData({ ...formData, team_special: e.target.value })}
            placeholder="We're the #1 team in San Antonio with exclusive Zillow Premier Agent partnerships, comprehensive training programs, and a proven system that helped our agents close 450+ transactions last year."
            className="mt-1.5 min-h-[120px]"
          />
        </div>

        {/* Key Benefits to Highlight */}
        <div>
          <Label>Key Benefits to Highlight</Label>
          <div className="mt-2 space-y-2">
            {formData.key_benefits.map((benefit, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={benefit}
                  onChange={(e) => handleUpdateBenefit(index, e.target.value)}
                  placeholder="e.g., 80/20 commission split"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveBenefit(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddBenefit}
              className="w-full"
            >
              + Add Benefit
            </Button>
          </div>
        </div>

        {/* Brokerage Info */}
        <div>
          <Label htmlFor="brokerage_info">Brokerage Information</Label>
          <Textarea
            id="brokerage_info"
            value={formData.brokerage_info}
            onChange={(e) => setFormData({ ...formData, brokerage_info: e.target.value })}
            placeholder="Detailed information about your brokerage..."
            className="mt-1.5 min-h-[100px]"
          />
        </div>

        {/* Offer Details */}
        <div>
          <Label htmlFor="offer_details">Offer Details</Label>
          <Textarea
            id="offer_details"
            value={formData.offer_details}
            onChange={(e) => setFormData({ ...formData, offer_details: e.target.value })}
            placeholder="What you offer to agents..."
            className="mt-1.5 min-h-[100px]"
          />
        </div>

        {/* AI Response Tone */}
        <div>
          <Label htmlFor="ai_response_tone">AI Response Tone</Label>
          <Select
            value={formData.ai_response_tone}
            onValueChange={(value) => setFormData({ ...formData, ai_response_tone: value })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Professional & Friendly">Professional & Friendly</SelectItem>
              <SelectItem value="Casual & Conversational">Casual & Conversational</SelectItem>
              <SelectItem value="Formal & Business-like">Formal & Business-like</SelectItem>
              <SelectItem value="Enthusiastic & Energetic">Enthusiastic & Energetic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* When Should AI Escalate to You? */}
        <div>
          <Label className="text-base font-semibold mb-3 block">When Should AI Escalate to You?</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="escalate_commission"
                checked={formData.escalate_on_commission_questions}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, escalate_on_commission_questions: checked as boolean })
                }
              />
              <label
                htmlFor="escalate_commission"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Lead asks about specific commission splits
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="escalate_objections"
                checked={formData.escalate_on_objections}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, escalate_on_objections: checked as boolean })
                }
              />
              <label
                htmlFor="escalate_objections"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Lead expresses concerns or objections
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="escalate_callback"
                checked={formData.escalate_on_callback_requests}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, escalate_on_callback_requests: checked as boolean })
                }
              />
              <label
                htmlFor="escalate_callback"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Lead requests immediate callback
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="escalate_messages"
                checked={formData.escalate_after_messages > 0}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, escalate_after_messages: checked ? 5 : 0 })
                }
              />
              <label
                htmlFor="escalate_messages"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                After 5+ messages with no appointment booked
              </label>
            </div>
          </div>
        </div>

        {/* Twilio Phone & Calendly */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="twilio_phone">Twilio Phone Number</Label>
            <Input
              id="twilio_phone"
              value={formData.twilio_phone_number}
              onChange={(e) => setFormData({ ...formData, twilio_phone_number: e.target.value })}
              placeholder="+1234567890"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="calendly">Calendly Link</Label>
            <Input
              id="calendly"
              value={formData.calendly_link}
              onChange={(e) => setFormData({ ...formData, calendly_link: e.target.value })}
              placeholder="https://calendly.com/..."
              className="mt-1.5"
            />
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={updateConfigMutation.isPending}
          className="w-full h-12 text-base font-bold"
        >
          💾 Save AI Configuration
        </Button>

        {/* Separator */}
        <Separator className="my-8" />

        {/* Escalation Rules Builder */}
        <EscalationRulesBuilder clientId={clientId} />
      </div>
    </div>
  );
}
