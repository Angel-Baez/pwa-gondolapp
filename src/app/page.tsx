import { PWAInstallPrompt, PWAStatusIndicator } from '@/components/pwa';
import { AlertsSection } from '@/components/ui/alerts-section';
import { BottomNavigation } from '@/components/ui/bottom-navigation';
import { Header } from '@/components/ui/header';
import { QuickActionsGrid } from '@/components/ui/quick-actions-grid';
import { QuickStats } from '@/components/ui/quick-stats';

export default function HomePage() {
  return (
    <div className="container mx-auto max-w-md px-4 py-8">
      <PWAInstallPrompt />

      <Header
        title="GondolApp"
        subtitle="Gestión de inventario offline-first"
      />

      <QuickActionsGrid />

      <QuickStats />

      <AlertsSection />

      <BottomNavigation currentPath="/" />

      <PWAStatusIndicator />
    </div>
  );
}
