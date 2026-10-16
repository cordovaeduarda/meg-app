import type { Tables, TablesInsert, TablesUpdate } from './database.types'
import { supabase } from './supabase'

// One medication row, plus the list of its schedule rows attached
export type MedicationWithSchedules = Tables<'medications'> & {
  medication_schedules: Tables<'medication_schedules'>[]
}

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

// Update a medication's fields and syncs its schedule times without deleting rows that didn't change (deleting a schedule cascades to its dose_logs)

export async function updateMedication(
  medication: MedicationWithSchedules, //the medication as it was before editing
  fields: TablesUpdate<'medications'>, //the new name, dose, etc.
  times: string[], //times from the form, 'HH:MM'
) {
  // Update the necessary fields from medications table for which the id of medications table is the same as the medication.id we wanna change
  const { error } = await supabase
    .from('medications') 
    .update(fields)
    .eq('id', medication.id)

  if (error) {
    throw error
  }

  const oldTimes = medication.medication_schedules.map((schedule) => schedule.time_of_day.slice(0,5)) //here we have an array of strings sliced 'HH:MM'

  //Find the times to INSERT: in 'times' but not among the old times 
  const fieldsToBeInserted = times.filter((time) => !(oldTimes.includes(time)))
  // We need to .map() the fields to be inserted into { medication_id, time_of_day } since we need the medication_id to do the insert operation in the database
  const rowsToBeInserted = fieldsToBeInserted.map((time) => ({
    medication_id: medication.id,
    time_of_day: time
  }))

  if (rowsToBeInserted.length > 0) {
    const { error: insertError } = await supabase
      .from('medication_schedules')
      .insert(rowsToBeInserted)

    if (insertError) {
      throw insertError
    }
  }

  //Find the times to DELETE: the old rows whose time is NOT among the new times
  const schedulesToDelete = medication.medication_schedules.filter((schedule) => !(times.includes(schedule.time_of_day.slice(0,5))))
  const idsToBeDeleted = schedulesToDelete.map((schedule) => schedule.id)

  if (idsToBeDeleted.length > 0) {
    const { error: deleteError } = await supabase
      .from('medication_schedules')
      .delete()
      .in('id', idsToBeDeleted)

    if (deleteError) {
      throw deleteError
    }
  }
}

export async function stopMedication(id: string) {
   const { error } = await supabase
    .from('medications') 
    .update({active: false})
    .eq('id', id)

  if (error) {
    throw error
  }
}

