import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Send, RefreshCw, Mail, MessageSquare, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Payment {
  id: string;
  client_id: string;
  stripe_payment_intent_id: string | null;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  refunded_amount: number;
  created_at: string;
}

interface Client {
  id: string;
  company_name: string;
  email: string;
  phone: string | null;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isPaymentLinkOpen, setIsPaymentLinkOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [paymentLinkForm, setPaymentLinkForm] = useState({
    client_id: "",
    amount: 0,
    description: "",
    send_via: "email" as "email" | "sms" | "both",
    email_message: "",
    sms_message: "",
  });

  const [refundForm, setRefundForm] = useState({
    amount: 0,
    reason: "",
  });

  useEffect(() => {
    fetchPayments();
    fetchClients();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching payments",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, email, phone")
        .order("company_name");

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching clients",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreatePaymentLink = async () => {
    if (!paymentLinkForm.client_id || !paymentLinkForm.amount || !paymentLinkForm.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-link", {
        body: paymentLinkForm,
      });

      if (error) throw error;

      toast({
        title: "Payment link created",
        description: "The payment link has been sent to the client",
      });

      setIsPaymentLinkOpen(false);
      setPaymentLinkForm({
        client_id: "",
        amount: 0,
        description: "",
        send_via: "email",
        email_message: "",
        sms_message: "",
      });
    } catch (error: any) {
      toast({
        title: "Error creating payment link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedPayment || !refundForm.amount) {
      toast({
        title: "Missing information",
        description: "Please enter a refund amount",
        variant: "destructive",
      });
      return;
    }

    if (refundForm.amount > (selectedPayment.amount - selectedPayment.refunded_amount)) {
      toast({
        title: "Invalid amount",
        description: "Refund amount exceeds available amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-refund", {
        body: {
          payment_id: selectedPayment.id,
          amount: refundForm.amount,
          reason: refundForm.reason,
        },
      });

      if (error) throw error;

      toast({
        title: "Refund processed",
        description: `$${refundForm.amount} has been refunded`,
      });

      setIsRefundOpen(false);
      setSelectedPayment(null);
      setRefundForm({ amount: 0, reason: "" });
      fetchPayments();
    } catch (error: any) {
      toast({
        title: "Error processing refund",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      succeeded: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <img src="/owldoor-logo-new.png" alt="OwlDoor" className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Payments</h1>
            <p className="text-muted-foreground">Manage payments, refunds, and payment links</p>
          </div>
        </div>
        <Dialog open={isPaymentLinkOpen} onOpenChange={setIsPaymentLinkOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Send className="mr-2 h-5 w-5" />
              Create Payment Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Payment Link</DialogTitle>
              <DialogDescription>
                Send a payment link to a client via email or SMS
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="client">Client</Label>
                <Select
                  value={paymentLinkForm.client_id}
                  onValueChange={(value) => setPaymentLinkForm({ ...paymentLinkForm, client_id: value })}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name} - {client.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={paymentLinkForm.amount}
                    onChange={(e) => setPaymentLinkForm({ ...paymentLinkForm, amount: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="send_via">Send Via</Label>
                  <Select
                    value={paymentLinkForm.send_via}
                    onValueChange={(value: any) => setPaymentLinkForm({ ...paymentLinkForm, send_via: value })}
                  >
                    <SelectTrigger id="send_via">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={paymentLinkForm.description}
                  onChange={(e) => setPaymentLinkForm({ ...paymentLinkForm, description: e.target.value })}
                  placeholder="What is this payment for?"
                />
              </div>

              <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">
                    <Mail className="mr-2 h-4 w-4" />
                    Email Message
                  </TabsTrigger>
                  <TabsTrigger value="sms">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    SMS Message
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="email" className="space-y-2">
                  <Label htmlFor="email_message">Custom Email Message (optional)</Label>
                  <Textarea
                    id="email_message"
                    value={paymentLinkForm.email_message}
                    onChange={(e) => setPaymentLinkForm({ ...paymentLinkForm, email_message: e.target.value })}
                    placeholder="Add a personal message to the email..."
                    rows={4}
                  />
                </TabsContent>
                <TabsContent value="sms" className="space-y-2">
                  <Label htmlFor="sms_message">Custom SMS Message (optional)</Label>
                  <Textarea
                    id="sms_message"
                    value={paymentLinkForm.sms_message}
                    onChange={(e) => setPaymentLinkForm({ ...paymentLinkForm, sms_message: e.target.value })}
                    placeholder="Add a personal message to the SMS..."
                    rows={4}
                  />
                </TabsContent>
              </Tabs>

              <Button onClick={handleCreatePaymentLink} className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create & Send Payment Link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View and manage all payments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Refunded</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {clients.find((c) => c.id === payment.client_id)?.company_name || "N/A"}
                  </TableCell>
                  <TableCell>{payment.description || "—"}</TableCell>
                  <TableCell className="font-medium">
                    ${payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>
                    {payment.refunded_amount > 0 ? (
                      <span className="text-destructive font-medium">
                        -${payment.refunded_amount.toFixed(2)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {payment.status === "succeeded" && payment.refunded_amount < payment.amount && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setRefundForm({
                              amount: payment.amount - payment.refunded_amount,
                              reason: "",
                            });
                            setIsRefundOpen(true);
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Refund
                        </Button>
                      )}
                      {payment.stripe_payment_intent_id && (
                        <Button size="sm" variant="ghost" asChild>
                          <a
                            href={`https://dashboard.stripe.com/payments/${payment.stripe_payment_intent_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Issue a partial or full refund for this payment
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Original Amount:</span>
                  <span className="font-medium">${selectedPayment.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Already Refunded:</span>
                  <span className="font-medium text-destructive">
                    ${selectedPayment.refunded_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Available to Refund:</span>
                  <span className="font-bold">
                    ${(selectedPayment.amount - selectedPayment.refunded_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="refund_amount">Refund Amount ($)</Label>
                <Input
                  id="refund_amount"
                  type="number"
                  step="0.01"
                  max={selectedPayment.amount - selectedPayment.refunded_amount}
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({ ...refundForm, amount: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  placeholder="Reason for refund..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setRefundForm({ ...refundForm, amount: selectedPayment.amount - selectedPayment.refunded_amount })}
                >
                  Full Refund
                </Button>
                <Button onClick={handleRefund} className="flex-1" disabled={loading}>
                  {loading ? "Processing..." : "Process Refund"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}