import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CustomField {
  id: string;
  field_name: string;
  field_type: string;
}

interface AIPrompt {
  id: string;
  prompt_type: string;
  target_id: string | null;
  target_name: string | null;
  prompt_content: string;
}

const AIPrompts = () => {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fieldsRes, promptsRes] = await Promise.all([
        supabase.from("custom_fields").select("id, field_name, field_type"),
        supabase.from("ai_prompts" as any).select("*")
      ]);

      if (fieldsRes.error) throw fieldsRes.error;
      if (promptsRes.error) throw promptsRes.error;

      setCustomFields(fieldsRes.data || []);
      
      const promptsMap: Record<string, string> = {};
      (promptsRes.data as any)?.forEach((p: AIPrompt) => {
        const key = p.prompt_type === 'field' ? `field_${p.target_id}` : `page_${p.target_name}`;
        promptsMap[key] = p.prompt_content;
      });
      setPrompts(promptsMap);
    } catch (error: any) {
      toast.error("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async (type: 'field' | 'page', id: string | null, name: string | null, content: string) => {
    const key = type === 'field' ? `field_${id}` : `page_${name}`;
    setSaving(key);

    try {
      const { error } = await supabase.from("ai_prompts" as any).upsert({
        prompt_type: type,
        target_id: id,
        target_name: name,
        prompt_content: content
      } as any, {
        onConflict: type === 'field' ? 'prompt_type,target_id' : 'prompt_type,target_name'
      });

      if (error) throw error;

      setPrompts(prev => ({ ...prev, [key]: content }));
      toast.success("Prompt saved successfully");
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Prompts Configuration</h1>
      
      <Tabs defaultValue="fields" className="w-full">
        <TabsList>
          <TabsTrigger value="fields">Field Prompts</TabsTrigger>
          <TabsTrigger value="pages">Page Prompts</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          {customFields.map((field) => {
            const key = `field_${field.id}`;
            return (
              <Card key={field.id}>
                <CardHeader>
                  <CardTitle>{field.field_name}</CardTitle>
                  <CardDescription>Type: {field.field_type}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`prompt-${field.id}`}>AI Prompt</Label>
                    <Textarea
                      id={`prompt-${field.id}`}
                      value={prompts[key] || ''}
                      onChange={(e) => setPrompts(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`Enter AI instructions for how to handle the "${field.field_name}" field...`}
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                  <Button
                    onClick={() => savePrompt('field', field.id, null, prompts[key] || '')}
                    disabled={saving === key}
                  >
                    {saving === key && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Prompt
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          {['blog', 'dashboard', 'campaigns', 'leads'].map((pageName) => {
            const key = `page_${pageName}`;
            return (
              <Card key={pageName}>
                <CardHeader>
                  <CardTitle className="capitalize">{pageName} Page</CardTitle>
                  <CardDescription>Configure AI behavior for the {pageName} page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`prompt-${pageName}`}>AI Prompt</Label>
                    <Textarea
                      id={`prompt-${pageName}`}
                      value={prompts[key] || ''}
                      onChange={(e) => setPrompts(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`Enter AI instructions for the ${pageName} page (e.g., when to publish, what content to generate, etc.)...`}
                      rows={6}
                      className="mt-2"
                    />
                  </div>
                  <Button
                    onClick={() => savePrompt('page', null, pageName, prompts[key] || '')}
                    disabled={saving === key}
                  >
                    {saving === key && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Prompt
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIPrompts;
