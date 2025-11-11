import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Save, X, Plus, Database, Eye, Target, Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FieldDefinition {
  id: string;
  field_name: string;
  display_name: string;
  description: string | null;
  field_type: string;
  allowed_values: any[] | null;
  use_ai_matching: boolean;
  entity_types: string[];
  visible_in: string[];
  is_required: boolean;
  matching_weight: number;
  field_group: string | null;
  sort_order: number;
  active: boolean;
}

const ENTITY_TYPES = [
  { value: 'real_estate_agent', label: 'Real Estate Agent' },
  { value: 'mortgage_officer', label: 'Mortgage Officer' },
  { value: 'client_real_estate', label: 'Client (Real Estate)' },
  { value: 'client_mortgage', label: 'Client (Mortgage)' },
];

const VISIBILITY_OPTIONS = [
  { value: 'profile', label: 'Profile Page', icon: '👤' },
  { value: 'pro_dashboard', label: 'Pro Dashboard', icon: '📊' },
  { value: 'client_dashboard', label: 'Client Dashboard', icon: '🏢' },
  { value: 'admin_dashboard', label: 'Admin Dashboard', icon: '⚙️' },
  { value: 'matching', label: 'Matching Engine', icon: '🎯' },
];

const FIELD_GROUPS = [
  'personal',
  'business',
  'location',
  'performance',
  'preferences',
  'skills',
  'other',
];

// Data type reference organized by SQL types
const DATA_TYPE_REFERENCE = {
  text: [
    'full_name', 'first_name', 'last_name', 'email', 'email2', 'phone', 'phone2',
    'address', 'full_address', 'bio', 'notes', 'website_url', 'linkedin_url',
    'facebook_url', 'twitter_url', 'instagram_url', 'tiktok_url', 'youtube_url',
    'homes_com_url', 'realtor_com_url', 'profile_url', 'pro_type', 'brokerage',
    'company', 'company_name', 'license_number', 'license_type', 'nmls_id', 'lender_name',
    'status', 'pipeline_stage', 'pipeline_type', 'original_status', 'source',
    'specialization', 'motivation', 'client_email', 'client_phone', 'lead_source',
    'best_time_to_contact', 'preferred_contact_method', 'utm_source', 'utm_campaign',
    'utm_medium', 'ip_address', 'signup_ip', 'user_agent', 'referrer_url',
    'top_lender', 'top_originator', 'partnership_fee_structure', 'lender_company_nmls',
    'match_to', 'image_url', 'county', 'user_type', 'needs', 'team', 'contact_name'
  ],
  integer: [
    'experience', 
    'transactions', 'transactions_per_year', 'yearly_sales', // All aliases for annual transaction count
    'transactions_12mo',
    'buyer_units', 'seller_units', 'dual_units', 'total_units', 'team_size',
    'dom', 'profile_completeness', 'profile_views', 'times_contacted', 'contact_attempts',
    'engagement_score', 'form_submission_count', 'avg_close_time_days',
    'monthly_loan_volume', 'annual_loan_volume', 'loans_closed_12mo',
    'max_loans_per_month'
  ],
  numeric: [
    'total_sales', 'total_volume_12mo', 'avg_sale_price', 'average_sale_price', 'avg_sale',
    'average_deal', 'buyer_volume', 'buyer_financed', 'seller_volume',
    'seller_financed', 'dual_volume', 'total_volume', 'percent_financed',
    'buyer_percentage', 'seller_percentage', 'purchase_percentage',
    'conventional_percentage', 'seller_side_percentage', 'refinance_percentage',
    'on_time_close_rate', 'response_rate', 'top_lender_share', 'top_lender_volume',
    'top_originator_share', 'top_originator_volume', 'avg_loan_size',
    'low_price_point', 'high_price_point', 'list_to_sell_ratio',
    'price_reductions', 'off_market_deals', 'luxury_volume', 'commercial_volume',
    'rental_volume', 'lead_price', 'price_per_lead', 'qualification_score', 'price_range_min',
    'price_range_max', 'radius'
  ],
  boolean: [
    'has_photo', 'has_bio', 'is_claimed', 'open_to_company_offers',
    'interested_in_opportunities', 'matching_completed', 'market_coverage_completed',
    'profile_completed', 'onboarding_completed', 'nmls_verified',
    'provides_leads_to_agents', 'co_marketing_available', 'accepts_agent_partnerships',
    'accepting_new_partners', 'active'
  ],
  'text array': [
    'cities', 'states', 'zip_codes', 'counties', 'primary_neighborhoods',
    'farm_areas', 'tags', 'wants', 'skills', 'languages', 'designations',
    'certifications', 'awards', 'property_types', 'license_states',
    'loan_types_specialized', 'loan_purposes', 'client_types_served',
    'specializations'
  ],
  jsonb: [
    'coverage_areas', 'price_range'
  ],
  timestamp: [
    'date', 'date_scraped', 'claimed_at', 'became_lead_at',
    'last_form_submission_at', 'last_contacted_at', 'last_responded_at',
    'last_viewed_at', 'nmls_verified_at', 'last_sale_date'
  ]
};

