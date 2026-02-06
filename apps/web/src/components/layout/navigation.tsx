'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useSidebar } from '@/hooks/use-sidebar';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

const navItems: readonly NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/logs', label: 'Logs', icon: FileText },
];

function NavLinks({
  onNavigate,
}: {
  readonly onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <ul className="space-y-1 px-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function NavHeader() {
  return (
    <div className="flex h-14 items-center border-b px-4">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          C
        </div>
        <span>Claude Monitor</span>
      </Link>
    </div>
  );
}

/** 데스크톱 사이드바 (lg 이상에서만 표시) */
function DesktopSidebar() {
  return (
    <nav className="hidden h-full w-56 flex-col border-r bg-card lg:flex">
      <NavHeader />
      <div className="flex-1 overflow-auto py-4">
        <NavLinks />
      </div>
    </nav>
  );
}

/** 모바일 헤더 + Drawer (lg 미만에서만 표시) */
function MobileHeader({
  isOpen,
  onToggle,
  onClose,
}: {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly onClose: () => void;
}) {
  return (
    <>
      <header className="flex h-14 items-center gap-3 border-b bg-card px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label="메뉴 열기"
          className="h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            C
          </div>
          <span>Claude Monitor</span>
        </Link>
      </header>

      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent side="left" className="w-64 p-0">
          <VisuallyHidden.Root>
            <DrawerTitle>내비게이션 메뉴</DrawerTitle>
          </VisuallyHidden.Root>
          <NavHeader />
          <div className="flex-1 overflow-auto py-4">
            <NavLinks onNavigate={onClose} />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export function Navigation() {
  const { isOpen, toggle, close } = useSidebar();

  return (
    <>
      <DesktopSidebar />
      <MobileHeader isOpen={isOpen} onToggle={toggle} onClose={close} />
    </>
  );
}
