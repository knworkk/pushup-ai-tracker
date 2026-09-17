import React, { useState } from 'react';
import { WorkoutSettings } from '../types/pushup';
import { StorageService, UserProfile } from '../services/storageService';
import { getSupabaseCredentials, saveCustomSupabaseCredentials } from '../services/supabaseClient';
import { X, Settings, User, Volume2, Shield, Camera, Sliders, Database } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WorkoutSettings;
  onSaveSettings: (settings: WorkoutSettings) => void;
  onProfileUpdated?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onProfileUpdated,
}) => {
  const [localSettings, setLocalSettings] = useState<WorkoutSettings>(settings);
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getUserProfile());

  const initialSb = getSupabaseCredentials();
  const [sbUrl, setSbUrl] = useState<string>(initialSb.url);
  const [sbKey, setSbKey] = useState<string>(initialSb.anonKey);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    StorageService.saveUserProfile(profile);
    saveCustomSupabaseCredentials(sbUrl, sbKey);
    if (onProfileUpdated) onProfileUpdated();
    onClose();
  };

  const avatars = ['🏆', '⚡', '🦾', '🔥', '🌟', '🚀', '🥊', '🦍'];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">App & Workout Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 text-sm">
          {/* Athlete Profile */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" /> Athlete Profile
            </label>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex gap-1.5 overflow-x-auto py-1">
                {avatars.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setProfile({ ...profile, avatar: av })}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                      profile.avatar === av
                        ? 'bg-emerald-500/20 border-2 border-emerald-400 scale-105'
                        : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Your Name / Nickname"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Pushup Style & Gender Profile */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" /> Pushup Style & Profile
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, pushupStyle: 'standard', gender: 'men' })}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all text-left flex flex-col gap-0.5 ${
                  localSettings.pushupStyle === 'standard'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span className="font-extrabold text-white text-xs">Standard (Men / Toes)</span>
                <span className="text-[10px] text-slate-400">Knees elevated, full plank line</span>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, pushupStyle: 'knee', gender: 'women' })}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all text-left flex flex-col gap-0.5 ${
                  localSettings.pushupStyle === 'knee'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span className="font-extrabold text-white text-xs">Knee Pushup (Women / Mod)</span>
                <span className="text-[10px] text-slate-400">Knees on floor, shoulder-knee line</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              {localSettings.pushupStyle === 'knee'
                ? '💡 Knee Mode: AI checks straight spine from shoulders to knees. Knees resting on floor is allowed.'
                : '💡 Standard Mode: AI requires legs straight on toes. Dropping knees triggers a fault warning.'}
            </p>
          </div>

          {/* Strictness Difficulty */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Form Strictness Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['beginner', 'standard', 'strict'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, difficulty: mode })}
                  className={`py-2 px-3 rounded-xl capitalize font-bold text-xs border transition-all ${
                    localSettings.difficulty === mode
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {localSettings.difficulty === 'strict' && 'Strict: Elbow <= 85°, spine strictly locked. Military test standard.'}
              {localSettings.difficulty === 'standard' && 'Standard: Elbow <= 90° depth, safe hip alignment required.'}
              {localSettings.difficulty === 'beginner' && 'Beginner: Elbow <= 95°, more forgiving angle thresholds.'}
            </p>
          </div>

          {/* Camera Selection */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" /> Camera Lens
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, cameraFacing: 'user' })}
                className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                  localSettings.cameraFacing === 'user'
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Front Camera (Selfie)
              </button>
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, cameraFacing: 'environment' })}
                className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                  localSettings.cameraFacing === 'environment'
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Rear Camera
              </button>
            </div>
          </div>

          {/* Audio Toggles */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Voice Coaching</span>
            </div>
            <input
              type="checkbox"
              checked={localSettings.voiceCoach}
              onChange={(e) => setLocalSettings({ ...localSettings, voiceCoach: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* Cloud Database (Supabase) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" /> Free Cloud Database (Supabase)
              </label>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                sbUrl && sbKey ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {sbUrl && sbKey ? 'Cloud Active' : 'Local Storage Mode'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Connect Supabase to sync your workouts to the cloud and participate in real-time friend leaderboards!
            </p>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={sbUrl}
                onChange={(e) => setSbUrl(e.target.value)}
                placeholder="Supabase Project URL (https://xxxx.supabase.co)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="password"
                value={sbKey}
                onChange={(e) => setSbKey(e.target.value)}
                placeholder="Supabase Anon Public API Key (eyJhbG...)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
