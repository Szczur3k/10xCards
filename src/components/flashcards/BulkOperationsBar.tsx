import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Trash2, Archive, Tag, Users, CheckCircle, FileText, AlertTriangle } from "lucide-react";
import type { FlashcardStatus } from "../../types";
import type { BulkOperationType } from "../../hooks/useBulkOperations";

interface BulkOperationsBarProps {
  selectedCount: number;
  isProcessing: boolean;
  currentOperation?: BulkOperationType;
  onBulkOperation: (operation: BulkOperationType, data?: unknown) => void;
  onClearSelection: () => void;
}

/**
 * BulkOperationsBar - Floating action bar for bulk operations
 * Appears when flashcards are selected, provides bulk action buttons
 * Implements confirmation flow for destructive operations
 */
export function BulkOperationsBar({
  selectedCount,
  isProcessing,
  currentOperation,
  onBulkOperation,
  onClearSelection,
}: BulkOperationsBarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  const handleStatusChange = (status: FlashcardStatus) => {
    onBulkOperation("change_status", { status });
    setShowStatusMenu(false);
  };

  const handleDeleteConfirm = () => {
    onBulkOperation("delete");
    setShowDeleteConfirm(false);
  };

  const isOperationActive = (operation: BulkOperationType) => {
    return currentOperation === operation && isProcessing;
  };

  return (
    <>
      {/* Main Floating Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-background border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[400px]">
          {/* Selection Info */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xs text-primary-foreground font-medium">{selectedCount}</span>
            </div>
            <span className="text-sm font-medium">
              {selectedCount} fiszka{selectedCount !== 1 ? "i" : ""} zaznaczon{selectedCount === 1 ? "a" : "e"}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Change Status */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={isProcessing}
                className="gap-2"
              >
                {isOperationActive("change_status") ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Status
              </Button>

              {/* Status Dropdown Menu */}
              {showStatusMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-background border border-border rounded-lg shadow-md py-1 min-w-[120px]">
                  <button
                    onClick={() => handleStatusChange("draft")}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Szkic
                  </button>
                  <button
                    onClick={() => handleStatusChange("published")}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Opublikowane
                  </button>
                  <button
                    onClick={() => handleStatusChange("archived")}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    Zarchiwizowane
                  </button>
                </div>
              )}
            </div>

            {/* Assign Categories */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkOperation("assign_categories")}
              disabled={isProcessing}
              className="gap-2"
            >
              {isOperationActive("assign_categories") ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Tag className="w-4 h-4" />
              )}
              Kategorie
            </Button>

            {/* Assign Groups */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkOperation("assign_groups")}
              disabled={isProcessing}
              className="gap-2"
            >
              {isOperationActive("assign_groups") ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              Grupy
            </Button>

            {/* Delete */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
              className="gap-2"
            >
              {isOperationActive("delete") ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Usuń
            </Button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Clear Selection */}
          <Button variant="ghost" size="sm" onClick={onClearSelection} disabled={isProcessing} className="gap-2">
            <X className="w-4 h-4" />
            Anuluj
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-background border border-border rounded-lg shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">Usuń zaznaczone fiszki</h3>
                <p className="text-sm text-muted-foreground">Czy na pewno chcesz usunąć {selectedCount} fiszek?</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Ta operacja jest nieodwracalna. Wszystkie zaznaczone fiszki zostaną trwale usunięte.
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isProcessing}>
                Anuluj
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isProcessing} className="gap-2">
                {isOperationActive("delete") ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Usuń {selectedCount} fiszek
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close status menu */}
      {showStatusMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowStatusMenu(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowStatusMenu(false)}
          role="button"
          tabIndex={0}
          aria-label="Zamknij menu statusu"
        />
      )}
    </>
  );
}
