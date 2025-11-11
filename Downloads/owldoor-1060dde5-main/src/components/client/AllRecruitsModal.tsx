import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Eye, Search } from "lucide-react";
import { RecruitDetailModal } from "./RecruitDetailModal";

interface AllRecruitsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  recruits: Array<{
    id: string;
    status: string;
    match_score: number;
    created_at: string;
    pros: {
      id?: string;
      full_name: string;
      email: string;
      phone: string;
      cities: string[] | null;
      states: string[] | null;
      qualification_score: number;
      pro_type: string;
      total_volume_12mo?: number;
      transactions_12mo?: number;
      experience?: number;
      brokerage?: string;
    };
  }>;
}

export const AllRecruitsModal = ({ open, onOpenChange, recruits, clientId }: AllRecruitsModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecruit, setSelectedRecruit] = useState<typeof recruits[0] | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredRecruits = recruits.filter(recruit =>
    recruit.pros.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recruit.pros.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recruit.pros.phone.includes(searchTerm)
  );

  const handleViewRecruit = (recruit: typeof recruits[0]) => {
    setSelectedRecruit(recruit);
    setShowDetailModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">All Recruits ({recruits.length})</DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Recruits List */}
          <div className="space-y-3 overflow-y-auto max-h-[50vh]">
            {filteredRecruits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recruits found</p>
              </div>
            ) : (
              filteredRecruits.map((recruit) => (
                <div
                  key={recruit.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{recruit.pros.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {recruit.pros.email} • {recruit.pros.phone}
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {recruit.pros.cities && recruit.pros.cities.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {recruit.pros.cities[0]}
                        </Badge>
                      )}
                      {recruit.pros.experience && (
                        <Badge variant="outline" className="text-xs">
                          {recruit.pros.experience} yrs exp
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        Score: {recruit.match_score}%
                      </Badge>
                      <Badge
                        variant={
                          recruit.status === "active" ? "default" :
                          recruit.status === "pending" ? "secondary" : "outline"
                        }
                        className="text-xs"
                      >
                        {recruit.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewRecruit(recruit)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recruit Detail Modal */}
      {selectedRecruit && (
        <RecruitDetailModal
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          recruit={selectedRecruit}
          clientId={clientId}
        />
      )}
    </>
  );
};
