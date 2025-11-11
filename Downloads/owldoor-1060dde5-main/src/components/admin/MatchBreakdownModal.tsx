import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, MapPin, TrendingUp, Sparkles } from "lucide-react";

interface FieldScore {
  field_name: string;
  score: number;
  max_score: number;
  match_type: 'exact' | 'overlap' | 'range' | 'semantic' | 'none';
  details: string;
}

interface MatchBreakdown {
  total_score: number;
  field_scores: FieldScore[];
  geographic_score: number;
  performance_score: number;
  ai_semantic_score: number;
}

interface MatchBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  breakdown: MatchBreakdown | null;
  proName: string;
  clientName: string;
}

export const MatchBreakdownModal = ({
  open,
  onOpenChange,
  breakdown,
  proName,
  clientName,
}: MatchBreakdownModalProps) => {
  if (!breakdown) return null;

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'exact': return 'bg-green-500';
      case 'overlap': return 'bg-blue-500';
      case 'range': return 'bg-purple-500';
      case 'semantic': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'exact': return 'Exact';
      case 'overlap': return 'Overlap';
      case 'range': return 'Range';
      case 'semantic': return 'AI Match';
      default: return 'None';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Match Breakdown: {proName} ↔ {clientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overall Match Score</span>
                <span className={`text-4xl font-bold ${getScoreColor(breakdown.total_score)}`}>
                  {breakdown.total_score}/100
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={breakdown.total_score} className="h-3" />
            </CardContent>
          </Card>

          {/* Category Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Geographic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(breakdown.geographic_score)}</div>
                <Progress value={breakdown.geographic_score} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(breakdown.performance_score)}</div>
                <Progress value={breakdown.performance_score} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Semantic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(breakdown.ai_semantic_score)}</div>
                <Progress value={breakdown.ai_semantic_score} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Field-by-Field Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Field Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {breakdown.field_scores
                  .sort((a, b) => b.score - a.score)
                  .map((field, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {field.field_name.replace(/_/g, ' ')}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`${getMatchTypeColor(field.match_type)} text-white`}
                          >
                            {getMatchTypeLabel(field.match_type)}
                          </Badge>
                        </div>
                        <span className={`font-bold ${getScoreColor((field.score / field.max_score) * 100)}`}>
                          {field.score.toFixed(1)}/{field.max_score}
                        </span>
                      </div>
                      <Progress 
                        value={(field.score / field.max_score) * 100} 
                        className="h-2" 
                      />
                      <p className="text-sm text-muted-foreground">{field.details}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
