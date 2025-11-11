import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  MapPin, Users, TrendingUp, Share2, Building, Phone, Mail, Globe,
  ChevronRight, Zap, Award, Sparkles, GraduationCap, BarChart, Handshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import owlDoorLogo from "@/assets/owldoor-logo-new.png";

interface Client {
  id: string;
  company_name: string;
  city?: string;
  state?: string;
  client_type: string;
  team_size?: number;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
}

export default function PublicClientProfile() {
  const { clientId } = useParams<{ clientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${client?.company_name} - OwlDoor`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!client) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-bold mb-2">Company Not Found</h2><Button onClick={() => navigate('/')}>Go Home</Button></div></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img src={owlDoorLogo} alt="OwlDoor" className="h-10" />
            </div>
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />Share
            </Button>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 rounded-2xl bg-card flex items-center justify-center text-primary font-bold text-3xl border-4 border-primary-foreground shadow-xl">
              {client.company_name?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{client.company_name}</h1>
              <Badge variant="secondary" className="mb-2">{client.client_type === 'real_estate' ? 'Real Estate Brokerage' : 'Mortgage Lender'}</Badge>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{client.city}, {client.state}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4" /><span>{client.team_size || 1} Team Member{(client.team_size || 1) > 1 ? 's' : ''}</span></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {client.description && (
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-primary" />About Us</CardTitle></CardHeader><CardContent><p className="text-muted-foreground leading-relaxed">{client.description}</p></CardContent></Card>
            )}

            <Card><CardHeader><CardTitle>What We Offer</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: TrendingUp, title: 'Competitive Splits', desc: 'Industry-leading commission structures' },
                { icon: BarChart, title: 'Advanced Technology', desc: 'Access to cutting-edge real estate tools' },
                { icon: GraduationCap, title: 'Training Programs', desc: 'Continuous professional development' },
                { icon: Award, title: 'Marketing Support', desc: 'Professional branding and lead generation' },
                { icon: Handshake, title: 'Mentorship', desc: 'Guidance from experienced professionals' },
                { icon: Sparkles, title: 'Growth Opportunities', desc: 'Clear paths to advancement and success' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 mb-2"><item.icon className="w-5 h-5 text-primary" /><h4 className="font-semibold">{item.title}</h4></div>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div></CardContent></Card>

            {client.city && (
              <Card><CardHeader><CardTitle>Coverage Areas</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2"><Badge variant="secondary">{client.city}</Badge></div><Separator className="my-4" /><h4 className="font-semibold mb-3">States</h4><Badge variant="secondary">{client.state}</Badge></CardContent></Card>
            )}

            <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"><CardContent className="pt-6 text-center"><h3 className="text-2xl font-bold mb-2">Ready to Join?</h3><p className="mb-6 opacity-90">Apply now and take the next step in your real estate career</p><Button size="lg" className="bg-card text-foreground hover:bg-card/90">Apply Now</Button></CardContent></Card>
          </div>

          <div className="space-y-6">
            <Card><CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader><CardContent className="space-y-4">
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Total Sales</span><span className="text-lg font-bold">$10M</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Avg. Sale Price</span><span className="text-lg font-bold">$1.2M</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Years Experience</span><span className="text-lg font-bold">2 Years</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Team Members</span><span className="text-lg font-bold">{client.team_size || 1}</span></div>
            </CardContent></Card>

            <Card><CardHeader><CardTitle>Contact Information</CardTitle></CardHeader><CardContent className="space-y-3">
              {client.website_url && <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/20 transition-colors"><Globe className="w-5 h-5" /><span>Website</span><ChevronRight className="w-4 h-4 ml-auto" /></a>}
              {client.contact_email && <a href={`mailto:${client.contact_email}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/20 transition-colors"><Mail className="w-5 h-5" /><span>Email</span><ChevronRight className="w-4 h-4 ml-auto" /></a>}
              {client.contact_phone && <a href={`tel:${client.contact_phone}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/20 transition-colors"><Phone className="w-5 h-5" /><span>Phone</span><ChevronRight className="w-4 h-4 ml-auto" /></a>}
              <Button variant="outline" className="w-full justify-start gap-2"><MapPin className="w-4 h-4" />Get Directions</Button>
            </CardContent></Card>
          </div>
        </div>
      </div>
    </div>
  );
}
