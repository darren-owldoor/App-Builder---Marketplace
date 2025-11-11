import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  Star,
  MapPin,
  TrendingUp,
  Users,
  Briefcase,
  ArrowLeft,
  Heart,
  MessageSquare,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AgentMatchCard from "@/components/agent/AgentMatchCard";

interface Match {
  id: string;
  pro_id?: string;
  client_id?: string;
  match_score: number;
  status: string;
  match_type: string;
  created_at: string;
  pro?: {
    id: string;
    first_name: string;
    last_name: string;
    cities: string[];
    states: string[];
    experience?: number;
    transactions_per_year?: number;
  };
  client?: {
    id: string;
    company_name: string;
    cities: string[];
    states: string[];
    client_type: string;
    yearly_sales?: number;
  };
}

export default function Matches() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [userType, setUserType] = useState<"pro" | "client" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");

  useEffect(() => {
    if (user) {
      fetchUserTypeAndMatches();
    } else {
      navigate("/auth");
    }
  }, [user]);

  const fetchUserTypeAndMatches = async () => {
    try {
      setLoading(true);

      // Check if user is a pro
      const { data: proData } = await supabase
        .from("pros")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (proData) {
        setUserType("pro");
        await fetchProMatches(proData.id);
      } else {
        // Check if user is a client
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user?.id)
          .maybeSingle();

        if (clientData) {
          setUserType("client");
          await fetchClientMatches(clientData.id);
        }
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast({
        title: "Error",
        description: "Failed to load matches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProMatches = async (proId: string) => {
    const { data, error } = await supabase
      .from("matches")
      .select(
        `
        *,
        client:clients(
          id,
          company_name,
          cities,
          states,
          client_type,
          yearly_sales
        )
      `
      )
      .eq("pro_id", proId)
      .order("match_score", { ascending: false });

    if (error) throw error;
    setMatches(data || []);
  };

  const fetchClientMatches = async (clientId: string) => {
    const { data, error } = await supabase
      .from("matches")
      .select(
        `
        *,
        pro:pros(
          id,
          first_name,
          last_name,
          cities,
          states,
          experience,
          transactions_per_year
        )
      `
      )
      .eq("client_id", clientId)
      .order("match_score", { ascending: false });

    if (error) throw error;
    setMatches(data || []);
  };

  const handleStatusUpdate = async (matchId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("matches")
        .update({ status: newStatus })
        .eq("id", matchId);

      if (error) throw error;

      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: newStatus } : m))
      );

      toast({
        title: "Success",
        description: "Match status updated",
      });
    } catch (error) {
      console.error("Error updating match:", error);
      toast({
        title: "Error",
        description: "Failed to update match status",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "contacted":
        return <MessageSquare className="w-4 h-4" />;
      case "accepted":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "contacted":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredMatches = matches.filter((match) => {
    const matchesSearch = userType === "pro"
      ? match.client?.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      : `${match.pro?.first_name} ${match.pro?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || match.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    switch (sortBy) {
      case "score":
        return b.match_score - a.match_score;
      case "date":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  const statusCounts = {
    all: matches.length,
    pending: matches.filter((m) => m.status === "pending").length,
    contacted: matches.filter((m) => m.status === "contacted").length,
    accepted: matches.filter((m) => m.status === "accepted").length,
    rejected: matches.filter((m) => m.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(userType === "pro" ? "/agents" : "/client-dashboard")}
            >
              <div className="text-3xl">🦉</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">OwlDoor</h1>
                <p className="text-sm text-gray-600">
                  {userType === "pro" ? "Your Brokerage Matches" : "Your Agent Matches"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(userType === "pro" ? "/agents" : "/client-dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {userType === "pro" ? "Brokerage Matches" : "Agent Matches"}
          </h1>
          <p className="text-gray-600">
            {userType === "pro"
              ? "Brokerages that match your preferences and experience"
              : "Talented agents looking to join your team"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Matches</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-900 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">{statusCounts.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-900 mb-1">Contacted</p>
                  <p className="text-2xl font-bold text-blue-900">{statusCounts.contacted}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-900 mb-1">Accepted</p>
                  <p className="text-2xl font-bold text-green-900">{statusCounts.accepted}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-900 mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-red-900">{statusCounts.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={
                    userType === "pro" ? "Search brokerages..." : "Search agents..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Matches ({statusCounts.all})</SelectItem>
                  <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
                  <SelectItem value="contacted">
                    Contacted ({statusCounts.contacted})
                  </SelectItem>
                  <SelectItem value="accepted">Accepted ({statusCounts.accepted})</SelectItem>
                  <SelectItem value="rejected">Rejected ({statusCounts.rejected})</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Match Score</SelectItem>
                  <SelectItem value="date">Date Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Matches List */}
        {sortedMatches.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No matches found
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your filters to see more results"
                      : userType === "pro"
                      ? "We're working on finding the perfect brokerages for you. Check back soon!"
                      : "Complete your profile and set your preferences to start receiving agent matches"}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMatches.map((match) => (
              <Card
                key={match.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  if (userType === "pro" && match.client) {
                    navigate(`/company/${match.client_id}`);
                  } else if (userType === "client" && match.pro) {
                    navigate(`/profile/${match.pro_id}`);
                  }
                }}
              >
                <CardContent className="pt-6">
                  {/* Match Score Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-green-100 text-green-800">
                      <Star className="w-3 h-3 mr-1" />
                      {match.match_score}% Match
                    </Badge>
                    <Badge className={getStatusColor(match.status)}>
                      {getStatusIcon(match.status)}
                      <span className="ml-1 capitalize">{match.status}</span>
                    </Badge>
                  </div>

                  {/* Content - Different for Pro vs Client */}
                  {userType === "pro" && match.client ? (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {match.client.company_name}
                      </h3>
                      {(match.client.cities?.length > 0 || match.client.states?.length > 0) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          {match.client.cities?.[0] && match.client.states?.[0]
                            ? `${match.client.cities[0]}, ${match.client.states[0]}`
                            : match.client.states?.[0] || 'Location not set'}
                        </div>
                      )}
                      <div className="space-y-2">
                        {match.client.yearly_sales && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Yearly Sales</span>
                            <span className="font-medium text-green-600">
                              ${parseFloat(match.client.yearly_sales.toString()).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Type</span>
                          <Badge variant="secondary">
                            {match.client.client_type === "real_estate"
                              ? "Real Estate"
                              : "Mortgage"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : userType === "client" && match.pro ? (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {match.pro.first_name} {match.pro.last_name}
                      </h3>
                      {(match.pro.cities?.length > 0 || match.pro.states?.length > 0) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          {match.pro.cities?.[0] && match.pro.states?.[0]
                            ? `${match.pro.cities[0]}, ${match.pro.states[0]}`
                            : match.pro.states?.[0] || 'Location not set'}
                        </div>
                      )}
                      <div className="space-y-2">
                        {match.pro.experience && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Experience</span>
                            <span className="font-medium">
                              {match.pro.experience} years
                            </span>
                          </div>
                        )}
                        {match.pro.transactions_per_year && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Transactions/Year</span>
                            <span className="font-medium text-blue-600">
                              {match.pro.transactions_per_year}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    {match.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(match.id, "contacted");
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Contact
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(match.id, "rejected");
                          }}
                        >
                          Pass
                        </Button>
                      </>
                    )}
                    {match.status === "contacted" && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(match.id, "accepted");
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(match.id, "rejected");
                          }}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {match.status === "accepted" && (
                      <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
