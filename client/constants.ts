import Constants from 'expo-constants';

import type { DietaryRestriction, RestrictionMeta } from './types';

const envBase = process.env.EXPO_PUBLIC_API_BASE;

/**
 * Must include `/api` because the FastAPI server mounts the router at that prefix.
 * Example: `http://192.168.1.10:8000/api`
 */
export const API_BASE: string = (() => {
  if (envBase && envBase.trim().length > 0) return envBase.replace(/\/+$/, '');
  // Best-effort defaults; for real devices, set EXPO_PUBLIC_API_BASE to your LAN IP.
  return 'http://10.221.77.31:8000/api';
})();

export const Colors = {
  white: '#FFFFFF',
  bg: '#0B0B10',
  bgElevated: '#12121B',
  bgCard: '#141420',
  border: '#24243A',

  text: '#F2F3FF',
  textSecondary: '#C8CAE8',
  textMuted: '#8A8FB8',

  accent: '#7C5CFF',
  accentLight: '#D6CCFF',
  accentDim: 'rgba(124,92,255,0.16)',

  go: '#20D39B',
  caution: '#FFB020',
  nogo: '#FF4D6A',
  nogoDim: 'rgba(255,77,106,0.10)',
} as const;

export const RESTRICTIONS: RestrictionMeta[] = [
  {
    id: 'halal',
    label: 'Halal (avoid pork)',
    emoji: '☪',
    category: 'religious',
    description: 'Blocks porcine ingredients',
  },
  {
    id: 'halal_strict',
    label: 'Halal (strict)',
    emoji: '🕌',
    category: 'religious',
    description: 'Blocks porcine + bovine unless certified',
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    emoji: '🥗',
    category: 'lifestyle',
    description: 'Avoids meat-derived ingredients',
  },
  {
    id: 'vegan',
    label: 'Vegan',
    emoji: '🌱',
    category: 'lifestyle',
    description: 'Avoids all animal-derived ingredients',
  },

  {
    id: 'nut_allergy',
    label: 'Nut allergy',
    emoji: '🥜',
    category: 'allergen',
    description: 'Flags nut-derived ingredients',
  },
  {
    id: 'gluten_free',
    label: 'Gluten-free',
    emoji: '🌾',
    category: 'allergen',
    description: 'Flags gluten sources (wheat/barley/rye)',
  },
  {
    id: 'dairy_free',
    label: 'Dairy-free',
    emoji: '🥛',
    category: 'allergen',
    description: 'Flags dairy-derived ingredients',
  },
  {
    id: 'soy_free',
    label: 'Soy-free',
    emoji: '🫘',
    category: 'allergen',
    description: 'Flags soy-derived ingredients',
  },
  {
    id: 'shellfish_allergy',
    label: 'Shellfish allergy',
    emoji: '🦐',
    category: 'allergen',
    description: 'Flags shellfish-derived ingredients',
  },
  {
    id: 'egg_free',
    label: 'Egg-free',
    emoji: '🥚',
    category: 'allergen',
    description: 'Flags egg-derived ingredients',
  },
  {
    id: 'fish_allergy',
    label: 'Fish allergy',
    emoji: '🐟',
    category: 'allergen',
    description: 'Flags fish-derived ingredients',
  },
];

export const CLASSIFICATION_LABELS: Record<
  string,
  { label: string; color: string }
> = {
  porcine: { label: 'Porcine', color: Colors.nogo },
  bovine: { label: 'Bovine', color: '#FF6B3D' },
  animal_derived: { label: 'Animal-derived', color: Colors.caution },
  allergen: { label: 'Allergen', color: Colors.nogo },
  plant: { label: 'Plant', color: Colors.go },
  synthetic: { label: 'Synthetic', color: '#4AA8FF' },
  unknown: { label: 'Unknown', color: Colors.textMuted },
};

