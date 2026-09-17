import React, { useState } from 'react';
import { WorkoutSession } from '../types/pushup';
import { StorageService } from '../services/storageService';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Clock, 
  CheckCircle, 
  Trophy, 
  Sparkles,
  Zap
} from 'lucide-react';

interface CalendarViewProps {
  workouts: WorkoutSession[];
  onSelectDateWorkout?: (session: WorkoutSession) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ workouts }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in current month
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Group workouts by date (YYYY-MM-DD)
  const workoutsByDate: Record<string, WorkoutSession[]> = {};
  workouts.forEach((w) => {
    if (!workoutsByDate[w.date]) workoutsByDate[w.date] = [];
    workoutsByDate[w.date].push(w);
  });

  const totalAllTimeReps = workouts.reduce((sum, w) => sum + w.validReps, 0);
  const streak = StorageService.calculateStreak(workouts);
  const avgOverallForm = workouts.length
    ? Math.round(workouts.reduce((sum, w) => sum + w.averageFormScore, 0) / workouts.length)
    : 0;

  const selectedWorkouts = workoutsByDate[selectedDayStr] || [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Top Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Daily Streak</span>
            <div className="text-2xl font-black text-white">{streak} {streak === 1 ? 'day' : 'days'}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Clean Reps</span>
            <div className="text-2xl font-black text-white">{totalAllTimeReps}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Avg Form Score</span>
            <div className="text-2xl font-black text-white">{avgOverallForm || 90}%</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Sessions</span>
            <div className="text-2xl font-black text-white">{workouts.length}</div>
          </div>
        </div>
      </div>

      {/* Main Calendar & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 cols on large) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">
                {monthNames[month]} {year}
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl p-1 border border-slate-700">
              <button
                onClick={prevMonth}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank leading days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`blank-${i}`} className="h-14 rounded-xl opacity-0" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayWorkouts = workoutsByDate[dateStr] || [];
              const dayReps = dayWorkouts.reduce((s, w) => s + w.validReps, 0);
              const isSelected = selectedDayStr === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDayStr(dateStr)}
                  className={`h-14 rounded-xl p-1.5 flex flex-col justify-between items-center transition-all relative border ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-950/40 text-white shadow-md'
                      : isToday
                      ? 'border-slate-600 bg-slate-800/60 text-white'
                      : 'border-slate-800/80 bg-slate-950/50 hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold self-start">{dayNum}</span>

                  {dayWorkouts.length > 0 ? (
                    <div className="w-full flex items-center justify-center gap-1 bg-emerald-500/20 border border-emerald-500/40 rounded-md py-0.5">
                      <span className="text-[10px] font-extrabold text-emerald-300">
                        {dayReps}
                      </span>
                    </div>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Workout Details Panel for Selected Date */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="border-b border-slate-800 pb-4 mb-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Workout Log
            </h4>
            <div className="text-xl font-bold text-white mt-1">
              {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>

          {selectedWorkouts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <CalendarIcon className="w-12 h-12 mb-2 text-slate-700" />
              <p className="text-sm font-medium">No pushup sessions logged on this day.</p>
              <p className="text-xs mt-1 text-slate-600">Start the camera to log a workout!</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 max-h-[380px]">
              {selectedWorkouts.map((w, index) => (
                <div
                  key={w.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">
                      Set #{index + 1}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(w.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-white">{w.validReps}</span>
                      <span className="text-xs text-slate-400 ml-1">clean reps</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-cyan-400">{w.averageFormScore}%</span>
                      <span className="block text-[10px] text-slate-500">form score</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{Math.round(w.totalDurationSec)}s duration</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>~{w.caloriesBurned} kcal burned</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
