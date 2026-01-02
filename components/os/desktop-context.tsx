'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface WindowState {
  id: string;
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  content: React.ReactNode;
}

interface DesktopContextType {
  windows: WindowState[];
  openWindow: (id: string, title: string, icon: React.ElementType, content: React.ReactNode) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  activeWindowId: string | null;
  wallpaper: string;
  setWallpaper: (url: string) => void;
}

const DesktopContext = createContext<DesktopContextType | undefined>(undefined);

export function DesktopProvider({ children }: { children: React.ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [wallpaper, setWallpaper] = useState('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000');

  const focusWindow = useCallback((id: string) => {
    setActiveWindowId(id);
    setMaxZIndex(prev => prev + 1);
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, zIndex: maxZIndex + 1, isMinimized: false } : w
    ));
  }, [maxZIndex]);

  const openWindow = useCallback((id: string, title: string, icon: React.ElementType, content: React.ReactNode) => {
    setWindows(prev => {
      const existing = prev.find(w => w.id === id);
      if (existing) {
        focusWindow(id);
        return prev.map(w => w.id === id ? { ...w, isMinimized: false } : w);
      }
      const newWindow: WindowState = {
        id,
        title,
        icon,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: maxZIndex + 1,
        content,
      };
      return [...prev, newWindow];
    });
    setActiveWindowId(id);
    setMaxZIndex(prev => prev + 1);
  }, [focusWindow, maxZIndex]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  }, [activeWindowId]);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMinimized: true } : w
    ));
    setActiveWindowId(null);
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
    ));
  }, []);

  return (
    <DesktopContext.Provider value={{ 
      windows, 
      openWindow, 
      closeWindow, 
      minimizeWindow, 
      maximizeWindow, 
      focusWindow,
      activeWindowId,
      wallpaper,
      setWallpaper
    }}>
      {children}
    </DesktopContext.Provider>
  );
}

export function useDesktop() {
  const context = useContext(DesktopContext);
  if (context === undefined) {
    throw new Error('useDesktop must be used within a DesktopProvider');
  }
  return context;
}
