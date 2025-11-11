import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Phone, Search, ShoppingCart } from "lucide-react";

interface PhoneNumber {
  id: string;
  phone_number: string;
  friendly_name: string;
  assignment_type: string;
  assigned_to_user_id: string | null;
  assigned_to_client_id: string | null;
  twilio_account_id: string;
  active: boolean;
  twilio_accounts: { account_name: string };
  clients?: { company_name: string; contact_name: string };
  profiles?: { full_name: string };
}

interface TwilioAccount {
  id: string;
  account_name: string;
}

interface Client {
  id: string;
  company_name: string;
  contact_name: string;
}

export default function PhoneNumbersManager() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [accounts, setAccounts] = useState<TwilioAccount[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [editingNumber, setEditingNumber] = useState<PhoneNumber | null>(null);
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [searchAreaCode, setSearchAreaCode] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  
  const [formData, setFormData] = useState({
    phone_number: "",
    twilio_account_id: "",
    friendly_name: "",
    assignment_type: "client" as "admin" | "staff" | "client" | "specific_account",
    assigned_to_user_id: "",
    assigned_to_client_id: "",
    active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load phone numbers
      const { data: numbersData, error: numbersError } = await supabase.functions.invoke(
        'twilio-manage-phone-numbers',
        { body: { action: 'list' } }
      );
      if (numbersError) throw numbersError;
      setNumbers(numbersData.numbers || []);

      // Load Twilio accounts
      const { data: accountsData, error: accountsError } = await supabase.functions.invoke(
        'twilio-manage-accounts',
        { body: { action: 'list' } }
      );
      if (accountsError) throw accountsError;
      setAccounts(accountsData.accounts || []);

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, company_name, contact_name')
        .eq('active', true)
        .order('company_name');
      if (clientsError) throw clientsError;
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchNumbers = async () => {
    if (!selectedAccount) {
      toast.error('Please select a Twilio account');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('twilio-manage-phone-numbers', {
        body: {
          action: 'search_available',
          phoneNumber: {
            twilio_account_id: selectedAccount,
            area_code: searchAreaCode,
          },
        },
      });

      if (error) throw error;
      setAvailableNumbers(data.available_numbers || []);
      toast.success(`Found ${data.available_numbers?.length || 0} available numbers`);
    } catch (error) {
      console.error('Error searching numbers:', error);
      toast.error('Failed to search available numbers');
    }
  };

  const handlePurchaseNumber = async (number: any) => {
    try {
      const { error } = await supabase.functions.invoke('twilio-manage-phone-numbers', {
        body: {
          action: 'purchase',
          phoneNumber: {
            phone_number: number.phone_number,
            twilio_account_id: selectedAccount,
            friendly_name: number.friendly_name || number.phone_number,
            assignment_type: 'client',
          },
        },
      });

      if (error) throw error;

      toast.success('Phone number purchased successfully');
      setIsSearchDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error purchasing number:', error);
      toast.error('Failed to purchase phone number');
    }
  };

  const handleSubmit = async () => {
    try {
      const action = editingNumber ? 'update' : 'create';
      const { error } = await supabase.functions.invoke('twilio-manage-phone-numbers', {
        body: {
          action,
          phoneNumber: editingNumber ? { ...formData, id: editingNumber.id } : formData,
        },
      });

      if (error) throw error;

      toast.success(`Phone number ${editingNumber ? 'updated' : 'added'} successfully`);
      setIsDialogOpen(false);
      setEditingNumber(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving number:', error);
      toast.error('Failed to save phone number');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this phone number?')) return;

    try {
      const { error } = await supabase.functions.invoke('twilio-manage-phone-numbers', {
        body: { action: 'delete', phoneNumber: { id } },
      });

      if (error) throw error;

      toast.success('Phone number deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting number:', error);
      toast.error('Failed to delete phone number');
    }
  };

  const openDialog = (number?: PhoneNumber) => {
    if (number) {
      setEditingNumber(number);
      setFormData({
        phone_number: number.phone_number,
        twilio_account_id: number.twilio_account_id,
        friendly_name: number.friendly_name,
        assignment_type: number.assignment_type as any,
        assigned_to_user_id: number.assigned_to_user_id || "",
        assigned_to_client_id: number.assigned_to_client_id || "",
        active: number.active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      phone_number: "",
      twilio_account_id: "",
      friendly_name: "",
      assignment_type: "client",
      assigned_to_user_id: "",
      assigned_to_client_id: "",
      active: true,
    });
    setEditingNumber(null);
  };

  const getAssignmentBadge = (number: PhoneNumber) => {
    switch (number.assignment_type) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'staff':
        return <Badge variant="secondary">Staff</Badge>;
      case 'client':
        return <Badge>Client Pool</Badge>;
      case 'specific_account':
        if (number.assigned_to_client_id && number.clients) {
          return <Badge variant="outline">{number.clients.company_name}</Badge>;
        }
        if (number.assigned_to_user_id && number.profiles) {
          return <Badge variant="outline">{number.profiles.full_name}</Badge>;
        }
        return <Badge variant="outline">Specific Account</Badge>;
      default:
        return <Badge variant="secondary">Unassigned</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Numbers
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={() => setIsSearchDialogOpen(true)} size="sm" variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search & Buy
            </Button>
            <Button onClick={() => openDialog()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Number
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading phone numbers...</p>
          ) : numbers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No phone numbers configured. Add or purchase numbers to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {numbers.map((number) => (
                  <TableRow key={number.id}>
                    <TableCell className="font-mono">{number.phone_number}</TableCell>
                    <TableCell>{number.friendly_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {number.twilio_accounts?.account_name}
                    </TableCell>
                    <TableCell>{getAssignmentBadge(number)}</TableCell>
                    <TableCell>
                      <Badge variant={number.active ? "default" : "secondary"}>
                        {number.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(number)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(number.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNumber ? 'Edit' : 'Add'} Phone Number
            </DialogTitle>
            <DialogDescription>
              {editingNumber 
                ? 'Update phone number configuration'
                : 'Manually add a phone number'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+18888888888"
                disabled={!!editingNumber}
                className="font-mono"
              />
            </div>

            <div>
              <Label htmlFor="twilio_account">Twilio Account</Label>
              <Select
                value={formData.twilio_account_id}
                onValueChange={(value) => setFormData({ ...formData, twilio_account_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="friendly_name">Friendly Name</Label>
              <Input
                id="friendly_name"
                value={formData.friendly_name}
                onChange={(e) => setFormData({ ...formData, friendly_name: e.target.value })}
                placeholder="Main Office Line"
              />
            </div>

            <div>
              <Label htmlFor="assignment_type">Assignment Type</Label>
              <Select
                value={formData.assignment_type}
                onValueChange={(value: any) => setFormData({ ...formData, assignment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin Use</SelectItem>
                  <SelectItem value="staff">Staff Use</SelectItem>
                  <SelectItem value="client">Client Pool</SelectItem>
                  <SelectItem value="specific_account">Specific Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.assignment_type === 'specific_account' && (
              <div>
                <Label htmlFor="assigned_client">Assign to Client</Label>
                <Select
                  value={formData.assigned_to_client_id}
                  onValueChange={(value) => setFormData({ ...formData, assigned_to_client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name || client.contact_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingNumber ? 'Update' : 'Add'} Number
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search & Purchase Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Search & Purchase Phone Numbers
            </DialogTitle>
            <DialogDescription>
              Search for available phone numbers and purchase them instantly
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="search_account">Twilio Account</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="area_code">Area Code (Optional)</Label>
                <Input
                  id="area_code"
                  value={searchAreaCode}
                  onChange={(e) => setSearchAreaCode(e.target.value)}
                  placeholder="888"
                  maxLength={3}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearchNumbers}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {availableNumbers.length > 0 && (
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                <h4 className="font-semibold mb-3">Available Numbers</h4>
                <div className="space-y-2">
                  {availableNumbers.map((number, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-mono font-semibold">{number.phone_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {number.locality}, {number.region}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePurchaseNumber(number)}
                      >
                        Purchase
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
