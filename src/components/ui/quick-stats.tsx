interface QuickStatsProps {
  totalProducts?: number;
  expiringProducts?: number;
}

export function QuickStats({
  totalProducts = 0,
  expiringProducts = 0,
}: QuickStatsProps) {
  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold">Resumen</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {totalProducts || '--'}
          </div>
          <div className="text-sm text-muted-foreground">Productos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning">
            {expiringProducts || '--'}
          </div>
          <div className="text-sm text-muted-foreground">Por vencer</div>
        </div>
      </div>
    </div>
  );
}
