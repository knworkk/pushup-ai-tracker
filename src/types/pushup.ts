export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type TrackedSide = 'left' | 'right' | 'none';

export type RepPhase = 
  | 'STANDBY'       // Waiting or standing
  | 'READY_PLANK'   // In plank pose ready to start
  | 'GOING_DOWN'    // Descending
  | 'DOWN_POSITION' // Hit required depth (elbow <= 90)
  | 'GOING_UP'      // Ascending
  | 'REP_COMPLETE'; // Finished rep, returning to plank

export type FormFaultType = 
  | 'NONE'
  | 'SAGGING_HIPS'   // Lumbar spine strain risk
  | 'PIKED_HIPS'     // Hips too high (cheating chest work)
  | 'INSUFFICIENT_DEPTH' // Elbow didn't reach 90 deg
  | 'NECK_CRANING'   // Chin to floor (cervical strain)
  | 'HYPEREXTENDED_ELBOW'; // Snapping joint at top

export interface FormFault {
  type: FormFaultType;
  title: string;
  advice: string;
  injuryRisk: string;
  severity: 'low' | 'medium' | 'high';
}

export interface JointAngles {
  elbowAngle: number;       // Shoulder - Elbow - Wrist (Target: <= 90 down, >= 160 up)
  hipAngle: number;         // Shoulder - Hip - Ankle (Standard mode: Target 165 - 180)
  hipKneeAngle: number;     // Shoulder - Hip - Knee (Knee pushup mode: Target 165 - 180)
  kneeAngle: number;        // Hip - Knee - Ankle (Target: >= 165 in standard mode)
  shoulderAngle: number;    // Elbow - Shoulder - Hip
  headAngle?: number;       // Ear - Shoulder - Hip
}

export interface FrameAnalysis {
  angles: JointAngles;
  side: TrackedSide;
  isInFrame: boolean;
  isInPlank: boolean;
  activeFault: FormFault | null;
  formScore: number; // 0 - 100%
  repPhase: RepPhase;
  depthProgress: number; // 0% (up) to 100% (down at 90 deg)
  pushupStyle: 'standard' | 'knee';
}

export interface RepRecord {
  repNumber: number;
  minElbowAngle: number;
  avgHipAngle: number;
  formScore: number; // 0 - 100
  isValid: boolean;
  faultsDetected: FormFaultType[];
  durationSec: number;
  timestamp: number;
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: number;
  endTime: number;
  totalReps: number;
  validReps: number;
  averageFormScore: number;
  totalDurationSec: number;
  reps: RepRecord[];
  caloriesBurned: number;
  mode: 'standard' | 'strict' | 'beginner';
  pushupStyle: 'standard' | 'knee';
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  totalRepsToday: number;
  bestSingleSet: number;
  avgFormScore: number;
  streakDays: number;
  isCurrentUser?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetReps: number;
  minFormScore: number;
  creatorName: string;
  completed: boolean;
}

export type PushupStyle = 'standard' | 'knee';
export type GenderProfile = 'men' | 'women' | 'custom';

export interface WorkoutSettings {
  difficulty: 'standard' | 'strict' | 'beginner';
  pushupStyle: PushupStyle; // 'standard' (full plank / toes) or 'knee' (knees on ground)
  gender: GenderProfile;    // Men default to standard, Women default to knee / choose either
  voiceCoach: boolean;
  audioChimes: boolean;
  targetReps: number;
  facingDirection: 'auto' | 'left' | 'right';
  cameraFacing: 'user' | 'environment';
}

