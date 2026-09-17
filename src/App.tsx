import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CameraTracker } from './components/CameraTracker';
import { AngleHUD } from './components/AngleHUD';
import { CalendarView } from './components/CalendarView';
import { LeaderboardView } from './components/LeaderboardView';
import { PoseGuideModal } from './components/PoseGuideModal';
import { SettingsModal } from './components/SettingsModal';
import { FrameAnalysis, RepRecord, WorkoutSession, WorkoutSettings } from './types/pushup';
import { StorageService } from './services/storageService';
import { voiceCoach } from './services/voiceCoach';
import { 
  Dumbbell, 
  Calendar as CalendarIcon, 
  Trophy, 
  HelpCircle, 
  Settings, 
  Play, 
  Pause,
  Award,
  Flame,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function App() {
  const [activeTab, setActiveTab] = useState<'workout' | 'calendar' | 'leaderboard'>('workout');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Settings
  const [settings, setSettings] = useState<WorkoutSettings>({
    difficulty: 'standard',
    pushupStyle: 'standard',
    gender: 'men',
    voiceCoach: true,
    audioChimes: true,
    targetReps: 20,
    facingDirection: 'auto',
    cameraFacing: 'user',
  });

  // Workout state
  const [isWorkoutActive, setIsWorkoutActive] = useState<boolean>(true);
  const [validReps, setValidReps] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [sessionReps, setSessionReps] = useState<RepRecord[]>([]);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Saved workouts for calendar
  const [workouts, setWorkouts] = useState<WorkoutSession[]>(() => StorageService.getWorkouts());

  // Current frame analysis for HUD
  const [analysis, setAnalysis] = useState<FrameAnalysis>({
    angles: { elbowAngle: 180, hipAngle: 180, hipKneeAngle: 180, kneeAngle: 180, shoulderAngle: 90 },
    side: 'none',
    isInFrame: false,
    isInPlank: false,
    activeFault: null,
    formScore: 100,
    repPhase: 'STANDBY',
    depthProgress: 0,
    pushupStyle: 'standard',
  });

  // Summary modal after workout saved
  const [savedSessionSummary, setSavedSessionSummary] = useState<WorkoutSession | null>(null);

  // Sync settings with audio coach
  useEffect(() => {
    voiceCoach.setVoiceEnabled(settings.voiceCoach);
    voiceCoach.setSoundEnabled(settings.audioChimes);
  }, [settings.voiceCoach, settings.audioChimes]);

  const handleRepCompleted = useCallback((rep: RepRecord, totalValid: number) => {
    setTotalAttempts((prev) => prev + 1);
    setValidReps(totalValid);
    setSessionReps((prev) => [...prev, rep]);
  }, []);

  const handleAnalysisUpdate = useCallback((newAnalysis: FrameAnalysis, currentValid: number) => {
    setAnalysis(newAnalysis);
    setValidReps(currentValid);
  }, []);

  const handleResetSet = () => {
    setValidReps(0);
    setTotalAttempts(0);
    setSessionReps([]);
    sessionStartTimeRef.current = Date.now();
    voiceCoach.speak('Set reset. Ready when you are.');
  };

  const handleFinishWorkout = () => {
    if (validReps === 0) return;

    const endTime = Date.now();
    const durationSec = Math.max(1, Math.round((endTime - sessionStartTimeRef.current) / 1000));
    const avgScore = sessionReps.length
      ? Math.round(sessionReps.reduce((a, b) => a + b.formScore, 0) / sessionReps.length)
      : 85;

    // Approximate calories burned: ~0.35 - 0.45 kcal per pushup
    const calories = Math.round(validReps * 0.42);

    const session: WorkoutSession = {
      id: 'session_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      startTime: sessionStartTimeRef.current,
      endTime,
      totalReps: totalAttempts,
      validReps,
      averageFormScore: avgScore,
      totalDurationSec: durationSec,
      reps: sessionReps,
      caloriesBurned: calories,
      mode: settings.difficulty,
      pushupStyle: settings.pushupStyle,
    };

    StorageService.saveWorkout(session);
    setWorkouts(StorageService.getWorkouts());
    setSavedSessionSummary(session);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    voiceCoach.speak(`Workout complete! You logged ${validReps} clean pushups with an average form score of ${avgScore} percent!`);

    // Reset set after save
    handleResetSet();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400">
                <Dumbbell className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white m-0 p-0 flex items-center gap-1.5 leading-tight">
                PushUp<span className="text-emerald-400">AI</span>
              </h1>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Side-Vision Posture Tracker
              </span>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('workout')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'workout'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Workout</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboard</span>
            </button>
          </div>

          {/* Action Modals */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
              title="Pose Guide & Angles"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 pt-3 pb-6 flex-1">
        {activeTab === 'workout' && (
          <div className="flex flex-col lg:flex-row gap-5 items-stretch">
            {/* Left Col: Camera Tracker Canvas */}
            <div className="w-full lg:w-7/12 flex flex-col gap-2.5">
              <CameraTracker
                settings={settings}
                onRepCompleted={handleRepCompleted}
                onAnalysisUpdate={handleAnalysisUpdate}
                isActive={isWorkoutActive}
              />
              
              {/* Camera status bar */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 bg-slate-900/60 border border-slate-800/80 rounded-xl py-2 px-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${analysis.isInFrame ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="font-medium text-slate-300 text-xs">
                    {analysis.isInFrame ? 'Full Body In Frame (Active Tracking)' : 'Step back to fit your full body in the camera frame'}
                  </span>
                </div>
                <button
                  onClick={() => setIsWorkoutActive(!isWorkoutActive)}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white font-semibold bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition"
                >
                  {isWorkoutActive ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{isWorkoutActive ? 'Pause Vision' : 'Resume Vision'}</span>
                </button>
              </div>
            </div>

            {/* Right Col: Live Angle HUD, Rep Stats & Feedback */}
            <div className="w-full lg:w-5/12 flex flex-col">
              <AngleHUD
                analysis={analysis}
                validReps={validReps}
                totalAttempts={totalAttempts}
                onResetSet={handleResetSet}
                onFinishWorkout={handleFinishWorkout}
                voiceEnabled={settings.voiceCoach}
                onToggleVoice={() => setSettings({ ...settings, voiceCoach: !settings.voiceCoach })}
                soundEnabled={settings.audioChimes}
                onToggleSound={() => setSettings({ ...settings, audioChimes: !settings.audioChimes })}
                pushupStyle={settings.pushupStyle}
                onTogglePushupStyle={() => setSettings({ ...settings, pushupStyle: settings.pushupStyle === 'standard' ? 'knee' : 'standard' })}
              />
            </div>
          </div>
        )}

        {activeTab === 'calendar' && <CalendarView workouts={workouts} />}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            onStartChallenge={() => {
              setActiveTab('workout');
            }}
          />
        )}
      </main>

      {/* Guide Modal */}
      <PoseGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(s) => setSettings(s)}
        onProfileUpdated={() => setWorkouts(StorageService.getWorkouts())}
      />

      {/* Saved Workout Congratulations Modal */}
      {savedSessionSummary && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white mb-1">Workout Saved!</h3>
            <p className="text-xs text-slate-400 mb-6">
              Great pushup session! Your reps and form scores have been logged to your calendar.
            </p>

            <div className="grid grid-cols-3 gap-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6">
              <div>
                <span className="text-xs text-slate-400">Clean Reps</span>
                <div className="text-2xl font-black text-emerald-400">
                  {savedSessionSummary.validReps}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400">Form Score</span>
                <div className="text-2xl font-black text-cyan-400">
                  {savedSessionSummary.averageFormScore}%
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400">Calories</span>
                <div className="text-2xl font-black text-amber-400">
                  {savedSessionSummary.caloriesBurned}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSavedSessionSummary(null);
                  setActiveTab('calendar');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-sm"
              >
                View Calendar
              </button>
              <button
                onClick={() => setSavedSessionSummary(null)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
