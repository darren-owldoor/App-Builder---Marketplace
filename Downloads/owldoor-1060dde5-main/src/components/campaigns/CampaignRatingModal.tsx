import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface CampaignRatingModalProps {
  templateId: string;
  templateName: string;
  clientId: string;
  open: boolean;
  onClose: () => void;
}

const CampaignRatingModal = ({
  templateId,
  templateName,
  clientId,
  open,
  onClose,
}: CampaignRatingModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [existingRating, setExistingRating] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetchExistingRating();
    }
  }, [open, templateId, clientId]);

  const fetchExistingRating = async () => {
    try {
      const { data, error } = await supabase
        .from("campaign_template_ratings")
        .select("*")
        .eq("campaign_template_id", templateId)
        .eq("client_id", clientId)
        .single();

      if (data) {
        setExistingRating(data);
        setRating(data.rating);
        setReviewText(data.review_text || "");
      }
    } catch (error) {
      // No existing rating
    }
  };

  const handleSave = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSaving(true);
    try {
      const ratingData = {
        campaign_template_id: templateId,
        client_id: clientId,
        rating,
        review_text: reviewText.trim() || null,
      };

      if (existingRating) {
        const { error } = await supabase
          .from("campaign_template_ratings")
          .update(ratingData)
          .eq("id", existingRating.id);

        if (error) throw error;
        toast.success("Rating updated");
      } else {
        const { error } = await supabase
          .from("campaign_template_ratings")
          .insert(ratingData);

        if (error) throw error;
        toast.success("Rating submitted");
      }

      onClose();
    } catch (error: any) {
      toast.error("Failed to save rating");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Campaign Template</DialogTitle>
          <p className="text-sm text-muted-foreground">{templateName}</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-medium">Your Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Review (Optional)
            </label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this template..."
              rows={4}
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || rating === 0}>
            {saving ? "Saving..." : existingRating ? "Update Rating" : "Submit Rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignRatingModal;
