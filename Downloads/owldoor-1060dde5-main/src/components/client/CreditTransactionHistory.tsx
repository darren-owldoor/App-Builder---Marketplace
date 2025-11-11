import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface CreditTransactionHistoryProps {
  clientId: string;
}

export const CreditTransactionHistory = ({ clientId }: CreditTransactionHistoryProps) => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["credit-transactions", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Dollar Credit Transaction History
        </CardTitle>
        <CardDescription>
          View all your credit purchases, usage, and balance changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!transactions || transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions yet. Purchase credits to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
                  const isPositive = transaction.amount > 0;
                  const isCredit = transaction.transaction_type === "purchase" || 
                                  transaction.transaction_type === "adjustment" && isPositive;

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {format(new Date(transaction.created_at), "MMM dd, yyyy 'at' h:mm a")}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={isCredit ? "default" : "secondary"}
                          className="flex items-center gap-1 w-fit"
                        >
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {transaction.transaction_type === "purchase" && "Purchase"}
                          {transaction.transaction_type === "usage" && "Usage"}
                          {transaction.transaction_type === "adjustment" && "Adjustment"}
                          {transaction.transaction_type === "refund" && "Refund"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={isPositive ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                          {isPositive ? "+" : ""}${transaction.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${transaction.balance_after.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md">
                        {transaction.reason || "No description"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
