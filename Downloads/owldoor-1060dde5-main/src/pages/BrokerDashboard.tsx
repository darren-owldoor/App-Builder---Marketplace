import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  TrendingUp,
  MessageSquare,
  Settings,
  CreditCard,
  LayoutDashboard,
  UserPlus,
  LogOut,
  DollarSign,
  Target,
  Activity,
  Menu,
  Bell,
  Filter,
  Download,
  Calendar,
  MapPin,
  PhoneCall,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingDown,
  BarChart3,
  PieChart,
  Award,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";
import owlDoorLogo from "@/assets/owldoor-logo-new.png";
import { formatNumber } from "@/lib/utils";

function BrokerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRecruits: 0,
    activeRecruits: 0,
    creditsBalance: 0,
    monthlySpend: 0,
    newThisWeek: 0,
    newThisMonth: 0,
    conversionRate: 0,
    avgResponseTime: 0,
    totalContacted: 0,
    totalResponded: 0,
    totalInterviews: 0,
    totalHired: 0,
  });
  const [recentRecruits, setRecentRecruits] = useState<any[]>([]);
  const [campaignStats, setCampaignStats] = useState({
    active: 0,
    completed: 0,
    totalSent: 0,
    responseRate: 0,
  });
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, type: 'success', message: 'New agent responded to your campaign', time: '2 min ago' },
    { id: 2, type: 'info', message: '5 new agents match your criteria', time: '1 hour ago' },
    { id: 3, type: 'warning', message: 'Low credits balance - consider topping up', time: '3 hours ago' },
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: clients } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

      const client = clients?.[0];

      if (!client) {
        navigate("/auth");
        return;
      }

      setClientData(client);

      // Get recruit stats - for now use mock data since recruited_by column doesn't exist
      // TODO: Add recruited_by column to pros table or create a separate recruits tracking table
      const totalRecruits = 0;

      setStats({
        totalRecruits,
        activeRecruits: totalRecruits,
        creditsBalance: client.credits_balance || 0,
        monthlySpend: client.current_month_spend || 0,
        newThisWeek: Math.floor(totalRecruits * 0.15), // Mock data
        newThisMonth: Math.floor(totalRecruits * 0.40), // Mock data
        conversionRate: totalRecruits > 0 ? Math.floor(Math.random() * 30 + 20) : 0, // Mock: 20-50%
        avgResponseTime: Math.floor(Math.random() * 12 + 4), // Mock: 4-16 hours
        totalContacted: Math.floor(totalRecruits * 2.5), // Mock data
        totalResponded: Math.floor(totalRecruits * 1.8), // Mock data
        totalInterviews: Math.floor(totalRecruits * 1.2), // Mock data
        totalHired: Math.floor(totalRecruits * 0.6), // Mock data
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Logged out successfully");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/broker" },
    { icon: Users, label: "Recruits", path: "/client-recruits" },
    { icon: MapPin, label: "Market Coverage", path: "/market-coverage" },
    { icon: MessageSquare, label: "Campaigns", path: "/client-campaigns" },
    { icon: CreditCard, label: "Billing", path: "/client-billing" },
    { icon: Settings, label: "Settings", path: "/user-settings" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <img src={owlDoorLogo} alt="OwlDoor" className="h-8" />
          <span className="font-bold text-lg">OwlDoor</span>
        </div>
      </div>

      {/* User Profile */}
      {clientData && (
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={clientData.image_url} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {clientData.company_name?.[0] || "B"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{clientData.company_name}</p>
              <p className="text-xs text-muted-foreground truncate">{clientData.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.path}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex items-center gap-4 p-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back! Here's your overview</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/market-coverage")} variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Add Location
              </Button>
              <Button onClick={() => navigate("/client-recruits")}>
                <UserPlus className="h-4 w-4 mr-2" />
                Find Agents
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Time Range Selector & Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <Tabs value={selectedTimeRange} onValueChange={(v) => setSelectedTimeRange(v as any)} className="w-fit">
              <TabsList>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
                <TabsTrigger value="year">This Year</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-[10px] flex items-center justify-center rounded-full text-destructive-foreground">
                    {notifications.length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Primary Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Recruits</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRecruits}</div>
                <div className="flex items-center text-xs mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">+{stats.newThisMonth}</span>
                  <span className="text-muted-foreground ml-1">this month</span>
                </div>
                <Progress value={75} className="mt-3 h-1" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                <div className="flex items-center text-xs mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">+5.2%</span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
                <Progress value={stats.conversionRate} className="mt-3 h-1" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Credits Balance</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.creditsBalance}</div>
                <div className="flex items-center text-xs mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                  <span className="text-muted-foreground">≈ {Math.floor(stats.creditsBalance / 10)} agents</span>
                </div>
                <Button size="sm" variant="link" className="mt-2 h-auto p-0" onClick={() => navigate("/client-billing")}>
                  Add more credits →
                </Button>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${formatNumber(stats.monthlySpend)}</div>
                <div className="flex items-center text-xs mt-1">
                  <span className="text-muted-foreground">Budget: ${formatNumber(clientData?.monthly_spend_maximum || 0)}</span>
                </div>
                <Progress 
                  value={(stats.monthlySpend / (clientData?.monthly_spend_maximum || 1)) * 100} 
                  className="mt-3 h-1" 
                />
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Contacted
                  <PhoneCall className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{stats.totalContacted}</div>
                <p className="text-xs text-muted-foreground">Agents reached</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Responded
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{stats.totalResponded}</div>
                <p className="text-xs text-muted-foreground">{Math.floor((stats.totalResponded / stats.totalContacted) * 100)}% response rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Interviews
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{stats.totalInterviews}</div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Hired
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{stats.totalHired}</div>
                <p className="text-xs text-muted-foreground">Successfully recruited</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pipeline Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recruitment Pipeline
                  <Button variant="ghost" size="sm">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>Agent status breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium">New Leads</span>
                    </div>
                    <span className="text-sm font-bold">{Math.floor(stats.totalRecruits * 0.3)}</span>
                  </div>
                  <Progress value={30} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-sm font-medium">In Contact</span>
                    </div>
                    <span className="text-sm font-bold">{Math.floor(stats.totalRecruits * 0.25)}</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm font-medium">Interviewing</span>
                    </div>
                    <span className="text-sm font-bold">{Math.floor(stats.totalRecruits * 0.20)}</span>
                  </div>
                  <Progress value={20} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">Hired</span>
                    </div>
                    <span className="text-sm font-bold">{Math.floor(stats.totalRecruits * 0.15)}</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      <span className="text-sm font-medium">Not Interested</span>
                    </div>
                    <span className="text-sm font-bold">{Math.floor(stats.totalRecruits * 0.10)}</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Campaign Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Campaign Performance
                  <Button variant="ghost" size="sm" onClick={() => navigate("/client-campaigns")}>
                    View All
                  </Button>
                </CardTitle>
                <CardDescription>Active outreach campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">Welcome Series</p>
                    <p className="text-sm text-muted-foreground">3-step email sequence</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" className="mb-1">Active</Badge>
                    <p className="text-xs text-muted-foreground">45% open rate</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">SMS Follow-up</p>
                    <p className="text-sm text-muted-foreground">2-step text campaign</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">Paused</Badge>
                    <p className="text-xs text-muted-foreground">67% response</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">Quarterly Check-in</p>
                    <p className="text-sm text-muted-foreground">Monthly nurture</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" className="mb-1">Active</Badge>
                    <p className="text-xs text-muted-foreground">38% engagement</p>
                  </div>
                </div>

                <Button className="w-full" variant="outline" onClick={() => navigate("/client-campaigns")}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create New Campaign
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Top Performers */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Recruits */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Recruits</CardTitle>
                <CardDescription>Latest agents added to your pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Sarah Johnson", role: "Senior Agent", exp: "8 years", status: "Interviewing", location: "Austin, TX", avatar: "" },
                    { name: "Mike Chen", role: "Team Lead", exp: "12 years", status: "In Contact", location: "Seattle, WA", avatar: "" },
                    { name: "Emily Rodriguez", role: "Agent", exp: "5 years", status: "New Lead", location: "Miami, FL", avatar: "" },
                    { name: "David Kim", role: "Senior Agent", exp: "10 years", status: "Hired", location: "Portland, OR", avatar: "" },
                  ].map((recruit, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {recruit.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{recruit.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{recruit.role}</span>
                          <span>•</span>
                          <span>{recruit.exp}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {recruit.location}
                        </div>
                      </div>
                      <Badge variant={
                        recruit.status === "Hired" ? "default" :
                        recruit.status === "Interviewing" ? "secondary" :
                        "outline"
                      }>
                        {recruit.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="outline" onClick={() => navigate("/client-recruits")}>
                  View All Recruits →
                </Button>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>Key metrics and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900 dark:text-green-100">Strong Performance</p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Your conversion rate is 18% above industry average. Keep up the great work!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900 dark:text-blue-100">Top Markets</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Best response rates in Austin (72%), Seattle (68%), and Miami (64%)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-900 dark:text-amber-100">Action Needed</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        12 agents waiting for follow-up. Respond within 24hrs for best results.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-start gap-3">
                    <PieChart className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-purple-900 dark:text-purple-100">ROI Tracking</p>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                        Average cost per hire: $428. 3.2x ROI on recruitment spend.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notif.type === 'success' ? 'bg-green-500' :
                      notif.type === 'warning' ? 'bg-amber-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Getting Started Guide */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Getting Started
              </CardTitle>
              <CardDescription>Complete these steps to maximize your recruiting success</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Set up your profile</p>
                    <p className="text-sm text-muted-foreground">Tell agents about your brokerage</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate("/edit-team-profile")}>
                    Complete
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Browse available agents</p>
                    <p className="text-sm text-muted-foreground">Find agents that match your criteria</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate("/client-recruits")}>
                    Browse
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Launch your first campaign</p>
                    <p className="text-sm text-muted-foreground">Engage agents with automated outreach</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate("/client-campaigns")}>
                    Create
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default BrokerDashboard;
