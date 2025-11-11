import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Copy, Plus } from "lucide-react";
import { toast } from "sonner";

interface FieldSelectorProps {
  onInsert: (field: string) => void;
}

const MERGE_FIELDS = [
  { label: "Lead Name", value: "{lead_name}" },
  { label: "Lead First Name", value: "{lead_first_name}" },
  { label: "Lead Last Name", value: "{lead_last_name}" },
  { label: "Lead Email", value: "{lead_email}" },
  { label: "Lead Phone", value: "{lead_phone}" },
  { label: "Lead City", value: "{lead_city}" },
  { label: "Lead State", value: "{lead_state}" },
  { label: "Lead County", value: "{lead_county}" },
  { label: "Lead Zip Code", value: "{lead_zip_code}" },
  { label: "Lead Status", value: "{lead_status}" },
  { label: "Lead Source", value: "{lead_source}" },
  { label: "Lead Company", value: "{lead_company}" },
  { label: "Lead Brokerage", value: "{lead_brokerage}" },
  { label: "Lead Team", value: "{lead_team}" },
  { label: "Lead License", value: "{lead_license}" },
  { label: "Lead License Type", value: "{lead_license_type}" },
  { label: "Lead Experience", value: "{lead_experience}" },
  { label: "Lead Transactions", value: "{lead_transactions}" },
  { label: "Lead Total Sales", value: "{lead_total_sales}" },
  { label: "Lead Qualification Score", value: "{lead_qualification_score}" },
  { label: "Pipeline Type", value: "{pipeline_type}" },
  { label: "Pipeline Stage", value: "{pipeline_stage}" },
  { label: "Client Company", value: "{client_company}" },
  { label: "Client Name", value: "{client_name}" },
  { label: "Client First Name", value: "{client_first_name}" },
  { label: "Client Last Name", value: "{client_last_name}" },
  { label: "Client Phone", value: "{client_phone}" },
  { label: "Client Email", value: "{client_email}" },
  { label: "Client Brokerage", value: "{client_brokerage}" },
];

const FieldSelector = ({ onInsert }: FieldSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleCopy = (field: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(field);
    toast.success("Field copied to clipboard");
  };

  const handleInsert = (field: string) => {
    onInsert(field);
    setOpen(false);
    toast.success("Field inserted");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <Plus className="mr-2 h-4 w-4" />
          Insert Field
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-background z-50 max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel className="sticky top-0 bg-background z-10">Available Fields</DropdownMenuLabel>
        <DropdownMenuSeparator className="sticky top-8 bg-background z-10" />
        {MERGE_FIELDS.map((field) => (
          <DropdownMenuItem
            key={field.value}
            onClick={() => handleInsert(field.value)}
            onContextMenu={(e) => handleCopy(field.value, e)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="text-sm">{field.label}</span>
            <div className="flex items-center gap-1">
              <code className="text-xs bg-muted px-1 rounded whitespace-nowrap">{field.value}</code>
              <Copy
                className="h-3 w-3 opacity-50 hover:opacity-100 flex-shrink-0"
                onClick={(e) => handleCopy(field.value, e)}
              />
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground sticky bottom-0 bg-background">
          Click to insert • Right-click to copy
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FieldSelector;
