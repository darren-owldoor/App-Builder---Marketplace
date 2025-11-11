import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Minus, History } from "lucide-react";

interface Client {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  credits_balance: number;
  credits_used: number;
}

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  reason: string | null;
  created_at: string;
  balance_after: number;
  created_by: string | null;
}

export const AdminCreditsManager = () => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isAdding, setIsAdding] = useState(true);
  const queryClient = useQueryClient();

  // Fetch all clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ["admin-clients-credits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, contact_name, email, credits_balance, credits_used")
        .order("company_name");
      
      if (error) throw error;
      return data as Client[];
    },
  });

  // Fetch credit history for selected client
  const { data: creditHistory } = useQuery({
    queryKey: ["credit-history", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("client_id", selectedClient.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!selectedClient && showHistoryModal,
  });

  // Mutation to adjust credits
  const adjustCreditsMutation = useMutation({
    mutationFn: async ({ 
      clientId, 
      amount, 
      type, 
      reason 
    }: { 
      clientId: string; 
      amount: number; 
      type: string; 
      reason: string;
    }) => {
      // Get current balance
      const { data: client, error: fetchError } = await supabase
        .from("clients")
        .select("credits_balance")
        .eq("id", clientId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newBalance = client.credits_balance + amount;
      
      if (newBalance < 0) {
        throw new Error("Cannot set negative credit balance");
      }

      // Update client balance
      const { error: updateError } = await supabase
        .from("clients")
        .update({ 
          credits_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq("id", clientId);
      
      if (updateError) throw updateError;

      // Create transaction record
      const { data: userData } = await supabase.auth.getUser();
      
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          client_id: clientId,
          amount: amount,
          transaction_type: type,
          reason: reason,
          created_by: userData.user?.id,
          balance_after: newBalance
        });
      
      if (transactionError) throw transactionError;

      return newBalance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients-credits"] });
      queryClient.invalidateQueries({ queryKey: ["credit-history"] });
      toast.success("Dollar credits adjusted successfully");
      setShowAddModal(false);
      setAmount("");
      setReason("");
      setSelectedClient(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to adjust credits: ${error.message}`);
    },
  });

  const handleOpenModal = (client: Client, adding: boolean) => {
    setSelectedClient(client);
    setIsAdding(adding);
    setShowAddModal(true);
  };

  const handleSubmit = () => {
    if (!selectedClient || !amount || parseInt(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    const numAmount = parseInt(amount);
    const actualAmount = isAdding ? numAmount : -numAmount;
    const type = isAdding ? "manual_add" : "manual_remove";

    adjustCreditsMutation.mutate({
      clientId: selectedClient.id,
      amount: actualAmount,
      type,
      reason: reason.trim()
    });
  };

  const handleShowHistory = (client: Client) => {
    setSelectedClient(client);
    setShowHistoryModal(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading clients...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Client Dollar Credits Management</CardTitle>
          <CardDescription>Add or remove dollar credits ($) from client accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.company_name}</TableCell>
                  <TableCell>{client.contact_name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={client.credits_balance < 10 ? "destructive" : "secondary"}>
                      ${client.credits_balance.toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${client.credits_used.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenModal(client, true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenModal(client, false)}
                      >
                        <Minus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleShowHistory(client)}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Remove Credits Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAdding ? "Add" : "Remove"} Dollar Credits
            </DialogTitle>
            <DialogDescription>
              {isAdding ? "Add" : "Remove"} dollar credits ($) {isAdding ? "to" : "from"}{" "}
              {selectedClient?.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Balance</Label>
              <div className="text-2xl font-bold">
                ${selectedClient?.credits_balance.toFixed(2)}
              </div>
            </div>
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter dollar amount"
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for this adjustment..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setAmount("");
                  setReason("");
                  setSelectedClient(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={adjustCreditsMutation.isPending}
              >
                {isAdding ? "Add $" : "Remove $"}{amount || "0"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Dollar Credit History</DialogTitle>
            <DialogDescription>
              Transaction history for {selectedClient?.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditHistory?.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {transaction.transaction_type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                        {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {transaction.balance_after}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.reason || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
