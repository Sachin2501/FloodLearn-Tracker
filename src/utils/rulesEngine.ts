import { School, SchoolStatus, ScoreColor, Task, ScoringRuleConfig } from '../types';

/**
 * Calculates the quantitative Learning Continuity Score (0 - 100)
 * Factors:
 * 1. Days Closed (30 points weight)
 * 2. Student Engagement Rate (45 points weight)
 * 3. Learning Materials Distribution (25 points weight)
 */
export function calculateLearningContinuityScore(
  status: SchoolStatus,
  daysClosed: number,
  studentsEngaged: number,
  totalStudents: number,
  materialsDelivered: boolean,
  config: ScoringRuleConfig
): { scoreValue: number; scoreColor: ScoreColor; engagementPercent: number } {
  const engagementPercent = totalStudents > 0 
    ? Math.min(100, Math.round((studentsEngaged / totalStudents) * 100))
    : 0;

  // 1. Days Closed Points (max 30)
  let daysPoints = 0;
  if (status === 'OPEN' || daysClosed === 0) {
    daysPoints = config.weights.daysClosedWeight; // 30
  } else if (daysClosed === 1) {
    daysPoints = config.weights.daysClosedWeight * 0.8; // 24
  } else if (daysClosed === 2) {
    daysPoints = config.weights.daysClosedWeight * 0.5; // 15
  } else if (daysClosed === 3) {
    daysPoints = config.weights.daysClosedWeight * 0.2; // 6
  } else {
    daysPoints = 0; // >3 days closed
  }

  // 2. Engagement Points (max 45)
  const engagementPoints = (engagementPercent / 100) * config.weights.engagementWeight;

  // 3. Materials Points (max 25)
  const materialsPoints = materialsDelivered ? config.weights.materialsWeight : 0;

  // Total raw score
  let totalScore = Math.round(daysPoints + engagementPoints + materialsPoints);
  totalScore = Math.max(0, Math.min(100, totalScore));

  // Determine Color Scale
  let scoreColor: ScoreColor = 'GREEN';

  // Strict thresholds from specifications:
  // Green: days_closed <= 1 AND engagement >= 60% AND materials = YES (or overall score >= greenMinScore)
  // Yellow: 2-3 days closed OR 30-60% engagement
  // Red: >3 days closed OR <30% engagement OR score < yellowMinScore
  if (daysClosed >= 3 || engagementPercent < config.minEngagementPercentForYellow || totalScore < config.yellowMinScore) {
    scoreColor = 'RED';
  } else if (
    daysClosed >= 2 || 
    engagementPercent < config.minEngagementPercentForGreen || 
    !materialsDelivered || 
    totalScore < config.greenMinScore
  ) {
    scoreColor = 'YELLOW';
  } else {
    scoreColor = 'GREEN';
  }

  return {
    scoreValue: totalScore,
    scoreColor,
    engagementPercent,
  };
}

/**
 * Rules Engine for Automatic Task Generation
 * Analyzes updated school status and automatically assigns tasks to responsible officials.
 */
export function evaluateAutomaticTasks(
  school: School,
  existingTasks: Task[]
): Task[] {
  const newTasks: Task[] = [];
  const openTasksForSchool = existingTasks.filter(
    (t) => t.schoolId === school.id && t.status !== 'DONE'
  );

  // Rule 1: High-Severity Emergency Offline Content Delivery
  // Trigger: School is RED and closed for >= 3 days
  const hasOfflinePackTask = openTasksForSchool.some(
    (t) => t.category === 'OFFLINE_CONTENT' || t.category === 'EMERGENCY_PRINT'
  );
  if (school.latestScoreColor === 'RED' && school.daysClosed >= 3 && !hasOfflinePackTask) {
    newTasks.push({
      id: `TSK-AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: school.id,
      schoolCode: school.code,
      schoolName: school.name,
      block: school.block,
      cluster: school.cluster,
      title: `Distribute emergency offline learning pack to ${school.code}`,
      description: `Automated Trigger: School has been closed for ${school.daysClosed} days with RED continuity score (${school.latestScoreValue}). Dispatch 100+ waterproof pocket-lesson packets and solar learning receivers.`,
      category: school.floodRiskZone === 'CRITICAL_BASIN' ? 'BOAT_TRANSPORT' : 'OFFLINE_CONTENT',
      severity: 'CRITICAL',
      status: 'OPEN',
      triggerReason: `Auto-Trigger: RED score (${school.latestScoreValue}) + ${school.daysClosed} days closed`,
      assignedOfficialId: school.assignedOfficialId,
      assignedOfficialName: school.assignedOfficialName,
      assignedOfficialRole: school.assignedOfficialRole,
      assignedOfficialPhone: school.assignedOfficialPhone,
      createdAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
    });
  }

  // Rule 2: Community Study Circle & Volunteer Deployment
  // Trigger: Engagement is severely low (<30%)
  const hasStudyCircleTask = openTasksForSchool.some((t) => t.category === 'STUDY_CIRCLE');
  if (school.engagementPercent < 30 && !hasStudyCircleTask) {
    newTasks.push({
      id: `TSK-AUTO-${Date.now() + 1}-${Math.floor(Math.random() * 1000)}`,
      schoolId: school.id,
      schoolCode: school.code,
      schoolName: school.name,
      block: school.block,
      cluster: school.cluster,
      title: `Mobilize community study circle for ${school.name}`,
      description: `Automated Trigger: Only ${school.studentsEngaged}/${school.totalStudents} (${school.engagementPercent}%) students are currently accessing any form of learning. Mobilize youth volunteers at dry highland shelters.`,
      category: 'STUDY_CIRCLE',
      severity: 'HIGH',
      status: 'OPEN',
      triggerReason: `Auto-Trigger: Student engagement dropped to ${school.engagementPercent}% (<30% threshold)`,
      assignedOfficialId: school.assignedOfficialId,
      assignedOfficialName: school.assignedOfficialName,
      assignedOfficialRole: school.assignedOfficialRole,
      assignedOfficialPhone: school.assignedOfficialPhone,
      createdAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    });
  }

  // Rule 3: Headmaster Check-in & Attendance Audit
  // Trigger: YELLOW status with no materials delivered
  const hasCallTask = openTasksForSchool.some((t) => t.category === 'COMMUNITY_CALL');
  if (school.latestScoreColor === 'YELLOW' && !school.materialsDelivered && !hasCallTask) {
    newTasks.push({
      id: `TSK-AUTO-${Date.now() + 2}-${Math.floor(Math.random() * 1000)}`,
      schoolId: school.id,
      schoolCode: school.code,
      schoolName: school.name,
      block: school.block,
      cluster: school.cluster,
      title: `Headmaster check-in call & student tracking audit`,
      description: `Automated Trigger: School is in YELLOW alert. Materials have not reached students. Call Headmaster ${school.headmasterName} (${school.headmasterPhone}) to coordinate delivery point.`,
      category: 'COMMUNITY_CALL',
      severity: 'MEDIUM',
      status: 'OPEN',
      triggerReason: `Auto-Trigger: YELLOW score alert + learning materials pending`,
      assignedOfficialId: school.assignedOfficialId,
      assignedOfficialName: school.assignedOfficialName,
      assignedOfficialRole: school.assignedOfficialRole,
      assignedOfficialPhone: school.assignedOfficialPhone,
      createdAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });
  }

  return newTasks;
}
