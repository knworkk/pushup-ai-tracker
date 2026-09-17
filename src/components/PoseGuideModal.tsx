import React from 'react';
import { X, Camera, ShieldAlert, CheckCircle2, Award, Info, AlertTriangle } from 'lucide-react';

interface PoseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PoseGuideModal: React.FC<PoseGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Pushup Form & Setup Guide</h3>
              <p className="text-xs text-slate-400">Master the biomechanics and prevent joint injury</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-6 text-sm text-slate-300">
          {/* Camera Setup Section */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <h4 className="font-bold text-white flex items-center gap-2 mb-2 text-base">
              <Camera className="w-4 h-4 text-cyan-400" /> 1. Camera Placement (Profile View)
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
              <li>Place your phone or laptop <strong>2 to 3 meters (6 to 9 feet)</strong> away directly at your side.</li>
              <li>Prop your device vertically on the floor or a low stool so your entire body (head to toes) fits in frame.</li>
              <li>The AI auto-detects whether you are facing left or right and tracks the side facing the camera.</li>
            </ul>
          </div>

          {/* Biomechanical Angle Specifications */}
          <div>
            <h4 className="font-bold text-white flex items-center gap-2 mb-3 text-base">
              <Award className="w-4 h-4 text-emerald-400" /> 2. Target Joint Angles for Rep Counting
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1 text-xs">
                  <CheckCircle2 className="w-4 h-4" /> UP / Standby Mode
                </div>
                <div className="text-2xl font-black text-white">160° - 180°</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Arms extended in plank, maintaining a soft lockout to avoid hyperextending elbows. Spine forms a straight 180° line.
                </p>
              </div>

              <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1 text-xs">
                  <CheckCircle2 className="w-4 h-4" /> DOWN / Inflection Depth
                </div>
                <div className="text-2xl font-black text-white">&le; 90°</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Elbow bends to 90 degrees or below, bringing chest 2-3 inches from the floor for full pectoralis activation.
                </p>
              </div>
            </div>
          </div>

          {/* Harmful Postures & Injury Risks */}
          <div>
            <h4 className="font-bold text-white flex items-center gap-2 mb-3 text-base">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> 3. Harmful Postures & Injury Risks
            </h4>
            <div className="flex flex-col gap-2.5">
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Sagging Lower Back (Hip &lt; 155°)
                  </span>
                  <span className="text-[10px] uppercase font-bold text-rose-400 px-1.5 py-0.5 bg-rose-500/10 rounded">
                    High Risk
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  <strong>Risk:</strong> Lumbar shear and anterior pelvic tilt causing L4/L5 disc herniation.
                </p>
                <p className="text-[11px] text-emerald-400 mt-0.5">
                  <strong>Correction:</strong> Squeeze glutes and brace your core as if bracing for a punch.
                </p>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Piked Hips (Butt High in Air)
                  </span>
                  <span className="text-[10px] uppercase font-bold text-amber-400 px-1.5 py-0.5 bg-amber-500/10 rounded">
                    Medium Risk
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  <strong>Risk:</strong> Relieves chest workload and strains the anterior deltoid rotator cuffs.
                </p>
                <p className="text-[11px] text-emerald-400 mt-0.5">
                  <strong>Correction:</strong> Lower hips until a straight line connects shoulders, hips, and heels.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Neck Craning (Chin to Floor)
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 bg-slate-800 rounded">
                    Medium Risk
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  <strong>Risk:</strong> Severe cervical spine strain from dipping head to fake bottom depth.
                </p>
                <p className="text-[11px] text-emerald-400 mt-0.5">
                  <strong>Correction:</strong> Fix gaze on the floor about 12 inches ahead of your hands.
                </p>
              </div>
            </div>
          </div>

          {/* Style Comparison: Standard vs Knee Pushups */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <h4 className="font-bold text-white flex items-center gap-2 mb-2 text-base">
              <CheckCircle2 className="w-4 h-4 text-purple-400" /> 4. Standard vs Knee Pushup Styles
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-3">
                <span className="font-bold text-emerald-400 text-xs block mb-1">
                  Standard Pushup (Men / Toes)
                </span>
                <p className="text-xs text-slate-300">
                  Pivot is at the feet. Body maintains a straight line from <strong>Shoulder &rarr; Hip &rarr; Ankle</strong>. Knees must remain elevated; dropping knees triggers a fault.
                </p>
              </div>
              <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-3">
                <span className="font-bold text-purple-400 text-xs block mb-1">
                  Knee Pushup (Women / Modified)
                </span>
                <p className="text-xs text-slate-300">
                  Pivot is at the knees. Body maintains a straight line from <strong>Shoulder &rarr; Hip &rarr; Knee</strong>. Knees on the floor is 100% allowed, while still targeting &le; 90° elbow depth.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
          >
            Got It, Let's Push!
          </button>
        </div>
      </div>
    </div>
  );
};
