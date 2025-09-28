'use client';

import { NavigationProvider } from '@/contexts/navigationContext';
import { ScheduleProvider } from '@/contexts/createScheduleContext';
import { TanstackQueryProvider } from '@/contexts/tanstackQueryContext';
import { HeroUIProvider } from '@heroui/react';
import { AuthProvider } from '@/contexts/authContext';

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider locale='ko-KR'>
      <NavigationProvider>
        <TanstackQueryProvider>
          <AuthProvider>
            <ScheduleProvider>{children}</ScheduleProvider>
          </AuthProvider>
        </TanstackQueryProvider>
      </NavigationProvider>
    </HeroUIProvider>
  );
}
