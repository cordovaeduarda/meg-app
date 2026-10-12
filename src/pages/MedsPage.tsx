import PageHeader from '@/components/PageHeader'

function MedsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Schedule" title="Medications" />
      <p className="text-muted-foreground">
        Meg's medication list and schedules will live here (step 8).
      </p>
    </div>
  )
}

export default MedsPage
