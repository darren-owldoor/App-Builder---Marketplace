import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, TrendingUp, Award } from "lucide-react";

interface TeamInviteModalProps {
  open: boolean;
  onClose: () => void;
  onQuestionPrompt: () => void;
}

export function TeamInviteModal({ open, onClose, onQuestionPrompt }: TeamInviteModalProps) {
  const handleInterested = () => {
    onClose();
    onQuestionPrompt();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">New Team Invite</DialogTitle>
            <Badge className="bg-success text-white">
              95% Match
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Company Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-2xl">
              KW
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Keller Williams</h3>
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                San Diego, CA
              </p>
            </div>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-success" />
                <span className="font-semibold text-foreground">Commission Split</span>
              </div>
              <p className="text-muted-foreground">Up to 90%</p>
            </div>
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Avg. Sales/Year</span>
              </div>
              <p className="text-muted-foreground">12 transactions</p>
            </div>
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-accent" />
                <span className="font-semibold text-foreground">Free Leads</span>
              </div>
              <p className="text-muted-foreground">Yes + CRM</p>
            </div>
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold text-foreground">Monthly Fees</span>
              </div>
              <p className="text-muted-foreground">None</p>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              "Top producing team in San Diego. We provide comprehensive support including free leads, 
              advanced CRM, coaching, and a collaborative office environment. Join 50+ successful agents."
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Not Now
            </Button>
            <Button
              className="flex-1 bg-success hover:bg-success/90 text-white"
              onClick={handleInterested}
            >
              I'm Interested!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
