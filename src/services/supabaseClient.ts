import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WorkoutSession, LeaderboardUser } from '../types/pushup';

const STORAGE_KEYS = {
  SUPABASE_URL: 'agy_pushup_sb_url_v1',
  SUPABASE_ANON_KEY: 'agy_pushup_sb_key_v1',
};

// Retrieve credentials from Vite env or user localStorage config
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY) || '' : '';

  return {
    url: envUrl || localUrl,
    anonKey: envKey || localKey,
  };
}

export function saveCustomSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, anonKey.trim());
    supabaseInstance = null; // reset client to reinitialize
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) return null;

  try {
    supabaseInstance = createClient(url, anonKey);
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client', err);
    return null;
  }
}

export function isSupabaseConnected(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey);
}

/**
 * Uploads completed workout session to Supabase
 */
export async function syncWorkoutToSupabase(session: WorkoutSession, athleteName: string, avatar: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('workouts').insert([
      {
        id: session.id,
        athlete_name: athleteName,
        athlete_avatar: avatar,
        workout_date: session.date,
        start_time: session.startTime,
        end_time: session.endTime,
        total_reps: session.totalReps,
        valid_reps: session.validReps,
        avg_form_score: session.averageFormScore,
        duration_sec: session.totalDurationSec,
        calories_burned: session.caloriesBurned,
        mode: session.mode,
        pushup_style: session.pushupStyle,
      },
    ]);

    if (error) {
      console.warn('Supabase workout sync warning:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase sync error', e);
    return false;
  }
}

/**
 * Fetches real-time leaderboard from Supabase
 */
export async function fetchSupabaseLeaderboard(): Promise<LeaderboardUser[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch today's workouts aggregated by athlete
    const { data, error } = await client
      .from('workouts')
      .select('*')
      .eq('workout_date', today)
      .order('valid_reps', { ascending: false });

    if (error || !data) {
      console.warn('Supabase fetch leaderboard error', error);
      return null;
    }

    // Aggregate by athlete_name
    const map = new Map<string, LeaderboardUser>();

    data.forEach((w: any) => {
      const name = w.athlete_name || 'Anonymous';
      const existing = map.get(name);
      if (existing) {
        existing.totalRepsToday += w.valid_reps || 0;
        existing.bestSingleSet = Math.max(existing.bestSingleSet, w.valid_reps || 0);
        existing.avgFormScore = Math.round((existing.avgFormScore + (w.avg_form_score || 85)) / 2);
      } else {
        map.set(name, {
          id: name,
          name,
          avatar: w.athlete_avatar || '🏆',
          totalRepsToday: w.valid_reps || 0,
          bestSingleSet: w.valid_reps || 0,
          avgFormScore: w.avg_form_score || 90,
          streakDays: 1,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalRepsToday - a.totalRepsToday);
  } catch (err) {
    console.error('Failed to load Supabase leaderboard', err);
    return null;
  }
}
