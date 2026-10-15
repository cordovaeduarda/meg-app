import type { TablesInsert } from './database.types'
import { supabase } from './supabase'

// Creates a medication and its schedule times.
// TablesInsert<'medications'> is a generated type: the columns you're
// allowed to send when inserting (id, created_at… are filled in by the database)
export async function createMedication(
  medication: TablesInsert<'medications'>,
  times: string[],
) {
  const { data, error } = await supabase
    .from('medications')
    .insert(medication)
    .select('id')
    .single()

  if (error) {
    throw error
  }

  // No times given: the medication shows "No time set" on the Meds page
  if (times.length === 0) {
    return
  }

  const rows = times.map((time) => ({
    medication_id: data.id,
    time_of_day: time,
  }))

  const { error: schedulesError } = await supabase
    .from('medication_schedules')
    .insert(rows)

  if (schedulesError) {
    // Don't leave a half-saved medication behind
    await supabase.from('medications').delete().eq('id', data.id)
    throw schedulesError
  }
}
