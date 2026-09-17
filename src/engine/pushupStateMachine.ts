import { RepPhase, JointAngles, FormFault, FormFaultType, RepRecord, WorkoutSettings } from '../types/pushup';

export interface StateMachineResult {
  phase: RepPhase;
  repCount: number;
  validReps: number;
  newRepCompleted: boolean;
  completedRepData: RepRecord | null;
  depthProgress: number; // 0% to 100%
  repMessage: string | null;
  isDiscounted: boolean;
}

export class PushupStateMachine {
  private phase: RepPhase = 'STANDBY';
  private repCount: number = 0;
  private validReps: number = 0;
  private settings: WorkoutSettings;

  // Tracking metrics within current rep
  private repStartTime: number = 0;
  private minElbowInRep: number = 180;
  private hipAnglesInRep: number[] = [];
  private formScoresInRep: number[] = [];
  private faultsInRep: Set<FormFaultType> = new Set();
  private hasHitDepth: boolean = false;

  // Thresholds based on difficulty
  private upElbowThreshold = 155;
  private downElbowThreshold = 90;
  private startDownElbowThreshold = 140;
  private minSafeHipAngle = 158;

  constructor(settings: WorkoutSettings) {
    this.settings = settings;
    this.configureThresholds();
  }

  public updateSettings(settings: WorkoutSettings) {
    this.settings = settings;
    this.configureThresholds();
  }

  private configureThresholds() {
    if (this.settings.difficulty === 'strict') {
      this.upElbowThreshold = 162;
      this.downElbowThreshold = 85;
      this.minSafeHipAngle = 162;
    } else if (this.settings.difficulty === 'beginner') {
      this.upElbowThreshold = 150;
      this.downElbowThreshold = 95;
      this.minSafeHipAngle = 150;
    } else {
      // standard
      this.upElbowThreshold = 155;
      this.downElbowThreshold = 90;
      this.minSafeHipAngle = 156;
    }
  }

  public reset() {
    this.phase = 'STANDBY';
    this.repCount = 0;
    this.validReps = 0;
    this.minElbowInRep = 180;
    this.hipAnglesInRep = [];
    this.formScoresInRep = [];
    this.faultsInRep.clear();
    this.hasHitDepth = false;
  }

