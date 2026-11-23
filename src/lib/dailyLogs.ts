import type { Tables } from './database.types'
import { supabase } from './supabase'

export type DailyLog = Tables<'daily_logs'>

export type DailyLogFields = { 
    symptoms: string[],
    extra_medications: string | null,
    notes: string | null
}

//given a pet id and a date, returns that day's log, or
//null if there isn't one
export async function loadDailyLog (petId: string, date: string): Promise<DailyLog | null> {
    const { data, error} = await supabase
        .from('daily_logs')
        .select('*')
        .eq('pet_id', petId)
        .eq('log_date', date)
        .maybeSingle() //"I expect zero or one row"

    if (error) throw error

    return data
}

//given a pet id, date and the three fields, creates or
//updates that day's row

export async function saveDailyLog (petId: string, date: string, fields: DailyLogFields) {
    const { error } = await supabase
        .from('daily_logs')
        .upsert({
            pet_id: petId,
            log_date: date,
            symptoms: fields.symptoms,
            extra_medications: fields.extra_medications,
            notes: fields.notes,
            updated_at: new Date().toISOString()
        }, { onConflict: 'pet_id,log_date' })

    if (error) throw error

}
