import { PawPrint } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'
import { usePet } from '@/lib/pet-context'
import { navItems } from './nav-items'

function AppLayout() {
  const pet = usePet()

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop: sidebar on the left (hidden below the md breakpoint) */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 bg-sidebar p-4 md:flex">
        <div className="flex items-center gap-2 px-2 pt-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <PawPrint className="size-4" />
          </div>
          <span className="font-semibold">{pet.name}</span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  isActive && 'bg-muted text-foreground',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* The current page renders here */}
      <main className="mx-auto w-full max-w-md flex-1 p-4 pb-28 md:max-w-3xl md:p-8">
        <Outlet />
      </main>

      {/* Mobile: tab bar fixed to the bottom (hidden from md up) */}
      <nav className="fixed inset-x-0 bottom-0 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-3 text-xs font-medium text-muted-foreground',
                  isActive && 'text-foreground',
                )
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default AppLayout