  public update(
    angles: JointAngles,
    currentFault: FormFault | null,
    frameFormScore: number,
    isInFrame: boolean
  ): StateMachineResult {
    let newRepCompleted = false;
    let completedRepData: RepRecord | null = null;
    let repMessage: string | null = null;
    let isDiscounted = false;

    if (!isInFrame) {
      this.phase = 'STANDBY';
      return {
        phase: this.phase,
        repCount: this.repCount,
        validReps: this.validReps,
        newRepCompleted: false,
        completedRepData: null,
        depthProgress: 0,
        repMessage: 'Step back to fit entire body in frame',
        isDiscounted: false,
      };
    }

    const { elbowAngle } = angles;
    const effectiveHipAngle = this.settings.pushupStyle === 'knee' ? angles.hipKneeAngle : angles.hipAngle;

    // Calculate depth progress: 0% at upElbowThreshold, 100% at downElbowThreshold
    const totalRom = this.upElbowThreshold - this.downElbowThreshold;
    const progress = Math.max(0, Math.min(100, Math.round(((this.upElbowThreshold - elbowAngle) / totalRom) * 100)));

    // Track active fault
    if (currentFault && currentFault.type !== 'NONE') {
      this.faultsInRep.add(currentFault.type);
    }

    switch (this.phase) {
      case 'STANDBY': {
        // Detect if user has assumed a valid plank position (knees or toes)
        if (elbowAngle >= this.upElbowThreshold && effectiveHipAngle >= this.minSafeHipAngle) {
          this.phase = 'READY_PLANK';
          repMessage = this.settings.pushupStyle === 'knee' ? 'Ready in Knee Plank! Begin' : 'Ready! Begin pushup';
        }
        break;
      }

      case 'READY_PLANK': {
        // Ready to descend
        if (elbowAngle < this.startDownElbowThreshold) {
          this.phase = 'GOING_DOWN';
          this.repStartTime = performance.now();
          this.minElbowInRep = elbowAngle;
          this.hipAnglesInRep = [effectiveHipAngle];
          this.formScoresInRep = [frameFormScore];
          this.faultsInRep.clear();
          this.hasHitDepth = false;
        }
        break;
      }

      case 'GOING_DOWN': {
        this.minElbowInRep = Math.min(this.minElbowInRep, elbowAngle);
        this.hipAnglesInRep.push(effectiveHipAngle);
        this.formScoresInRep.push(frameFormScore);

        if (elbowAngle <= this.downElbowThreshold) {
          this.phase = 'DOWN_POSITION';
          this.hasHitDepth = true;
          repMessage = 'Depth reached! Push up!';
        } else if (elbowAngle > this.startDownElbowThreshold + 5) {
          // Aborted before reaching depth
          this.phase = 'READY_PLANK';
          repMessage = 'Incomplete rep: Go lower next time';
        }
        break;
      }

      case 'DOWN_POSITION': {
        this.minElbowInRep = Math.min(this.minElbowInRep, elbowAngle);
        this.hipAnglesInRep.push(effectiveHipAngle);
        this.formScoresInRep.push(frameFormScore);

        if (elbowAngle > this.downElbowThreshold + 12) {
          this.phase = 'GOING_UP';
        }
        break;
      }

      case 'GOING_UP': {
        this.hipAnglesInRep.push(effectiveHipAngle);
        this.formScoresInRep.push(frameFormScore);

        if (elbowAngle >= this.upElbowThreshold) {
          // Rep completed!
          this.phase = 'REP_COMPLETE';
          this.repCount++;

          const repDuration = (performance.now() - this.repStartTime) / 1000;
          const avgHip = this.hipAnglesInRep.length
            ? Math.round(this.hipAnglesInRep.reduce((a, b) => a + b, 0) / this.hipAnglesInRep.length)
            : effectiveHipAngle;

          const avgScore = this.formScoresInRep.length
            ? Math.round(this.formScoresInRep.reduce((a, b) => a + b, 0) / this.formScoresInRep.length)
            : frameFormScore;

          // Check if rep was valid
          const hadSevereSag = this.faultsInRep.has('SAGGING_HIPS');
          const isValid = this.hasHitDepth && !hadSevereSag;

          if (isValid) {
            this.validReps++;
            repMessage = avgScore > 85 ? `Rep ${this.validReps}! Great form!` : `Rep ${this.validReps}! Keep it up!`;
          } else {
            isDiscounted = true;
            if (!this.hasHitDepth) {
              this.faultsInRep.add('INSUFFICIENT_DEPTH');
              repMessage = 'No count: Go lower (Chest closer to floor)';
            } else if (hadSevereSag) {
              repMessage = 'No count: Hips sagged (Protect your spine!)';
            }
          }

          completedRepData = {
            repNumber: this.repCount,
            minElbowAngle: this.minElbowInRep,
            avgHipAngle: avgHip,
            formScore: isValid ? avgScore : Math.min(avgScore, 60),
            isValid,
            faultsDetected: Array.from(this.faultsInRep),
            durationSec: Math.round(repDuration * 10) / 10,
            timestamp: Date.now(),
          };

          newRepCompleted = true;
        }
        break;
      }

      case 'REP_COMPLETE': {
        // Return to ready plank for next rep
        this.phase = 'READY_PLANK';
        break;
      }
    }

    return {
      phase: this.phase,
      repCount: this.repCount,
      validReps: this.validReps,
      newRepCompleted,
      completedRepData,
      depthProgress: progress,
      repMessage,
      isDiscounted,
    };
  }

  public getCounts() {
    return {
      total: this.repCount,
      valid: this.validReps,
    };
  }
}
