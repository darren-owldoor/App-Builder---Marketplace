import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Settings2,
  Edit2,
  ClipboardList
} from "lucide-react";
import { RecruitDetailModal } from "./RecruitDetailModal";
import { TasksEditor } from "../ai-recruiter/TasksEditor";

interface Match {
  id: string;
  status: string;
  match_score: number;
  created_at: string;
  purchased?: boolean;
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
    wants?: string[];
  };
}

interface DetailedRecruitsListProps {
  matches: Match[];
  clientId?: string;
  onOpenCardBuilder?: () => void;
}

export const DetailedRecruitsList = ({ matches, clientId, onOpenCardBuilder }: DetailedRecruitsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedRecruit, setSelectedRecruit] = useState<Match | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortBy, setSortBy] = useState<"score" | "name" | "date">("score");
  const [tasksRecruitId, setTasksRecruitId] = useState<string | null>(null);
  const [tasksOpen, setTasksOpen] = useState(false);

  const filteredMatches = matches
    .filter(match =>
      match.pros.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.pros.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.pros.phone.includes(searchTerm) ||
      match.pros.brokerage?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "score") return b.match_score - a.match_score;
      if (sortBy === "name") return a.pros.full_name.localeCompare(b.pros.full_name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const formatCurrency = (value?: number) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleViewDetails = (match: Match) => {
    setSelectedRecruit(match);
    setShowDetailModal(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-xl">All Recruits ({matches.length})</CardTitle>
            
            <div className="flex gap-2 flex-wrap">
              {onOpenCardBuilder && (
                <Button variant="outline" size="sm" onClick={onOpenCardBuilder}>
                  <Settings2 className="h-4 w-4 mr-2" />
                  Customize Cards
                </Button>
              )}
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, brokerage..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="score">Sort by Match Score</option>
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2">
            {filteredMatches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recruits found matching your search</p>
              </div>
            ) : (
              filteredMatches.map((match) => (
                <div key={match.id} className="border rounded-lg">
                  {/* Compact View */}
                  <div 
                    className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === match.id ? null : match.id)}
                  >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                      <div>
                        <div className="font-semibold text-base">{match.pros.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {match.pros.brokerage || "Independent"}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            match.match_score >= 80 ? "destructive" :
                            match.match_score >= 60 ? "default" : "secondary"
                          }
                        >
                          {match.match_score}% Match
                        </Badge>
                        {match.pros.experience && (
                          <Badge variant="outline">
                            {match.pros.experience}yr exp
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm space-y-1">
                        {match.pros.cities && match.pros.cities.length > 0 && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{match.pros.cities[0]}</span>
                          </div>
                        )}
                        {match.pros.transactions_12mo && (
                          <div className="flex items-center gap-1 font-semibold text-primary">
                            <TrendingUp className="h-3 w-3" />
                            <span>{match.pros.transactions_12mo} deals/yr</span>
                          </div>
                        )}
                      </div>
                      
                      {/* What They Want - Prominent Display */}
                      <div className="text-sm">
                        {match.pros.wants && match.pros.wants.length > 0 ? (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1 font-semibold">Looking For:</div>
                            <div className="flex flex-wrap gap-1">
                              {match.pros.wants.slice(0, 3).map((want, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {want}
                                </Badge>
                              ))}
                              {match.pros.wants.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{match.pros.wants.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">No preferences listed</div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 justify-end items-center">
                        {match.status === 'purchased' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTasksRecruitId(match.pros.id || match.id);
                                setTasksOpen(true);
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                              <ClipboardList className="h-3 w-3 mr-1" />
                              Tasks
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(match);
                              }}
                              className="bg-blue-500 hover:bg-blue-600"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit Lead
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(match);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {expandedId === match.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded View */}
                  {expandedId === match.id && (
                    <div className="border-t p-4 bg-accent/20 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Contact Info */}
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Contact Information</h4>
                          {match.status === 'purchased' ? (
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <a href={`mailto:${match.pros.email}`} className="hover:underline">
                                  {match.pros.email}
                                </a>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <a href={`tel:${match.pros.phone}`} className="hover:underline">
                                  {match.pros.phone}
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground p-3 border rounded bg-muted/50">
                              <p className="mb-2">🔒 Contact details locked</p>
                              <Button size="sm" variant="outline" className="w-full">
                                Purchase to Unlock
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Location */}
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Location Coverage</h4>
                          <div className="space-y-1 text-sm">
                            {match.pros.cities && match.pros.cities.length > 0 && (
                              <div>
                                <span className="text-muted-foreground">Cities:</span>{" "}
                                <span className="font-medium">{match.pros.cities.join(", ")}</span>
                              </div>
                            )}
                            {match.pros.states && match.pros.states.length > 0 && (
                              <div>
                                <span className="text-muted-foreground">States:</span>{" "}
                                <span className="font-medium">{match.pros.states.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Performance */}
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Performance Metrics</h4>
                          <div className="space-y-2">
                            {match.pros.total_volume_12mo && (
                              <div className="bg-primary/10 p-3 rounded-lg border-l-4 border-primary">
                                <p className="text-xs text-muted-foreground font-semibold">Total Volume (12mo)</p>
                                <p className="text-lg font-bold text-primary">{formatCurrency(match.pros.total_volume_12mo)}</p>
                              </div>
                            )}
                            {match.pros.transactions_12mo && (
                              <div className="bg-primary/10 p-3 rounded-lg border-l-4 border-primary">
                                <p className="text-xs text-muted-foreground font-semibold">Transactions (12mo)</p>
                                <p className="text-lg font-bold text-primary">{match.pros.transactions_12mo} deals</p>
                              </div>
                            )}
                            {match.pros.total_volume_12mo && match.pros.transactions_12mo && (
                              <div className="bg-accent/50 p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground font-semibold">Avg Deal Size</p>
                                <p className="text-base font-bold">{formatCurrency(match.pros.total_volume_12mo / match.pros.transactions_12mo)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* What They Want - Highlighted */}
                      {match.pros.wants && match.pros.wants.length > 0 && (
                        <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
                          <h4 className="font-bold text-sm mb-3 text-primary flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            What They're Looking For
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {match.pros.wants.map((want, idx) => (
                              <Badge key={idx} variant="default" className="text-xs bg-primary hover:bg-primary/90">
                                {want}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t flex-wrap">
                        {match.status === 'purchased' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTasksRecruitId(match.pros.id || match.id);
                                setTasksOpen(true);
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                              <ClipboardList className="h-3 w-3 mr-2" />
                              Tasks
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleViewDetails(match)}
                              className="bg-blue-500 hover:bg-blue-600"
                            >
                              <Edit2 className="h-3 w-3 mr-2" />
                              Edit All Fields
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(match)}
                        >
                          <Eye className="h-3 w-3 mr-2" />
                          View Details
                        </Button>
                        {match.status === 'purchased' && match.pros.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`tel:${match.pros.phone}`)}
                          >
                            <Phone className="h-3 w-3 mr-2" />
                            Call Now
                          </Button>
                        )}
                        {match.status === 'purchased' && match.pros.email && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`mailto:${match.pros.email}`)}
                          >
                            <Mail className="h-3 w-3 mr-2" />
                            Email
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Detail Modal */}
      {selectedRecruit && (
        <RecruitDetailModal
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          recruit={selectedRecruit}
          clientId={clientId}
        />
      )}

      {/* Tasks Editor */}
      {tasksRecruitId && clientId && (
        <TasksEditor
          open={tasksOpen}
          onOpenChange={setTasksOpen}
          leadId={tasksRecruitId}
          clientId={clientId}
        />
      )}
    </>
  );
};
