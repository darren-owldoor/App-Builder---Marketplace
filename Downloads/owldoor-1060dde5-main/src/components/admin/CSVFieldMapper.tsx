import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface CSVFieldMapperProps {
  csvHeaders: string[];
  targetFields: { value: string; label: string; required?: boolean }[];
  mapping: Record<string, string>;
  onMappingChange: (field: string, csvColumn: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CSVFieldMapper = ({
  csvHeaders,
  targetFields,
  mapping,
  onMappingChange,
  onConfirm,
  onCancel,
}: CSVFieldMapperProps) => {
  const [customFields, setCustomFields] = useState<Array<{ value: string; label: string; required?: boolean }>>([]);
  const [newFieldName, setNewFieldName] = useState("");

  const requiredFields = targetFields.filter(f => f.required);
  const allRequiredMapped = requiredFields.every(field => 
    mapping[field.value] && mapping[field.value] !== "__skip__"
  );

  const allFields = [...targetFields, ...customFields];

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    
    const fieldValue = newFieldName.toLowerCase().replace(/\s+/g, '_');
    const newField = { value: fieldValue, label: newFieldName };
    setCustomFields([...customFields, newField]);
    setNewFieldName("");
  };

  const handleRemoveCustomField = (fieldValue: string) => {
    setCustomFields(customFields.filter(f => f.value !== fieldValue));
    const newMapping = { ...mapping };
    delete newMapping[fieldValue];
    onMappingChange(fieldValue, "__skip__");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map CSV Fields</CardTitle>
        <CardDescription>
          Connect your CSV columns to the database fields. Required fields are marked with *
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {allFields.map((field) => (
            <div key={field.value} className="grid grid-cols-2 gap-4 items-center">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {customFields.some(f => f.value === field.value) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCustomField(field.value)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select
                value={mapping[field.value] || "__skip__"}
                onValueChange={(value) => onMappingChange(field.value, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select CSV column..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__skip__">Skip this field</SelectItem>
                  {csvHeaders.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <Label className="text-sm font-medium mb-2 block">Add Custom Field</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter field name..."
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomField()}
            />
            <Button type="button" onClick={handleAddCustomField} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={!allRequiredMapped}
          >
            Import with Mapping
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
