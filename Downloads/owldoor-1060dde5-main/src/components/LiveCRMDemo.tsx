import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  Building2, 
  Trophy, 
  DollarSign, 
  TrendingUp, 
  Star,
  Search,
  Filter,
  CheckCircle2,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Activity {
  id: string;
  type: 'team' | 'office' | 'lender';
  agent: string;
  entity: string;
  benefits: string[];
  timestamp: Date;
}

interface Entity {
  name: string;
  location: string;
  split: string;
  leads: string;
  rating: string;
  type: 'team' | 'office' | 'lender';
}

const stats = [
  { icon: Users, label: "Active Agents", value: "1,247", color: "text-primary" },
  { icon: Building2, label: "Partner Offices", value: "89", color: "text-primary" },
  { icon: Trophy, label: "Top Teams", value: "156", color: "text-primary" },
  { icon: Briefcase, label: "Lender Partners", value: "43", color: "text-primary" },
  { icon: CheckCircle2, label: "Matches Today", value: "328", color: "text-primary" },
  { icon: TrendingUp, label: "Success Rate", value: "92%", color: "text-primary" },
];

const teams: Entity[] = [
  { name: 'Keller Williams Elite', location: 'San Francisco, CA', split: '90/10', leads: '50+/mo', rating: '4.9', type: 'team' },
  { name: 'RE/MAX Champions', location: 'Los Angeles, CA', split: '85/15', leads: '40+/mo', rating: '4.8', type: 'team' },
  { name: 'Coldwell Banker Pro', location: 'San Diego, CA', split: '80/20', leads: '60+/mo', rating: '4.7', type: 'team' },
  { name: 'Century 21 Masters', location: 'Oakland, CA', split: '90/10', leads: '35+/mo', rating: '4.9', type: 'team' },
];

const offices: Entity[] = [
  { name: 'Berkshire Hathaway HomeServices', location: 'Palo Alto, CA', split: '70/30', leads: '30+/mo', rating: '4.8', type: 'office' },
  { name: "Sotheby's International", location: 'Beverly Hills, CA', split: '75/25', leads: '25+/mo', rating: '4.9', type: 'office' },
  { name: 'Douglas Elliman', location: 'Miami, FL', split: '80/20', leads: '40+/mo', rating: '4.7', type: 'office' },
];

const lenders: Entity[] = [
  { name: 'Wells Fargo Home Mortgage', location: 'National', split: 'Referral', leads: 'Unlimited', rating: '4.6', type: 'lender' },
  { name: 'Chase Home Lending', location: 'California', split: 'Referral', leads: 'Unlimited', rating: '4.5', type: 'lender' },
  { name: 'Quicken Loans', location: 'National', split: 'Referral', leads: 'Unlimited', rating: '4.8', type: 'lender' },
];

const activityTemplates = [
  { 
    type: 'team' as const,
    main: 'Agent matched to Top Team!',
    benefits: ['Leads Provided', 'CRM Access', 'Coaching', '90/10 Split']
  },
  { 
    type: 'office' as const,
    main: 'Office placement confirmed',
    benefits: ['Desk Space', 'Marketing Support', 'Training']
  },
  { 
    type: 'lender' as const,
    main: 'Lender partnership established',
    benefits: ['Referral Program', 'Commission', 'Support']
  },
];

const agentNames = ['Sarah M.', 'John D.', 'Lisa K.', 'Mike R.', 'Emma W.', 'David L.'];
const teamNames = ['Keller Williams Elite', 'RE/MAX Champions', 'Compass Group', 'Century 21'];

