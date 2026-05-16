import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { RankedSeries } from "../types/series";

type CompareContextValue = {
  compareItems: RankedSeries[];
  toggleCompare: (series: RankedSeries) => void;
  isSelected: (seriesId: number) => boolean;
  clearCompare: () => void;
  canAddMore: boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);

const MAX_COMPARE_ITEMS = 4;

export function CompareProvider({ children }: PropsWithChildren) {
  const [compareItems, setCompareItems] = useState<RankedSeries[]>([]);

  const toggleCompare = useCallback((series: RankedSeries) => {
    setCompareItems((current) => {
      const exists = current.some((item) => item.id === series.id);
      if (exists) {
        return current.filter((item) => item.id !== series.id);
      }

      if (current.length >= MAX_COMPARE_ITEMS) {
        return current;
      }

      return [...current, series];
    });
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
      canAddMore: compareItems.length < MAX_COMPARE_ITEMS,
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
