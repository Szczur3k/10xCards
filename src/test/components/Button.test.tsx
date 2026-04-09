import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { renderWithProviders } from "../setup";

describe("Button", () => {
  it("renders button with default props", () => {
    renderWithProviders(<Button>Kliknij mnie</Button>);

    const button = screen.getByRole("button", { name: "Kliknij mnie" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary", "text-primary-foreground");
  });

  it("renders button with custom variant", () => {
    renderWithProviders(<Button variant="destructive">Usuń</Button>);

    const button = screen.getByRole("button", { name: "Usuń" });
    expect(button).toHaveClass("bg-destructive", "text-white");
  });

  it("renders button with custom size", () => {
    renderWithProviders(<Button size="lg">Duży przycisk</Button>);

    const button = screen.getByRole("button", { name: "Duży przycisk" });
    expect(button).toHaveClass("h-10", "px-6");
  });

  it("renders button with custom className", () => {
    renderWithProviders(<Button className="custom-class">Przycisk</Button>);

    const button = screen.getByRole("button", { name: "Przycisk" });
    expect(button).toHaveClass("custom-class");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    renderWithProviders(<Button onClick={handleClick}>Kliknij</Button>);

    const button = screen.getByRole("button", { name: "Kliknij" });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders as child component when asChild is true", () => {
    renderWithProviders(
      <Button asChild>
        <a href="/test">Link jako przycisk</a>
      </Button>
    );

    const link = screen.getByRole("link", { name: "Link jako przycisk" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
    expect(link).toHaveClass("bg-primary", "text-primary-foreground");
  });

  it("applies disabled state correctly", () => {
    renderWithProviders(<Button disabled>Wyłączony</Button>);

    const button = screen.getByRole("button", { name: "Wyłączony" });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:pointer-events-none", "disabled:opacity-50");
  });

  it("renders icon button with icon size", () => {
    renderWithProviders(<Button size="icon">🔍</Button>);

    const button = screen.getByRole("button", { name: "🔍" });
    expect(button).toHaveClass("size-9");
  });
});
