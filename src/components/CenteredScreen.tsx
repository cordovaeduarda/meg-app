import type { ReactNode } from 'react'
import { PawPrint } from 'lucide-react'

// Full-screen wrapper for screens shown outside the app layout:
// loading, login, and first-time setup
function CenteredScreen({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <PawPrint className="size-6" />
      </div>
      {children}
    </div>
  )
}

export default CenteredScreen
