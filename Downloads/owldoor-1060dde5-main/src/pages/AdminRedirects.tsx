import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Redirect {
  id: string;
  from_path: string;
  to_path: string;
  redirect_type: string;
  status_code: number;
  is_active: boolean;
  hit_count: number;
  last_hit_at: string | null;
  notes: string | null;
  created_at: string;
}

export default function AdminRedirects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  
  // Form state
  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");
  const [redirectType, setRedirectType] = useState("permanent");
  const [statusCode, setStatusCode] = useState(301);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadRedirects();
  }, []);

  const loadRedirects = async () => {
    try {
      const { data, error } = await supabase
        .from("url_redirects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRedirects(data || []);
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

  const resetForm = () => {
    setFromPath("");
    setToPath("");
    setRedirectType("permanent");
    setStatusCode(301);
    setIsActive(true);
    setNotes("");
    setEditingRedirect(null);
  };

  const openEditDialog = (redirect: Redirect) => {
    setEditingRedirect(redirect);
    setFromPath(redirect.from_path);
    setToPath(redirect.to_path);
    setRedirectType(redirect.redirect_type);
    setStatusCode(redirect.status_code);
    setIsActive(redirect.is_active);
    setNotes(redirect.notes || "");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const redirectData = {
        from_path: fromPath.startsWith("/") ? fromPath : `/${fromPath}`,
        to_path: toPath,
        redirect_type: redirectType,
        status_code: statusCode,
        is_active: isActive,
        notes: notes || null,
      };

      if (editingRedirect) {
        const { error } = await supabase
          .from("url_redirects")
          .update(redirectData)
          .eq("id", editingRedirect.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Redirect updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("url_redirects")
          .insert(redirectData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Redirect created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      loadRedirects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this redirect?")) return;

    try {
      const { error } = await supabase
        .from("url_redirects")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Redirect deleted successfully",
      });

      loadRedirects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (redirect: Redirect) => {
    try {
      const { error } = await supabase
        .from("url_redirects")
        .update({ is_active: !redirect.is_active })
        .eq("id", redirect.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Redirect ${!redirect.is_active ? "enabled" : "disabled"}`,
      });

      loadRedirects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>URL Redirects & 404 Forwarding</CardTitle>
                <CardDescription>
                  Manage URL redirects and handle 404 errors by forwarding paths
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Redirect
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingRedirect ? "Edit Redirect" : "Add New Redirect"}
                      </DialogTitle>
                      <DialogDescription>
                        Create a redirect rule to forward visitors from one URL to another
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="from_path">From Path *</Label>
                        <Input
                          id="from_path"
                          placeholder="/old-page"
                          value={fromPath}
                          onChange={(e) => setFromPath(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="to_path">To Path *</Label>
                        <Input
                          id="to_path"
                          placeholder="/new-page or https://example.com"
                          value={toPath}
                          onChange={(e) => setToPath(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="redirect_type">Redirect Type</Label>
                          <Select value={redirectType} onValueChange={setRedirectType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="permanent">Permanent (301)</SelectItem>
                              <SelectItem value="temporary">Temporary (302)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="status_code">Status Code</Label>
                          <Select 
                            value={statusCode.toString()} 
                            onValueChange={(val) => setStatusCode(parseInt(val))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="301">301 (Permanent)</SelectItem>
                              <SelectItem value="302">302 (Temporary)</SelectItem>
                              <SelectItem value="307">307 (Temporary)</SelectItem>
                              <SelectItem value="308">308 (Permanent)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={isActive}
                          onCheckedChange={setIsActive}
                        />
                        <Label htmlFor="is_active">Active</Label>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add any notes about this redirect..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingRedirect ? "Update" : "Create"} Redirect
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : redirects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No redirects configured yet. Click "Add Redirect" to create one.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hits</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redirects.map((redirect) => (
                      <TableRow key={redirect.id}>
                        <TableCell className="font-mono text-sm">
                          {redirect.from_path}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-2">
                            {redirect.to_path}
                            {redirect.to_path.startsWith("http") && (
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{redirect.redirect_type}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{redirect.status_code}</span>
                        </TableCell>
                        <TableCell>{redirect.hit_count}</TableCell>
                        <TableCell>
                          <Switch
                            checked={redirect.is_active}
                            onCheckedChange={() => toggleActive(redirect)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(redirect)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(redirect.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
