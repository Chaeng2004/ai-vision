export type RestrictionCategory = 'religious' | 'lifestyle' | 'allergen';

export type DietaryRestriction =
  | 'halal'
  | 'halal_strict'
  | 'vegan'
  | 'vegetarian'
  | 'nut_allergy'
  | 'gluten_free'
  | 'dairy_free'
  | 'soy_free'
  | 'shellfish_allergy'
  | 'egg_free'
  | 'fish_allergy';

export type RestrictionMeta = {
  id: DietaryRestriction;
  label: string;
  emoji: string;
  category: RestrictionCategory;
  description: string;
};

export type IngredientClassification =
  | 'porcine'
  | 'bovine'
  | 'animal_derived'
  | 'allergen'
  | 'plant'
  | 'synthetic'
  | 'unknown';

export type ScanVerdict = 'GO' | 'CAUTION' | 'NO_GO';

export type IngredientAnalysis = {
  ingredient: string;
  normalized?: string;
  classification: IngredientClassification;
  confidence?: 'high' | 'medium' | 'low';
  evidence?: { matched_text?: string };
  is_halal_concern: boolean;
  is_vegan_concern: boolean;
  allergen_flags: string[];
  why_flagged?: string;
  notes?: string | null;
};

export type ScanResult = {
  status: ScanVerdict;
  verdict_reason: string;
  recommendation: string;
  extracted_text: string[];
  ingredients_detected: string[];
  flagged_ingredients: string[];
  analysis: IngredientAnalysis[];
  report?: {
    summary?: string;
    highlights?: string[];
    next_steps?: string[];
    limitations?: string[];
  };
};

export type ScanHistoryItem = {
  id: string;
  timestamp: number;
  imageUri: string | null;
  restrictions: DietaryRestriction[];
  result: ScanResult;
};

