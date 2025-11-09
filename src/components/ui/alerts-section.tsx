import { Bell } from 'lucide-react';

interface AlertsSectionProps {
  alerts?: string[];
}

export function AlertsSection({ alerts = [] }: AlertsSectionProps) {
  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-6">
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Alertas</h2>
      </div>
      {alerts.length > 0 ? (
        <ul className="space-y-2">
          {alerts.map((alert, index) => (
            <li key={index} className="text-sm">
              {alert}
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No hay alertas pendientes
        </p>
      )}
    </div>
  );
}
