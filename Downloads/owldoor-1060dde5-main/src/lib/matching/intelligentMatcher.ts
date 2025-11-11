import { MultiProviderAI } from '../ai/multiProviderClient';

export interface FieldDefinition {
  field_name: string;
  field_type: string;
  use_ai_matching: boolean;
  matching_weight: number;
  allowed_values: string[] | null;
}

export interface MatchBreakdown {
  total_score: number;
  field_scores: {
    field_name: string;
    score: number;
    max_score: number;
    match_type: 'exact' | 'overlap' | 'range' | 'semantic' | 'none';
    details: string;
  }[];
  geographic_score: number;
  performance_score: number;
  ai_semantic_score: number;
}

export interface Entity {
  [key: string]: any;
}

export class IntelligentMatcher {
  /**
   * Calculate match score between two entities using field definitions
   */
  static async calculateMatch(
    entity1: Entity,
    entity2: Entity,
    fieldDefinitions: FieldDefinition[],
    entity1Type: string,
    entity2Type: string
  ): Promise<MatchBreakdown> {
    const breakdown: MatchBreakdown = {
      total_score: 0,
      field_scores: [],
      geographic_score: 0,
      performance_score: 0,
      ai_semantic_score: 0,
    };

    // Get matchable fields (those with weight > 0)
    const matchableFields = fieldDefinitions.filter(f => f.matching_weight > 0);

    // Calculate total possible weight
    const totalWeight = matchableFields.reduce((sum, f) => sum + f.matching_weight, 0);

    // Score each field
    for (const field of matchableFields) {
      const fieldScore = await this.scoreField(
        field,
        entity1[field.field_name],
        entity2[field.field_name]
      );

      // Normalize score to field's weight
      const weightedScore = (fieldScore.score / 100) * field.matching_weight;

      breakdown.field_scores.push({
        field_name: field.field_name,
        score: weightedScore,
        max_score: field.matching_weight,
        match_type: fieldScore.match_type,
        details: fieldScore.details,
      });

      // Accumulate scores by category
      if (this.isGeographicField(field.field_name)) {
        breakdown.geographic_score += weightedScore;
      } else if (this.isPerformanceField(field.field_name)) {
        breakdown.performance_score += weightedScore;
      } else if (fieldScore.match_type === 'semantic') {
        breakdown.ai_semantic_score += weightedScore;
      }

      breakdown.total_score += weightedScore;
    }

    // Normalize total score to 0-100 scale
    breakdown.total_score = totalWeight > 0 
      ? Math.round((breakdown.total_score / totalWeight) * 100)
      : 0;

    return breakdown;
  }

  /**
   * Score a single field based on its type and values
   */
  private static async scoreField(
    field: FieldDefinition,
    value1: any,
    value2: any
  ): Promise<{ score: number; match_type: 'exact' | 'overlap' | 'range' | 'semantic' | 'none'; details: string }> {
    // Handle null/undefined values
    if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) {
      return { score: 0, match_type: 'none', details: 'One or both values missing' };
    }

