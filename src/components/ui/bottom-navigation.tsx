import { List, Package, Scan, Settings } from 'lucide-react';
import Link from 'next/link';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`touch-target-44 flex flex-col items-center p-2 ${
        isActive ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      {icon}
      <span className="mt-1 text-xs">{label}</span>
    </Link>
  );
}

interface BottomNavigationProps {
  currentPath?: string;
}

export function BottomNavigation({ currentPath = '/' }: BottomNavigationProps) {
  return (
    <>
      <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 border-t border-border bg-background">
        <div className="flex justify-around py-2">
          <NavItem
            href="/"
            icon={<Package className="h-6 w-6" />}
            label="Inicio"
            isActive={currentPath === '/'}
          />
          <NavItem
            href="/lists"
            icon={<List className="h-6 w-6" />}
            label="Listas"
            isActive={currentPath === '/lists'}
          />
          <NavItem
            href="/scanner"
            icon={<Scan className="h-6 w-6" />}
            label="Escanear"
            isActive={currentPath === '/scanner'}
          />
          <NavItem
            href="/settings"
            icon={<Settings className="h-6 w-6" />}
            label="Ajustes"
            isActive={currentPath === '/settings'}
          />
        </div>
      </nav>

      {/* Add bottom padding to account for navigation */}
      <div className="h-20" />
    </>
  );
}
