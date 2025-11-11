import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FieldDefinition {
  id: string;
  field_name: string;
  display_name: string;
  description: string | null;
  field_type: string;
  allowed_values: string[] | null;
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

interface UseFieldDefinitionsOptions {
  entityType?: string;
  visibleIn?: string;
  fieldGroup?: string;
  activeOnly?: boolean;
}

export const useFieldDefinitions = (options: UseFieldDefinitionsOptions = {}) => {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchFields();
  }, [options.entityType, options.visibleIn, options.fieldGroup]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("field_definitions")
        .select("*")
        .order("sort_order", { ascending: true });

      // Apply filters
      if (options.activeOnly !== false) {
        query = query.eq("active", true);
      }

      if (options.fieldGroup) {
        query = query.eq("field_group", options.fieldGroup);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      let filteredFields = data || [];

      // Filter by entity type (array contains)
      if (options.entityType) {
        filteredFields = filteredFields.filter((field: any) =>
          field.entity_types.includes(options.entityType)
        );
      }

      // Filter by visible_in (array contains)
      if (options.visibleIn) {
        filteredFields = filteredFields.filter((field: any) =>
          field.visible_in.includes(options.visibleIn)
        );
      }

      // Transform allowed_values to ensure it's an array or null
      const transformedFields = filteredFields.map((field: any) => ({
        ...field,
        allowed_values: Array.isArray(field.allowed_values)
          ? field.allowed_values
          : null,
      }));

      setFields(transformedFields);
      setError(null);
    } catch (err) {
      console.error("Error fetching field definitions:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const getFieldByName = (fieldName: string) => {
    return fields.find((f) => f.field_name === fieldName);
  };

  const getFieldsByGroup = (group: string) => {
    return fields.filter((f) => f.field_group === group);
  };

  const getMatchableFields = () => {
    return fields.filter((f) => f.matching_weight > 0);
  };

  return {
    fields,
    loading,
    error,
    refetch: fetchFields,
    getFieldByName,
    getFieldsByGroup,
    getMatchableFields,
  };
};
