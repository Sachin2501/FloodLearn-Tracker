import { School } from '../types';

export interface DailyDistrictTrend {
  date: string; // e.g. "Oct 1"
  dayIndex: number; // 1 to 30
  fullDate: string; // "2026-10-01"
  avgDistrictScore: number;
  greenPercent: number;
  yellowPercent: number;
  redPercent: number;
  activeRedSchools: number;
  tasksCompletedCumulative: number;
  studentsEngagedPercent: number;
  riverWaterLevelMeters: number; // relative to danger mark
  floodPhase: 'BASELINE' | 'BREACH_FLOOD' | 'EMERGENCY_PEAK' | 'INTERVENTION_RECOVERY';
  phaseNote?: string;
}

export interface SchoolHistoricalPoint {
  date: string;
  dayIndex: number;
  score: number;
  status: 'OPEN' | 'PARTIALLY_OPEN' | 'CLOSED';
  engagementPercent: number;
  materialsDelivered: boolean;
  eventNote?: string;
}

export interface BlockComparison {
  block: string;
  baselineScore: number;
  lowestScore: number;
  currentScore: number;
  recoveryRatePercent: number;
  tasksCompleted: number;
}

/**
 * Generates 30-day trend data for the district (October 1 to October 29)
 */
export function generate30DayDistrictTrend(): DailyDistrictTrend[] {
  const trends: DailyDistrictTrend[] = [];
  const days = 30;

  for (let i = 1; i <= days; i++) {
    const dayNumber = i;
    const dateStr = `Oct ${dayNumber}`;
    const fullDate = `2026-10-${dayNumber.toString().padStart(2, '0')}`;

    let avgScore = 80;
    let greenPct = 80;
    let yellowPct = 15;
    let redPct = 5;
    let activeRed = 1;
    let riverLevel = -0.4;
    let tasksCompleted = 0;
    let engagedPct = 88;
    let phase: DailyDistrictTrend['floodPhase'] = 'BASELINE';
    let phaseNote: string | undefined = undefined;

    if (i <= 5) {
      // Baseline before flood
      avgScore = Math.round(82 + Math.sin(i) * 2);
      greenPct = 85;
      yellowPct = 12;
      redPct = 3;
      activeRed = 1;
      riverLevel = -0.3;
      tasksCompleted = 1;
      engagedPct = 86;
      phase = 'BASELINE';
      if (i === 1) phaseNote = 'Pre-flood normal school operations';
    } else if (i <= 12) {
      // River breach & sudden surge
      const progress = (i - 5) / 7;
      avgScore = Math.round(82 - progress * 52); // drops to 30
      greenPct = Math.round(85 - progress * 70); // drops to 15%
      yellowPct = Math.round(12 + progress * 23); // increases to 35%
      redPct = Math.round(3 + progress * 47); // increases to 50%
      activeRed = Math.round(1 + progress * 5);
      riverLevel = parseFloat((-0.3 + progress * 1.5).toFixed(2)); // up to +1.2m
      tasksCompleted = Math.round(1 + progress * 2);
      engagedPct = Math.round(86 - progress * 62); // drops to 24%
      phase = 'BREACH_FLOOD';
      if (i === 8) phaseNote = 'Brahmaputra breach at Laharighat; schools shut';
    } else if (i <= 19) {
      // Peak inundation & automatic task triggers
      const progress = (i - 12) / 7;
      avgScore = Math.round(30 + progress * 12); // slowly stabilizes to 42
      greenPct = Math.round(15 + progress * 10);
      yellowPct = Math.round(35 + progress * 15);
      redPct = Math.round(50 - progress * 15);
      activeRed = Math.max(3, Math.round(6 - progress * 2));
      riverLevel = parseFloat((1.2 - progress * 0.4).toFixed(2)); // slowly receding
      tasksCompleted = Math.round(3 + progress * 6); // tasks ramping up
      engagedPct = Math.round(24 + progress * 18); // up to 42%
      phase = 'EMERGENCY_PEAK';
      if (i === 14) phaseNote = 'FloodLearn automated relief tasks dispatched';
    } else {
      // Intervention recovery phase
      const progress = (i - 19) / 11;
      avgScore = Math.round(42 + progress * 24); // rises to 66
      greenPct = Math.round(25 + progress * 35); // rises to 60%
      yellowPct = Math.round(50 - progress * 25); // drops to 25%
      redPct = Math.round(35 - progress * 20); // drops to 15%
      activeRed = Math.max(3, Math.round(4 - progress * 1));
      riverLevel = parseFloat((0.8 - progress * 0.4).toFixed(2)); // +0.4m
      tasksCompleted = Math.round(9 + progress * 8); // total 17 tasks resolved
      engagedPct = Math.round(42 + progress * 26); // rises to 68%
      phase = 'INTERVENTION_RECOVERY';
      if (i === 22) phaseNote = 'Offline pocket packets & solar study circles active';
    }

    trends.push({
      date: dateStr,
      dayIndex: i,
      fullDate,
      avgDistrictScore: avgScore,
      greenPercent: greenPct,
      yellowPercent: yellowPct,
      redPercent: redPct,
      activeRedSchools: activeRed,
      tasksCompletedCumulative: tasksCompleted,
      studentsEngagedPercent: engagedPct,
      riverWaterLevelMeters: riverLevel,
      floodPhase: phase,
      phaseNote,
    });
  }

  return trends;
}

