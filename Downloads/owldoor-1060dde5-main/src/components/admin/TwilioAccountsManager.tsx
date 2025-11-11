import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Edit, Trash2, Star, Phone } from "lucide-react";

interface TwilioAccount {
  id: string;
  account_name: string;
  account_sid: string;
  auth_token: string;
  is_default: boolean;
  active: boolean;
  created_at: string;
}

export default function TwilioAccountsManager() {
  const [accounts, setAccounts] = useState<TwilioAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TwilioAccount | null>(null);
  const [formData, setFormData] = useState({
    account_name: "",
    account_sid: "",
    auth_token: "",
    is_default: false,
    active: true,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('twilio-manage-accounts', {
        body: { action: 'list' },
      });

      if (error) throw error;
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load Twilio accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const action = editingAccount ? 'update' : 'create';
      const { data, error } = await supabase.functions.invoke('twilio-manage-accounts', {
        body: {
          action,
          account: editingAccount ? { ...formData, id: editingAccount.id } : formData,
        },
      });

      if (error) throw error;

      toast.success(`Account ${editingAccount ? 'updated' : 'created'} successfully`);
      setIsDialogOpen(false);
      setEditingAccount(null);
      resetForm();
      loadAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
      toast.error('Failed to save account');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Twilio account?')) return;

    try {
      const { error } = await supabase.functions.invoke('twilio-manage-accounts', {
        body: { action: 'delete', account: { id } },
      });

      if (error) throw error;

      toast.success('Account deleted successfully');
      loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('twilio-manage-accounts', {
        body: { action: 'set_default', account: { id } },
      });

      if (error) throw error;

      toast.success('Default account updated');
      loadAccounts();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default account');
    }
  };

  const openDialog = (account?: TwilioAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        account_name: account.account_name,
        account_sid: account.account_sid,
        auth_token: account.auth_token,
        is_default: account.is_default,
        active: account.active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      account_name: "",
      account_sid: "",
      auth_token: "",
      is_default: false,
      active: true,
    });
    setEditingAccount(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Twilio Accounts
        </CardTitle>
        <Button onClick={() => openDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading accounts...</p>
        ) : accounts.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No Twilio accounts configured. Add your first account to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Account SID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.account_name}</TableCell>
                  <TableCell className="font-mono text-sm">{account.account_sid}</TableCell>
                  <TableCell>
                    <Badge variant={account.active ? "default" : "secondary"}>
                      {account.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {account.is_default ? (
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Default
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(account.id)}
                      >
                        Set Default
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(account)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Edit' : 'Add'} Twilio Account
              </DialogTitle>
              <DialogDescription>
                {editingAccount 
                  ? 'Update the Twilio account credentials'
                  : 'Add a new Twilio account to manage multiple phone numbers'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="Production Account"
                />
              </div>

              <div>
                <Label htmlFor="account_sid">Account SID</Label>
                <Input
                  id="account_sid"
                  value={formData.account_sid}
                  onChange={(e) => setFormData({ ...formData, account_sid: e.target.value })}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="font-mono"
                />
              </div>

              <div>
                <Label htmlFor="auth_token">Auth Token</Label>
                <Input
                  id="auth_token"
                  type="password"
                  value={formData.auth_token}
                  onChange={(e) => setFormData({ ...formData, auth_token: e.target.value })}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="font-mono"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_default">Set as Default</Label>
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_default: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingAccount ? 'Update' : 'Create'} Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
