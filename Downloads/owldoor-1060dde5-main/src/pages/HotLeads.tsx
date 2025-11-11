import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, Mail, Video, Calendar, MapPin, Flame, Zap, Target, TrendingUp, Users, Clock, Eye, ExternalLink, Briefcase, DollarSign, Award, Building } from "lucide-react";
import Papa from "papaparse";

interface HotLead {
  Priority_Rank: string;
  Urgency_Score: string;
  Priority_Level: string;
  Full_Name: string;
  First_Name: string;
  Phone_Formatted: string;
  Current_Brokerage: string;
  Profile_URL: string;
  Meeting_Preference: string;
  Motivation_Score: string;
  What_They_Want: string;
  Top_Priority: string;
  Key_Motivators: string;
  Suggested_Pitch: string;
  Next_Action: string;
  Email_Template: string;
  Call_Script_Focus: string;
}

export default function HotLeads() {
  const [leads, setLeads] = useState<HotLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<HotLead | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  useEffect(() => {
    fetch("/data/hot-leads.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setLeads(results.data as HotLead[]);
            setLoading(false);
          },
        });
      });
  }, []);

  const immediateLeads = leads.filter((lead) =>
    lead.Priority_Level?.includes("IMMEDIATE")
  );
  const highLeads = leads.filter((lead) => lead.Priority_Level?.includes("HIGH"));
  const mediumLeads = leads.filter((lead) =>
    lead.Priority_Level?.includes("MEDIUM")
  );

  const getPriorityIcon = (level: string) => {
    if (level?.includes("IMMEDIATE")) return <Flame className="h-5 w-5 text-destructive" />;
    if (level?.includes("HIGH")) return <Zap className="h-5 w-5 text-warning" />;
    return <Target className="h-5 w-5 text-primary" />;
  };

  const getPriorityColor = (level: string) => {
    if (level?.includes("IMMEDIATE")) return "destructive";
    if (level?.includes("HIGH")) return "warning";
    return "secondary";
  };

  const getMeetingIcon = (preference: string) => {
    if (preference?.includes("Office")) return <MapPin className="h-4 w-4" />;
    if (preference?.includes("Zoom")) return <Video className="h-4 w-4" />;
    return <Phone className="h-4 w-4" />;
  };

  const openLeadModal = (lead: HotLead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse">Loading hot leads...</div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-8 text-primary-foreground">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Flame className="h-10 w-10 animate-pulse" />
          Hot Leads Dashboard
        </h1>
        <p className="text-lg opacity-90">
          {leads.length} agents actively looking to join your team
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                  Immediate Action
                </p>
                <p className="text-4xl font-bold text-destructive mt-2">
                  {immediateLeads.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Contact today
                </p>
              </div>
              <Flame className="h-12 w-12 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-gradient-to-br from-warning/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                  High Priority
                </p>
                <p className="text-4xl font-bold text-warning mt-2">
                  {highLeads.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Within 24 hours
                </p>
              </div>
              <Zap className="h-12 w-12 text-warning opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                  Total Leads
                </p>
                <p className="text-4xl font-bold text-primary mt-2">{leads.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Active prospects</p>
              </div>
              <Users className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                  Avg Motivation
                </p>
                <p className="text-4xl font-bold text-accent mt-2">
                  {(
                    leads.reduce(
                      (sum, lead) => sum + parseInt(lead.Motivation_Score || "0"),
                      0
                    ) / leads.length
                  ).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Out of 10</p>
              </div>
              <TrendingUp className="h-12 w-12 text-accent opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Immediate Action Section */}
      {immediateLeads.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="bg-destructive/5">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Flame className="h-6 w-6 animate-pulse" />
              🔥 IMMEDIATE - Contact Today ({immediateLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {immediateLeads.map((lead, idx) => (
                <Card key={idx} className="border-destructive/20 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{lead.Full_Name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {lead.Current_Brokerage}
                        </p>
                      </div>
                      <Badge variant="destructive" className="animate-pulse">
                        Score: {lead.Urgency_Score}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      {getMeetingIcon(lead.Meeting_Preference)}
                      <span className="font-medium">{lead.Meeting_Preference}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-primary">
                        {lead.Top_Priority}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {lead.Key_Motivators}
                      </p>
                    </div>

                    <div className="bg-accent/10 p-3 rounded-lg">
                      <p className="text-xs font-semibold text-accent mb-1">
                        📋 Suggested Pitch:
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.Suggested_Pitch}
                      </p>
                    </div>

                    <div className="bg-primary/10 p-3 rounded-lg">
                      <p className="text-xs font-semibold text-primary mb-1">
                        ✅ Next Action:
                      </p>
                      <p className="text-xs text-muted-foreground">{lead.Next_Action}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => openLeadModal(lead)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Lead
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(lead.Profile_URL, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Profile
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      <p>
                        <strong>What they want:</strong> {lead.What_They_Want}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* High Priority Section */}
      {highLeads.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader className="bg-warning/5">
            <CardTitle className="flex items-center gap-2 text-warning">
              <Zap className="h-6 w-6" />
              ⚡ HIGH - Contact Within 24 Hours ({highLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {highLeads.map((lead, idx) => (
                <Card key={idx} className="border-warning/20 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{lead.Full_Name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {lead.Current_Brokerage}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-warning/20 text-warning">
                        Score: {lead.Urgency_Score}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      {getMeetingIcon(lead.Meeting_Preference)}
                      <span className="font-medium">{lead.Meeting_Preference}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-primary">
                        {lead.Top_Priority}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {lead.Suggested_Pitch}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => openLeadModal(lead)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Lead
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(lead.Profile_URL, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medium Priority Section */}
      {mediumLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6" />
              📍 MEDIUM - Contact Within 48 Hours ({mediumLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {mediumLeads.map((lead, idx) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{lead.Full_Name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {lead.Current_Brokerage}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm font-semibold">{lead.Top_Priority}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => openLeadModal(lead)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(`tel:${lead.Phone_Formatted}`)}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>

    {/* Lead Detail Modal */}
    <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            {getPriorityIcon(selectedLead?.Priority_Level || "")}
            {selectedLead?.Full_Name || "Lead Details"}
          </DialogTitle>
        </DialogHeader>
        
        {selectedLead && (
          <div className="space-y-6">
            {/* Priority & Score */}
            <div className="flex gap-3">
              <Badge 
                variant={selectedLead.Priority_Level?.includes("IMMEDIATE") ? "destructive" : "secondary"}
                className="text-sm px-3 py-1"
              >
                {selectedLead.Priority_Level}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1">
                Urgency: {selectedLead.Urgency_Score}/10
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1">
                Motivation: {selectedLead.Motivation_Score}/10
              </Badge>
            </div>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a 
                      href={`tel:${selectedLead.Phone_Formatted}`}
                      className="text-lg font-semibold text-primary hover:underline flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      {selectedLead.Phone_Formatted}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">First Name</p>
                    <p className="text-lg font-semibold">{selectedLead.First_Name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Situation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Current Situation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Current Brokerage</p>
                  <p className="text-lg font-semibold">{selectedLead.Current_Brokerage}</p>
                </div>
                {selectedLead.Profile_URL && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedLead.Profile_URL, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    View Public Profile
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Meeting Preference */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Meeting Preference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                  {getMeetingIcon(selectedLead.Meeting_Preference)}
                  <span className="font-semibold">{selectedLead.Meeting_Preference}</span>
                </div>
              </CardContent>
            </Card>

            {/* What They Want */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  What They're Looking For
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Requested Features</p>
                  <p className="text-base">{selectedLead.What_They_Want}</p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-primary mb-1">
                    Top Priority:
                  </p>
                  <p className="text-base font-semibold">{selectedLead.Top_Priority}</p>
                </div>
              </CardContent>
            </Card>

            {/* Motivators & Psychology */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Key Motivators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed">{selectedLead.Key_Motivators}</p>
              </CardContent>
            </Card>

            {/* Pitch Strategy */}
            <Card className="border-accent/50 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-accent">
                  <Award className="h-5 w-5" />
                  Suggested Pitch Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base font-medium">{selectedLead.Suggested_Pitch}</p>
              </CardContent>
            </Card>

            {/* Action Plan */}
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Zap className="h-5 w-5" />
                  Next Action
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-background p-4 rounded-lg">
                  <p className="text-base font-semibold mb-2">{selectedLead.Next_Action}</p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Call Script Focus:</strong> {selectedLead.Call_Script_Focus}
                  </p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    <strong>Email Template:</strong>
                  </p>
                  <p className="text-sm">{selectedLead.Email_Template}</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                size="lg" 
                className="flex-1"
                onClick={() => window.open(`tel:${selectedLead.Phone_Formatted}`)}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="flex-1"
                onClick={() => window.open(selectedLead.Profile_URL, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
