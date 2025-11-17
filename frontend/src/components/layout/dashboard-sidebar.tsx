'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: string;
  icon?: string;
}

interface DashboardSidebarProps {
  items: NavItem[];
  title: string;
}

export function DashboardSidebar({ items, title }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-gray-50">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">Ecoom</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">{title}</h2>
          <div className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-gray-200',
                  pathname === item.href
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900',
                )}
              >
                {item.icon && <span>{item.icon}</span>}
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="border-t p-4">
        <div className="mb-3">
          <p className="text-sm font-medium">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          {user?.isSuperAdmin && (
            <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              Super Admin
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={logout}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
