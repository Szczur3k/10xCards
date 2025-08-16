import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Plus, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "../providers/AuthProvider";

interface HeaderProps {
  onSearch?: (query: string) => void;
  onGenerateAI?: () => void;
  onAddManual?: () => void;
  selectedCount?: number;
  totalCount?: number;
  onSelectAll?: () => void;
}

/**
 * Header - Top bar with search, primary actions and user menu
 * Contains search bar with debounced input, Generate AI button, Add Manual button
 * Shows selected count when cards are selected for bulk operations
 */
export function Header({
  onSearch,
  onGenerateAI,
  onAddManual,
  selectedCount = 0,
  totalCount = 0,
  onSelectAll,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuth();

  // Debounced search implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleGenerateAI = () => {
    // TODO: Check for selected cards and block if any selected
    if (selectedCount > 0) {
      // Show blocking message
      return;
    }

    if (onGenerateAI) {
      onGenerateAI();
    }
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Search bar */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Szukaj fiszek..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>

        {/* Center - Selection info and Select All button */}
        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
              <span className="text-sm font-medium">
                {selectedCount} card{selectedCount !== 1 ? "s" : ""} selected
              </span>
            </div>
          )}

          {/* Select All Button - show when there are cards and not all selected */}
          {totalCount > 0 && selectedCount < totalCount && onSelectAll && (
            <Button variant="outline" size="sm" onClick={onSelectAll} className="gap-2">
              <input type="checkbox" className="w-3 h-3" checked={false} readOnly />
              Select All ({totalCount})
            </Button>
          )}
        </div>

        {/* Right side - Primary actions and user menu */}
        <div className="flex items-center gap-3">
          {/* Generate AI Button */}
          <Button onClick={handleGenerateAI} disabled={selectedCount > 0} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generuj fiszki AI
          </Button>

          {/* Add Manual Button */}
          <Button variant="outline" onClick={onAddManual} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Manual
          </Button>

          {/* User Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-3">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline-block">{user?.email || "User"}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
