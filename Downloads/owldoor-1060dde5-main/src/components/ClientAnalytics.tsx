import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { DollarSign, TrendingUp } from "lucide-react";
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from "date-fns";

interface ClientPurchase {
  client_name: string;
  company_name: string;
  total_purchases: number;
  total_amount: number;
}

const ClientAnalytics = () => {
  const [dailyData, setDailyData] = useState<ClientPurchase[]>([]);
  const [weeklyData, setWeeklyData] = useState<ClientPurchase[]>([]);
  const [monthlyData, setMonthlyData] = useState<ClientPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const now = new Date();
      
      // Fetch daily (last 24 hours)
      const dailyStart = startOfDay(subDays(now, 1));
      const dailyPurchases = await fetchPurchasesByPeriod(dailyStart, now);
      setDailyData(dailyPurchases);

      // Fetch weekly (last 7 days)
      const weeklyStart = startOfDay(subWeeks(now, 1));
      const weeklyPurchases = await fetchPurchasesByPeriod(weeklyStart, now);
      setWeeklyData(weeklyPurchases);

      // Fetch monthly (last 30 days)
      const monthlyStart = startOfDay(subMonths(now, 1));
      const monthlyPurchases = await fetchPurchasesByPeriod(monthlyStart, now);
      setMonthlyData(monthlyPurchases);
    } catch (error: any) {
      toast({
        title: "Error loading analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchasesByPeriod = async (startDate: Date, endDate: Date): Promise<ClientPurchase[]> => {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        purchase_amount,
        clients:client_id (
          contact_name,
          company_name
        )
      `)
      .eq("status", "purchased")
      .gte("purchased_at", startDate.toISOString())
      .lte("purchased_at", endDate.toISOString());

    if (error) throw error;

    // Aggregate by client
    const clientMap = new Map<string, ClientPurchase>();
    data?.forEach((match: any) => {
      const clientName = match.clients?.contact_name || "Unknown";
      const companyName = match.clients?.company_name || "N/A";
      const key = `${clientName}-${companyName}`;
      
      if (clientMap.has(key)) {
        const existing = clientMap.get(key)!;
        existing.total_purchases += 1;
        existing.total_amount += Number(match.purchase_amount || 0);
      } else {
        clientMap.set(key, {
          client_name: clientName,
          company_name: companyName,
          total_purchases: 1,
          total_amount: Number(match.purchase_amount || 0),
        });
      }
    });

    return Array.from(clientMap.values()).sort((a, b) => b.total_purchases - a.total_purchases);
  };

  const renderTable = (data: ClientPurchase[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Company</TableHead>
          <TableHead className="text-right">Purchases</TableHead>
          <TableHead className="text-right">Total Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              No purchases in this period
            </TableCell>
          </TableRow>
        ) : (
          data.map((client, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-medium">{client.client_name}</TableCell>
              <TableCell>{client.company_name}</TableCell>
              <TableCell className="text-right">{client.total_purchases}</TableCell>
              <TableCell className="text-right">
                ${client.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const getTotalStats = (data: ClientPurchase[]) => ({
    totalPurchases: data.reduce((sum, c) => sum + c.total_purchases, 0),
    totalRevenue: data.reduce((sum, c) => sum + c.total_amount, 0),
  });

  const dailyStats = getTotalStats(dailyData);
  const weeklyStats = getTotalStats(weeklyData);
  const monthlyStats = getTotalStats(monthlyData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Purchase Analytics</CardTitle>
        <CardDescription>Track agent purchases by client over time</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
        ) : (
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Purchases
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-2xl font-bold">{dailyStats.totalPurchases}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span className="text-2xl font-bold">
                        ${dailyStats.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {renderTable(dailyData)}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Purchases
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-2xl font-bold">{weeklyStats.totalPurchases}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span className="text-2xl font-bold">
                        ${weeklyStats.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {renderTable(weeklyData)}
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Purchases
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-2xl font-bold">{monthlyStats.totalPurchases}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span className="text-2xl font-bold">
                        ${monthlyStats.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {renderTable(monthlyData)}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientAnalytics;
