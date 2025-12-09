'use client';

import { useState, useCallback } from 'react';

export function usePortalDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const openDropdown = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setAnchorRect(rect);
    setIsOpen(true);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setAnchorRect(null);
  }, []);

  return { isOpen, openDropdown, closeDropdown, anchorRect };
}