export const LiveCRMDemo = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'teams' | 'offices' | 'lenders'>('teams');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  useEffect(() => {
    setMounted(true);
    
    const generateActivity = () => {
      const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
      const agent = agentNames[Math.floor(Math.random() * agentNames.length)];
      const entity = teamNames[Math.floor(Math.random() * teamNames.length)];
      
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: template.type,
        agent,
        entity,
        benefits: template.benefits,
        timestamp: new Date(),
      };

      setActivities(prev => [newActivity, ...prev].slice(0, 8));
    };

    generateActivity();
    const interval = setInterval(generateActivity, 4000);
    return () => clearInterval(interval);
  }, []);

  const getEntityList = () => {
    switch (activeTab) {
      case 'teams': return teams;
      case 'offices': return offices;
      case 'lenders': return lenders;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'team': return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
      case 'office': return 'border-emerald-600 bg-emerald-100 dark:bg-emerald-900/20';
      case 'lender': return 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20';
      default: return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'team': return Trophy;
      case 'office': return Building2;
      case 'lender': return DollarSign;
      default: return Users;
    }
  };

  if (!mounted) return null;

  return (
    <div className="py-8 md:py-16 px-4 bg-gradient-to-br from-emerald-50 via-background to-emerald-100 dark:from-emerald-950/20 dark:via-background dark:to-emerald-900/20 relative overflow-hidden">
      {/* Animated background shapes */}
      <motion.div 
        className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-emerald-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-32 md:w-64 h-32 md:h-64 bg-emerald-500/10 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 mb-6 md:mb-8">{stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="p-3 md:p-4 text-center hover:shadow-lg transition-all hover:-translate-y-1 border-t-4 border-t-emerald-500 bg-white dark:bg-background">
              <div className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wide mt-1">
                {stat.label}
              </div>
            </Card>
          </motion.div>
        ))}
        </div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Activity Feed */}
          <Card className="p-4 md:p-6 border-2 border-emerald-500/20 lg:col-span-1 bg-white dark:bg-background">
            <div className="flex items-center justify-between mb-4 md:mb-6 pb-3 md:pb-4 border-b-2 border-emerald-500/20">
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-xl font-bold text-emerald-700 dark:text-emerald-400">Live Matching Activity</h3>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
              <Button variant="ghost" size="sm" className="hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                <Filter className="h-4 w-4 text-emerald-600" />
              </Button>
            </div>

            <div className="space-y-2 md:space-y-3 max-h-[400px] md:max-h-[500px] overflow-y-auto pr-2">
              <AnimatePresence>
                {activities.map((activity) => {
                  const Icon = getTypeIcon(activity.type);
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onClick={() => setSelectedActivity(activity)}
                      className={`p-3 md:p-4 rounded-lg border-l-4 ${getTypeColor(activity.type)} transition-all hover:translate-x-2 cursor-pointer hover:shadow-md`}
                    >
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs md:text-sm mb-1">
                            <span className="text-emerald-700 dark:text-emerald-400">{activity.agent}</span> matched with <span className="text-emerald-700 dark:text-emerald-400">{activity.entity}</span>
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {activity.benefits.map((benefit, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px] md:text-xs bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                                {benefit}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </Card>

          {/* Entity List */}
          <Card className="p-4 md:p-6 border-2 border-emerald-500/20 lg:col-span-2 bg-white dark:bg-background">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-base md:text-xl font-bold text-emerald-700 dark:text-emerald-400">Teams & Offices Seeking Agents</h3>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto">
              {['teams', 'offices', 'lenders'].map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`capitalize text-xs md:text-sm whitespace-nowrap ${
                    activeTab === tab 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                      : 'border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                  }`}
                >
                  {tab}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-4 md:mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams, offices, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500"
              />
            </div>

            {/* Table */}
            <div className="space-y-2 max-h-[350px] md:max-h-[450px] overflow-y-auto">
              {getEntityList().map((entity, idx) => (
                <motion.div
                  key={entity.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="grid grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-500 transition-all hover:translate-x-2"
                >
                  <div className="col-span-12 md:col-span-4 flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs md:text-sm">
                      {entity.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-xs md:text-sm">{entity.name}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">{entity.location}</p>
                    </div>
                  </div>
                  <div className="col-span-4 md:col-span-2 flex items-center">
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] md:text-xs">
                      {entity.split}
                    </Badge>
                  </div>
                  <div className="col-span-4 md:col-span-2 flex items-center">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] md:text-xs">
                      {entity.leads}
                    </Badge>
                  </div>
                  <div className="col-span-4 md:col-span-2 flex items-center gap-1 text-yellow-500 font-bold text-xs md:text-sm">
                    <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-500" />
                    {entity.rating}
                  </div>
                  <div className="col-span-12 md:col-span-2 flex items-center gap-2 mt-2 md:mt-0">
                    <Button size="sm" className="text-[10px] md:text-xs h-7 md:h-8 bg-emerald-500 hover:bg-emerald-600 flex-1 md:flex-initial" onClick={() => setSelectedEntity(entity)}>
                      View Details
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Activity Detail Modal */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[500px] bg-white dark:bg-background z-50 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              {selectedActivity && (() => {
                const Icon = getTypeIcon(selectedActivity.type);
                return (
                  <>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                      <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                    <span className="text-base md:text-lg">
                      {selectedActivity.type === 'lender' ? 'Lender Partnership Match!' : 
                       selectedActivity.type === 'office' ? 'Premium Office Match!' : 
                       'Team Match!'}
                    </span>
                  </>
                );
              })()}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {selectedActivity?.type === 'lender' ? 'Premium mortgage partner connection' : 
               selectedActivity?.type === 'office' ? 'Exclusive office opportunity available' : 
               'Top team opportunity'}
            </DialogDescription>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-3 md:space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3 md:gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Agent</label>
                  <p className="text-sm md:text-lg font-bold text-emerald-700 dark:text-emerald-400">{selectedActivity.agent}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {selectedActivity.type === 'lender' ? 'Lender' : selectedActivity.type === 'office' ? 'Office' : 'Team'}
                  </label>
                  <p className="text-sm md:text-lg font-bold text-emerald-700 dark:text-emerald-400">{selectedActivity.entity}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {selectedActivity.type === 'lender' ? 'Partnership Benefits:' : 'Benefits Included:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedActivity.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs md:text-sm text-emerald-700 dark:text-emerald-400">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-xs md:text-sm">
                  {selectedActivity.type === 'lender' ? 'Start Partnership' : 'Apply Now'}
                </Button>
                <Button variant="outline" className="flex-1 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-xs md:text-sm">
                  View Terms
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Entity Detail Modal */}
      <Dialog open={!!selectedEntity} onOpenChange={() => setSelectedEntity(null)}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] bg-white dark:bg-background z-50 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
              {selectedEntity && (
                <>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm md:text-base">
                    {selectedEntity.name.substring(0, 2)}
                  </div>
                  <span className="text-base md:text-lg">{selectedEntity.name}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Complete profile and opportunities
            </DialogDescription>
          </DialogHeader>
          {selectedEntity && (
            <div className="space-y-3 md:space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                  <label className="text-xs font-semibold text-muted-foreground">Location</label>
                  <p className="font-medium text-xs md:text-sm">{selectedEntity.location}</p>
                </div>
                <div className="space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                  <label className="text-xs font-semibold text-muted-foreground">Type</label>
                  <Badge className="capitalize bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs">{selectedEntity.type}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2 p-3 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg">
                  <label className="text-xs font-semibold text-muted-foreground">Commission Split</label>
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm md:text-base">
                    {selectedEntity.split}
                  </Badge>
                </div>
                <div className="space-y-2 p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-lg">
                  <label className="text-xs font-semibold text-muted-foreground">Monthly Leads</label>
                  <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm md:text-base">
                    {selectedEntity.leads}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 rounded-lg">
                <label className="text-xs font-semibold text-muted-foreground">Rating</label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 md:h-5 md:w-5 ${i < Math.floor(parseFloat(selectedEntity.rating)) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-base md:text-lg font-bold text-yellow-600">{selectedEntity.rating}</span>
                </div>
              </div>
              <div className="pt-2 flex gap-2">
                <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-xs md:text-sm">Schedule Tour</Button>
                <Button variant="outline" className="flex-1 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-xs md:text-sm">Learn More</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
