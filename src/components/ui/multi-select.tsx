import React, { useState, useEffect, useRef } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { ChevronDown, X, Search, Check, Plus } from "lucide-react";

export interface MultiSelectOption {
  id: string;
  name: string;
  description?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxHeight?: string;
  disabled?: boolean;
  loading?: boolean;
  onCreate?: (name: string) => Promise<MultiSelectOption>;
  createLabel?: string;
}

/**
 * MultiSelect - Reusable multi-select component with search and create functionality
 * Used for categories and groups selection in modals
 */
export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Wybierz opcje...",
  searchPlaceholder = "Szukaj...",
  emptyMessage = "Brak opcji",
  maxHeight = "200px",
  disabled = false,
  loading = false,
  onCreate,
  createLabel = "Utwórz nowy",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = options.filter(
    (option) =>
      option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected options for display
  const selectedOptions = options.filter((option) => selected.includes(option.id));

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setSearchQuery("");
  };

  const handleOptionClick = (optionId: string) => {
    const newSelected = selected.includes(optionId)
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];

    onChange(newSelected);
  };

  const handleRemoveSelected = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((id) => id !== optionId));
  };

  const handleCreate = async () => {
    if (!onCreate || !searchQuery.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const newOption = await onCreate(searchQuery.trim());
      onChange([...selected, newOption.id]);
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to create option:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleToggle}
        disabled={disabled || loading}
        className={`w-full justify-between text-left font-normal ${
          selected.length === 0 ? "text-muted-foreground" : ""
        }`}
      >
        <div className="flex-1 flex flex-wrap gap-1 mr-2">
          {selected.length === 0 ? (
            <span>{placeholder}</span>
          ) : selected.length <= 3 ? (
            selectedOptions.map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded"
              >
                {option.name}
                <button
                  type="button"
                  onClick={(e) => handleRemoveSelected(option.id, e)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-sm">
              {selected.length} wybranych
              <button
                type="button"
                onClick={clearAll}
                className="ml-2 text-xs text-muted-foreground hover:text-foreground"
              >
                (wyczyść)
              </button>
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-background border border-border rounded-md shadow-lg z-50">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-[200px] overflow-y-auto" style={{ maxHeight }}>
            {loading ? (
              <div className="p-3 text-center text-sm text-muted-foreground">Ładowanie...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-3">
                <div className="text-center text-sm text-muted-foreground mb-2">
                  {searchQuery ? "Brak wyników wyszukiwania" : emptyMessage}
                </div>
                {onCreate && searchQuery.trim() && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="w-full gap-2"
                  >
                    {isCreating ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {createLabel} &quot;{searchQuery}&quot;
                  </Button>
                )}
              </div>
            ) : (
              <div className="py-1">
                {filteredOptions.map((option) => {
                  const isSelected = selected.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleOptionClick(option.id)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 ${
                        isSelected ? "bg-primary/10 text-primary" : ""
                      }`}
                    >
                      <div
                        className={`w-4 h-4 border rounded flex items-center justify-center ${
                          isSelected ? "bg-primary border-primary" : "border-border"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{option.name}</div>
                        {option.description && (
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create Option */}
          {onCreate && searchQuery.trim() && filteredOptions.length > 0 && (
            <div className="p-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full gap-2"
              >
                {isCreating ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {createLabel} &quot;{searchQuery}&quot;
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
