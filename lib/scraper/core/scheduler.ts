import { createClient } from "@supabase/supabase-js";
import { ScraperController } from "./scraperController";

function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function createSchedule(data: any) {
  const supabase = getServiceSupabase();
  const next_run_at = calculateNextRun(data.frequency, data.day_of_week, data.date_time);
  
  const { data: schedule, error } = await supabase
    .from("scraper_schedules")
    .insert([{ ...data, next_run_at }])
    .select()
    .single();

  if (error) throw error;
  return schedule;
}

export function calculateNextRun(frequency: string, dayOfWeek?: string, dateTime?: string): Date | null {
  const now = new Date();
  
  if (frequency === "one_time" && dateTime) {
    return new Date(dateTime);
  }
  
  if (frequency === "weekly" && dayOfWeek) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetDayIndex = days.indexOf(dayOfWeek);
    if (targetDayIndex === -1) return null;

    const currentDayIndex = now.getDay();
    let daysUntilNext = targetDayIndex - currentDayIndex;
    
    // If it's today but already past, or if it's earlier in the week, schedule for next week
    if (daysUntilNext <= 0) {
      daysUntilNext += 7;
    }

    const nextRun = new Date(now);
    nextRun.setDate(now.getDate() + daysUntilNext);
    // Set to 00:00:00 local time on that day (or any preferred default hour)
    nextRun.setHours(0, 0, 0, 0); 
    
    return nextRun;
  }
  
  return null;
}

export async function getDueSchedules() {
  const supabase = getServiceSupabase();
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from("scraper_schedules")
    .select("*")
    .eq("enabled", true)
    .lte("next_run_at", now);

  if (error) throw error;
  return data || [];
}

export async function updateScheduleAfterRun(id: string, frequency: string, dayOfWeek?: string) {
  const supabase = getServiceSupabase();
  const now = new Date();
  
  const updates: Record<string, string | boolean | null> = { last_run_at: now.toISOString() };
  
  if (frequency === "one_time") {
    // Disable it after running once
    updates.enabled = false;
  } else if (frequency === "weekly") {
    // Calculate the next run (7 days from now, or based on dayOfWeek)
    updates.next_run_at = calculateNextRun("weekly", dayOfWeek)?.toISOString() || null;
  }

  const { error } = await supabase
    .from("scraper_schedules")
    .update(updates)
    .eq("id", id);
    
  if (error) console.error(`Failed to update schedule ${id} after run:`, error);
}

export async function runDueSchedules() {
  const schedules = await getDueSchedules();
  console.log(`Found ${schedules.length} due schedules.`);
  
  const controller = new ScraperController();
  const results = [];

  for (const schedule of schedules) {
    console.log(`Running schedule ${schedule.id} for ${schedule.platform}...`);
    try {
      const result = await controller.run(schedule.platform, schedule.max_products);
      await updateScheduleAfterRun(schedule.id, schedule.frequency, schedule.day_of_week);
      results.push({ schedule_id: schedule.id, result });
    } catch (e: any) {
      console.error(`Error running schedule ${schedule.id}:`, e);
      results.push({ schedule_id: schedule.id, error: e.message });
    }
  }
  
  return results;
}
