import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageSquare, 
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Target,
  ArrowUpRight,
  Filter,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const ClientDashboardMainMockup = () => {
  const navigate = useNavigate();
  
  // Mock data
  const stats = {
    totalRecruits: 47,
    pendingRecruits: 8,
    acceptedRecruits: 32,
    declinedRecruits: 7,
    thisWeek: 5,
    thisMonth: 12,
    responseRate: 68,
    avgResponseTime: "2.4 hours"
  };

  const recentRecruits = [
    {
      id: "1",
      name: "Sarah Johnson",
      type: "Real Estate Agent",
      location: "Austin, TX",
      transactions: 24,
      volume: 4800000,
      experience: 5,
      status: "pending",
      matchScore: 94,
      receivedAt: "2 hours ago",
      phone: "(512) 555-0123",
      email: "sarah.j@realty.com",
      bidAmount: 175,
      motivation: "High",
      lookingFor: "Better splits, more support"
    },
    {
      id: "2",
      name: "Michael Chen",
      type: "Real Estate Agent",
      location: "Dallas, TX",
      transactions: 18,
      volume: 3600000,
      experience: 3,
      status: "accepted",
      matchScore: 89,
      receivedAt: "5 hours ago",
      phone: "(214) 555-0456",
      email: "mchen@homes.com",
      bidAmount: 150,
      motivation: "Medium",
      lookingFor: "Training programs"
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      type: "Real Estate Agent",
      location: "Houston, TX",
      transactions: 31,
      volume: 6200000,
      experience: 8,
      status: "pending",
      matchScore: 96,
      receivedAt: "1 day ago",
      phone: "(713) 555-0789",
      email: "emily.r@properties.com",
      bidAmount: 200,
      motivation: "High",
      lookingFor: "Lead generation, tech tools"
    },
    {
      id: "4",
      name: "David Park",
      type: "Real Estate Agent",
      location: "San Antonio, TX",
      transactions: 12,
      volume: 2400000,
      experience: 2,
      status: "accepted",
      matchScore: 82,
      receivedAt: "2 days ago",
      phone: "(210) 555-0321",
      email: "dpark@realtygroup.com",
      bidAmount: 150,
      motivation: "High",
      lookingFor: "Mentorship, better brand"
    },
    {
      id: "5",
      name: "Jessica Williams",
      type: "Real Estate Agent",
      location: "Austin, TX",
      transactions: 28,
      volume: 5600000,
      experience: 6,
      status: "declined",
      matchScore: 91,
      receivedAt: "3 days ago",
      phone: "(512) 555-0654",
      email: "jwilliams@luxury.com",
      bidAmount: 175,
      motivation: "Low",
      lookingFor: "Higher commission splits"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "accepted": return "bg-green-500";
      case "declined": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "accepted": return <CheckCircle className="w-4 h-4" />;
      case "declined": return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recruits Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and engage with your recruiting leads</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button 
              className="bg-[#35a87e] hover:bg-[#2d8f6a]"
              onClick={() => navigate("/client")}
            >
              <Target className="w-4 h-4 mr-2" />
              Manage Bids
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total Recruits */}
          <Card className="p-6 border-2 border-[#35a87e]/20 hover:border-[#35a87e]/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#35a87e]/10 rounded-xl">
                <Users className="w-6 h-6 text-[#35a87e]" />
              </div>
              <Badge variant="outline" className="text-xs">All Time</Badge>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Recruits</h3>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-gray-900">{stats.totalRecruits}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-600 font-medium">+{stats.thisWeek} this week</span>
              </div>
            </div>
          </Card>

          {/* Pending */}
          <Card className="p-6 border-2 border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                Pending
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Awaiting Response</h3>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-gray-900">{stats.pendingRecruits}</div>
              <p className="text-xs text-gray-500">Avg response: {stats.avgResponseTime}</p>
            </div>
          </Card>

          {/* Accepted */}
          <Card className="p-6 border-2 border-green-500/20 hover:border-green-500/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                {Math.round((stats.acceptedRecruits / stats.totalRecruits) * 100)}% Rate
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Accepted</h3>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-gray-900">{stats.acceptedRecruits}</div>
              <p className="text-xs text-gray-500">Successfully recruited</p>
            </div>
          </Card>

          {/* This Month */}
          <Card className="p-6 border-2 border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                This Month
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">New Recruits</h3>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-gray-900">{stats.thisMonth}</div>
              <Progress value={24} className="h-2" />
              <p className="text-xs text-gray-500">24% of monthly max (50)</p>
            </div>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search recruits by name, location, or email..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline">All Status</Button>
            <Button variant="outline">All Locations</Button>
            <Button variant="outline">Sort by Match Score</Button>
          </div>
        </Card>

        {/* Recent Recruits List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">Recent Recruits</h3>
              <Badge variant="outline">{recentRecruits.length} Showing</Badge>
            </div>
            <Button variant="outline" size="sm">
              View All
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="space-y-4">
            {recentRecruits.map((recruit) => (
              <Card key={recruit.id} className="p-5 hover:shadow-lg transition-all border-2 hover:border-[#35a87e]/40">
                <div className="flex items-start justify-between gap-4">
                  
                  {/* Left Section - Profile Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#35a87e] to-[#2d8f6a] flex items-center justify-center text-white font-bold text-lg">
                        {recruit.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg text-gray-900 truncate">{recruit.name}</h4>
                          <Badge className={`${getStatusColor(recruit.status)} text-white border-0`}>
                            {getStatusIcon(recruit.status)}
                            <span className="ml-1 capitalize">{recruit.status}</span>
                          </Badge>
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                            <Star className="w-3 h-3 text-yellow-600 fill-yellow-600" />
                            <span className="text-xs font-bold text-yellow-700">{recruit.matchScore}% Match</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{recruit.type}</p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 truncate">{recruit.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{recruit.transactions} transactions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">${(recruit.volume / 1000000).toFixed(1)}M volume</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{recruit.experience} years exp</span>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {recruit.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {recruit.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {recruit.receivedAt}
                      </div>
                    </div>

                    {/* Looking For */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-blue-900 mb-1">Looking for:</p>
                      <p className="text-sm text-blue-700">{recruit.lookingFor}</p>
                    </div>
                  </div>

                  {/* Right Section - Actions & Bid */}
                  <div className="flex flex-col items-end gap-3 ml-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Your Bid</p>
                      <p className="text-2xl font-bold text-[#35a87e]">${recruit.bidAmount}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full">
                      <div className={`w-2 h-2 rounded-full ${
                        recruit.motivation === 'High' ? 'bg-green-500' : 
                        recruit.motivation === 'Medium' ? 'bg-yellow-500' : 
                        'bg-gray-500'
                      }`}></div>
                      <span className="text-xs font-medium text-purple-900">{recruit.motivation} Motivation</span>
                    </div>

                    <div className="flex flex-col gap-2 w-full mt-2">
                      {recruit.status === "pending" && (
                        <>
                          <Button className="bg-[#35a87e] hover:bg-[#2d8f6a] w-full">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accept
                          </Button>
                          <Button variant="outline" className="w-full">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                        </>
                      )}
                      {recruit.status === "accepted" && (
                        <>
                          <Button className="bg-green-600 hover:bg-green-700 w-full">
                            <Phone className="w-4 h-4 mr-2" />
                            Call Now
                          </Button>
                          <Button variant="outline" className="w-full">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                        </>
                      )}
                      {recruit.status === "declined" && (
                        <Button variant="outline" className="w-full" disabled>
                          <XCircle className="w-4 h-4 mr-2" />
                          Declined
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="w-full">
                        View Full Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-6 text-center">
            <Button variant="outline" className="w-full md:w-auto">
              Load More Recruits
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-[#35a87e]/10 to-[#2d8f6a]/10 border-[#35a87e]/30">
            <Target className="w-8 h-8 text-[#35a87e] mb-3" />
            <h3 className="font-semibold text-lg mb-2">Manage Bids</h3>
            <p className="text-sm text-gray-600 mb-4">Create and manage custom bids for specific markets and criteria</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/client")}
            >
              Go to Bids
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
            <MessageSquare className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Start Campaign</h3>
            <p className="text-sm text-gray-600 mb-4">Launch SMS or email campaigns to engage with recruits</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/client-campaigns")}
            >
              Create Campaign
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300">
            <DollarSign className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-lg mb-2">View Billing</h3>
            <p className="text-sm text-gray-600 mb-4">Check your credits balance and manage payments</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/client-billing")}
            >
              Go to Billing
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardMainMockup;
