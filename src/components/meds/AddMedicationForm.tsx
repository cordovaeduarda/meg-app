import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createMedication } from '@/lib/medications'
import { usePet } from '@/lib/pet-context'

type AddMedicationFormProps = {
  onAdded: () => void
  onCancel: () => void
}

function AddMedicationForm({ onAdded, onCancel }: AddMedicationFormProps) {
  // pet_id doesn't come from a form field, it comes from the current pet
  const pet = usePet()
  const [name, setName] = useState('')
  const [doseAmount, setDoseAmount] = useState('')
  const [doseUnit, setDoseUnit] = useState('')
  const [instructions, setInstructions] = useState('')
  const [times, setTimes] = useState<string[]>(['08:00'])
  const [endDate, setEndDate] = useState('')
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

  async function handleAddition(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await createMedication(
        {
          pet_id: pet.id,
          name: name.trim(),
          dose_amount: doseAmount ? Number(doseAmount) : null,
          dose_unit: doseUnit.trim() || null,
          instructions: instructions.trim() || null,
          end_date: endDate || null,
        },
        times.filter((time) => time !== ''), // drop blank time inputs
      )
      onAdded() // MedsPage closes the dialog and reloads the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the medication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleAddition} className="flex flex-col gap-4">
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

export default AddMedicationForm
