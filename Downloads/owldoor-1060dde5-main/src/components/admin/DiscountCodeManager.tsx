import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, Percent, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface DiscountCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

export function DiscountCodeManager() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    max_uses: null as number | null,
    expires_at: '',
    active: true
  });

  useEffect(() => {
    fetchDiscountCodes();
  }, []);

  const fetchDiscountCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes((data as DiscountCode[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async () => {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .insert([{
          code: formData.code.toUpperCase(),
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          max_uses: formData.max_uses,
          expires_at: formData.expires_at || null,
          active: formData.active
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Discount code created successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        max_uses: null,
        expires_at: '',
        active: true
      });
      fetchDiscountCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({ active })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Discount code ${active ? 'activated' : 'deactivated'}`,
      });

      fetchDiscountCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;

    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Discount code deleted",
      });

      fetchDiscountCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isMaxedOut = (code: DiscountCode) => {
    if (!code.max_uses) return false;
    return code.current_uses >= code.max_uses;
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading discount codes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Discount Codes</h2>
          <p className="text-muted-foreground">Manage promotional discount codes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Discount Code</DialogTitle>
              <DialogDescription>
                Create a new discount code for clients to use when purchasing recruits
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Code</Label>
                <Input
                  placeholder="SAVE20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <Label>Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Discount Value</Label>
                <div className="flex items-center gap-2">
                  {formData.discount_type === 'percentage' ? (
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    type="number"
                    min={1}
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.discount_type === 'percentage' ? 'Percentage off (1-100)' : 'Dollar amount off'}
                </p>
              </div>

              <div>
                <Label>Max Uses (Optional)</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={formData.max_uses || ''}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>

              <div>
                <Label>Expiration Date (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>

              <Button onClick={handleCreateCode} className="w-full">
                Create Discount Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {codes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No discount codes yet</p>
            </CardContent>
          </Card>
        ) : (
          codes.map((code) => {
            const expired = isExpired(code.expires_at);
            const maxedOut = isMaxedOut(code);

            return (
              <Card key={code.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl font-mono">{code.code}</CardTitle>
                        {code.active && !expired && !maxedOut ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {expired && <Badge variant="destructive">Expired</Badge>}
                        {maxedOut && <Badge variant="destructive">Max Uses Reached</Badge>}
                      </div>
                      <CardDescription>
                        {code.discount_type === 'percentage' ? (
                          <span className="flex items-center gap-1">
                            <Percent className="h-4 w-4" />
                            {code.discount_value}% off
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ${code.discount_value} off
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Switch
                        checked={code.active}
                        onCheckedChange={(checked) => handleToggleActive(code.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCode(code.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Uses:</span>
                      <p className="font-semibold">
                        {code.current_uses} {code.max_uses ? `/ ${code.max_uses}` : '/ ∞'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expires:</span>
                      <p className="font-semibold">
                        {code.expires_at 
                          ? new Date(code.expires_at).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <p className="font-semibold">
                        {new Date(code.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p className="font-semibold">
                        {expired ? 'Expired' : maxedOut ? 'Maxed Out' : code.active ? 'Active' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
