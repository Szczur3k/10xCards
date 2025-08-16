import React from "react";
import { FlashcardCard } from "./FlashcardCard";
import type { FlashcardViewModel } from "../../types";

interface FlashcardGridProps {
  flashcards: FlashcardViewModel[];
  loading: boolean;
  onCardSelect: (id: string) => void;
  onCardEdit: (id: string) => void;
  onCardDelete: (id: string) => void;
}

/**
 * LoadingSkeleton - Skeleton component for loading state
 */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 mb-4"></div>
      <div className="space-y-2">
        <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-3/4"></div>
        <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-1/2"></div>
      </div>
    </div>
  );
}

/**
 * EmptyState - Component shown when no flashcards are available
 */
function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4">🎯</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Brak fiszek</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        Nie masz jeszcze żadnych fiszek. Rozpocznij naukę tworząc nowe fiszki ręcznie lub generując je przez AI.
      </p>
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Generuj AI
        </button>
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Dodaj ręcznie
        </button>
      </div>
    </div>
  );
}

/**
 * FlashcardGrid - Responsive grid component for displaying flashcards
 * Implements CSS Grid with responsive breakpoints and loading states
 * Supports card selection, editing, and deletion
 */
export function FlashcardGrid({ flashcards, loading, onCardSelect, onCardEdit, onCardDelete }: FlashcardGridProps) {
  // Show loading skeletons
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <LoadingSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (flashcards.length === 0) {
    return (
      <div className="grid grid-cols-1 min-h-[400px]">
        <EmptyState />
      </div>
    );
  }

  // Show flashcards grid
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {flashcards.map((flashcard) => (
          <FlashcardCard
            key={flashcard.id}
            flashcard={flashcard}
            selected={flashcard.selected}
            onSelect={onCardSelect}
            onEdit={onCardEdit}
            onDelete={onCardDelete}
          />
        ))}
      </div>
    </div>
  );
}
