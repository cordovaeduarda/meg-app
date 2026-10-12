type PageHeaderProps = {
  title: string
  eyebrow?: string
}

function PageHeader({ title, eyebrow }: PageHeaderProps) {
  return (
    <header>
      {eyebrow && (
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    </header>
  )
}

export default PageHeader
