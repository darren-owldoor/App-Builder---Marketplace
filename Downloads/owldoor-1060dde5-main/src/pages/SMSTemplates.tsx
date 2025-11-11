import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageSquare, Plus, Pencil, Send, Phone } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";
import { TwilioAccountSelector } from "@/components/campaigns/TwilioAccountSelector";

interface SMSTemplate {
  id: string;
  template_name: string;
  template_key: string;
  message_content: string;
  description: string | null;
  category: string;
  active: boolean;
  twilio_number: string | null;
}

const SMSTemplates = () => {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    template_name: "",
    template_key: "",
    message_content: "",
    description: "",
    category: "transactional",
    twilio_number: "",
    twilio_account_id: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("sms_templates")
      .select("*")
      .order("category", { ascending: true })
      .order("template_name", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive",
      });
      return;
    }

    setTemplates(data || []);
  };

  const handleEdit = (template: SMSTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      template_name: template.template_name,
      template_key: template.template_key,
      message_content: template.message_content,
      description: template.description || "",
      category: template.category,
      twilio_number: template.twilio_number || "",
      twilio_account_id: "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    const { error } = await supabase
      .from("sms_templates")
      .update({
        template_name: formData.template_name,
        message_content: formData.message_content,
        description: formData.description,
        category: formData.category,
        twilio_number: formData.twilio_number || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedTemplate.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Template updated successfully",
    });

    setIsEditing(false);
    fetchTemplates();
  };

  const handleTestSMS = async () => {
    if (!selectedTemplate || !testPhone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-sms-provider", {
        body: {
          to: testPhone,
          message: selectedTemplate.message_content,
          from_number: selectedTemplate.twilio_number || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Test SMS Sent",
        description: `Test message sent to ${testPhone}`,
      });

      setTestPhone("");
      setIsTesting(false);
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test SMS",
        variant: "destructive",
      });
      setIsTesting(false);
    }
  };

  const categoryColors: Record<string, string> = {
    onboarding: "bg-blue-100 text-blue-800",
    matching: "bg-green-100 text-green-800",
    transactional: "bg-purple-100 text-purple-800",
    support: "bg-orange-100 text-orange-800",
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, SMSTemplate[]>);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <img src={owlDoorLogo} alt="OwlDoor" className="h-12 cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">SMS Templates</h1>
              <p className="text-sm text-muted-foreground">Manage SMS message templates</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {category} Templates
                </CardTitle>
                <CardDescription>
                  {category === "onboarding" && "Welcome and signup messages"}
                  {category === "matching" && "Match notification messages"}
                  {category === "transactional" && "Transactional SMS messages"}
                  {category === "support" && "Support and help desk messages"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {categoryTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{template.template_name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                            <Badge className={`mt-2 ${categoryColors[template.category]}`}>
                              {template.category}
                            </Badge>
                            {template.twilio_number && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {template.twilio_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm">{template.message_content}</p>
                          <p className="text-xs text-muted-foreground">Key: {template.template_key}</p>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit SMS Template</DialogTitle>
            <DialogDescription>
              Customize the SMS template. SMS messages are limited to 160 characters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template_name">Template Name</Label>
              <Input
                id="template_name"
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <TwilioAccountSelector
              selectedAccountId={formData.twilio_account_id}
              selectedPhoneNumber={formData.twilio_number}
              onAccountChange={(accountId) => setFormData({ ...formData, twilio_account_id: accountId })}
              onPhoneNumberChange={(phoneNumber) => setFormData({ ...formData, twilio_number: phoneNumber })}
            />

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="matching">Matching</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message_content">Message Content</Label>
              <Textarea
                id="message_content"
                value={formData.message_content}
                onChange={(e) => setFormData({ ...formData, message_content: e.target.value })}
                rows={4}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.message_content.length}/160 characters
              </p>
            </div>

            <div className="border-t pt-4">
              <Label htmlFor="test_phone">Test SMS</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="test_phone"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+1234567890"
                  type="tel"
                />
                <Button onClick={handleTestSMS} disabled={isTesting}>
                  <Send className="mr-2 h-4 w-4" />
                  {isTesting ? "Sending..." : "Test"}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SMSTemplates;