import React, { useState } from "react";
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import type { FlashcardViewModel, FlashcardStatus, FlashcardType } from "../../types";

interface FlashcardCardProps {
  flashcard: FlashcardViewModel;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * StatusIndicator - Visual indicator for flashcard status
 */
function StatusIndicator({ status }: { status: FlashcardStatus | null }) {
  if (!status) return null;

  const statusConfig = {
    draft: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "Szkic" },
    published: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Opublikowane" },
    archived: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", label: "Zarchiwizowane" },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

/**
 * TypeIndicator - Visual indicator for flashcard creation type
 */
function TypeIndicator({ type }: { type: FlashcardType }) {
  const typeConfig = {
    manual: { icon: "✏️", label: "Ręczne" },
    llm: { icon: "🤖", label: "AI" },
  };

  const config = typeConfig[type];

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

/**
 * ContentPreview - Truncated content with character limits
 */
function ContentPreview({ content, maxLength = 100 }: { content: string; maxLength?: number }) {
  const truncated = content.length > maxLength ? content.substring(0, maxLength) + "..." : content;

  return <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{truncated}</p>;
}

/**
 * ActionsMenu - Dropdown menu with card actions
 */
function ActionsMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Zamknij menu"
          />

          {/* Menu */}
          <div className="absolute right-0 top-8 z-20 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit className="w-3 h-3" />
              Edytuj
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-3 h-3" />
              Usuń
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * FlashcardCard - Individual flashcard component with preview and actions
 * Supports selection, front/back toggle, content preview, and action menu
 * Implements hover effects and responsive design
 */
export function FlashcardCard({ flashcard, selected, onSelect, onEdit, onDelete }: FlashcardCardProps) {
  const [showBack, setShowBack] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = () => {
    setShowBack(!showBack);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(flashcard.id);
  };

  return (
    <div
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${
          selected
            ? "border-blue-500 shadow-lg shadow-blue-500/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        }
        ${isHovered ? "shadow-md" : "shadow-sm"}
      `}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Fiszka: ${flashcard.front.slice(0, 50)}...`}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => undefined} // Handled by onClick
          onClick={handleCheckboxClick}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
      </div>

      {/* Actions Menu */}
      <div className="absolute top-3 right-3 z-10">
        <ActionsMenu onEdit={() => onEdit(flashcard.id)} onDelete={() => onDelete(flashcard.id)} />
      </div>

      {/* Card Content */}
      <div className="p-4 pt-12">
        {/* Header with Status and Type */}
        <div className="flex items-center justify-between mb-3">
          <StatusIndicator status={flashcard.status} />
          <TypeIndicator type={flashcard.creation_type} />
        </div>

        {/* Front/Back Toggle Button */}
        <div className="flex items-center justify-center mb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBack(!showBack);
            }}
            className="flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {showBack ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showBack ? "Tył" : "Przód"}
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[120px] flex items-center justify-center">
          <ContentPreview content={showBack ? flashcard.back : flashcard.front} maxLength={showBack ? 200 : 150} />
        </div>

        {/* Footer with Categories/Groups */}
        {(flashcard.categories.length > 0 || flashcard.groups.length > 0) && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex flex-wrap gap-1">
              {flashcard.categories.map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                >
                  {category.name}
                </span>
              ))}
              {flashcard.groups.map((group) => (
                <span
                  key={group.id}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                >
                  {group.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loading/Error States */}
        {flashcard.loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}

        {flashcard.error && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-2">
              <p className="text-xs text-red-600 dark:text-red-400">{flashcard.error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
