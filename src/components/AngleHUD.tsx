import React from 'react';
import { FrameAnalysis } from '../types/pushup';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Activity, 
  Flame, 
  ArrowDown, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

import { PushupStyle } from '../types/pushup';

interface AngleHUDProps {
  analysis: FrameAnalysis;
  validReps: number;
  totalAttempts: number;
  onResetSet: () => void;
  onFinishWorkout: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  pushupStyle: PushupStyle;
  onTogglePushupStyle: () => void;
}

export const AngleHUD: React.FC<AngleHUDProps> = ({
  analysis,
  validReps,
  totalAttempts,
  onResetSet,
  onFinishWorkout,
  voiceEnabled,
  onToggleVoice,
  soundEnabled,
  onToggleSound,
  pushupStyle,
  onTogglePushupStyle,
}) => {
  const { angles, activeFault, formScore, repPhase, depthProgress, side } = analysis;

  const isAtDepth = angles.elbowAngle <= 90;
  const isKneeMode = pushupStyle === 'knee';
  const displayedHipAngle = isKneeMode ? angles.hipKneeAngle : angles.hipAngle;
  const isHipSafe = displayedHipAngle >= 158;

  // Status helper
  const getPhaseBadge = () => {
    switch (repPhase) {
      case 'STANDBY':
        return { text: 'Standby (Plank to start)', color: 'bg-slate-800 text-slate-300 border border-slate-700' };
      case 'READY_PLANK':
        return { text: 'Ready! Descend to start', color: 'bg-blue-600 text-white animate-pulse' };
      case 'GOING_DOWN':
        return { text: 'Descending...', color: 'bg-amber-600 text-white font-bold' };
      case 'DOWN_POSITION':
        return { text: 'Depth Reached! Push Up!', color: 'bg-cyan-500 text-slate-950 font-bold' };
      case 'GOING_UP':
        return { text: 'Ascending...', color: 'bg-emerald-600 text-white font-bold' };
      case 'REP_COMPLETE':
        return { text: 'Rep Complete!', color: 'bg-emerald-500 text-slate-950 font-bold' };
      default:
        return { text: 'Standby', color: 'bg-slate-800 text-slate-300' };
    }
  };

  const badge = getPhaseBadge();

  return (
    <div className="flex flex-col gap-3 w-full h-full justify-between">
      {/* Top Banner: Fault & Injury Risk Warning */}
      {activeFault && activeFault.type !== 'NONE' && (
        <div className="bg-rose-950/90 border-2 border-rose-500/80 rounded-2xl p-3.5 shadow-lg flex items-start gap-3 animate-bounce">
          <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-white font-bold text-sm truncate flex items-center gap-2">
                {activeFault.title}
                <span className="text-[10px] uppercase px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-md font-extrabold shrink-0">
                  Warning
                </span>
              </h4>
            </div>
            <p className="text-rose-200 text-xs font-medium mt-0.5 leading-snug">{activeFault.advice}</p>
            <div className="mt-1.5 bg-rose-900/50 rounded-lg px-2 py-0.5 text-[11px] text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 shrink-0 text-amber-400" />
              <span className="truncate">Risk: {activeFault.injuryRisk}</span>
            </div>
          </div>
        </div>
      )}

      {/* Card 1: Pushup Reps & Depth */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 lg:p-5 flex flex-col justify-between relative overflow-hidden shadow-md">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-emerald-400" /> Pushup Reps
            </span>
            <button
              onClick={onTogglePushupStyle}
              title="Click to toggle between Standard and Knee Pushup modes"
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                isKneeMode
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {isKneeMode ? 'Knee (Women/Mod)' : 'Standard (Men/Toes)'}
            </button>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap shadow-sm ${badge.color}`}>
            {badge.text}
          </span>
        </div>

        <div className="flex items-baseline gap-3 my-1">
          <span className="text-5xl lg:text-6xl font-black tracking-tight text-white glow-emerald">
            {validReps}
          </span>
          {totalAttempts > validReps && (
            <span className="text-xs text-slate-400 font-medium">
              ({totalAttempts - validReps} discounted)
            </span>
          )}
        </div>

        {/* Depth Progress Bar */}
        <div className="mt-2.5">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span className="flex items-center gap-1 text-slate-300">
              <ArrowDown className="w-3.5 h-3.5 text-cyan-400" /> Rep Depth
            </span>
            <span className="font-bold text-white">{depthProgress}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                depthProgress >= 95
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${depthProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>Plank (0%)</span>
            <span className="text-cyan-400 font-semibold">Chest to Floor (100% at &le;90°)</span>
          </div>
        </div>
      </div>

      {/* Card 2: Biomechanical Angles */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 lg:p-5 flex flex-col justify-between shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" /> Biomechanical Angles
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>Profile:</span>
            <span className="font-bold text-slate-200 capitalize bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
              {side === 'none' ? 'Searching...' : `${side} side`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 my-1">
          {/* Elbow Gauge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-xs text-slate-400 block mb-0.5 font-medium">Elbow Joint</span>
            <span className={`text-3xl font-black ${isAtDepth ? 'text-cyan-400' : 'text-slate-100'}`}>
              {angles.elbowAngle}°
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Target: &le; 90° (at bottom)
            </span>
          </div>

          {/* Spine/Hip Gauge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-xs text-slate-400 block mb-0.5 font-medium">
              {isKneeMode ? 'Spine (To Knee)' : 'Spine (To Ankle)'}
            </span>
            <span className={`text-3xl font-black ${isHipSafe ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
              {displayedHipAngle}°
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Safe: 165° - 180°
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Form Quality & Session Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 lg:p-5 flex flex-col justify-between shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Form Quality
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleVoice}
              title="Toggle Voice Coach"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                voiceEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Voice</span>
            </button>
            <button
              onClick={onToggleSound}
              title="Toggle Sound Effects"
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                soundEnabled
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              SFX
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <div className="text-4xl lg:text-5xl font-black text-white">
              {formScore}%
            </div>
            <div className="text-xs">
              {formScore >= 90 ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Strict Form
                </span>
              ) : formScore >= 75 ? (
                <span className="text-amber-400 font-bold">Acceptable Form</span>
              ) : (
                <span className="text-rose-400 font-bold">Form Breakdown</span>
              )}
              <span className="block text-slate-400 text-[11px]">Real-time biomechanics</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 mt-3">
          <button
            onClick={onResetSet}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Set
          </button>
          <button
            onClick={onFinishWorkout}
            disabled={validReps === 0}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-md ${
              validReps > 0
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                : 'bg-slate-800/60 text-slate-600 cursor-not-allowed'
            }`}
          >
            Save Workout
          </button>
        </div>
      </div>
    </div>
  );
};
