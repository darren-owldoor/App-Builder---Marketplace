import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MultiProviderAI, AIProvider } from "@/lib/ai/multiProviderClient";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AIProviderTester() {
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<AIProvider>("lovable");
  const [model, setModel] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const providerModels: Record<AIProvider, string[]> = {
    lovable: [
      "google/gemini-2.5-flash",
      "google/gemini-2.5-pro",
      "google/gemini-2.5-flash-lite",
      "openai/gpt-5",
      "openai/gpt-5-mini",
      "openai/gpt-5-nano",
    ],
    openai: [
      "gpt-5-2025-08-07",
      "gpt-5-nano-2025-08-07",
      "gpt-5-mini-2025-08-07",
      "gpt-4.1-2025-04-14",
      "o3-2025-04-16",
      "o4-mini-2025-04-16",
    ],
    anthropic: [
      "claude-sonnet-4-5",
      "claude-opus-4-1-20250805",
      "claude-sonnet-4-20250514",
    ],
  };

  const handleTest = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const startTime = Date.now();
      const result = await MultiProviderAI.chat({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ],
        provider,
        model: model || undefined,
      });
      const duration = Date.now() - startTime;

      setResponse({ ...result, duration });
      toast.success(`Response received in ${duration}ms`);
    } catch (error) {
      console.error("Test error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get response");
    } finally {
      setLoading(false);
    }
  };

  const handleSemanticMatch = async () => {
    setLoading(true);
    try {
      const result = await MultiProviderAI.semanticMatch(
        "Looking for high commission and free leads",
        "Offers 90% commission split and provides qualified leads"
      );
      setResponse(result);
      toast.success("Semantic match complete");
    } catch (error) {
      toast.error("Semantic match failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Provider Tester</CardTitle>
          <CardDescription>
            Test Lovable AI (Gemini), OpenAI (GPT-5-nano), and Anthropic (Claude) integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>Provider</Label>
            <div className="flex gap-2">
              <Button
                variant={provider === "lovable" ? "default" : "outline"}
                onClick={() => {
                  setProvider("lovable");
                  setModel("");
                }}
              >
                🚀 Lovable AI
              </Button>
              <Button
                variant={provider === "openai" ? "default" : "outline"}
                onClick={() => {
                  setProvider("openai");
                  setModel("");
                }}
              >
                🤖 OpenAI
              </Button>
              <Button
                variant={provider === "anthropic" ? "default" : "outline"}
                onClick={() => {
                  setProvider("anthropic");
                  setModel("");
                }}
              >
                🧠 Anthropic
              </Button>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label>Model (optional)</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select model (defaults to best)" />
              </SelectTrigger>
              <SelectContent>
                {providerModels[provider].map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleTest} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Chat
            </Button>
            <Button variant="outline" onClick={handleSemanticMatch} disabled={loading}>
              Test Semantic Match
            </Button>
          </div>

          {/* Response Display */}
          {response && (
            <Card className="bg-muted/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Response</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{response.provider}</Badge>
                    {response.model && <Badge variant="outline">{response.model}</Badge>}
                    {response.duration && (
                      <Badge variant="default">{response.duration}ms</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Content</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{response.content || JSON.stringify(response, null, 2)}</p>
                  </div>
                  {response.usage && (
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <Label className="text-muted-foreground">Prompt Tokens</Label>
                        <p className="font-mono">{response.usage.prompt_tokens}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Completion Tokens</Label>
                        <p className="font-mono">{response.usage.completion_tokens}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Total Tokens</Label>
                        <p className="font-mono">{response.usage.total_tokens}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
