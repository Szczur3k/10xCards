import React, { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useFilters } from "../../hooks/useFilters";

interface FilterContextType {
  filters: ReturnType<typeof useFilters>["filters"];
  updateSearch: ReturnType<typeof useFilters>["updateSearch"];
  updateStatus: ReturnType<typeof useFilters>["updateStatus"];
  updateCreationType: ReturnType<typeof useFilters>["updateCreationType"];
  updateCategories: ReturnType<typeof useFilters>["updateCategories"];
  updateGroups: ReturnType<typeof useFilters>["updateGroups"];
  updateSort: ReturnType<typeof useFilters>["updateSort"];
  clearFilters: ReturnType<typeof useFilters>["clearFilters"];
  toQueryParams: ReturnType<typeof useFilters>["toQueryParams"];
  activeFilterCount: ReturnType<typeof useFilters>["activeFilterCount"];
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

interface FilterProviderProps {
  children: ReactNode;
}

export function FilterProvider({ children }: FilterProviderProps) {
  const filterState = useFilters();

  return <FilterContext.Provider value={filterState}>{children}</FilterContext.Provider>;
}

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return context;
}
