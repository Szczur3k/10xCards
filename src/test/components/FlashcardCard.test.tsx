import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { FlashcardCard } from '@/components/flashcards/FlashcardCard'
import { renderWithProviders } from '../setup'
import type { FlashcardViewModel } from '@/types'

// Mock data
const mockFlashcard: FlashcardViewModel = {
  id: '1',
  front: 'What is React?',
  back: 'A JavaScript library for building user interfaces',
  creation_type: 'manual',
  status: 'draft',
  source_text_id: null,
  categories: [],
  groups: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  selected: false,
  loading: false,
  isEditing: false
}

// Mock functions
const mockOnSelect = vi.fn()
const mockOnEdit = vi.fn()
const mockOnDelete = vi.fn()

describe('FlashcardCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders flashcard content correctly', () => {
    renderWithProviders(
      <FlashcardCard
        flashcard={mockFlashcard}
        selected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('What is React?')).toBeInTheDocument()
    // Back content is not visible by default, only after clicking toggle
    expect(screen.queryByText('A JavaScript library for building user interfaces')).not.toBeInTheDocument()
  })

  it('shows back content after clicking toggle button', () => {
    renderWithProviders(
      <FlashcardCard
        flashcard={mockFlashcard}
        selected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const toggleButton = screen.getByText('Przód')
    fireEvent.click(toggleButton)

    expect(screen.getByText('A JavaScript library for building user interfaces')).toBeInTheDocument()
    expect(screen.getByText('Tył')).toBeInTheDocument()
  })

  it('shows edit and delete buttons in actions menu', () => {
    renderWithProviders(
      <FlashcardCard
        flashcard={mockFlashcard}
        selected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    // Click the actions menu button (three dots)
    const actionsButton = screen.getByRole('button', { name: '' })
    fireEvent.click(actionsButton)

    // Should show edit and delete buttons
    expect(screen.getByText('Edytuj')).toBeInTheDocument()
    expect(screen.getByText('Usuń')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    renderWithProviders(
      <FlashcardCard
        flashcard={mockFlashcard}
        selected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    // Open actions menu
    const actionsButton = screen.getByRole('button', { name: '' })
    fireEvent.click(actionsButton)

    // Click edit button
    const editButton = screen.getByText('Edytuj')
    fireEvent.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockFlashcard.id)
  })

  it('calls onDelete when delete button is clicked', () => {
    renderWithProviders(
      <FlashcardCard
        flashcard={mockFlashcard}
        selected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    // Open actions menu
    const actionsButton = screen.getByRole('button', { name: '' })
    fireEvent.click(actionsButton)

    // Click delete button
    const deleteButton = screen.getByText('Usuń')
    fireEvent.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledWith(mockFlashcard.id)
  })

  it('shows checkbox when selected is true', () => {
    renderWithProviders(
      <FlashcardCard
        flashcard={mockFlashcard}
        selected={true}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).toBeChecked()
  })

  it('calls onSelect when checkbox is clicked', () => {
    renderWithProviders(
      <FlashcardCard
        flashcard={mockFlashcard}
        selected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(mockOnSelect).toHaveBeenCalledWith(mockFlashcard.id)
  })

  it('displays AI generated indicator when flashcard is AI generated', () => {
    const aiFlashcard = { ...mockFlashcard, creation_type: 'llm' as const }
    
    renderWithProviders(
      <FlashcardCard
        flashcard={aiFlashcard}
        selected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('displays status indicator', () => {
    renderWithProviders(
      <FlashcardCard
        flashcard={mockFlashcard}
        selected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Szkic')).toBeInTheDocument()
  })

  it('displays creation type indicator', () => {
    renderWithProviders(
      <FlashcardCard
        flashcard={mockFlashcard}
        selected={false}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Ręczne')).toBeInTheDocument()
  })
})
