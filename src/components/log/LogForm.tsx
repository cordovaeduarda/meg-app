import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveDailyLog, type DailyLog } from '@/lib/dailyLogs'
import { errorMessage } from '@/lib/errors'
import { usePet } from '@/lib/pet-context'

// Fixed list so the same symptom is always spelled the same way,
// which makes it possible to count them later ("3 vomits this week")
const SYMPTOMS = ['Vomit', 'Diarrhea', 'No appetite', 'Lethargy', 'Coughing', 'Itching']

type LogFormProps = {
  log: DailyLog | null // null = nobody has logged this day yet → empty form
  date: string // 'YYYY-MM-DD'
}

function LogForm({ log, date }: LogFormProps) {
  const pet = usePet()
  // Starting values come from the loaded log, or are empty when there's none.
  // They're only read once: LogPage gives this form key={date}, so a new day = a new form
  const [symptoms, setSymptoms] = useState<string[]>(log?.symptoms ?? [])
  const [extraMedications, setExtraMedications] = useState(log?.extra_medications ?? '')
  const [notes, setNotes] = useState(log?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Always build a NEW list: React only redraws when it gets a different array
  function toggleSymptom(name: string) {
    setSaved(false)
    setSymptoms((current) =>
      current.includes(name) ? current.filter((s) => s !== name) : [...current, name],
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      await saveDailyLog(pet.id, date, {
        symptoms,
        // Empty box → null, so "nothing written" is stored one way only
        extra_medications: extraMedications.trim() || null,
        notes: notes.trim() || null,
      })
      setSaved(true)
    } catch (err) {
      setError(errorMessage(err, 'Could not save the log'))
    } finally {
      setSaving(false) // runs on success AND failure, so the button never gets stuck
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Symptoms</legend>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((name) => {
            const on = symptoms.includes(name)
            return (
              <Button
                key={name}
                type="button" // without this, tapping a chip would submit the form
                size="sm"
                variant={on ? 'default' : 'outline'}
                aria-pressed={on}
                className="rounded-full"
                onClick={() => toggleSymptom(name)}
              >
                {on && <Check />}
                {name}
              </Button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="extra-medications">Extra medication</Label>
        <Textarea
          id="extra-medications"
          placeholder="Dipyrone 10 drops at 15:00"
          value={extraMedications}
          onChange={(e) => {
            setSaved(false)
            setExtraMedications(e.target.value)
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={4}
          placeholder="Mood, walks, anything the vet should know…"
          value={notes}
          onChange={(e) => {
            setSaved(false)
            setNotes(e.target.value)
          }}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? 'Saving…' : 'Save log'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Check className="size-4" /> Saved
          </span>
        )}
      </div>
    </form>
  )
}

export default LogForm
