import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Settings2, Eye, EyeOff } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FieldDefinition {
  id: string;
  field_name: string;
  display_name: string;
  description: string | null;
  field_type: string;
  allowed_values: any;
  use_ai_matching: boolean;
  entity_types: string[];
  visible_in: string[];
  is_required: boolean;
  matching_weight: number;
  field_group: string | null;
  sort_order: number;
  active: boolean;
  default_value: string | null;
}

export default function AdminFieldDefinitions() {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [mergeSourceField, setMergeSourceField] = useState<string>("");
  const [mergeTargetField, setMergeTargetField] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("field_definitions")
        .select("*")
        .order("entity_types", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading fields",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveField = async () => {
    if (!editingField) return;

    // Validate required fields
    if (!editingField.field_name.trim() || !editingField.display_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Field name and display name are required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isAddingField) {
        // Create new field
        const { error } = await supabase
          .from("field_definitions")
          .insert({
            field_name: editingField.field_name,
            display_name: editingField.display_name,
            description: editingField.description,
            field_type: editingField.field_type,
            allowed_values: editingField.allowed_values,
            use_ai_matching: editingField.use_ai_matching,
            entity_types: editingField.entity_types,
            visible_in: editingField.visible_in,
            is_required: editingField.is_required,
            matching_weight: editingField.matching_weight,
            field_group: editingField.field_group,
            active: editingField.active,
            default_value: editingField.default_value,
            sort_order: fields.length + 1,
          });

        if (error) throw error;

        toast({
          title: "✅ Field Created",
          description: `Field "${editingField.display_name}" has been created successfully`,
        });
      } else {
        // Update existing field
        const { error } = await supabase
          .from("field_definitions")
          .update({
            field_name: editingField.field_name,
            display_name: editingField.display_name,
            description: editingField.description,
            field_type: editingField.field_type,
            allowed_values: editingField.allowed_values,
            use_ai_matching: editingField.use_ai_matching,
            entity_types: editingField.entity_types,
            visible_in: editingField.visible_in,
            is_required: editingField.is_required,
            matching_weight: editingField.matching_weight,
            field_group: editingField.field_group,
            active: editingField.active,
            default_value: editingField.default_value,
          })
          .eq("id", editingField.id);

        if (error) throw error;

        toast({
          title: "✅ Field Updated",
          description: `Field "${editingField.display_name}" has been saved successfully`,
        });
      }

      closeDialog();
      fetchFields();
    } catch (error: any) {
      console.error("Save field error:", error);
      toast({
        title: isAddingField ? "❌ Error Creating Field" : "❌ Error Saving Field",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingField(null);
    setIsAddingField(false);
  };

  const toggleFieldActive = async (field: FieldDefinition) => {
    try {
      const { error } = await supabase
        .from("field_definitions")
        .update({ active: !field.active })
        .eq("id", field.id);

      if (error) throw error;
      fetchFields();
    } catch (error: any) {
      toast({
        title: "Error updating field",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMergeFields = async () => {
    if (!mergeSourceField || !mergeTargetField) {
      toast({
        title: "Error",
        description: "Please select both source and target fields",
        variant: "destructive",
      });
      return;
    }

    if (mergeSourceField === mergeTargetField) {
      toast({
        title: "Error",
        description: "Source and target fields must be different",
        variant: "destructive",
      });
      return;
    }

    try {
      // Call edge function to merge fields
      const { data, error } = await supabase.functions.invoke("admin-merge-fields", {
        body: {
          sourceFieldName: mergeSourceField,
          targetFieldName: mergeTargetField,
        },
      });

      if (error) throw error;

      toast({
        title: "✅ Fields Merged Successfully",
        description: `Data from "${mergeSourceField}" has been merged into "${mergeTargetField}"`,
      });

      setIsMergeDialogOpen(false);
      setMergeSourceField("");
      setMergeTargetField("");
      fetchFields();
    } catch (error: any) {
      toast({
        title: "❌ Merge Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const groupedFields = fields.reduce((acc, field) => {
    const key = field.entity_types[0] || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(field);
    return acc;
  }, {} as Record<string, FieldDefinition[]>);

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Field Definitions Manager
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Configure all system fields, visibility, labels, and field behavior
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsMergeDialogOpen(true)}
              >
                Merge Fields
              </Button>
              <Button
                onClick={() => {
                  setEditingField({
                    id: "",
                    field_name: "",
                    display_name: "",
                    description: null,
                    field_type: "text",
                    allowed_values: null,
                    use_ai_matching: false,
                    entity_types: ["pro"],
                    visible_in: ["profile", "form"],
                    is_required: false,
                    matching_weight: 0,
                    field_group: null,
                    sort_order: 0,
                    active: true,
                    default_value: null,
                  });
                  setIsAddingField(true);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading fields...</p>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedFields).map(([entityType, entityFields]) => (
                <div key={entityType}>
                  <h3 className="text-lg font-semibold mb-4 capitalize">
                    {entityType === "pro" ? "Agent/Pro Fields" : entityType === "client" ? "Office/Client Fields" : entityType} ({entityFields.length})
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Visible In</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>AI Match</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entityFields.map((field) => (
                        <TableRow key={field.id}>
                          <TableCell className="font-mono text-xs">
                            {field.field_name}
                            {field.field_name === "wants" && entityType === "pro" && (
                              <Badge variant="outline" className="ml-2">What agents want</Badge>
                            )}
                            {field.field_name === "wants" && entityType === "client" && (
                              <Badge variant="destructive" className="ml-2">Should be "provides"</Badge>
                            )}
                          </TableCell>
                          <TableCell>{field.display_name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{field.field_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {field.visible_in.map((v) => (
                                <Badge key={v} variant="outline" className="text-xs">
                                  {v}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {field.is_required ? "✓" : ""}
                          </TableCell>
                          <TableCell>
                            {field.use_ai_matching ? (
                              <Badge>Weight: {field.matching_weight}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleFieldActive(field)}
                            >
                              {field.active ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </TableCell>
                           <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingField({...field});
                                setIsAddingField(false);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) closeDialog();
        setIsDialogOpen(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAddingField ? "Add New Field Definition" : "Edit Field Definition"}</DialogTitle>
          </DialogHeader>
          {editingField && (
            <div className="space-y-4">
              <div>
                <Label>Field Name (system) {!isAddingField && <span className="text-xs text-muted-foreground">(read-only)</span>}</Label>
                <Input 
                  value={editingField.field_name} 
                  disabled={!isAddingField}
                  className={`font-mono ${!isAddingField ? 'bg-muted cursor-not-allowed' : ''}`}
                  onChange={(e) =>
                    setEditingField({ ...editingField, field_name: e.target.value })
                  }
                  placeholder="e.g., custom_field_name"
                />
                {isAddingField ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Use lowercase with underscores (e.g., years_in_business)
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Field name cannot be changed after creation
                  </p>
                )}
              </div>

              <div>
                <Label>Display Name</Label>
                <Input
                  value={editingField.display_name}
                  onChange={(e) =>
                    setEditingField({ ...editingField, display_name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingField.description || ""}
                  onChange={(e) =>
                    setEditingField({ ...editingField, description: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div>
                <Label>Field Type <span className="text-xs text-emerald-600">✓ Editable</span></Label>
                <Select
                  value={editingField.field_type}
                  onValueChange={(value) => {
                    console.log("Field type changed to:", value);
                    setEditingField({ ...editingField, field_type: value });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="select">Select (Single Choice)</SelectItem>
                    <SelectItem value="multi_select">Multi Select (Multiple Choices)</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Current: <span className="font-semibold">{editingField.field_type}</span>
                </p>
              </div>

              {(editingField.field_type === "select" || editingField.field_type === "multi_select") && (
                <div>
                  <Label>Allowed Values (comma-separated)</Label>
                  <Input
                    value={Array.isArray(editingField.allowed_values) ? editingField.allowed_values.join(", ") : ""}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        allowed_values: e.target.value.split(",").map((v) => v.trim()),
                      })
                    }
                  />
                </div>
              )}

              <div>
                <Label>Visible In (comma-separated: profile, form, card, list)</Label>
                <Input
                  value={editingField.visible_in.join(", ")}
                  onChange={(e) =>
                    setEditingField({
                      ...editingField,
                      visible_in: e.target.value.split(",").map((v) => v.trim()),
                    })
                  }
                />
              </div>

              <div>
                <Label>Field Group</Label>
                <Input
                  value={editingField.field_group || ""}
                  onChange={(e) =>
                    setEditingField({ ...editingField, field_group: e.target.value || null })
                  }
                  placeholder="e.g., contact, business, location"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={editingField.is_required}
                  onCheckedChange={(checked) =>
                    setEditingField({ ...editingField, is_required: checked === true })
                  }
                />
                <Label>Required Field</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={editingField.use_ai_matching}
                  onCheckedChange={(checked) =>
                    setEditingField({ ...editingField, use_ai_matching: checked === true })
                  }
                />
                <Label>Use in AI Matching</Label>
              </div>

              {editingField.use_ai_matching && (
                <div>
                  <Label>Matching Weight (0-100)</Label>
                  <Input
                    type="number"
                    value={editingField.matching_weight}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        matching_weight: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={editingField.active}
                  onCheckedChange={(checked) =>
                    setEditingField({ ...editingField, active: checked === true })
                  }
                />
                <Label>Active</Label>
              </div>

              <Button onClick={handleSaveField} className="w-full">
                {isAddingField ? "Create Field" : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Merge Fields Dialog */}
      <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Field Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Merge data from one field into another. This will copy all values from the source field to the target field for all records.
            </p>
            
            <div>
              <Label>Source Field (data will be copied FROM this field)</Label>
              <Select value={mergeSourceField} onValueChange={setMergeSourceField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((field) => (
                    <SelectItem key={field.id} value={field.field_name}>
                      {field.display_name} ({field.field_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Target Field (data will be copied TO this field)</Label>
              <Select value={mergeTargetField} onValueChange={setMergeTargetField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((field) => (
                    <SelectItem key={field.id} value={field.field_name}>
                      {field.display_name} ({field.field_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
              <strong>⚠️ Warning:</strong> This will overwrite existing data in the target field with data from the source field.
            </div>

            <Button onClick={handleMergeFields} className="w-full">
              Merge Fields
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
