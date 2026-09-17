import { WorkoutSession, LeaderboardUser, Challenge } from '../types/pushup';
import { syncWorkoutToSupabase } from './supabaseClient';

const STORAGE_KEYS = {
  WORKOUTS: 'agy_pushup_workouts_v1',
  SETTINGS: 'agy_pushup_settings_v1',
  LEADERBOARD: 'agy_pushup_leaderboard_v1',
  CHALLENGES: 'agy_pushup_challenges_v1',
  USER_PROFILE: 'agy_pushup_profile_v1',
};

export interface UserProfile {
  name: string;
  avatar: string;
}

const DEFAULT_USERS: LeaderboardUser[] = [
  { id: '1', name: 'Alex Rivera', avatar: '⚡', totalRepsToday: 65, bestSingleSet: 42, avgFormScore: 94, streakDays: 14 },
  { id: '2', name: 'Sarah Chen', avatar: '🔥', totalRepsToday: 50, bestSingleSet: 35, avgFormScore: 96, streakDays: 9 },
  { id: '3', name: 'Marcus Vance', avatar: '🦾', totalRepsToday: 45, bestSingleSet: 30, avgFormScore: 89, streakDays: 5 },
  { id: '4', name: 'Emma Watson', avatar: '🌟', totalRepsToday: 38, bestSingleSet: 26, avgFormScore: 92, streakDays: 7 },
  { id: '5', name: 'David Kim', avatar: '🚀', totalRepsToday: 25, bestSingleSet: 20, avgFormScore: 87, streakDays: 3 },
];

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: 'Strict Form Century',
    description: 'Complete 30 pushups in one session with >= 90% form score.',
    targetReps: 30,
    minFormScore: 90,
    creatorName: 'Coach Marcus',
    completed: false,
  },
  {
    id: 'c2',
    title: 'Daily Double',
    description: 'Hit 20 clean pushups with chest touching 90° depth.',
    targetReps: 20,
    minFormScore: 85,
    creatorName: 'Sarah Chen',
    completed: false,
  },
  {
    id: 'c3',
    title: 'Iron Chest Sprint',
    description: 'Power through 15 pushups without a single hip sag warning.',
    targetReps: 15,
    minFormScore: 92,
    creatorName: 'Alex Rivera',
    completed: false,
  },
];

export class StorageService {
  public static getWorkouts(): WorkoutSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveWorkout(session: WorkoutSession): void {
    try {
      const workouts = this.getWorkouts();
      workouts.unshift(session);
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
      this.updateLeaderboardForUser(session);

      // Async cloud sync to Supabase if connected
      const profile = this.getUserProfile();
      syncWorkoutToSupabase(session, profile.name, profile.avatar).catch((err) =>
        console.warn('Background Supabase sync notice:', err)
      );
    } catch (e) {
      console.error('Failed to save workout session', e);
    }
  }

  public static getUserProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : { name: 'You (Athlete)', avatar: '🏆' };
    } catch {
      return { name: 'You (Athlete)', avatar: '🏆' };
    }
  }

  public static saveUserProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  }

  public static getLeaderboard(): LeaderboardUser[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      let list: LeaderboardUser[] = data ? JSON.parse(data) : DEFAULT_USERS;

      // Ensure current user is in list
      const profile = this.getUserProfile();
      const workouts = this.getWorkouts();
      const todayStr = new Date().toISOString().split('T')[0];
      const todayWorkouts = workouts.filter((w) => w.date === todayStr);
      const todayReps = todayWorkouts.reduce((acc, w) => acc + w.validReps, 0);
      const bestSet = workouts.reduce((max, w) => Math.max(max, w.validReps), 0);
      const avgScore = workouts.length
        ? Math.round(workouts.reduce((acc, w) => acc + w.averageFormScore, 0) / workouts.length)
        : 0;

      const userIndex = list.findIndex((u) => u.isCurrentUser);
      const userItem: LeaderboardUser = {
        id: 'me',
        name: profile.name,
        avatar: profile.avatar,
        totalRepsToday: todayReps,
        bestSingleSet: bestSet,
        avgFormScore: avgScore || 90,
        streakDays: this.calculateStreak(workouts),
        isCurrentUser: true,
      };

      if (userIndex >= 0) {
        list[userIndex] = userItem;
      } else {
        list.push(userItem);
      }

      return list.sort((a, b) => b.totalRepsToday - a.totalRepsToday);
    } catch {
      return DEFAULT_USERS;
    }
  }

  private static updateLeaderboardForUser(session: WorkoutSession) {
    const list = this.getLeaderboard();
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(list));
    this.checkChallenges(session);
  }

  public static getChallenges(): Challenge[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
      return data ? JSON.parse(data) : DEFAULT_CHALLENGES;
    } catch {
      return DEFAULT_CHALLENGES;
    }
  }

  public static addCustomChallenge(challenge: Omit<Challenge, 'id' | 'completed'>): Challenge {
    const challenges = this.getChallenges();
    const newChallenge: Challenge = {
      ...challenge,
      id: 'c_' + Date.now(),
      completed: false,
    };
    challenges.unshift(newChallenge);
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
    return newChallenge;
  }

  private static checkChallenges(session: WorkoutSession) {
    const challenges = this.getChallenges();
    let updated = false;

    for (const c of challenges) {
      if (!c.completed && session.validReps >= c.targetReps && session.averageFormScore >= c.minFormScore) {
        c.completed = true;
        updated = true;
      }
    }

    if (updated) {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
    }
  }

  public static calculateStreak(workouts: WorkoutSession[]): number {
    if (!workouts || workouts.length === 0) return 0;
    
    // Sort unique dates descending
    const dates = Array.from(new Set(workouts.map((w) => w.date))).sort().reverse();
    if (dates.length === 0) return 0;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Must have worked out today or yesterday to maintain streak
    if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 1;
    let curr = new Date(dates[0]);

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(curr);
      prev.setDate(prev.getDate() - 1);
      const expected = prev.toISOString().split('T')[0];

      if (dates[i] === expected) {
        streak++;
        curr = prev;
      } else {
        break;
      }
    }

    return streak;
  }
}
