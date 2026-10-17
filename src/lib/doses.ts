import { supabase } from './supabase'

// One row of the Today checklist: a single dose at a single time
export type TodayDose = {
  scheduleId: string
  name: string
  dose: string // '2.5 mg', or '' when there's no dose
  time: string // 'HH:MM'
  given: boolean
}

export async function loadTodayDoses(petId: string, today: string): Promise<TodayDose[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*, medication_schedules(*, dose_logs(*))')
    .eq('pet_id', petId)
    .eq('active', true)
    .lte('start_date', today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .eq('medication_schedules.dose_logs.log_date', today)

  if (error) throw error

  // Nested (medication → schedules) to flat (one row per dose), sorted by time
  return data
    .flatMap((med) =>
      med.medication_schedules.map((schedule) => ({
        scheduleId: schedule.id,
        name: med.name,
        time: schedule.time_of_day.slice(0, 5),
        given: schedule.dose_logs.length > 0, // only today's logs were fetched
        dose:
          med.dose_amount !== null
            ? `${med.dose_amount} ${med.dose_unit ?? ''}`.trim()
            : '',
      })),
    )
    .sort((a, b) => a.time.localeCompare(b.time))
}

// Ticks a dose: one dose_log row for this schedule on this day
// given_at and given_by are filled in by the database (defaults)
export async function markDoseGiven(scheduleId: string, today: string) {
  const { error } = await supabase
    .from('dose_logs')
    .insert({ schedule_id: scheduleId, log_date: today })

  if (error) {
    throw error
  }
}

// Unticks a dose: removes that day's row for this schedule
export async function unmarkDose(scheduleId: string, today: string) {
  const { error } = await supabase
    .from('dose_logs')
    .delete()
    .eq('schedule_id', scheduleId)
    .eq('log_date', today)

  if (error) {
    throw error
  }
}

