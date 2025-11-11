import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Database, Plus, Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
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

interface Field {
  id: string;
  name: string;
  type: string;
  table: string;
  required: boolean;
  isBuiltIn?: boolean;
}

const builtInFields: Field[] = [
  // Lead fields (Zapier integrated)
  { id: "1", name: "full_name", type: "text", table: "leads", required: true, isBuiltIn: true },
  { id: "2", name: "first_name", type: "text", table: "leads", required: false, isBuiltIn: true },
  { id: "3", name: "last_name", type: "text", table: "leads", required: false, isBuiltIn: true },
  { id: "4", name: "email", type: "email", table: "leads", required: false, isBuiltIn: true },
  { id: "5", name: "phone", type: "phone", table: "leads", required: true, isBuiltIn: true },
  { id: "6", name: "cities", type: "text", table: "leads", required: false, isBuiltIn: true },
  { id: "7", name: "states", type: "text", table: "leads", required: false, isBuiltIn: true },
  { id: "8", name: "counties", type: "text", table: "leads", required: false, isBuiltIn: true },
  { id: "9", name: "zip_codes", type: "text", table: "leads", required: false, isBuiltIn: true },
  { id: "10", name: "license_type", type: "text", table: "leads", required: false, isBuiltIn: true },
  { id: "11", name: "brokerage", type: "text", table: "leads", required: false, isBuiltIn: true },
  { id: "12", name: "transactions", type: "number", table: "leads", required: false, isBuiltIn: true },
  { id: "13", name: "experience", type: "number", table: "leads", required: false, isBuiltIn: true },
  { id: "14", name: "total_sales", type: "number", table: "leads", required: false, isBuiltIn: true },
  { id: "15", name: "motivation", type: "number", table: "leads", required: false, isBuiltIn: true },
  { id: "16", name: "wants", type: "text", table: "leads", required: false, isBuiltIn: true },
  { id: "17", name: "skills", type: "text", table: "leads", required: false, isBuiltIn: true },
  { id: "18", name: "lead_type", type: "text", table: "leads", required: false, isBuiltIn: true },
  { id: "19", name: "status", type: "text", table: "leads", required: false, isBuiltIn: true },
  { id: "20", name: "pipeline_stage", type: "text", table: "leads", required: false, isBuiltIn: true },
  { id: "21", name: "qualification_score", type: "number", table: "leads", required: false, isBuiltIn: true },
  { id: "22", name: "source", type: "text", table: "leads", required: false, isBuiltIn: true },
  { id: "23", name: "notes", type: "text", table: "leads", required: false, isBuiltIn: true },
  
  // Client fields (Zapier integrated)
  { id: "30", name: "company_name", type: "text", table: "clients", required: true, isBuiltIn: true },
  { id: "31", name: "contact_name", type: "text", table: "clients", required: true, isBuiltIn: true },
  { id: "32", name: "first_name", type: "text", table: "clients", required: false, isBuiltIn: true },
  { id: "33", name: "last_name", type: "text", table: "clients", required: false, isBuiltIn: true },
  { id: "34", name: "email", type: "email", table: "clients", required: true, isBuiltIn: true },
  { id: "35", name: "phone", type: "phone", table: "clients", required: false, isBuiltIn: true },
  { id: "36", name: "brokerage", type: "text", table: "clients", required: false, isBuiltIn: true },
  { id: "37", name: "cities", type: "text", table: "clients", required: false, isBuiltIn: true },
  { id: "38", name: "states", type: "text", table: "clients", required: false, isBuiltIn: true },
  { id: "39", name: "zip_codes", type: "text", table: "clients", required: false, isBuiltIn: true },
  { id: "40", name: "license_type", type: "text", table: "clients", required: false, isBuiltIn: true },
  { id: "41", name: "designations", type: "text", table: "clients", required: false, isBuiltIn: true },
  { id: "42", name: "yearly_sales", type: "number", table: "clients", required: false, isBuiltIn: true },
  { id: "43", name: "years_experience", type: "number", table: "clients", required: false, isBuiltIn: true },
  { id: "44", name: "avg_sale", type: "number", table: "clients", required: false, isBuiltIn: true },
  { id: "45", name: "languages", type: "text", table: "clients", required: false, isBuiltIn: true },
  { id: "46", name: "skills", type: "text", table: "clients", required: false, isBuiltIn: true },
  { id: "47", name: "client_type", type: "text", table: "clients", required: false, isBuiltIn: true },
  { id: "48", name: "provides", type: "text", table: "clients", required: false, isBuiltIn: true },
];

