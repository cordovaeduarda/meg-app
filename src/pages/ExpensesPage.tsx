import PageHeader from '@/components/PageHeader'

function ExpensesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Finances" title="Expenses" />
      <p className="text-muted-foreground">
        Expenses and spending dashboards will live here (step 10).
      </p>
    </div>
  )
}

export default ExpensesPage
