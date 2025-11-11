import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { FieldDefinition } from "@/hooks/useFieldDefinitions";

interface DynamicFieldInputProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  error?: string;
}

export const DynamicFieldInput = ({
  field,
  value,
  onChange,
  disabled = false,
  error,
}: DynamicFieldInputProps) => {
  const renderInput = () => {
    switch (field.field_type) {
      case "multi_select":
        // Button-based multi-select
        if (!field.allowed_values || field.allowed_values.length === 0) {
          return (
            <Textarea
              value={Array.isArray(value) ? value.join(", ") : ""}
              onChange={(e) => {
                const values = e.target.value
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean);
                onChange(values);
              }}
              disabled={disabled}
              placeholder={`Enter ${field.display_name.toLowerCase()} (comma separated)`}
            />
          );
        }

        const selectedValues = Array.isArray(value) ? value : [];

        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {field.allowed_values.map((option) => {
                const isSelected = selectedValues.includes(option);
                return (
                  <Button
                    key={option}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={disabled}
                    onClick={() => {
                      const newValues = isSelected
                        ? selectedValues.filter((v) => v !== option)
                        : [...selectedValues, option];
                      onChange(newValues);
                    }}
                  >
                    {option}
                    {isSelected && <X className="ml-2 h-3 w-3" />}
                  </Button>
                );
              })}
            </div>
            
            {/* Show selected count */}
            {selectedValues.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedValues.length} selected
              </div>
            )}

            {/* Custom input for additional values */}
            <div>
              <Label className="text-xs">Add Custom</Label>
              <Input
                placeholder="Enter custom value and press Enter"
                disabled={disabled}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    const newValue = e.currentTarget.value.trim();
                    if (!selectedValues.includes(newValue)) {
                      onChange([...selectedValues, newValue]);
                    }
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
          </div>
        );

      case "select":
        // Single select dropdown
        if (!field.allowed_values || field.allowed_values.length === 0) {
          return (
            <Input
              type="text"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder={`Enter ${field.display_name.toLowerCase()}`}
            />
          );
        }

        return (
          <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.display_name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.allowed_values.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            placeholder={`Enter ${field.display_name.toLowerCase()}`}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${field.display_name.toLowerCase()}`}
            rows={4}
          />
        );

      case "text":
      default:
        return (
          <Input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${field.display_name.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={field.field_name}>
          {field.display_name}
          {field.is_required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {field.use_ai_matching && (
          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
            🤖 AI Match
          </Badge>
        )}
      </div>
      
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      
      {renderInput()}
      
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
