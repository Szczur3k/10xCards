import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { MultiSelect } from "../ui/multi-select";
import { X, Save, Plus, Edit3, FileText, Type, Tag, Users, AlertCircle, CheckCircle } from "lucide-react";
import type { FlashcardDTO, CreateFlashcardRequestDTO, UpdateFlashcardRequestDTO, FlashcardStatus } from "../../types";
import { useFlashcards } from "../../hooks/useFlashcards";
import { useCategories } from "../../hooks/useCategories";
import { useGroups } from "../../hooks/useGroups";
import { useToast } from "../providers/ToastProvider";

interface EditFlashcardModalProps {
  isOpen: boolean;
  flashcard?: FlashcardDTO; // undefined for create mode
  onClose: () => void;
  onSave?: (flashcard: FlashcardDTO) => void;
}

/**
 * EditFlashcardModal - Modal for creating and editing flashcards
 * Handles both create and update modes with form validation
 * Implements character limits and unsaved changes warning
 */
export function EditFlashcardModal({ isOpen, flashcard, onClose, onSave }: EditFlashcardModalProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [status, setStatus] = useState<FlashcardStatus>("draft");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { createFlashcard, updateFlashcard, isCreating, isUpdating } = useFlashcards();
  const { addToast } = useToast();

  const { categoryOptions, isLoading: isLoadingCategories, createCategory } = useCategories();

  const { groupOptions, isLoading: isLoadingGroups, createGroup } = useGroups();

  const isEditMode = !!flashcard;
  const isProcessing = isCreating || isUpdating;

  // Initialize form when flashcard changes
  useEffect(() => {
    if (flashcard) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      setStatus(flashcard.status || "draft");
      setSelectedCategories(flashcard.categories.map((cat) => cat.id));
      setSelectedGroups(flashcard.groups.map((group) => group.id));
    } else {
      // Reset form for create mode
      setFront("");
      setBack("");
      setStatus("draft");
      setSelectedCategories([]);
      setSelectedGroups([]);
    }
    setHasUnsavedChanges(false);
  }, [flashcard]);

  // Track changes
  useEffect(() => {
    if (!flashcard) {
      // Create mode - any content is considered changes
      setHasUnsavedChanges(front.trim() !== "" || back.trim() !== "");
    } else {
      // Edit mode - compare with original
      const frontChanged = front !== flashcard.front;
      const backChanged = back !== flashcard.back;
      const statusChanged = status !== (flashcard.status || "draft");
      const categoriesChanged =
        JSON.stringify(selectedCategories.sort()) !== JSON.stringify(flashcard.categories.map((cat) => cat.id).sort());
      const groupsChanged =
        JSON.stringify(selectedGroups.sort()) !== JSON.stringify(flashcard.groups.map((group) => group.id).sort());

      setHasUnsavedChanges(frontChanged || backChanged || statusChanged || categoriesChanged || groupsChanged);
    }
  }, [front, back, status, selectedCategories, selectedGroups, flashcard]);

  if (!isOpen) return null;

  // Validation
  const frontValid = front.trim().length > 0 && front.length <= 200;
  const backValid = back.trim().length > 0 && back.length <= 500;
  const isFormValid = frontValid && backValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid || isProcessing) return;

    setIsSaving(true);

    try {
      if (isEditMode) {
        // Update existing flashcard
        const updateData: UpdateFlashcardRequestDTO = {
          front: front.trim(),
          back: back.trim(),
          status,
          category_ids: selectedCategories.length > 0 ? selectedCategories : undefined,
          group_ids: selectedGroups.length > 0 ? selectedGroups : undefined,
        };

        await updateFlashcard({ id: flashcard.id, data: updateData });

        addToast({
          type: "success",
          title: "Fiszka zaktualizowana",
          description: "Zmiany zostały pomyślnie zapisane",
        });
      } else {
        // Create new flashcard
        const createData: CreateFlashcardRequestDTO = {
          front: front.trim(),
          back: back.trim(),
          status,
          category_ids: selectedCategories.length > 0 ? selectedCategories : undefined,
          group_ids: selectedGroups.length > 0 ? selectedGroups : undefined,
        };

        await createFlashcard(createData);

        addToast({
          type: "success",
          title: "Fiszka utworzona",
          description: "Nowa fiszka została dodana do kolekcji",
        });
      }

      // Reset form and close
      setHasUnsavedChanges(false);
      onClose();

      if (onSave && flashcard) {
        onSave(flashcard);
      }
    } catch (error) {
      addToast({
        type: "error",
        title: `Błąd podczas ${isEditMode ? "aktualizacji" : "tworzenia"}`,
        description: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedWarning(false);
    onClose();
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-background border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {isEditMode ? <Edit3 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{isEditMode ? "Edytuj fiszkę" : "Nowa fiszka"}</h2>
                <p className="text-sm text-muted-foreground">
                  {isEditMode ? "Zaktualizuj zawartość fiszki" : "Stwórz nową fiszkę ręcznie"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} disabled={isSaving}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              {/* Front */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="front" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Przód fiszki
                  </label>
                  <div className={`text-xs ${front.length > 200 ? "text-destructive" : "text-muted-foreground"}`}>
                    {front.length}/200 znaków
                  </div>
                </div>
                <textarea
                  id="front"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Pytanie, pojęcie lub fraza do zapamiętania..."
                  className={`w-full h-24 px-3 py-2 border rounded-md resize-none text-sm bg-background focus:outline-none focus:ring-2 transition-colors ${
                    frontValid ? "border-border focus:ring-primary/20" : "border-destructive focus:ring-destructive/20"
                  }`}
                  disabled={isSaving}
                />
                {front.trim().length === 0 && front.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    Przód fiszki nie może być pusty
                  </div>
                )}
                {front.length > 200 && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    Przód fiszki nie może przekraczać 200 znaków
                  </div>
                )}
                {frontValid && front.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Przód fiszki jest poprawny
                  </div>
                )}
              </div>

              {/* Back */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="back" className="text-sm font-medium flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Tył fiszki
                  </label>
                  <div className={`text-xs ${back.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                    {back.length}/500 znaków
                  </div>
                </div>
                <textarea
                  id="back"
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Odpowiedź, definicja lub wyjaśnienie..."
                  className={`w-full h-32 px-3 py-2 border rounded-md resize-none text-sm bg-background focus:outline-none focus:ring-2 transition-colors ${
                    backValid ? "border-border focus:ring-primary/20" : "border-destructive focus:ring-destructive/20"
                  }`}
                  disabled={isSaving}
                />
                {back.trim().length === 0 && back.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    Tył fiszki nie może być pusty
                  </div>
                )}
                {back.length > 500 && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    Tył fiszki nie może przekraczać 500 znaków
                  </div>
                )}
                {backValid && back.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Tył fiszki jest poprawny
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FlashcardStatus)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={isSaving}
                >
                  <option value="draft">Szkic</option>
                  <option value="published">Opublikowane</option>
                  <option value="archived">Zarchiwizowane</option>
                </select>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label htmlFor="categories" className="text-sm font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Kategorie (opcjonalne)
                </label>
                <div className="text-sm text-muted-foreground mb-2">
                  Przypisz fiszki do kategorii dla lepszej organizacji
                </div>
                <MultiSelect
                  options={categoryOptions}
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                  placeholder="Wybierz kategorie..."
                  searchPlaceholder="Szukaj kategorii..."
                  emptyMessage="Brak kategorii"
                  loading={isLoadingCategories}
                  disabled={isSaving}
                  onCreate={createCategory}
                  createLabel="Utwórz kategorię"
                />
              </div>

              {/* Groups */}
              <div className="space-y-2">
                <label htmlFor="groups" className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Grupy (opcjonalne)
                </label>
                <div className="text-sm text-muted-foreground mb-2">Przypisz fiszki do grup tematycznych</div>
                <MultiSelect
                  options={groupOptions}
                  selected={selectedGroups}
                  onChange={setSelectedGroups}
                  placeholder="Wybierz grupy..."
                  searchPlaceholder="Szukaj grup..."
                  emptyMessage="Brak grup"
                  loading={isLoadingGroups}
                  disabled={isSaving}
                  onCreate={createGroup}
                  createLabel="Utwórz grupę"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-6 border-t border-border">
              <div className="text-sm text-muted-foreground">
                {isFormValid ? (
                  <span className="text-green-600">Formularz jest poprawny</span>
                ) : (
                  "Wypełnij wymagane pola poprawnie"
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
                  Anuluj
                </Button>
                <Button type="submit" disabled={!isFormValid || isSaving} className="gap-2">
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {isEditMode ? "Zapisuję..." : "Tworzę..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isEditMode ? "Zapisz zmiany" : "Utwórz fiszkę"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">Niezapisane zmiany</h3>
                <p className="text-sm text-muted-foreground">Czy na pewno chcesz wyjść bez zapisywania?</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6">Wprowadzone zmiany zostaną utracone.</p>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowUnsavedWarning(false)}>
                Kontynuuj edycję
              </Button>
              <Button variant="destructive" onClick={confirmClose}>
                Wyjdź bez zapisywania
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
