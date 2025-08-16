import { useState, useCallback, useMemo } from "react";
import type { FlashcardStatus, FlashcardType } from "../types";

// Simple debounce implementation
function debounce<T extends (...args: unknown[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

export interface FilterState {
  search: string;
  status: FlashcardStatus[];
  creation_type: FlashcardType[];
  category_ids: string[];
  group_ids: string[];
  sort: "created_at" | "updated_at";
  order: "asc" | "desc";
}

const defaultFilters: FilterState = {
  search: "",
  status: [],
  creation_type: [],
  category_ids: [],
  group_ids: [],
  sort: "created_at",
  order: "desc",
};

/**
 * Hook for managing filter state with debounced search
 * Provides conversion to API query parameters
 */
export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounced search update (300ms delay)
  const debouncedUpdateSearch = useMemo(
    () =>
      debounce((search: string) => {
        setDebouncedSearch(search);
      }, 300),
    []
  );

  const updateSearch = useCallback(
    (search: string) => {
      setFilters((prev) => ({ ...prev, search }));
      debouncedUpdateSearch(search);
    },
    [debouncedUpdateSearch]
  );

  const updateStatus = useCallback((status: FlashcardStatus[]) => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  const updateCreationType = useCallback((creation_type: FlashcardType[]) => {
    setFilters((prev) => ({ ...prev, creation_type }));
  }, []);

  const updateCategories = useCallback((category_ids: string[]) => {
    setFilters((prev) => ({ ...prev, category_ids }));
  }, []);

  const updateGroups = useCallback((group_ids: string[]) => {
    setFilters((prev) => ({ ...prev, group_ids }));
  }, []);

  const updateSort = useCallback((sort: "created_at" | "updated_at", order: "asc" | "desc" = "desc") => {
    setFilters((prev) => ({ ...prev, sort, order }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setDebouncedSearch("");
  }, []);

  // Convert filters to API query parameters
  const toQueryParams = useCallback(() => {
    const params: Record<string, unknown> = {
      sort: filters.sort,
      order: filters.order,
    };

    // Use debounced search for API calls
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    // API expects single values, not arrays
    if (filters.status.length > 0) {
      params.status = filters.status[0]; // Take first selected status
    }

    if (filters.creation_type.length > 0) {
      params.creation_type = filters.creation_type[0]; // Take first selected type
    }

    if (filters.category_ids.length > 0) {
      params.category_ids = filters.category_ids[0]; // Take first selected category
    }

    if (filters.group_ids.length > 0) {
      params.group_ids = filters.group_ids[0]; // Take first selected group
    }

    return params;
  }, [filters, debouncedSearch]);

  // Count active filters (excluding sort/order)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch.trim()) count++;
    if (filters.status.length > 0) count++;
    if (filters.creation_type.length > 0) count++;
    if (filters.category_ids.length > 0) count++;
    if (filters.group_ids.length > 0) count++;
    return count;
  }, [filters, debouncedSearch]);

  return {
    filters: { ...filters, search: debouncedSearch }, // Return debounced search for display
    updateSearch,
    updateStatus,
    updateCreationType,
    updateCategories,
    updateGroups,
    updateSort,
    clearFilters,
    toQueryParams,
    activeFilterCount,
  };
}
