import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { DietaryRestriction, RestrictionMeta } from '../types';
import { RESTRICTIONS } from '../constants';

interface UseProfileReturn {
  restrictions: DietaryRestriction[];
  activeRestrictionsMeta: RestrictionMeta[];
  hasRestrictions: boolean;
  isSelected: (r: DietaryRestriction) => boolean;
  toggle: (r: DietaryRestriction) => void;
  setAll: (r: DietaryRestriction[]) => void;
  clearAll: () => void;
  restrictionsByCategory: {
    religious: RestrictionMeta[];
    lifestyle: RestrictionMeta[];
    allergen: RestrictionMeta[];
  };
}

export function useProfile(): UseProfileReturn {
  const restrictions = useAppStore((s) => s.restrictions);
  const toggleRestriction = useAppStore((s) => s.toggleRestriction);
  const setRestrictions = useAppStore((s) => s.setRestrictions);

  const isSelected = useCallback(
    (r: DietaryRestriction) => restrictions.includes(r),
    [restrictions]
  );

  const clearAll = useCallback(() => setRestrictions([]), [setRestrictions]);

  const activeRestrictionsMeta = RESTRICTIONS.filter((r) =>
    restrictions.includes(r.id)
  );

  const restrictionsByCategory = {
    religious: RESTRICTIONS.filter((r) => r.category === 'religious'),
    lifestyle: RESTRICTIONS.filter((r) => r.category === 'lifestyle'),
    allergen: RESTRICTIONS.filter((r) => r.category === 'allergen'),
  };

  return {
    restrictions,
    activeRestrictionsMeta,
    hasRestrictions: restrictions.length > 0,
    isSelected,
    toggle: toggleRestriction,
    setAll: setRestrictions,
    clearAll,
    restrictionsByCategory,
  };
}