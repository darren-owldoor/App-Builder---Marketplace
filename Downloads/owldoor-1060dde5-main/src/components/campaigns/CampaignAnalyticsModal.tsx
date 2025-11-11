import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Users, MessageSquare, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CampaignAnalyticsModalProps {
  templateId: string;
  templateName: string;
  open: boolean;
  onClose: () => void;
}

const CampaignAnalyticsModal = ({
  templateId,
  templateName,
  open,
  onClose,
}: CampaignAnalyticsModalProps) => {
  const [analytics, setAnalytics] = useState({
    clientsUsing: 0,
    averageRating: 0,
    totalRatings: 0,
    totalAssignments: 0,
    totalResponses: 0,
    responseRate: 0,
    responsesPerAction: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchAnalytics();
    }
  }, [open, templateId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from("campaign_template_ratings")
        .select("rating")
        .eq("campaign_template_id", templateId);

      if (ratingsError) throw ratingsError;

      // Fetch assignments and responses
      const { data: assignments, error: assignmentsError } = await supabase
        .from("campaign_assignments")
        .select(`
          id,
          assigned_by,
          campaign_responses(count),
          campaign_logs(count)
        `)
        .eq("campaign_template_id", templateId);

      if (assignmentsError) throw assignmentsError;

      // Calculate metrics
      const uniqueClients = new Set(assignments?.map(a => a.assigned_by) || []).size;
      const totalAssignments = assignments?.length || 0;
      const totalResponses = assignments?.reduce((sum, a) => 
        sum + (a.campaign_responses?.[0]?.count || 0), 0) || 0;
      const totalActions = assignments?.reduce((sum, a) => 
        sum + (a.campaign_logs?.[0]?.count || 0), 0) || 0;

      const avgRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      setAnalytics({
        clientsUsing: uniqueClients,
        averageRating: avgRating,
        totalRatings: ratings?.length || 0,
        totalAssignments,
        totalResponses,
        responseRate: totalAssignments > 0 
          ? (totalResponses / totalAssignments) * 100 
          : 0,
        responsesPerAction: totalActions > 0 
          ? totalResponses / totalActions 
          : 0,
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Campaign Analytics</DialogTitle>
          <p className="text-muted-foreground">{templateName}</p>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">Loading analytics...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Clients Using
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.clientsUsing}</div>
                <p className="text-xs text-muted-foreground">
                  Unique clients running this campaign
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Rating
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {renderStars(analytics.averageRating)}
                  <Badge variant="secondary">
                    {analytics.averageRating.toFixed(1)} / 5.0
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on {analytics.totalRatings} rating{analytics.totalRatings !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Response Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.responseRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalResponses} responses from {analytics.totalAssignments} assignments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Responses Per Action
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.responsesPerAction.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average engagement per campaign action
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CampaignAnalyticsModal;
