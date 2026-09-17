import { Landmark3D, JointAngles, TrackedSide, FormFault } from '../types/pushup';

// MediaPipe landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

/**
 * Calculates the interior angle (in degrees 0-180) formed by 3 landmarks: A - B - C
 * B is the vertex point.
 */
export function calculateAngle(a: Landmark3D, b: Landmark3D, c: Landmark3D): number {
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  const dotProduct = baX * bcX + baY * bcY;
  const magnitudeBA = Math.sqrt(baX * baX + baY * baY);
  const magnitudeBC = Math.sqrt(bcX * bcX + bcY * bcY);

  if (magnitudeBA === 0 || magnitudeBC === 0) return 180;

  let cosine = dotProduct / (magnitudeBA * magnitudeBC);
  // Clamp between -1 and 1 to prevent floating point domain errors
  cosine = Math.max(-1, Math.min(1, cosine));

  const radians = Math.acos(cosine);
  return Math.round((radians * 180) / Math.PI);
}

/**
 * Calculates 3D angle considering depth (z) if available.
 */
export function calculate3DAngle(a: Landmark3D, b: Landmark3D, c: Landmark3D): number {
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const baZ = (a.z || 0) - (b.z || 0);

  const bcX = c.x - b.x;
  const bcY = c.y - b.y;
  const bcZ = (c.z || 0) - (b.z || 0);

  const dotProduct = baX * bcX + baY * bcY + baZ * bcZ;
  const magBA = Math.sqrt(baX * baX + baY * baY + baZ * baZ);
  const magBC = Math.sqrt(bcX * bcX + bcY * bcY + bcZ * bcZ);

  if (magBA === 0 || magBC === 0) return 180;
  let cosine = dotProduct / (magBA * magBC);
  cosine = Math.max(-1, Math.min(1, cosine));
  return Math.round((Math.acos(cosine) * 180) / Math.PI);
}

/**
 * Determines whether user is facing left or right, or which side has better camera visibility.
 */
export function detectSide(landmarks: Landmark3D[]): TrackedSide {
  if (!landmarks || landmarks.length < 33) return 'none';

  const leftKeypoints = [
    landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
    landmarks[POSE_LANDMARKS.LEFT_ELBOW],
    landmarks[POSE_LANDMARKS.LEFT_WRIST],
    landmarks[POSE_LANDMARKS.LEFT_HIP],
    landmarks[POSE_LANDMARKS.LEFT_KNEE],
    landmarks[POSE_LANDMARKS.LEFT_ANKLE],
  ];

  const rightKeypoints = [
    landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
    landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
    landmarks[POSE_LANDMARKS.RIGHT_WRIST],
    landmarks[POSE_LANDMARKS.RIGHT_HIP],
    landmarks[POSE_LANDMARKS.RIGHT_KNEE],
    landmarks[POSE_LANDMARKS.RIGHT_ANKLE],
  ];

  const leftConfidence = leftKeypoints.reduce((acc, pt) => acc + (pt.visibility ?? 0), 0) / leftKeypoints.length;
  const rightConfidence = rightKeypoints.reduce((acc, pt) => acc + (pt.visibility ?? 0), 0) / rightKeypoints.length;

  if (leftConfidence < 0.45 && rightConfidence < 0.45) {
    return 'none';
  }

  return leftConfidence >= rightConfidence ? 'left' : 'right';
}

/**
 * Checks if key pushup landmarks are inside the camera frame bounds.
 */
export function checkBodyInFrame(landmarks: Landmark3D[], side: TrackedSide): boolean {
  if (side === 'none' || !landmarks || landmarks.length < 33) return false;

  const indices = side === 'left' 
    ? [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_ANKLE]
    : [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_ANKLE];

  for (const idx of indices) {
    const pt = landmarks[idx];
    if (!pt) return false;
    // Check visibility confidence
    if (pt.visibility !== undefined && pt.visibility < 0.4) return false;
    // Check viewport boundaries
    if (pt.x < 0.02 || pt.x > 0.98 || pt.y < 0.02 || pt.y > 0.98) return false;
  }

  return true;
}

/**
 * Exponential Moving Average (EMA) smoothing for angles to eliminate webcam frame-by-frame flutter.
 */
export class AngleSmoother {
  private alpha: number;
  private prevAngles: JointAngles | null = null;

  constructor(alpha: number = 0.4) {
    this.alpha = alpha;
  }

