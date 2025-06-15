import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Moon, Sun, BarChart3, BookOpen, LogOut, User } from 'lucide-react';
import type { FilterState, FlashcardStatus, FlashcardType } from '../../types';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';
import { useFilterContext } from '../providers/FilterProvider';

interface SidebarProps {
  isCollapsed?: boolean;
}

/**
 * Sidebar - Fixed vertical sidebar (250px) with navigation, theme toggle and filters
 * Contains logo, theme toggle, navigation menu, and collapsible filter sections
 * Always visible on desktop, drawer overlay on mobile
 */
export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const { theme, setTheme, isDarkMode } = useTheme();
  const { logout } = useAuth();
  const { filters, updateStatus, updateCreationType } = useFilterContext();

  const handleThemeToggle = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect will be handled by auth state change
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">🎯</span>
          </div>
          <span className="font-bold text-xl">10xCards</span>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="p-4 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleThemeToggle}
          className="w-full justify-start gap-2"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 border-b border-border">
        <div className="space-y-2">
          <Button
            variant="default"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Flashcards
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Statistics
          </Button>
        </div>
      </nav>

      {/* Collapsible Filters Section */}
      <div className="flex-1 p-4">
        <Collapsible open={filtersExpanded} onOpenChange={setFiltersExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between p-2"
            >
              <span className="font-medium">Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Status Filter */}
            <Card>
              <CardContent className="p-3">
                <h4 className="font-medium text-sm mb-2">Status</h4>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={filters.status.includes('draft')}
                      onChange={(e) => {
                        const newStatus = e.target.checked 
                          ? [...filters.status, 'draft' as FlashcardStatus]
                          : filters.status.filter(s => s !== 'draft');
                        updateStatus(newStatus);
                      }}
                    />
                    Draft
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={filters.status.includes('published')}
                      onChange={(e) => {
                        const newStatus = e.target.checked 
                          ? [...filters.status, 'published' as FlashcardStatus]
                          : filters.status.filter(s => s !== 'published');
                        updateStatus(newStatus);
                      }}
                    />
                    Published
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={filters.status.includes('archived')}
                      onChange={(e) => {
                        const newStatus = e.target.checked 
                          ? [...filters.status, 'archived' as FlashcardStatus]
                          : filters.status.filter(s => s !== 'archived');
                        updateStatus(newStatus);
                      }}
                    />
                    Archived
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Type Filter */}
            <Card>
              <CardContent className="p-3">
                <h4 className="font-medium text-sm mb-2">Type</h4>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={filters.creation_type.includes('llm')}
                      onChange={(e) => {
                        const newCreationType = e.target.checked 
                          ? [...filters.creation_type, 'llm' as FlashcardType]
                          : filters.creation_type.filter(t => t !== 'llm');
                        updateCreationType(newCreationType);
                      }}
                    />
                    🤖 AI Generated
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={filters.creation_type.includes('manual')}
                      onChange={(e) => {
                        const newCreationType = e.target.checked 
                          ? [...filters.creation_type, 'manual' as FlashcardType]
                          : filters.creation_type.filter(t => t !== 'manual');
                        updateCreationType(newCreationType);
                      }}
                    />
                    ✏️ Manual
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Categories Filter - Placeholder */}
            <Card>
              <CardContent className="p-3">
                <h4 className="font-medium text-sm mb-2">Categories</h4>
                <p className="text-xs text-muted-foreground">No categories yet</p>
              </CardContent>
            </Card>

            {/* Groups Filter - Placeholder */}
            <Card>
              <CardContent className="p-3">
                <h4 className="font-medium text-sm mb-2">Groups</h4>
                <p className="text-xs text-muted-foreground">No groups yet</p>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </aside>
  );
} 