import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Star, Trash2, Plus, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_role: string | null;
  rating: number;
  review_text: string;
  years_with_team: string | null;
  created_at: string;
}

interface ClientReviewsManagerProps {
  clientId: string;
  clientName: string;
}

export const ClientReviewsManager = ({ clientId, clientName }: ClientReviewsManagerProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  
  const [formData, setFormData] = useState({
    reviewer_name: "",
    reviewer_role: "",
    rating: 5,
    review_text: "",
    years_with_team: ""
  });

  useEffect(() => {
    fetchReviews();
  }, [clientId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("client_reviews")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reviewer_name || !formData.review_text) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      if (editingReview) {
        // Update existing review
        const { error } = await supabase
          .from("client_reviews")
          .update({
            reviewer_name: formData.reviewer_name,
            reviewer_role: formData.reviewer_role || null,
            rating: formData.rating,
            review_text: formData.review_text,
            years_with_team: formData.years_with_team || null
          })
          .eq("id", editingReview.id);

        if (error) throw error;
        toast.success("Review updated successfully");
      } else {
        // Create new review
        const { error } = await supabase
          .from("client_reviews")
          .insert({
            client_id: clientId,
            reviewer_name: formData.reviewer_name,
            reviewer_role: formData.reviewer_role || null,
            rating: formData.rating,
            review_text: formData.review_text,
            years_with_team: formData.years_with_team || null
          });

        if (error) throw error;
        toast.success("Review added successfully");
      }

      resetForm();
      setIsDialogOpen(false);
      fetchReviews();
    } catch (error) {
      console.error("Error saving review:", error);
      toast.error("Failed to save review");
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setFormData({
      reviewer_name: review.reviewer_name,
      reviewer_role: review.reviewer_role || "",
      rating: review.rating,
      review_text: review.review_text,
      years_with_team: review.years_with_team || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const { error } = await supabase
        .from("client_reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;
      toast.success("Review deleted successfully");
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

  const resetForm = () => {
    setFormData({
      reviewer_name: "",
      reviewer_role: "",
      rating: 5,
      review_text: "",
      years_with_team: ""
    });
    setEditingReview(null);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reviews & Ratings</CardTitle>
            <CardDescription>Manage reviews for {clientName}</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingReview ? "Edit Review" : "Add New Review"}</DialogTitle>
                <DialogDescription>
                  Add a review for {clientName}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reviewer_name">Reviewer Name *</Label>
                    <Input
                      id="reviewer_name"
                      value={formData.reviewer_name}
                      onChange={(e) => setFormData({ ...formData, reviewer_name: e.target.value })}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reviewer_role">Role/Title</Label>
                    <Input
                      id="reviewer_role"
                      value={formData.reviewer_role}
                      onChange={(e) => setFormData({ ...formData, reviewer_role: e.target.value })}
                      placeholder="Current Agent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rating">Rating *</Label>
                    <Select
                      value={formData.rating.toString()}
                      onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                    >
                      <SelectTrigger id="rating">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 4, 3, 2, 1].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} Star{num !== 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="years_with_team">Time with Team</Label>
                    <Input
                      id="years_with_team"
                      value={formData.years_with_team}
                      onChange={(e) => setFormData({ ...formData, years_with_team: e.target.value })}
                      placeholder="2 years"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="review_text">Review Text *</Label>
                  <Textarea
                    id="review_text"
                    value={formData.review_text}
                    onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                    required
                    rows={4}
                    placeholder="Share your experience with this team..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingReview ? "Update Review" : "Add Review"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{review.reviewer_name}</span>
                          {review.reviewer_role && (
                            <Badge variant="secondary">{review.reviewer_role}</Badge>
                          )}
                        </div>
                        {renderStars(review.rating)}
                      </div>
                      {review.years_with_team && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {review.years_with_team} with team
                        </p>
                      )}
                      <p className="text-sm">{review.review_text}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(review)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(review.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
