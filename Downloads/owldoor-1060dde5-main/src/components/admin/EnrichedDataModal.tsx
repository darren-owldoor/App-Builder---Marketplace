import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface EnrichedDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
  type: "person" | "company";
}

export const EnrichedDataModal = ({ open, onOpenChange, data, type }: EnrichedDataModalProps) => {
  if (!data) return null;

  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A";
    if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "N/A";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  const renderPersonData = () => {
    const sections = [
      {
        title: "Basic Info",
        fields: [
          { label: "Full Name", value: data.full_name },
          { label: "First Name", value: data.first_name },
          { label: "Last Name", value: data.last_name },
          { label: "Gender", value: data.gender },
          { label: "Birth Year", value: data.birth_year },
        ]
      },
      {
        title: "Contact",
        fields: [
          { label: "Emails", value: data.emails },
          { label: "Phone Numbers", value: data.phone_numbers },
          { label: "LinkedIn", value: data.linkedin_url },
          { label: "Facebook", value: data.facebook_url },
          { label: "Twitter", value: data.twitter_url },
        ]
      },
      {
        title: "Location",
        fields: [
          { label: "Location Name", value: data.location_name },
          { label: "Street Address", value: data.street_address },
          { label: "Locality", value: data.location_locality },
          { label: "Region", value: data.location_region },
          { label: "Country", value: data.location_country },
          { label: "Postal Code", value: data.location_postal_code },
        ]
      },
      {
        title: "Current Job",
        fields: [
          { label: "Job Title", value: data.job_title },
          { label: "Company", value: data.job_company_name },
          { label: "Job Start Date", value: data.job_start_date },
          { label: "Job Title Role", value: data.job_title_role },
          { label: "Job Title Sub Role", value: data.job_title_sub_role },
          { label: "Job Company Industry", value: data.job_company_industry },
          { label: "Job Company Size", value: data.job_company_size },
        ]
      },
      {
        title: "Skills & Education",
        fields: [
          { label: "Skills", value: data.skills },
          { label: "Education", value: data.education?.map((e: any) => `${e.school?.name} - ${e.degrees?.join(", ")}`).join("; ") },
          { label: "Certifications", value: data.certifications },
        ]
      },
      {
        title: "Experience",
        fields: [
          { label: "Experience (companies)", value: data.experience?.map((e: any) => `${e.company?.name} - ${e.title?.name}`).join("; ") },
          { label: "Industry", value: data.industry },
          { label: "Interests", value: data.interests },
        ]
      }
    ];

    return sections.map((section, idx) => (
      <Card key={idx} className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">{section.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {section.fields.map((field, fieldIdx) => (
            <div key={fieldIdx} className="grid grid-cols-3 gap-2">
              <span className="font-medium text-sm text-muted-foreground">{field.label}:</span>
              <span className="col-span-2 text-sm">{renderValue(field.value)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    ));
  };

  const renderCompanyData = () => {
    const sections = [
      {
        title: "Basic Info",
        fields: [
          { label: "Company Name", value: data.name },
          { label: "Legal Name", value: data.legal_name },
          { label: "Display Name", value: data.display_name },
          { label: "Website", value: data.website },
          { label: "Founded", value: data.founded },
        ]
      },
      {
        title: "Location",
        fields: [
          { label: "Locality", value: data.location?.locality },
          { label: "Region", value: data.location?.region },
          { label: "Country", value: data.location?.country },
          { label: "Postal Code", value: data.location?.postal_code },
          { label: "Street Address", value: data.location?.street_address },
        ]
      },
      {
        title: "Company Details",
        fields: [
          { label: "Industry", value: data.industry },
          { label: "Size", value: data.size },
          { label: "Employee Count", value: data.employee_count },
          { label: "Type", value: data.type },
          { label: "Tags", value: data.tags },
        ]
      },
      {
        title: "Contact & Social",
        fields: [
          { label: "LinkedIn", value: data.linkedin_url },
          { label: "Facebook", value: data.facebook_url },
          { label: "Twitter", value: data.twitter_url },
          { label: "Description", value: data.summary },
        ]
      }
    ];

    return sections.map((section, idx) => (
      <Card key={idx} className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">{section.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {section.fields.map((field, fieldIdx) => (
            <div key={fieldIdx} className="grid grid-cols-3 gap-2">
              <span className="font-medium text-sm text-muted-foreground">{field.label}:</span>
              <span className="col-span-2 text-sm">{renderValue(field.value)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Enriched Data
            <Badge variant="secondary">{type === "person" ? "Person" : "Company"}</Badge>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {type === "person" ? renderPersonData() : renderCompanyData()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