  smooth(current: JointAngles): JointAngles {
    if (!this.prevAngles) {
      this.prevAngles = { ...current };
      return current;
    }

    const smoothed: JointAngles = {
      elbowAngle: Math.round(this.alpha * current.elbowAngle + (1 - this.alpha) * this.prevAngles.elbowAngle),
      hipAngle: Math.round(this.alpha * current.hipAngle + (1 - this.alpha) * this.prevAngles.hipAngle),
      hipKneeAngle: Math.round(this.alpha * current.hipKneeAngle + (1 - this.alpha) * (this.prevAngles.hipKneeAngle || current.hipKneeAngle)),
      kneeAngle: Math.round(this.alpha * current.kneeAngle + (1 - this.alpha) * this.prevAngles.kneeAngle),
      shoulderAngle: Math.round(this.alpha * current.shoulderAngle + (1 - this.alpha) * this.prevAngles.shoulderAngle),
      headAngle: current.headAngle !== undefined && this.prevAngles.headAngle !== undefined
        ? Math.round(this.alpha * current.headAngle + (1 - this.alpha) * this.prevAngles.headAngle)
        : current.headAngle,
    };

    this.prevAngles = smoothed;
    return smoothed;
  }

  reset() {
    this.prevAngles = null;
  }
}

/**
 * Extracts joint angles from landmarks based on active side.
 */
export function extractJointAngles(landmarks: Landmark3D[], side: TrackedSide): JointAngles | null {
  if (side === 'none' || !landmarks || landmarks.length < 33) return null;

  const isLeft = side === 'left';
  const shoulder = landmarks[isLeft ? POSE_LANDMARKS.LEFT_SHOULDER : POSE_LANDMARKS.RIGHT_SHOULDER];
  const elbow = landmarks[isLeft ? POSE_LANDMARKS.LEFT_ELBOW : POSE_LANDMARKS.RIGHT_ELBOW];
  const wrist = landmarks[isLeft ? POSE_LANDMARKS.LEFT_WRIST : POSE_LANDMARKS.RIGHT_WRIST];
  const hip = landmarks[isLeft ? POSE_LANDMARKS.LEFT_HIP : POSE_LANDMARKS.RIGHT_HIP];
  const knee = landmarks[isLeft ? POSE_LANDMARKS.LEFT_KNEE : POSE_LANDMARKS.RIGHT_KNEE];
  const ankle = landmarks[isLeft ? POSE_LANDMARKS.LEFT_ANKLE : POSE_LANDMARKS.RIGHT_ANKLE];
  const ear = landmarks[isLeft ? POSE_LANDMARKS.LEFT_EAR : POSE_LANDMARKS.RIGHT_EAR];

  if (!shoulder || !elbow || !wrist || !hip || !knee) return null;

  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  const hipAngle = ankle ? calculateAngle(shoulder, hip, ankle) : 180;
  const hipKneeAngle = calculateAngle(shoulder, hip, knee);
  const kneeAngle = ankle ? calculateAngle(hip, knee, ankle) : 180;
  const shoulderAngle = calculateAngle(elbow, shoulder, hip);
  const headAngle = ear ? calculateAngle(ear, shoulder, hip) : undefined;

  return {
    elbowAngle,
    hipAngle,
    hipKneeAngle,
    kneeAngle,
    shoulderAngle,
    headAngle,
  };
}

/**
 * Evaluates posture faults and harmful biomechanics.
 */
