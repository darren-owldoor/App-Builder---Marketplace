import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Plus, Pencil, Eye, Send } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";
import DOMPurify from 'dompurify';

interface EmailTemplate {
  id: string;
  template_name: string;
  template_key: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  description: string | null;
  category: string;
  active: boolean;
}

const EmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    template_name: "",
    template_key: "",
    subject: "",
    html_content: "",
    text_content: "",
    description: "",
    category: "onboarding",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("email_templates")
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

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      template_name: template.template_name,
      template_key: template.template_key,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || "",
      description: template.description || "",
      category: template.category,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    const { error } = await supabase
      .from("email_templates")
      .update({
        template_name: formData.template_name,
        subject: formData.subject,
        html_content: formData.html_content,
        text_content: formData.text_content,
        description: formData.description,
        category: formData.category,
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

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreview(true);
  };

  const handleTestEmail = async () => {
    if (!selectedTemplate || !testEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);

    try {
      const { error } = await supabase.functions.invoke("send-test-email", {
        body: {
          to: testEmail,
          templateId: selectedTemplate.id,
        },
      });

      if (error) throw error;

      toast({
        title: "✅ Test Email Sent",
        description: `Test email with sample data sent to ${testEmail}`,
      });

      setTestEmail("");
      setIsTesting(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
      setIsTesting(false);
    }
  };

  const categoryColors: Record<string, string> = {
    onboarding: "bg-blue-100 text-blue-800",
    matching: "bg-green-100 text-green-800",
    transactions: "bg-purple-100 text-purple-800",
    support: "bg-orange-100 text-orange-800",
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <img src={owlDoorLogo} alt="OwlDoor" className="h-12 cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Email Templates</h1>
              <p className="text-sm text-muted-foreground">Manage transactional email templates</p>
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
                  <Mail className="h-5 w-5" />
                  {category} Templates
                </CardTitle>
                <CardDescription>
                  {category === "onboarding" && "Welcome and signup emails"}
                  {category === "matching" && "Match notification emails"}
                  {category === "transactions" && "Payment and billing emails"}
                  {category === "support" && "Support and help desk emails"}
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
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm"><strong>Subject:</strong> {template.subject}</p>
                          <p className="text-xs text-muted-foreground">Key: {template.template_key}</p>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreview(template)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-[#35a87e]/10 hover:bg-[#35a87e]/20 text-[#35a87e] border-[#35a87e]/30"
                              onClick={() => {
                                setSelectedTemplate(template);
                                setIsEditing(true);
                              }}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Test
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Customize the email template. Use double curly braces with variable names for dynamic content.
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

            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Welcome to {{company_name}}!"
              />
            </div>

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
                  <SelectItem value="transactions">Transactions</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="html" className="w-full">
              <TabsList>
                <TabsTrigger value="html">HTML Content</TabsTrigger>
                <TabsTrigger value="text">Plain Text</TabsTrigger>
              </TabsList>
              <TabsContent value="html">
                <Label htmlFor="html_content">HTML Content</Label>
                <Textarea
                  id="html_content"
                  value={formData.html_content}
                  onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                  rows={15}
                  className="font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="text">
                <Label htmlFor="text_content">Plain Text Content</Label>
                <Textarea
                  id="text_content"
                  value={formData.text_content}
                  onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                  rows={15}
                />
              </TabsContent>
            </Tabs>

            <div className="border-t pt-4 space-y-3">
              <div className="bg-[#35a87e]/5 border border-[#35a87e]/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Send className="h-4 w-4 text-[#35a87e]" />
                  <Label htmlFor="test_email" className="text-[#35a87e] font-semibold">Send Test Email</Label>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Test this template with sample data. The email will be sent immediately with placeholder values.
                </p>
                <div className="flex gap-2">
                  <Input
                    id="test_email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    type="email"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleTestEmail} 
                    disabled={isTesting}
                    className="bg-[#35a87e] hover:bg-[#2d8f6a]"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isTesting ? "Sending..." : "Send Test"}
                  </Button>
                </div>
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

      {/* Preview Dialog */}
      <Dialog open={isPreview} onOpenChange={setIsPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview of {selectedTemplate?.template_name}
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Subject:</p>
                <p className="text-sm text-muted-foreground">{selectedTemplate.subject}</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">HTML Preview:</p>
              <div
                className="border rounded-lg p-4 bg-white"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(selectedTemplate.html_content, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'div', 'span'],
                    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'width', 'height'],
                    ALLOW_DATA_ATTR: false
                  })
                }}
              />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplates;
