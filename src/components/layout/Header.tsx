import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { LogOut } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Asperção', href: '/' },
    { name: 'Ajustagem', href: '/ajustagem' },
    { name: 'Produtos', href: '/produtos' },
    { name: 'Bicos', href: '/bicos' },
    { name: 'Funcionários', href: '/funcionarios' },
    ...(user?.role === 'admin' ? [{ name: 'Admin', href: '/admin' }] : []),
  ];

  return (
    <header className="bg-card/80 backdrop-blur-lg sticky top-0 z-50 border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-bold text-foreground">Painel de produção</h1>
          <nav className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center">
            {user && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-secondary text-foreground">
                            {getInitials(user.name)}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="end">
                        <div className="p-2">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                        <div className="h-px bg-border my-2" />
                        <Button variant="ghost" className="w-full justify-start" onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                        </Button>
                    </PopoverContent>
                </Popover>
            )}
        </div>
      </div>
    </header>
  );
}
