import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { useFlashcards } from "@/hooks/useFlashcards";
import { renderWithProviders } from "../setup";
import type { FlashcardDTO } from "@/types";

// Mock fetch globally
global.fetch = vi.fn();

// Mock data
const mockFlashcards: FlashcardDTO[] = [
  {
    id: "1",
    front: "What is React?",
    back: "A JavaScript library for building user interfaces",
    creation_type: "manual",
    status: "draft",
    source_text_id: null,
    categories: [],
    groups: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    front: "What is TypeScript?",
    back: "A superset of JavaScript that adds static typing",
    creation_type: "manual",
    status: "draft",
    source_text_id: null,
    categories: [],
    groups: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const mockResponse = {
  data: mockFlashcards,
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    pages: 1,
  },
};

// Test component to render the hook
function TestComponent() {
  const hook = useFlashcards();
  return (
    <div>
      <div data-testid="flashcards-count">{hook.flashcards.length}</div>
      <div data-testid="loading">{hook.isLoading.toString()}</div>
      <div data-testid="error">{hook.error?.message || ""}</div>
      <button onClick={() => hook.refetch()}>Load</button>
      <button onClick={() => hook.createFlashcard({ front: "Test", back: "Answer" })}>Create</button>
      <button onClick={() => hook.updateFlashcard({ id: "1", data: { front: "Updated" } })}>Update</button>
      <button onClick={() => hook.deleteFlashcard("1")}>Delete</button>
    </div>
  );
}

describe("useFlashcards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockClear();
  });

  it("should initialize with empty state", () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { getByTestId } = renderWithProviders(<TestComponent />);

    expect(getByTestId("flashcards-count")).toHaveTextContent("0");
    expect(getByTestId("loading")).toHaveTextContent("true");
    expect(getByTestId("error")).toHaveTextContent("");
  });

  it("should load flashcards successfully", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { getByTestId, getByText } = renderWithProviders(<TestComponent />);

    // Wait for initial load
    await waitFor(() => {
      expect(getByTestId("flashcards-count")).toHaveTextContent("2");
      expect(getByTestId("loading")).toHaveTextContent("false");
    });

    // Trigger refetch
    getByText("Load").click();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/flashcards?");
    });
  });

  it("should handle loading state correctly", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { getByTestId } = renderWithProviders(<TestComponent />);

    // Should be loading initially
    expect(getByTestId("loading")).toHaveTextContent("true");

    // Wait for loading to complete
    await waitFor(() => {
      expect(getByTestId("loading")).toHaveTextContent("false");
    });
  });

  it("should handle error state correctly", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Failed to fetch flashcards"));

    const { getByTestId } = renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(getByTestId("error")).toHaveTextContent("Failed to fetch flashcards");
    });
  });

  it("should create flashcard successfully", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFlashcards[0],
    } as Response);

    const { getByText } = renderWithProviders(<TestComponent />);

    // Wait for initial load
    await waitFor(() => {
      expect(getByText("Load")).toBeInTheDocument();
    });

    getByText("Create").click();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ front: "Test", back: "Answer" }),
      });
    });
  });

  it("should update flashcard successfully", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockFlashcards[0], front: "Updated Question" }),
    } as Response);

    const { getByText } = renderWithProviders(<TestComponent />);

    // Wait for initial load
    await waitFor(() => {
      expect(getByText("Load")).toBeInTheDocument();
    });

    getByText("Update").click();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/flashcards/1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ front: "Updated" }),
      });
    });
  });

  it("should delete flashcard successfully", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => undefined,
    } as Response);

    const { getByText } = renderWithProviders(<TestComponent />);

    // Wait for initial load
    await waitFor(() => {
      expect(getByText("Load")).toBeInTheDocument();
    });

    getByText("Delete").click();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/flashcards/1", {
        method: "DELETE",
      });
    });
  });
});