export const FieldManagement = () => {
  const [customFields, setCustomFields] = useState<Field[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newField, setNewField] = useState({
    name: "",
    type: "text",
    table: "leads",
    required: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomFields();
  }, []);

  const fetchCustomFields = async () => {
    try {
      const { data, error } = await supabase
        .from("custom_fields")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const fields: Field[] = data?.map((field) => ({
        id: field.id,
        name: field.field_name,
        type: field.field_type,
        table: field.target_table,
        required: field.required,
        isBuiltIn: false,
      })) || [];

      setCustomFields(fields);
    } catch (error: any) {
      toast({
        title: "Error fetching fields",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddField = async () => {
    if (!newField.name.trim()) {
      toast({
        title: "Invalid field",
        description: "Please enter a field name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("custom_fields").insert({
        field_name: newField.name,
        field_type: newField.type,
        target_table: newField.table,
        required: newField.required,
      });

      if (error) throw error;

      toast({
        title: "Field added",
        description: `${newField.name} has been added to ${newField.table}`,
      });

      setIsDialogOpen(false);
      setNewField({ name: "", type: "text", table: "leads", required: false });
      fetchCustomFields();
    } catch (error: any) {
      toast({
        title: "Error adding field",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from("custom_fields")
        .delete()
        .eq("id", fieldId);

      if (error) throw error;

      toast({
        title: "Field deleted",
        description: "The custom field has been removed",
      });

      fetchCustomFields();
    } catch (error: any) {
      toast({
        title: "Error deleting field",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const allFields = [...builtInFields, ...customFields];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Field Management
            </CardTitle>
            <CardDescription>
              Manage database fields for leads and clients
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Field</DialogTitle>
                <DialogDescription>
                  Create a custom field to collect additional information without database migrations.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="field-name">Field Name</Label>
                  <Input
                    id="field-name"
                    placeholder="e.g., license_number"
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-type">Field Type</Label>
                  <Select 
                    value={newField.type} 
                    onValueChange={(value) => setNewField({ ...newField, type: value })}
                  >
                    <SelectTrigger id="field-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-table">Table</Label>
                  <Select 
                    value={newField.table} 
                    onValueChange={(value) => setNewField({ ...newField, table: value })}
                  >
                    <SelectTrigger id="field-table">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="clients">Clients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="field-required" 
                    checked={newField.required}
                    onCheckedChange={(checked) => setNewField({ ...newField, required: checked === true })}
                  />
                  <Label htmlFor="field-required" className="text-sm font-normal">
                    Required field
                  </Label>
                </div>
                <Button onClick={handleAddField} className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Field"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Leads Table Fields</h3>
            <div className="space-y-2">
              {allFields.filter(f => f.table === "leads").map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {field.name}
                        {field.isBuiltIn && (
                          <span className="ml-2 text-xs text-muted-foreground">(built-in)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {field.type} • {field.required ? "Required" : "Optional"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!field.isBuiltIn && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDeleteField(field.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Clients Table Fields</h3>
            <div className="space-y-2">
              {allFields.filter(f => f.table === "clients").map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {field.name}
                        {field.isBuiltIn && (
                          <span className="ml-2 text-xs text-muted-foreground">(built-in)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {field.type} • {field.required ? "Required" : "Optional"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!field.isBuiltIn && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDeleteField(field.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};