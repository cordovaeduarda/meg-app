import { useCallback, useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import LogForm from '@/components/log/LogForm'
import { usePet } from '@/lib/pet-context'
import { loadDailyLog, type DailyLog } from '@/lib/dailyLogs'
import { todayISO } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'

function LogPage() {
  const pet = usePet()
  // Kept as state (not todayISO() everywhere) so moving between days is easy later
  const [date] = useState(todayISO())
  //undefined = still loading
  //null = loaded, nobody has logged today
  //a DailyLog object = loaded, and the log exists
  const [log, setLog] = useState<DailyLog | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const loadLog = useCallback(async () => {
    try {
      setLog(await loadDailyLog(pet.id, date))
    } catch (err) {
      setError(errorMessage(err, 'Could not load the daily log'))
    }
  }, [pet.id, date])

  useEffect(() => {
    void loadLog()
  }, [loadLog])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Daily notes" title={`${pet.name}'s log`} />

      {/* error first: if loading failed, log stays undefined and we'd show "Loading…" forever */}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : log === undefined ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        // Covers both null (empty form) and a loaded log (filled form).
        // key={date}: a different day throws this form away and starts a fresh one
        <LogForm key={date} log={log} date={date} />
      )}
    </div>
  )
}

export default LogPage
