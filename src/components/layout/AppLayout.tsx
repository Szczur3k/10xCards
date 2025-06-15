import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { ModalProvider, ModalRenderer } from '../modals/ModalSystem';

/**
 * AppLayout - Main layout component with responsive sidebar and main content
 * Mobile-first approach with drawer overlay on mobile, fixed sidebar on desktop
 * Contains sidebar, main content area, and modal system with proper provider structure
 */
export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <ModalProvider>
      <div className="flex h-screen bg-background">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}
        
        {/* Sidebar - Fixed on desktop, drawer on mobile */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <Sidebar />
        </div>
        
        {/* Main Content Area - Responsive, fills remaining space */}
        <div className="flex-1 flex flex-col min-w-0">
          <MainContent />
        </div>
      </div>
      
      {/* Modal Renderer - Renders all modals based on context state */}
      <ModalRenderer />
    </ModalProvider>
  );
} 