export default function FieldManagement() {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [isDataTypeOpen, setIsDataTypeOpen] = useState(false);

  useEffect(() => {
    fetchFields();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('field_definitions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'field_definitions'
        },
        (payload) => {
          console.log('Field definition changed:', payload);
          fetchFields(); // Refresh the list
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFields = async () => {
    try {
      const { data, error } = await supabase
        .from("field_definitions")
        .select("*")
        .order("field_group", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) throw error;
      
      // Transform the data to ensure allowed_values is an array
      const transformedData = (data || []).map(field => ({
        ...field,
        allowed_values: Array.isArray(field.allowed_values) ? field.allowed_values : null,
      }));
      
      setFields(transformedData as FieldDefinition[]);
    } catch (error: any) {
      console.error("Error fetching fields:", error);
      toast.error("Failed to load field definitions");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: FieldDefinition) => {
    setEditingField(field);
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingField) return;

    try {
      const { error } = await supabase
        .from("field_definitions")
        .update({
          display_name: editingField.display_name,
          description: editingField.description,
          entity_types: editingField.entity_types,
          visible_in: editingField.visible_in,
          is_required: editingField.is_required,
          matching_weight: editingField.matching_weight,
          field_group: editingField.field_group,
          active: editingField.active,
        })
        .eq("id", editingField.id);

      if (error) throw error;

      toast.success("Field updated successfully");
      setIsEditModalOpen(false);
      fetchFields();
    } catch (error: any) {
      console.error("Error updating field:", error);
      toast.error("Failed to update field");
    }
  };

  const filteredFields = fields.filter((field) => {
    const matchesSearch =
      field.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = filterGroup === "all" || field.field_group === filterGroup;
    
    const matchesEntity = 
      filterEntity === "all" || 
      field.entity_types.includes(filterEntity);

    return matchesSearch && matchesGroup && matchesEntity;
  });

  const groupedFields = filteredFields.reduce((acc, field) => {
    const group = field.field_group || 'other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, FieldDefinition[]>);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Database className="h-6 w-6" />
                Field Management System
              </CardTitle>
              <CardDescription className="mt-2">
                Control all fields across the platform - define who sees what, control matching weights, and ensure data consistency
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Data Type Reference */}
          <Collapsible open={isDataTypeOpen} onOpenChange={setIsDataTypeOpen}>
            <Card className="border-primary/20">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Info className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <CardTitle className="text-lg">Database Field Types Reference</CardTitle>
                        <CardDescription>
                          Complete mapping of Zapier fields to database column types
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {isDataTypeOpen ? 'Hide' : 'Show'} Details
                    </Badge>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid gap-4">
                    {Object.entries(DATA_TYPE_REFERENCE).map(([dataType, fields]) => (
                      <div key={dataType} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="font-mono text-xs">
                            {dataType}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {fields.length} fields
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pl-4">
                          {fields.map((field) => (
                            <Badge
                              key={field}
                              variant="outline"
                              className="text-xs font-mono"
                            >
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <Input
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {FIELD_GROUPS.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {ENTITY_TYPES.map((entity) => (
                  <SelectItem key={entity.value} value={entity.value}>
                    {entity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              {filteredFields.length} fields
            </div>
          </div>

          {/* Fields by Group */}
          {loading ? (
            <div className="text-center py-8">Loading fields...</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedFields).map(([group, groupFields]) => (
                <div key={group}>
                  <h3 className="text-lg font-semibold mb-3 capitalize flex items-center gap-2">
                    {group === 'location' && '📍'}
                    {group === 'personal' && '👤'}
                    {group === 'business' && '💼'}
                    {group === 'performance' && '📈'}
                    {group === 'preferences' && '⚙️'}
                    {group === 'skills' && '🎓'}
                    {group} ({groupFields.length})
                  </h3>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Field Name</TableHead>
                          <TableHead>Display Name</TableHead>
                          <TableHead className="w-[120px]">Type</TableHead>
                          <TableHead>Applies To</TableHead>
                          <TableHead>Visible In</TableHead>
                          <TableHead className="text-center">Match Weight</TableHead>
                          <TableHead className="text-center">Required</TableHead>
                          <TableHead className="text-center">Active</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupFields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                  {field.field_name}
                                </code>
                                <span className="text-xs text-muted-foreground">
                                  Internal field name
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {field.display_name}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {/* Input Type Badge: Button or Filled In */}
                                <Badge 
                                  variant={
                                    field.field_type === 'select' || field.field_type === 'multi_select' || field.field_type === 'boolean'
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs w-fit font-bold"
                                >
                                  {field.field_type === 'select' || field.field_type === 'multi_select' || field.field_type === 'boolean'
                                    ? '🔘 Button'
                                    : '✍️ Filled In'}
                                </Badge>
                                
                                {/* Field Type Detail */}
                                <Badge 
                                  variant="outline"
                                  className="text-xs w-fit"
                                >
                                  {field.field_type}
                                </Badge>
                                
                                {field.use_ai_matching && (
                                  <Badge variant="default" className="text-xs w-fit bg-purple-600">
                                    🤖 AI Match
                                  </Badge>
                                )}
                                {field.allowed_values && field.allowed_values.length > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {field.allowed_values.length} options
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {field.entity_types.map((type) => (
                                  <Badge key={type} variant="outline" className="text-xs">
                                    {type.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {field.visible_in.map((location) => {
                                  const option = VISIBILITY_OPTIONS.find(o => o.value === location);
                                  return (
                                    <Badge key={location} variant="secondary" className="text-xs">
                                      {option?.icon} {location.replace('_', ' ')}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={field.matching_weight > 20 ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {field.matching_weight}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {field.is_required ? (
                                <Badge variant="destructive" className="text-xs">Yes</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">No</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {field.active ? (
                                <Badge variant="default" className="text-xs">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(field)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Field: {editingField?.field_name}</DialogTitle>
            <DialogDescription>
              Configure how this field appears and behaves across the system
            </DialogDescription>
          </DialogHeader>

          {editingField && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={editingField.display_name}
                    onChange={(e) =>
                      setEditingField({ ...editingField, display_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingField.description || ""}
                    onChange={(e) =>
                      setEditingField({ ...editingField, description: e.target.value })
                    }
                    placeholder="What is this field used for?"
                  />
                </div>

                <div>
                  <Label htmlFor="field_group">Field Group</Label>
                  <Select
                    value={editingField.field_group || "other"}
                    onValueChange={(value) =>
                      setEditingField({ ...editingField, field_group: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_GROUPS.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group.charAt(0).toUpperCase() + group.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Field Type & Matching Info */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Field Type</Label>
                    <Badge variant="default" className="text-xs">
                      {editingField.field_type}
                    </Badge>
                  </div>
                  
                  {editingField.use_ai_matching && (
                    <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                      <Badge variant="default" className="bg-purple-600">🤖 AI Matching</Badge>
                      <span className="text-xs">This field uses AI for semantic matching</span>
                    </div>
                  )}
                  
                  {editingField.allowed_values && editingField.allowed_values.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs">Predefined Options ({editingField.allowed_values.length})</Label>
                      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 bg-background rounded border">
                        {editingField.allowed_values.map((value: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {value}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        ✓ These options enable exact matching without AI
                      </p>
                    </div>
                  )}
                  
                  {editingField.field_type === 'text' && !editingField.use_ai_matching && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                      <Badge variant="outline" className="border-amber-600 text-amber-600">⚠️ Warning</Badge>
                      <span>Free text fields cannot be matched reliably. Consider adding predefined options or enabling AI matching.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Entity Types */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Applies To (Entity Types)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {ENTITY_TYPES.map((entity) => (
                    <div key={entity.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`entity-${entity.value}`}
                        checked={editingField.entity_types.includes(entity.value)}
                        onCheckedChange={(checked) => {
                          const newTypes = checked
                            ? [...editingField.entity_types, entity.value]
                            : editingField.entity_types.filter((t) => t !== entity.value);
                          setEditingField({ ...editingField, entity_types: newTypes });
                        }}
                      />
                      <label
                        htmlFor={`entity-${entity.value}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {entity.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Visible In
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {VISIBILITY_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`visible-${option.value}`}
                        checked={editingField.visible_in.includes(option.value)}
                        onCheckedChange={(checked) => {
                          const newVisible = checked
                            ? [...editingField.visible_in, option.value]
                            : editingField.visible_in.filter((v) => v !== option.value);
                          setEditingField({ ...editingField, visible_in: newVisible });
                        }}
                      />
                      <label
                        htmlFor={`visible-${option.value}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {option.icon} {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matching Weight */}
              <div className="space-y-3">
                <Label>
                  Matching Weight: {editingField.matching_weight}
                  <span className="text-xs text-muted-foreground ml-2">
                    (0 = not used in matching, 100 = highest priority)
                  </span>
                </Label>
                <Slider
                  value={[editingField.matching_weight]}
                  onValueChange={([value]) =>
                    setEditingField({ ...editingField, matching_weight: value })
                  }
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_required"
                    checked={editingField.is_required}
                    onCheckedChange={(checked) =>
                      setEditingField({ ...editingField, is_required: !!checked })
                    }
                  />
                  <label htmlFor="is_required" className="text-sm font-medium cursor-pointer">
                    Required Field
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={editingField.active}
                    onCheckedChange={(checked) =>
                      setEditingField({ ...editingField, active: !!checked })
                    }
                  />
                  <label htmlFor="active" className="text-sm font-medium cursor-pointer">
                    Active
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSave} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}