    // Route to appropriate scoring method based on field type
    switch (field.field_type) {
      case 'text':
      case 'textarea':
        return await this.scoreTextFields(field, value1, value2);
      
      case 'number':
      case 'currency':
        return this.scoreNumericFields(field, value1, value2);
      
      case 'array':
      case 'multi_select':
        return this.scoreArrayFields(field, value1, value2);
      
      case 'boolean':
        return this.scoreBooleanFields(value1, value2);
      
      case 'select':
      case 'enum':
        return this.scoreSelectFields(value1, value2);
      
      default:
        return { score: 0, match_type: 'none', details: 'Unknown field type' };
    }
  }

  /**
   * Score text fields - use AI semantic matching if enabled
   */
  private static async scoreTextFields(
    field: FieldDefinition,
    text1: string,
    text2: string
  ): Promise<{ score: number; match_type: 'exact' | 'semantic' | 'none'; details: string }> {
    const str1 = String(text1).toLowerCase().trim();
    const str2 = String(text2).toLowerCase().trim();

    // Exact match
    if (str1 === str2) {
      return { score: 100, match_type: 'exact', details: 'Exact text match' };
    }

    // Use AI semantic matching if enabled
    if (field.use_ai_matching) {
      try {
        const result = await MultiProviderAI.semanticMatch(
          str1,
          str2,
          `Comparing ${field.field_name} fields for matching`
        );
        
        return {
          score: Math.round(result.score * 100),
          match_type: 'semantic',
          details: result.reasoning,
        };
      } catch (error) {
        console.error(`AI semantic matching failed for ${field.field_name}:`, error);
        // Fallback to simple string similarity
        return this.simpleStringSimilarity(str1, str2);
      }
    }

    // Fallback to simple string similarity
    return this.simpleStringSimilarity(str1, str2);
  }

  /**
   * Simple string similarity as fallback
   */
  private static simpleStringSimilarity(str1: string, str2: string): { score: number; match_type: 'semantic'; details: string } {
    // Check for substring match
    const longerStr = str1.length > str2.length ? str1 : str2;
    const shorterStr = str1.length > str2.length ? str2 : str1;
    
    if (longerStr.includes(shorterStr)) {
      const score = Math.round((shorterStr.length / longerStr.length) * 70);
      return { score, match_type: 'semantic', details: `Partial match (${score}% similarity)` };
    }

    return { score: 0, match_type: 'semantic', details: 'No text similarity' };
  }

  /**
   * Score numeric fields - check if values are within reasonable range
   */
  private static scoreNumericFields(
    field: FieldDefinition,
    num1: number,
    num2: number
  ): { score: number; match_type: 'range' | 'exact'; details: string } {
    const n1 = Number(num1);
    const n2 = Number(num2);

    if (isNaN(n1) || isNaN(n2)) {
      return { score: 0, match_type: 'range', details: 'Invalid numeric values' };
    }

    // Exact match
    if (n1 === n2) {
      return { score: 100, match_type: 'exact', details: 'Exact numeric match' };
    }

    // Calculate range-based score
    // The closer the numbers, the higher the score
    const difference = Math.abs(n1 - n2);
    const average = (n1 + n2) / 2;
    const percentDifference = average !== 0 ? (difference / average) * 100 : 100;

    let score = 0;
    if (percentDifference < 10) {
      score = 90;
    } else if (percentDifference < 25) {
      score = 70;
    } else if (percentDifference < 50) {
      score = 50;
    } else if (percentDifference < 75) {
      score = 30;
    } else if (percentDifference < 100) {
      score = 10;
    }

    return {
      score,
      match_type: 'range',
      details: `${percentDifference.toFixed(1)}% difference`,
    };
  }

  /**
   * Score array fields - calculate overlap percentage
   */
  private static scoreArrayFields(
    field: FieldDefinition,
    arr1: any[],
    arr2: any[]
  ): { score: number; match_type: 'overlap'; details: string } {
    const array1 = Array.isArray(arr1) ? arr1 : [];
    const array2 = Array.isArray(arr2) ? arr2 : [];

    if (array1.length === 0 || array2.length === 0) {
      return { score: 0, match_type: 'overlap', details: 'One or both arrays empty' };
    }

    // Normalize arrays (lowercase strings for comparison)
    const normalized1 = array1.map(v => String(v).toLowerCase().trim());
    const normalized2 = array2.map(v => String(v).toLowerCase().trim());

    // Calculate overlap
    const intersection = normalized1.filter(v => normalized2.includes(v));
    const union = [...new Set([...normalized1, ...normalized2])];

    const overlapCount = intersection.length;
    const totalCount = union.length;
    const score = totalCount > 0 ? Math.round((overlapCount / totalCount) * 100) : 0;

    return {
      score,
      match_type: 'overlap',
      details: `${overlapCount} of ${totalCount} items match (${intersection.join(', ') || 'none'})`,
    };
  }

  /**
   * Score boolean fields
   */
  private static scoreBooleanFields(
    bool1: boolean,
    bool2: boolean
  ): { score: number; match_type: 'exact'; details: string } {
    const match = bool1 === bool2;
    return {
      score: match ? 100 : 0,
      match_type: 'exact',
      details: match ? 'Both values match' : 'Values differ',
    };
  }

  /**
   * Score select/enum fields
   */
  private static scoreSelectFields(
    val1: string,
    val2: string
  ): { score: number; match_type: 'exact'; details: string } {
    const str1 = String(val1).toLowerCase().trim();
    const str2 = String(val2).toLowerCase().trim();
    const match = str1 === str2;

    return {
      score: match ? 100 : 0,
      match_type: 'exact',
      details: match ? `Both selected: ${val1}` : `Different selections: ${val1} vs ${val2}`,
    };
  }

  /**
   * Check if field is geographic
   */
  private static isGeographicField(fieldName: string): boolean {
    return ['cities', 'states', 'zip_codes', 'counties', 'primary_neighborhoods'].includes(fieldName);
  }

  /**
   * Check if field is performance-related
   */
  private static isPerformanceField(fieldName: string): boolean {
    return [
      'experience',
      'transactions',
      'total_volume_12mo',
      'transactions_12mo',
      'annual_loan_volume',
      'qualification_score',
    ].includes(fieldName);
  }

  /**
   * Filter matches by minimum score threshold
   */
  static filterByThreshold(
    matches: Array<{ breakdown: MatchBreakdown; [key: string]: any }>,
    minScore: number = 30
  ): Array<{ breakdown: MatchBreakdown; [key: string]: any }> {
    return matches.filter(m => m.breakdown.total_score >= minScore);
  }

  /**
   * Sort matches by score (descending)
   */
  static sortByScore(
    matches: Array<{ breakdown: MatchBreakdown; [key: string]: any }>
  ): Array<{ breakdown: MatchBreakdown; [key: string]: any }> {
    return matches.sort((a, b) => b.breakdown.total_score - a.breakdown.total_score);
  }
}
