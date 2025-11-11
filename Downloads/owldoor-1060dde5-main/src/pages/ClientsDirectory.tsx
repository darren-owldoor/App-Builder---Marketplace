import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  MapPin,
  Building,
  Home,
  DollarSign,
  Grid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Client {
  id: string;
  company_name: string;
  logo_url?: string;
  city?: string | null;
  state?: string | null;
  client_type: 'real_estate' | 'mortgage';
  team_size?: number;
  commission_split_max?: number;
  description?: string;
  created_at: string;
}

export default function ClientsDirectory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [clientType, setClientType] = useState<'all' | 'real_estate' | 'mortgage'>(
    (searchParams.get('type') as any) || 'all'
  );

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, clientType, clients]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.company_name.toLowerCase().includes(searchLower) ||
          c.city?.toLowerCase().includes(searchLower) ||
          c.state?.toLowerCase().includes(searchLower)
      );
    }

    if (clientType !== 'all') {
      filtered = filtered.filter((c) => c.client_type === clientType);
    }

    setFilteredClients(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="text-3xl">🦉</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">OwlDoor</h1>
                <p className="text-sm text-gray-600">Company Directory</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!user ? (
                <>
                  <Button variant="outline" onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate('/agent-signup')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Join as Agent
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate('/dashboard')}>Dashboard</Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find Your Perfect{' '}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Brokerage or Lender
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Browse {filteredClients.length} companies
          </p>

          <div className="max-w-3xl mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by company name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg rounded-xl shadow-lg border-2 focus:border-green-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <Button
              variant={clientType === 'all' ? 'default' : 'outline'}
              onClick={() => setClientType('all')}
              className="gap-2"
            >
              <Building className="w-4 h-4" />
              All Companies
            </Button>
            <Button
              variant={clientType === 'real_estate' ? 'default' : 'outline'}
              onClick={() => setClientType('real_estate')}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Real Estate
            </Button>
            <Button
              variant={clientType === 'mortgage' ? 'default' : 'outline'}
              onClick={() => setClientType('mortgage')}
              className="gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Mortgage
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-700">
            <span className="font-semibold">{filteredClients.length}</span> companies found
          </p>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <Card className="p-12 text-center">
            <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No companies found
            </h3>
            <Button onClick={() => { setSearch(''); setClientType('all'); }} variant="outline">
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card
                key={client.id}
                className="cursor-pointer hover:shadow-xl transition-all"
                onClick={() => navigate(`/client/${client.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                      {client.company_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
                        {client.company_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {client.city && client.state
                            ? `${client.city}, ${client.state}`
                            : client.state || 'Location N/A'}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          client.client_type === 'real_estate'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }
                      >
                        {client.client_type === 'real_estate' ? 'Real Estate' : 'Mortgage'}
                      </Badge>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                    View Details →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