/**
 * Generates 30-day trajectory for a specific school
 */
export function generateSchoolTrajectory(school: School): SchoolHistoricalPoint[] {
  const points: SchoolHistoricalPoint[] = [];
  const isHighRisk = school.floodRiskZone === 'CRITICAL_BASIN' || school.latestScoreColor === 'RED';
  const baseline = school.totalStudents > 200 ? 88 : 82;

  for (let i = 1; i <= 30; i++) {
    const dateStr = `Oct ${i}`;
    let score = baseline;
    let status: 'OPEN' | 'PARTIALLY_OPEN' | 'CLOSED' = 'OPEN';
    let engagement = 85;
    let materials = true;
    let eventNote: string | undefined = undefined;

    if (i <= 6) {
      score = baseline;
      status = 'OPEN';
      engagement = 85;
      materials = true;
    } else if (i <= 14) {
      if (isHighRisk) {
        score = Math.max(10, Math.round(baseline - (i - 6) * 10));
        status = 'CLOSED';
        engagement = Math.max(15, Math.round(85 - (i - 6) * 10));
        materials = false;
        if (i === 8) eventNote = 'Road submerged; building cut off';
      } else {
        score = Math.max(45, Math.round(baseline - (i - 6) * 5));
        status = 'PARTIALLY_OPEN';
        engagement = Math.max(45, Math.round(85 - (i - 6) * 5));
        materials = true;
        if (i === 8) eventNote = 'Shifting to shelter terrace';
      }
    } else if (i <= 22) {
      if (isHighRisk) {
        // Trough then starting intervention
        if (i < 18) {
          score = 14;
          status = 'CLOSED';
          engagement = 20;
          materials = false;
          if (i === 15) eventNote = 'FloodLearn triggered emergency offline kit';
        } else {
          score = Math.round(14 + (i - 17) * 6);
          status = 'PARTIALLY_OPEN';
          engagement = Math.round(20 + (i - 17) * 5);
          materials = true;
          if (i === 18) eventNote = 'Boat delivery of worksheets & solar radios';
        }
      } else {
        score = Math.min(75, Math.round(45 + (i - 14) * 3));
        status = 'PARTIALLY_OPEN';
        engagement = Math.min(70, Math.round(45 + (i - 14) * 3));
        materials = true;
      }
    } else {
      // Days 23 - 30: approaching current live score
      const currentTarget = school.latestScoreValue;
      const progress = (i - 22) / 8;
      const startVal = isHighRisk ? 38 : 65;
      score = Math.round(startVal + progress * (currentTarget - startVal));
      status = school.latestStatus;
      engagement = Math.round(school.engagementPercent * (0.8 + progress * 0.2));
      materials = school.materialsDelivered;
      if (i === 25 && isHighRisk) eventNote = 'Volunteer study circle operating daily';
    }

    points.push({
      date: dateStr,
      dayIndex: i,
      score: Math.min(100, Math.max(0, score)),
      status,
      engagementPercent: Math.min(100, Math.max(0, engagement)),
      materialsDelivered: materials,
      eventNote,
    });
  }

  return points;
}

/**
 * Comparative intervention impact metrics
 */
export const INTERVENTION_IMPACT_STATS = {
  averageDaysToIntervene: 1.8, // from Red alert to task assignment
  averageDaysToScoreRecovery: 5.6, // from task assignment to Yellow/Green
  avgScoreGainPostIntervention: 28.4, // point gain
  treatedSchoolsRecoveryRate: 78.5, // 78.5% of schools with completed tasks moved to Yellow or Green
  untreatedSchoolsRecoveryRate: 18.2, // schools without interventions remained in Red
  totalStudentHoursRecovered: '42,800+',
  kitDeliveryFulfillmentRate: 88, // %
};

/**
 * Block comparison data
 */
export const BLOCK_COMPARISONS: BlockComparison[] = [
  {
    block: 'Mayong Block',
    baselineScore: 84,
    lowestScore: 48,
    currentScore: 74,
    recoveryRatePercent: 72,
    tasksCompleted: 5,
  },
  {
    block: 'Laharighat Block',
    baselineScore: 81,
    lowestScore: 24,
    currentScore: 56,
    recoveryRatePercent: 56,
    tasksCompleted: 6,
  },
  {
    block: 'Bhuragaon Block',
    baselineScore: 80,
    lowestScore: 22,
    currentScore: 52,
    recoveryRatePercent: 51,
    tasksCompleted: 4,
  },
  {
    block: 'Dhing Block',
    baselineScore: 83,
    lowestScore: 42,
    currentScore: 68,
    recoveryRatePercent: 63,
    tasksCompleted: 3,
  },
];
