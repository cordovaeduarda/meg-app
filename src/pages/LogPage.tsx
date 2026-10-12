import PageHeader from '@/components/PageHeader'

function LogPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Daily notes" title="Log" />
      <p className="text-muted-foreground">
        Appetite, symptoms, weight and photos will live here (step 9).
      </p>
    </div>
  )
}

export default LogPage
