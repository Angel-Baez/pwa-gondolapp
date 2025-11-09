import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="relative mb-8 text-center">
      <div className="absolute right-0 top-0">
        <ThemeToggle />
      </div>
      <h1 className="mb-2 text-3xl font-bold text-primary">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </header>
  );
}
