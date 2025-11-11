import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Calendar,
  Zap,
  ArrowUpRight,
  Target
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ClientDashboardMockup = () => {
  const navigate = useNavigate();
  // Mock data
  const packageData = {
    name: "VIP OwlDoor",
    type: "Non-Exclusive",
    monthlyCost: 150,
    status: "active",
    renewalDate: "Dec 5, 2025",
    includesBids: true,
    baseRecruitPrice: 150,
    maxRecruitsPerMonth: 50
  };

  const creditsData = {
    balance: 1250.00, // Dollar amount
    thisMonth: {
      added: 500,
      used: 450,
      refunded: 0
    }
  };

  const recruitsData = {
    received: 12,
    maxPerMonth: packageData.maxRecruitsPerMonth,
    percentUsed: 24,
    thisMonth: 12,
    pending: 3,
    totalCost: 1800 // 12 × $150
  };

  const bidsData = packageData.includesBids ? [
    {
      id: "1",
      location: "Austin, TX",
      bidAmount: 175,
      status: "active",
      recruitsThisMonth: 3
    },
    {
      id: "2", 
      location: "Dallas, TX",
      bidAmount: 150,
      status: "active",
      recruitsThisMonth: 5
    }
  ] : [];

  const smsData = {
    included: 500,
    used: 247,
    remaining: 253,
    additionalCost: 10
  };

  const billingData = {
    currentMonthSpend: 2200,
    spendLimit: 5000,
    nextBilling: 150,
    lastPayment: "Nov 5, 2025"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing & Credits</h1>
            <p className="text-gray-600 mt-1">Manage your account, credits, and billing</p>
          </div>
        </div>

        {/* Current Package Banner */}
        <Card className="bg-gradient-to-r from-[#35a87e] to-[#2d8f6a] text-white p-6 border-0">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{packageData.name}</h2>
                <Badge className="bg-white/20 text-white border-white/30">
                  {packageData.type}
                </Badge>
                <Badge className="bg-green-500 text-white border-0">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {packageData.status}
                </Badge>
                {packageData.includesBids && (
                  <Badge className="bg-blue-500 text-white border-0">
                    <Target className="w-3 h-3 mr-1" />
                    Bids Enabled
                  </Badge>
                )}
              </div>
              <p className="text-white/90 text-lg">${packageData.monthlyCost}/month • Base: ${packageData.baseRecruitPrice} per recruit</p>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Calendar className="w-4 h-4" />
                Renews on {packageData.renewalDate}
              </div>
            </div>
            <Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
              View Details
            </Button>
          </div>
        </Card>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Credits Balance Card */}
          <Card className="p-6 border-2 border-[#35a87e]/20 hover:border-[#35a87e]/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#35a87e]/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-[#35a87e]" />
              </div>
              <Badge variant="outline" className="text-xs">Balance</Badge>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Credits Balance</h3>
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">${creditsData.balance.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500">
                Available for refunds, gifts & recruiting
              </p>
              <div className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded">
                <AlertCircle className="w-3 h-3 text-blue-600" />
                <span className="text-blue-600">Load balance anytime</span>
              </div>
            </div>
          </Card>

          {/* Recruits Card */}
          <Card className="p-6 border-2 border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                {recruitsData.percentUsed}% Used
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Recruits This Month</h3>
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">{recruitsData.received}</span>
                <span className="text-lg text-gray-500">/ {recruitsData.maxPerMonth}</span>
              </div>
              <Progress value={recruitsData.percentUsed} className="h-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{recruitsData.pending} pending matches</span>
                <span className="text-green-600 font-medium">+3 this week</span>
              </div>
            </div>
          </Card>

          {/* SMS Card - Only show if > 0 */}
          {smsData.remaining > 0 && (
            <Card className="p-6 border-2 border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <Badge variant="outline" className="text-xs text-purple-600 border-purple-600">
                  {Math.round((smsData.used / smsData.included) * 100)}% Used
                </Badge>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">SMS Messages</h3>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">{smsData.remaining}</span>
                  <span className="text-lg text-gray-500">left</span>
                </div>
                <Progress value={(smsData.used / smsData.included) * 100} className="h-2" />
                <p className="text-xs text-gray-500">
                  {smsData.used} used of {smsData.included} included
                </p>
              </div>
            </Card>
          )}

          {/* Billing Card */}
          <Card className="p-6 border-2 border-green-500/20 hover:border-green-500/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                Auto-Pay On
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Current Month Spend</h3>
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">${billingData.currentMonthSpend}</span>
                <span className="text-lg text-gray-500">/ ${billingData.spendLimit}</span>
              </div>
              <Progress value={(billingData.currentMonthSpend / billingData.spendLimit) * 100} className="h-2" />
              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  Next billing: ${billingData.nextBilling} on {packageData.renewalDate}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Active Bids Section */}
        {packageData.includesBids && bidsData.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">Active Bids</h3>
              <Badge variant="outline">{bidsData.length} Active</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bidsData.map((bid) => (
                <div key={bid.id} className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-blue-500/40 transition-colors">
                  <div>
                    <p className="font-medium">{bid.location}</p>
                    <p className="text-sm text-gray-600">{bid.recruitsThisMonth} recruits this month</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-blue-600">${bid.bidAmount}</p>
                    <Badge variant="default" className="text-xs mt-1">
                      {bid.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* How It Works */}
          <Card className="p-6 col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#35a87e]/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-[#35a87e]" />
              </div>
              <h3 className="font-semibold text-lg">How It Works</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#35a87e] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">$</div>
                <div>
                  <p className="font-medium text-sm">Credits = Dollar Balance</p>
                  <p className="text-xs text-gray-600">Your credits balance is ${creditsData.balance.toFixed(2)} - use for refunds, gifts, or recruiting</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-medium text-sm">Base Cost Per Recruit</p>
                  <p className="text-xs text-gray-600">${packageData.baseRecruitPrice} per recruiting lead (pros ready for matching)</p>
                </div>
              </div>
              {packageData.includesBids && (
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    <Target className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Bids Enabled</p>
                    <p className="text-xs text-gray-600">Set custom amounts for specific markets to compete for top recruits</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-medium text-sm">Monthly Cap</p>
                  <p className="text-xs text-gray-600">Maximum of {recruitsData.maxPerMonth} recruits per month to maintain quality</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Current Month Breakdown */}
          <Card className="p-6 col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">This Month's Activity</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">Base Subscription</span>
                <span className="font-semibold">${packageData.monthlyCost}.00</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">Recruits ({recruitsData.received})</span>
                <span className="font-semibold">${recruitsData.totalCost}.00</span>
              </div>
              {smsData.remaining > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">SMS Overages</span>
                  <span className="font-semibold">$0.00</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">AI Usage</span>
                <span className="font-semibold">$50.00</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3 -mx-3">
                <span className="font-semibold">Total This Month</span>
                <span className="font-bold text-xl text-[#35a87e]">${billingData.currentMonthSpend}.00</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <Button 
                className="w-full justify-between bg-[#35a87e] hover:bg-[#2d8f6a]"
                onClick={() => navigate("/client-billing")}
              >
                Add Credits Balance
                <ArrowUpRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => navigate("/client-recruits")}
              >
                View All Recruits
                <ArrowUpRight className="w-4 h-4" />
              </Button>
              {packageData.includesBids && (
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => navigate("/client")}
                >
                  Manage Bids
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => navigate("/client-billing")}
              >
                Billing History
                <ArrowUpRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => navigate("/client-billing")}
              >
                Update Payment Method
                <ArrowUpRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => navigate("/support")}
              >
                Contact Support
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-blue-900">Need Help?</p>
                  <p className="text-xs text-blue-700 mt-1">Contact support to optimize your package for your business needs</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Understanding Your Account</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-medium mb-1">💰 Credits = Dollars:</p>
                  <p className="text-xs">Your credits balance (${creditsData.balance.toFixed(2)}) is a dollar amount for refunds, gifting, and keeping a balance for recruiting.</p>
                </div>
                <div>
                  <p className="font-medium mb-1">👥 Recruits:</p>
                  <p className="text-xs">Base cost is ${packageData.baseRecruitPrice} per recruiting lead (pros ready for matching). {packageData.includesBids ? "Use bids to compete in specific markets." : ""}</p>
                </div>
                <div>
                  <p className="font-medium mb-1">📊 Monthly Spend Cap:</p>
                  <p className="text-xs">Your account has a ${billingData.spendLimit} monthly maximum to prevent unexpected charges. Adjust in settings.</p>
                </div>
                {smsData.remaining > 0 && (
                  <div>
                    <p className="font-medium mb-1">📱 SMS Included:</p>
                    <p className="text-xs">Your package includes {smsData.included} SMS messages per month for recruit communication and campaigns.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboardMockup;
