import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getPoseLandmarker, processPoseResult } from '../engine/poseDetector';
import { 
  detectSide, 
  checkBodyInFrame, 
  extractJointAngles, 
  evaluatePostureFault, 
  calculateInstantFormScore,
  AngleSmoother,
  POSE_LANDMARKS
} from '../engine/angleMath';
import { PushupStateMachine } from '../engine/pushupStateMachine';
import { FrameAnalysis, JointAngles, Landmark3D, RepRecord, TrackedSide, WorkoutSettings } from '../types/pushup';
import { voiceCoach } from '../services/voiceCoach';
import { RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CameraTrackerProps {
  settings: WorkoutSettings;
  onRepCompleted: (rep: RepRecord, totalValid: number) => void;
  onAnalysisUpdate: (analysis: FrameAnalysis, validCount: number) => void;
  isActive: boolean;
}

export const CameraTracker: React.FC<CameraTrackerProps> = ({
  settings,
  onRepCompleted,
  onAnalysisUpdate,
  isActive,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [streamReady, setStreamReady] = useState<boolean>(false);

  const smootherRef = useRef<AngleSmoother>(new AngleSmoother(0.4));
  const fsmRef = useRef<PushupStateMachine>(new PushupStateMachine(settings));
  const lastTimeRef = useRef<number>(-1);
  const currentStreamRef = useRef<MediaStream | null>(null);

  // Keep settings updated in state machine
  useEffect(() => {
    fsmRef.current.updateSettings(settings);
  }, [settings]);

  // Handle camera stream setup
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: settings.cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      currentStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setStreamReady(true);
        };
      }
    } catch (err: unknown) {
      console.error('Camera access error', err);
      setCameraError('Unable to access camera. Please allow camera permissions and refresh.');
    }
  }, [settings.cameraFacing]);

  // Load Pose Landmarker
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoadingModel(true);
        await getPoseLandmarker();
        if (mounted) {
          setIsLoadingModel(false);
          startCamera();
        }
      } catch (err) {
        console.error('Failed to initialize pose landmarker', err);
        if (mounted) {
          setCameraError('Failed to initialize AI posture vision. Please check internet connection.');
          setIsLoadingModel(false);
        }
      }
    })();

    return () => {
      mounted = false;
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [startCamera]);

  // Frame processing loop
  useEffect(() => {
    if (!streamReady || !isActive || isLoadingModel) return;

    let isRunning = true;

    const processFrame = async () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const landmarker = await getPoseLandmarker();
        const ctx = canvas.getContext('2d');

        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        if (ctx && landmarker) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const currentTime = performance.now();
          if (currentTime !== lastTimeRef.current) {
            lastTimeRef.current = currentTime;

            const poseResult = landmarker.detectForVideo(video, currentTime);
            const landmarks = processPoseResult(poseResult);

            if (landmarks && landmarks.length >= 33) {
              // 1. Determine side
              let side: TrackedSide = settings.facingDirection !== 'auto' 
                ? settings.facingDirection 
                : detectSide(landmarks);

              // 2. Check if body is in frame
              const isInFrame = checkBodyInFrame(landmarks, side);

              // 3. Extract and smooth angles
              const rawAngles = extractJointAngles(landmarks, side);

              if (rawAngles) {
                const smoothedAngles = smootherRef.current.smooth(rawAngles);

                // 4. Check for posture faults (respecting standard vs knee pushup style)
                const currentFault = evaluatePostureFault(
                  smoothedAngles,
                  landmarks,
                  side,
                  fsmRef.current.getCounts().total > 0 ? 'GOING_DOWN' : 'STANDBY',
                  settings.pushupStyle
                );

                const formScore = calculateInstantFormScore(smoothedAngles, currentFault, settings.pushupStyle);

                // 5. Update state machine
                const smResult = fsmRef.current.update(
                  smoothedAngles,
                  currentFault,
                  formScore,
                  isInFrame
                );

                // Sound & voice feedback
                if (smResult.newRepCompleted && smResult.completedRepData) {
                  if (smResult.completedRepData.isValid) {
                    voiceCoach.playRepChime();
                    voiceCoach.speak(smResult.repMessage || `Rep ${smResult.validReps}`, true);
                    
                    // Celebrate milestone reps
                    if (smResult.validReps % 5 === 0) {
                      confetti({
                        particleCount: 50,
                        spread: 60,
                        origin: { y: 0.8 },
                        colors: ['#10b981', '#06b6d4', '#f59e0b'],
                      });
                    }
                  } else {
                    voiceCoach.playFaultWarning();
                    voiceCoach.speak(smResult.repMessage || 'Rep discounted: check form', true);
                  }
                  onRepCompleted(smResult.completedRepData, smResult.validReps);
                } else if (smResult.phase === 'DOWN_POSITION') {
                  voiceCoach.playDepthClick();
                } else if (currentFault && currentFault.severity === 'high') {
                  voiceCoach.speak(currentFault.advice, false, 3500);
                }

                // Callback for HUD
                onAnalysisUpdate(
                  {
                    angles: smoothedAngles,
                    side,
                    isInFrame,
                    isInPlank: smResult.phase !== 'STANDBY',
                    activeFault: currentFault,
                    formScore,
                    repPhase: smResult.phase,
                    depthProgress: smResult.depthProgress,
                    pushupStyle: settings.pushupStyle,
                  },
                  smResult.validReps
                );

                // 6. Draw Skeleton HUD on canvas
                drawSkeleton(ctx, landmarks, side, smoothedAngles, currentFault, smResult.depthProgress, canvas.width, canvas.height);
              }
            } else {
              // No person detected
              onAnalysisUpdate(
                {
                  angles: { elbowAngle: 180, hipAngle: 180, hipKneeAngle: 180, kneeAngle: 180, shoulderAngle: 90 },
                  side: 'none',
                  isInFrame: false,
                  isInPlank: false,
                  activeFault: null,
                  formScore: 100,
                  repPhase: 'STANDBY',
                  depthProgress: 0,
                  pushupStyle: settings.pushupStyle,
                },
                fsmRef.current.getCounts().valid
              );
            }
          }
        }
      }

      if (isRunning) {
        animFrameIdRef.current = requestAnimationFrame(processFrame);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [streamReady, isActive, isLoadingModel, settings, onRepCompleted, onAnalysisUpdate]);

  // Drawing helper function for canvas
  const drawSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: Landmark3D[],
    side: TrackedSide,
    angles: JointAngles,
    fault: ReturnType<typeof evaluatePostureFault>,
    depthProgress: number,
    w: number,
    h: number
  ) => {
    if (side === 'none') return;
    const isLeft = side === 'left';

    const pShoulder = landmarks[isLeft ? POSE_LANDMARKS.LEFT_SHOULDER : POSE_LANDMARKS.RIGHT_SHOULDER];
    const pElbow = landmarks[isLeft ? POSE_LANDMARKS.LEFT_ELBOW : POSE_LANDMARKS.RIGHT_ELBOW];
    const pWrist = landmarks[isLeft ? POSE_LANDMARKS.LEFT_WRIST : POSE_LANDMARKS.RIGHT_WRIST];
    const pHip = landmarks[isLeft ? POSE_LANDMARKS.LEFT_HIP : POSE_LANDMARKS.RIGHT_HIP];
    const pKnee = landmarks[isLeft ? POSE_LANDMARKS.LEFT_KNEE : POSE_LANDMARKS.RIGHT_KNEE];
    const pAnkle = landmarks[isLeft ? POSE_LANDMARKS.LEFT_ANKLE : POSE_LANDMARKS.RIGHT_ANKLE];

    const toCoords = (lm: Landmark3D) => ({ x: lm.x * w, y: lm.y * h });

    // Helper line drawer
    const drawBone = (p1: Landmark3D, p2: Landmark3D, color: string, width: number = 4) => {
      const c1 = toCoords(p1);
      const c2 = toCoords(p2);
      ctx.beginPath();
      ctx.moveTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    };

    // Helper joint drawer
    const drawJoint = (p: Landmark3D, color: string, radius: number = 7) => {
      const c = toCoords(p);
      ctx.beginPath();
      ctx.arc(c.x, c.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // Determine colors based on posture status
    const isKneeMode = settings.pushupStyle === 'knee';
    const displayedHipAngle = isKneeMode ? angles.hipKneeAngle : angles.hipAngle;

    const armColor = depthProgress >= 95 ? '#06b6d4' : '#10b981'; // cyan at depth, green otherwise
    const spineColor = fault && fault.type === 'SAGGING_HIPS' ? '#f43f5e' : (fault?.type === 'PIKED_HIPS' ? '#f59e0b' : '#10b981');
    const legColor = isKneeMode ? '#10b981' : (angles.kneeAngle < 160 ? '#f59e0b' : '#10b981');

    // Draw arm bones
    if (pShoulder && pElbow) drawBone(pShoulder, pElbow, armColor, 5);
    if (pElbow && pWrist) drawBone(pElbow, pWrist, armColor, 5);

    // Draw torso/spine bone
    if (pShoulder && pHip) drawBone(pShoulder, pHip, spineColor, 6);

    // Draw legs
    if (pHip && pKnee) drawBone(pHip, pKnee, isKneeMode ? spineColor : legColor, isKneeMode ? 6 : 5);
    if (pKnee && pAnkle) drawBone(pKnee, pAnkle, isKneeMode ? 'rgba(100, 116, 139, 0.4)' : legColor, isKneeMode ? 3 : 5);

    // Draw joints
    if (pShoulder) drawJoint(pShoulder, '#38bdf8', 8);
    if (pElbow) drawJoint(pElbow, armColor, 9);
    if (pWrist) drawJoint(pWrist, '#38bdf8', 6);
    if (pHip) drawJoint(pHip, spineColor, 10);
    if (pKnee) drawJoint(pKnee, isKneeMode ? '#38bdf8' : legColor, isKneeMode ? 9 : 7);
    if (pAnkle) drawJoint(pAnkle, isKneeMode ? 'rgba(100, 116, 139, 0.5)' : '#38bdf8', 6);

    // Draw angle badge on Elbow
    if (pElbow) {
      const eb = toCoords(pElbow);
      drawAngleBadge(ctx, eb.x + 25, eb.y - 10, `${angles.elbowAngle}°`, armColor);
    }

    // Draw angle badge on Hip (Shows Shoulder-Hip-Knee angle in knee mode, Shoulder-Hip-Ankle in standard mode)
    if (pHip) {
      const hb = toCoords(pHip);
      drawAngleBadge(ctx, hb.x, hb.y - 25, `${displayedHipAngle}°`, spineColor);
    }
  };

  const drawAngleBadge = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    text: string,
    color: string
  ) => {
    ctx.save();
    ctx.font = 'bold 13px system-ui, sans-serif';
    const textMetrics = ctx.measureText(text);
    const pad = 6;
    const boxW = textMetrics.width + pad * 2;
    const boxH = 22;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    // Rounded box
    ctx.beginPath();
    ctx.roundRect(x - boxW / 2, y - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  return (
    <div className="relative w-full aspect-[4/3] md:aspect-[16/9] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Background Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Foreground Canvas for Real-time Skeleton & Angles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <Sparkles className="w-8 h-8 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Initializing AI Pose Engine</h3>
          <p className="text-slate-400 text-sm max-w-xs">
            Loading MediaPipe client-side neural network for sub-millisecond posture tracking...
          </p>
        </div>
      )}

      {/* Camera Error / Permission Banner */}
      {cameraError && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-30">
          <AlertCircle className="w-14 h-14 text-rose-500 mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Camera Access Required</h3>
          <p className="text-slate-400 text-sm max-w-md mb-6">{cameraError}</p>
          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}

      {/* Floating Framing Assistance overlay */}
      {!isLoadingModel && !cameraError && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 rounded-full text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Side-View AI Tracker Active</span>
        </div>
      )}
    </div>
  );
};
