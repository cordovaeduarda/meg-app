import { useCallback, useEffect, useState } from 'react'
import { Pill, Plus, Wallet } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { usePet } from '@/lib/pet-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { todayISO } from '@/lib/dates'
import { loadTodayDoses, markDoseGiven, unmarkDose, type TodayDose } from '@/lib/doses'
import { errorMessage } from '@/lib/errors'

function TodayPage() {
  const pet = usePet()
  // null = still loading, [] = loaded but nothing to give today
  const [doses, setDoses] = useState<TodayDose[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null) // a scheduleId, or null
  // Kept apart from `error`: a failed tick shows a message but keeps the list visible
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadDoses = useCallback(async () => {
    try {
      setDoses(await loadTodayDoses(pet.id, todayISO()))
    } catch (err) {
      setError(errorMessage(err, 'Could not load doses'))
    }
  }, [pet.id])

  useEffect(() => {
    void loadDoses()
  }, [loadDoses])

  // While loading, count as an empty list so the summary shows 0/0
  const list = doses ?? []
  const givenCount = list.filter((dose) => dose.given).length
  // Guard against 0/0 = NaN when there's nothing to give today
  const progress = list.length > 0 ? (givenCount / list.length) * 100 : 0
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  async function toggleDose(dose: TodayDose) {
    // One save at a time: a quick double tap would insert the same dose twice
    if (savingId !== null) return

    setSavingId(dose.scheduleId)
    setSaveError(null)

    try {
      if (dose.given) {
        await unmarkDose(dose.scheduleId, todayISO())
      } else {
        await markDoseGiven(dose.scheduleId, todayISO())
      }
      await loadDoses() // refresh, so the boxes show what's really saved
    } catch (err) {
      console.error(err)
      setSaveError(errorMessage(err, 'Could not save the dose'))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={today} title={`${pet.name}'s day`} />

      <section className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Doses today
            </p>
            <p className="text-3xl font-semibold tracking-tight">
              {givenCount}/{list.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Spent in Oct
            </p>
            <p className="text-3xl font-semibold tracking-tight">R$ 482</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="size-4" /> Medications
          </CardTitle>
          <CardDescription>Tap a dose once it's given</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? (
            <p className="text-sm text-destructive">
              Couldn't load today's doses: {error}
            </p>
          ) : doses === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : doses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No doses for {pet.name} today.
            </p>
          ) : (
            <>
              <Progress value={progress} />
              {saveError && (
                <p className="text-sm text-destructive">
                  Couldn't save: {saveError}
                </p>
              )}
              <ul className="flex flex-col gap-3">
                {doses.map((dose) => (
                  <li key={dose.scheduleId}>
                    <label className="flex items-center gap-3">
                      <Checkbox
                        checked={dose.given}
                        disabled={savingId === dose.scheduleId}
                        onCheckedChange={() => void toggleDose(dose)}
                      />
                      <span className="flex-1">
                        <span className="font-medium">{dose.name}</span>{' '}
                        <span className="text-muted-foreground">{dose.dose}</span>
                      </span>
                      <Badge variant="secondary">{dose.time}</Badge>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick note</CardTitle>
          <CardDescription>Appetite, mood, anything for the vet</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="Ate everything, very playful…" />
          <Button>
            <Plus /> Save
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button className="flex-1">
          <Wallet /> Add expense
        </Button>
        <Button variant="outline" className="flex-1">
          View history
        </Button>
      </div>
    </div>
  )
}

export default TodayPage
