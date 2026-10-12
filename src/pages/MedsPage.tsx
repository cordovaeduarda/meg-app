import { useCallback, useEffect, useState } from 'react'
import { Pill } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Tables } from '@/lib/database.types'
import { usePet } from '@/lib/pet-context'
import { supabase } from '@/lib/supabase'

// One medication row, plus the list of its schedule rows attached
type MedicationWithSchedules = Tables<'medications'> & {
  medication_schedules: Tables<'medication_schedules'>[]
}

function MedsPage() {
  const pet = usePet()
  // null = still loading, [] = loaded but empty
  const [medications, setMedications] = useState<MedicationWithSchedules[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadMedications = useCallback(async () => {
    const { data, error } = await supabase
      .from('medications')
      .select('*, medication_schedules(*)')
      .eq('pet_id', pet.id)
      .eq('active', true)
      .order('name')
      // Sorts the attached schedules too, so 08:00 shows before 20:00
      .order('time_of_day', { referencedTable: 'medication_schedules' })

    if (error) setError(error.message)
    else setMedications(data)
  }, [pet.id])

  useEffect(() => {
    void loadMedications()
  }, [loadMedications])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Schedule" title="Medications" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="size-4" /> Active medications
          </CardTitle>
          <CardDescription>What {pet.name} takes, and when.</CardDescription>
        </CardHeader>

        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">
              Couldn't load medications: {error}
            </p>
          ) : medications === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : medications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No medications yet.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {medications.map((med) => (
                <li
                  key={med.id}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p>
                      <span className="font-medium">{med.name}</span>{' '}
                      {med.dose_amount !== null && (
                        <span className="text-muted-foreground">
                          {med.dose_amount} {med.dose_unit}
                        </span>
                      )}
                    </p>
                    {med.instructions && (
                      <p className="text-sm text-muted-foreground">
                        {med.instructions}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-end gap-1">
                    {med.medication_schedules.length === 0 ? (
                      <Badge variant="outline">No time set</Badge>
                    ) : (
                      med.medication_schedules.map((schedule) => (
                        <Badge key={schedule.id} variant="secondary">
                          {schedule.time_of_day.slice(0, 5)}
                        </Badge>
                      ))
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MedsPage
