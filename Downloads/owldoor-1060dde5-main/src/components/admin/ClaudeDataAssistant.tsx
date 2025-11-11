import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Brain, Database, FolderTree, Sparkles, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

type AnalysisType = 'database_schema' | 'data_cleaning' | 'directory_structure' | 'custom';

export const ClaudeDataAssistant = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('database_schema');
  const [customQuery, setCustomQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    analysis: string;
    data?: any;
    type: AnalysisType;
  } | null>(null);

  const runAnalysis = async (type: AnalysisType, query?: string) => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('claude-data-assistant', {
        body: { type, query }
      });

      if (error) throw error;

      if (data.success) {
        setResult(data);
        toast.success('Analysis completed');
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to run analysis');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('claude-data-assistant', {
        body: { 
          type: 'custom',
          query: 'Say "API connection successful" if you can read this message.'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Claude API connection is working!');
        setResult(data);
      } else {
        throw new Error(data.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast.error(error instanceof Error ? error.message : 'API connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Claude AI Data Assistant
          </CardTitle>
          <CardDescription>
            Get AI-powered insights on your database, data quality, and project structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testConnection}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Test API Connection
          </Button>

          <Tabs value={analysisType} onValueChange={(v) => setAnalysisType(v as AnalysisType)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="database_schema">
                <Database className="h-4 w-4 mr-2" />
                Database
              </TabsTrigger>
              <TabsTrigger value="data_cleaning">
                <Sparkles className="h-4 w-4 mr-2" />
                Data Cleaning
              </TabsTrigger>
              <TabsTrigger value="directory_structure">
                <FolderTree className="h-4 w-4 mr-2" />
                Structure
              </TabsTrigger>
              <TabsTrigger value="custom">
                Custom
              </TabsTrigger>
            </TabsList>

            <TabsContent value="database_schema" className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h3 className="font-semibold">Database Schema Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Claude will analyze your database structure, table counts, sample data,
                  and provide recommendations for optimization and data quality improvements.
                </p>
              </div>
              <Button 
                onClick={() => runAnalysis('database_schema')}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Analyze Database
              </Button>
            </TabsContent>

            <TabsContent value="data_cleaning" className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h3 className="font-semibold">Data Cleaning Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  Identifies duplicate records, missing data, and provides specific SQL queries
                  and strategies to clean and merge your data.
                </p>
              </div>
              <Button 
                onClick={() => runAnalysis('data_cleaning')}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Find Data Issues
              </Button>
            </TabsContent>

            <TabsContent value="directory_structure" className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h3 className="font-semibold">Directory Structure Review</h3>
                <p className="text-sm text-muted-foreground">
                  Reviews your React/TypeScript project structure and suggests improvements
                  for component organization and maintainability.
                </p>
              </div>
              <Button 
                onClick={() => runAnalysis('directory_structure')}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Review Structure
              </Button>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Query</label>
                <Textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="Ask Claude anything about your data, structure, or get specific recommendations..."
                  rows={4}
                />
              </div>
              <Button 
                onClick={() => runAnalysis('custom', customQuery)}
                disabled={loading || !customQuery.trim()}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Ask Claude
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Analysis Results</CardTitle>
              <Badge variant="outline">{result.type.replace('_', ' ')}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                  {result.analysis}
                </pre>
              </div>

              {result.data && (
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold text-sm mb-2">
                    View Raw Data
                  </summary>
                  <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
