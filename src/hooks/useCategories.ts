import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CategoryDTO, CreateCategoryRequestDTO } from '../types';

/**
 * Hook for managing categories
 * Provides CRUD operations and data management for category operations
 */
export function useCategories() {
  const queryClient = useQueryClient();

  // Fetch all categories
  const {
    data: categories = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<CategoryDTO[]> => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Błąd podczas ładowania kategorii');
      }
      const result = await response.json();
      return result.data || result; // Handle both formats
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create new category
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CreateCategoryRequestDTO): Promise<CategoryDTO> => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Błąd podczas tworzenia kategorii');
      }

      return response.json();
    },
    onSuccess: (newCategory) => {
      // Update categories cache
      queryClient.setQueryData(['categories'], (old: CategoryDTO[] = []) => {
        return [...old, newCategory].sort((a, b) => a.name.localeCompare(b.name));
      });
    },
  });

  // Transform categories for MultiSelect component
  const categoryOptions = categories.map(category => ({
    id: category.id,
    name: category.name,
    description: category.description || undefined,
  }));

  // Create category function for MultiSelect
  const createCategory = async (name: string) => {
    const newCategory = await createCategoryMutation.mutateAsync({
      name: name.trim(),
      description: undefined,
    });

    return {
      id: newCategory.id,
      name: newCategory.name,
      description: newCategory.description || undefined,
    };
  };

  // Get categories by IDs (for displaying selected categories)
  const getCategoriesByIds = (ids: string[]): CategoryDTO[] => {
    return categories.filter(category => ids.includes(category.id));
  };

  return {
    // Data
    categories,
    categoryOptions,
    
    // Loading states
    isLoading,
    isCreating: createCategoryMutation.isPending,
    
    // Error states
    error,
    createError: createCategoryMutation.error,
    
    // Actions
    createCategory,
    getCategoriesByIds,
    
    // Utils
    refetch: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  };
} 