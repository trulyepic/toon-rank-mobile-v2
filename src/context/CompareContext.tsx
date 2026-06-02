import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { RankedSeries } from "../types/series";
import { canAddToCompare, computeNextCompare, MAX_COMPARE_ITEMS } from "../utils/compare";

export { MAX_COMPARE_ITEMS };

type CompareContextValue = {
  compareItems: RankedSeries[];
  toggleCompare: (series: RankedSeries) => void;
  isSelected: (seriesId: number) => boolean;
  clearCompare: () => void;
  canAddMore: boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: PropsWithChildren) {
  const [compareItems, setCompareItems] = useState<RankedSeries[]>([]);

  const toggleCompare = useCallback((series: RankedSeries) => {
    setCompareItems((current) => computeNextCompare(current, series));
  }, []);

  const isSelected = useCallback(
    (seriesId: number) => compareItems.some((item) => item.id === seriesId),
    [compareItems],
  );

  const clearCompare = useCallback(() => setCompareItems([]), []);

  const value = useMemo(
    () => ({
      compareItems,
      toggleCompare,
      isSelected,
      clearCompare,
      canAddMore: canAddToCompare(compareItems),
    }),
    [clearCompare, compareItems, isSelected, toggleCompare],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);

  if (!context) {
    throw new Error("useCompare must be used within CompareProvider");
  }

  return context;
}
