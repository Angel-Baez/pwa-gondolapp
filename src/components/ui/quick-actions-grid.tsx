import { BarChart3, List, Package, Scan } from 'lucide-react';
import Link from 'next/link';

interface ActionCardProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isPrimary?: boolean;
}

function ActionCard({ href, icon, label, isPrimary }: ActionCardProps) {
  const baseClasses =
    'touch-target-44 group rounded-xl p-6 transition-all hover:scale-105 active:scale-95';
  const primaryClasses = 'bg-primary text-primary-foreground';
  const secondaryClasses = 'border border-border bg-card';

  return (
    <Link
      href={href}
      className={`${baseClasses} ${isPrimary ? primaryClasses : secondaryClasses}`}
    >
      <div className="text-center">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Link>
  );
}

export function QuickActionsGrid() {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4">
      <ActionCard
        href="/scanner"
        icon={<Scan className="mx-auto mb-2 h-8 w-8" />}
        label="Escanear"
        isPrimary
      />
      <ActionCard
        href="/lists"
        icon={<List className="mx-auto mb-2 h-8 w-8 text-primary" />}
        label="Listas"
      />
      <ActionCard
        href="/products"
        icon={<Package className="mx-auto mb-2 h-8 w-8 text-primary" />}
        label="Productos"
      />
      <ActionCard
        href="/reports"
        icon={<BarChart3 className="mx-auto mb-2 h-8 w-8 text-primary" />}
        label="Reportes"
      />
    </div>
  );
}
