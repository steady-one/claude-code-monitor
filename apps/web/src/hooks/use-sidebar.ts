'use client';

import { useState, useCallback, useEffect } from 'react';

const LG_BREAKPOINT = 1024;

interface UseSidebarReturn {
  readonly isOpen: boolean;
  readonly toggle: () => void;
  readonly open: () => void;
  readonly close: () => void;
}

export function useSidebar(): UseSidebarReturn {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= LG_BREAKPOINT) {
        setIsOpen(false);
      }
    };

    // 초기 상태 설정: 데스크톱에서는 사이드바가 항상 보이므로 isOpen은 모바일 오버레이 전용
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, toggle, open, close } as const;
}
