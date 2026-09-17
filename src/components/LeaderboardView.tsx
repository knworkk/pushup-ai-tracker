import React, { useState } from 'react';
import { LeaderboardUser, Challenge } from '../types/pushup';
import { StorageService } from '../services/storageService';
import { 
  Trophy, 
  Flame, 
  Share2, 
  PlusCircle, 
  Check, 
  Medal,
  Users,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LeaderboardViewProps {
  onStartChallenge?: (challenge: Challenge) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onStartChallenge }) => {
  const [users, setUsers] = useState<LeaderboardUser[]>(() => StorageService.getLeaderboard());
  const [challenges, setChallenges] = useState<Challenge[]>(() => StorageService.getChallenges());

  // Challenge modal / create form
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('Weekend Pushup Showdown');
  const [targetReps, setTargetReps] = useState<number>(25);
  const [minFormScore, setMinFormScore] = useState<number>(90);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = StorageService.getUserProfile();
    const created = StorageService.addCustomChallenge({
      title,
      description: `Challenge from ${profile.name}: Complete ${targetReps} reps with &ge; ${minFormScore}% form score.`,
      targetReps,
      minFormScore,
      creatorName: profile.name,
    });

    setChallenges(StorageService.getChallenges());
    setShowCreateModal(false);
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 },
    });
  };

  const handleShareChallenge = (challenge: Challenge) => {
    const text = `🔥 Can you beat my Pushup Challenge "${challenge.title}"? Target: ${challenge.targetReps} clean reps at ${challenge.minFormScore}% form score!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(challenge.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-cyan-500/10 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-black text-white tracking-tight">Community Leaderboard & Challenges</h3>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Compete with friends, maintain form integrity, and climb the daily rankings!
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Challenge a Friend
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Leaderboard Table */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" /> Today's Clean Rep Leaderboard
            </h4>
            <span className="text-xs text-slate-500">Live Local & Friend Ranks</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                  <th className="py-3 px-2">Rank</th>
                  <th className="py-3 px-2">Athlete</th>
                  <th className="py-3 px-2 text-center">Reps Today</th>
                  <th className="py-3 px-2 text-center">Best Set</th>
                  <th className="py-3 px-2 text-center">Avg Form</th>
                  <th className="py-3 px-2 text-right">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((user, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        user.isCurrentUser ? 'bg-emerald-500/10 border-l-2 border-emerald-400' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-2 font-bold">
                        {rank === 1 ? (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Medal className="w-4 h-4" /> #1
                          </span>
                        ) : rank === 2 ? (
                          <span className="text-slate-300">#2</span>
                        ) : rank === 3 ? (
                          <span className="text-amber-600">#3</span>
                        ) : (
                          <span className="text-slate-500">#{rank}</span>
                        )}
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-base border border-slate-700">
                            {user.avatar}
                          </span>
                          <div>
                            <span className="font-bold text-white block">
                              {user.name}
                              {user.isCurrentUser && (
                                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md">
                                  YOU
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Reps */}
                      <td className="py-3 px-2 text-center font-extrabold text-emerald-400">
                        {user.totalRepsToday}
                      </td>

                      {/* Best set */}
                      <td className="py-3 px-2 text-center font-medium text-slate-300">
                        {user.bestSingleSet}
                      </td>

                      {/* Form Score */}
                      <td className="py-3 px-2 text-center">
                        <span className="px-2 py-0.5 bg-slate-800 text-cyan-300 text-xs font-semibold rounded-md border border-slate-700">
                          {user.avgFormScore}%
                        </span>
                      </td>

                      {/* Streak */}
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1 text-amber-400 font-bold text-xs">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{user.streakDays}d</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Challenges */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-400" /> Active Challenges
            </h4>
            <span className="text-xs text-slate-500">{challenges.length} Available</span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[460px] pr-1">
            {challenges.map((c) => (
              <div
                key={c.id}
                className={`border rounded-xl p-4 flex flex-col gap-2 transition-all ${
                  c.completed
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-white text-sm flex items-center gap-2">
                      {c.title}
                      {c.completed && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Done
                        </span>
                      )}
                    </h5>
                    <span className="text-[11px] text-slate-400">By {c.creatorName}</span>
                  </div>
                  <button
                    onClick={() => handleShareChallenge(c)}
                    title="Copy challenge text to share"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {copiedId === c.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-300">{c.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-emerald-400 font-semibold">{c.targetReps} Clean Reps</span>
                  <span className="text-cyan-400 font-semibold">&ge; {c.minFormScore}% Form</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Create Friend Challenge</h3>
            <p className="text-xs text-slate-400 mb-4">
              Set a pushup goal and invite your friends to beat your rep count and strict form score.
            </p>

            <form onSubmit={handleCreateChallenge} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Challenge Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Target Reps
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={targetReps}
                    onChange={(e) => setTargetReps(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Min Form Score (%)
                  </label>
                  <input
                    type="number"
                    min="70"
                    max="99"
                    value={minFormScore}
                    onChange={(e) => setMinFormScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg"
                >
                  Create & Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
