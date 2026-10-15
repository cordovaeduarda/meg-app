import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  eyebrow?: string
  action?: ReactNode // e.g. an "Add" button, shown on the right
}

function PageHeader({ title, eyebrow, action }: PageHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {action}
    </header>
  )
}

export default PageHeader
