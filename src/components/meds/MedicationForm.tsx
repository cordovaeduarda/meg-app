import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createMedication,
  stopMedication,
  updateMedication,
  type MedicationWithSchedules,
} from '@/lib/medications'
import { usePet } from '@/lib/pet-context'

type MedicationFormProps = {
  onSaved: () => void
  onCancel: () => void
  medication?: MedicationWithSchedules //given -> edit mode, missing -> add mode
}

function MedicationForm({ onSaved, onCancel, medication}: MedicationFormProps) {
  // pet_id doesn't come from a form field, it comes from the current pet
  const pet = usePet()
  const [name, setName] = useState(medication?.name ?? '') //if medication was given when calling the function, use its name, if not, starts with empty name
  const [doseAmount, setDoseAmount] = useState(medication?.dose_amount?.toString() ?? '')
  const [doseUnit, setDoseUnit] = useState(medication?.dose_unit ?? '')
  const [instructions, setInstructions] = useState(medication?.instructions ?? '')
  const [times, setTimes] = useState<string[]>(medication? medication.medication_schedules.map((schedule) => schedule.time_of_day.slice(0, 5)): ['08:00'],)
  const [endDate, setEndDate] = useState(medication?.end_date ?? '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Each change builds a new array; state is never modified in place
  function changeTime(index: number, value: string) {
    setTimes(times.map((time, i) => (i === index ? value : time)))
  }

  function removeTime(index: number) {
    setTimes(times.filter((_, i) => i !== index))
  }

  function addTime() {
    setTimes([...times, ''])
  }

  async function handleStop() {
    // Checks first: returning after setLoading(true) would leave the form stuck on "Saving…"
    if (!medication) return
    if (!window.confirm(`Stop giving ${medication.name}? It will be removed from the list, but its history is kept.`)) return

    setError(null)
    setLoading(true)

    try {
      await stopMedication(medication.id)
      onSaved() // MedsPage closes the dialog and reloads the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not stop the medication')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const fields = {
        name: name.trim(),
        dose_amount: doseAmount ? Number(doseAmount) : null,
        dose_unit: doseUnit.trim() || null,
        instructions: instructions.trim() || null,
        end_date: endDate || null,
      }

      const cleanTimes = times.filter((time) => time !== '') // drop blank time inputs

      if (medication) {
        await updateMedication(medication, fields, cleanTimes)
      } else {
        await createMedication({ ...fields, pet_id: pet.id }, cleanTimes)
      }
      onSaved() // MedsPage closes the dialog and reloads the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the medication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          required
          placeholder="Pimobendan"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="dose-amount">Dose</Label>
          <Input
            id="dose-amount"
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            placeholder="2.5"
            value={doseAmount}
            onChange={(e) => setDoseAmount(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dose-unit">Unit</Label>
          <Input
            id="dose-unit"
            placeholder="mg"
            value={doseUnit}
            onChange={(e) => setDoseUnit(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Times</Label>
        {times.map((time, index) => (
          // Index as key is fine here: items have no id and are only appended/removed
          <div key={index} className="flex items-center gap-2">
            <Input
              type="time"
              aria-label={`Time ${index + 1}`}
              value={time}
              onChange={(e) => changeTime(index, e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove time ${index + 1}`}
              onClick={() => removeTime(index)}
            >
              <X />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addTime}>
          <Plus /> Add time
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="instructions">Instructions (optional)</Label>
        <Input
          id="instructions"
          placeholder="With food"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="end-date">End date (optional)</Label>
        <Input
          id="end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {medication && (
          <Button
            type="button"
            variant="destructive"
            className="sm:mr-auto"
            disabled={loading}
            onClick={handleStop}
          >
            Stop giving it
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save medication'}
        </Button>
      </div>
    </form>
  )
}

export default MedicationForm
