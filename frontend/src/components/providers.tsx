'use client';

import { type ReactNode } from 'react';
import { QueryProvider } from '@/lib/query-provider';
import { AuthProvider } from '@/lib/auth-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