export function evaluatePostureFault(
  angles: JointAngles,
  landmarks: Landmark3D[],
  side: TrackedSide,
  repPhase: string,
  pushupStyle: 'standard' | 'knee' = 'standard'
): FormFault | null {
  const isLeft = side === 'left';
  const shoulder = landmarks[isLeft ? POSE_LANDMARKS.LEFT_SHOULDER : POSE_LANDMARKS.RIGHT_SHOULDER];
  const hip = landmarks[isLeft ? POSE_LANDMARKS.LEFT_HIP : POSE_LANDMARKS.RIGHT_HIP];
  const knee = landmarks[isLeft ? POSE_LANDMARKS.LEFT_KNEE : POSE_LANDMARKS.RIGHT_KNEE];
  const ankle = landmarks[isLeft ? POSE_LANDMARKS.LEFT_ANKLE : POSE_LANDMARKS.RIGHT_ANKLE];

  if (pushupStyle === 'knee') {
    // KNEE PUSHUP MODE (Women / Beginners / Modified)
    // Pivot point is at knees; hips must remain aligned with shoulders and knees
    if (shoulder && hip && knee) {
      const expectedHipY = (shoulder.y + knee.y) / 2;
      const isHipDipped = hip.y > expectedHipY + 0.04;
      const isHipPiked = hip.y < expectedHipY - 0.07;

      if (angles.hipKneeAngle < 155 && isHipDipped) {
        return {
          type: 'SAGGING_HIPS',
          title: 'Sagging Lower Back (Knee Mode)',
          advice: 'Squeeze abs and glutes to keep a straight line from shoulders to knees.',
          injuryRisk: 'Causes severe lumbar disc shear (L4/L5 compression) and lower back strain.',
          severity: 'high',
        };
      }

      if (angles.hipKneeAngle < 155 && isHipPiked) {
        return {
          type: 'PIKED_HIPS',
          title: 'Hips Too High (Knee Mode)',
          advice: 'Flatten hips to form a straight line with knees.',
          injuryRisk: 'Shifts tension off the chest and strains shoulder caps.',
          severity: 'medium',
        };
      }
    }
  } else {
    // STANDARD PUSHUP MODE (Men / Full Plank on Toes)
    // Pivot point is at feet/ankles; knees must be straight and elevated
    if (shoulder && hip && ankle) {
      const expectedHipY = (shoulder.y + ankle.y) / 2;
      const isHipDipped = hip.y > expectedHipY + 0.05;
      const isHipPiked = hip.y < expectedHipY - 0.08;

      if (angles.hipAngle < 155 && isHipDipped) {
        return {
          type: 'SAGGING_HIPS',
          title: 'Sagging Lower Back',
          advice: 'Tighten abs and squeeze glutes to elevate hips.',
          injuryRisk: 'Causes severe lumbar disc shear (L4/L5 compression) and back pain.',
          severity: 'high',
        };
      }

      if (angles.hipAngle < 155 && isHipPiked) {
        return {
          type: 'PIKED_HIPS',
          title: 'Hips Piked Too High',
          advice: 'Lower your hips into a straight plank line.',
          injuryRisk: 'Shifts load off your chest and strains anterior shoulder tendons.',
          severity: 'medium',
        };
      }
    }

    // Knee dropped check in standard mode
    if (angles.kneeAngle < 145 && repPhase === 'GOING_DOWN') {
      return {
        type: 'SAGGING_HIPS',
        title: 'Knees Dropping (Standard Mode)',
        advice: 'Keep legs straight on your toes, or switch to Knee Pushup mode in Settings.',
        injuryRisk: 'Reduces core engagement and destabilizes pelvis.',
        severity: 'medium',
      };
    }
  }

  // Check for Neck Craning
  if (angles.headAngle !== undefined && angles.headAngle < 140 && repPhase === 'GOING_DOWN') {
    return {
      type: 'NECK_CRANING',
      title: 'Neck Craning Forward',
      advice: 'Keep head aligned with spine; look 1 foot ahead on the floor.',
      injuryRisk: 'Cervical spine strain and tension headaches.',
      severity: 'medium',
    };
  }

  return null;
}

/**
 * Calculates a 0-100 Form Score for the current frame.
 */
export function calculateInstantFormScore(
  angles: JointAngles,
  activeFault: FormFault | null,
  pushupStyle: 'standard' | 'knee' = 'standard'
): number {
  if (activeFault) {
    if (activeFault.severity === 'high') return 45;
    if (activeFault.severity === 'medium') return 65;
    return 80;
  }

  let score = 100;

  if (pushupStyle === 'knee') {
    // In knee mode, measure spine straightness between shoulder, hip, and knee
    const hipDev = Math.abs(175 - angles.hipKneeAngle);
    if (hipDev > 10) {
      score -= Math.min(30, (hipDev - 10) * 1.6);
    }
  } else {
    // In standard mode, measure shoulder-hip-ankle line and knee lock
    const hipDev = Math.abs(175 - angles.hipAngle);
    if (hipDev > 10) {
      score -= Math.min(25, (hipDev - 10) * 1.5);
    }
    if (angles.kneeAngle < 165) {
      score -= Math.min(15, (165 - angles.kneeAngle) * 1.2);
    }
  }

  return Math.max(20, Math.round(score));
}
