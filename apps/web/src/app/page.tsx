import { Suspense } from 'react';
import { Dashboard } from '@/components/dashboard';
import { DashboardSkeleton } from '@/components/dashboard-skeleton';

export default function HomePage() {
  return (
    <main className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Claude Code Monitor
        </h1>
        <p className="text-muted-foreground mt-2">
          OpenTelemetry 메트릭 기반 사용량 모니터링
        </p>
      </header>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}
