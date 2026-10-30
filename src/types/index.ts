export type ScoreColor = 'GREEN' | 'YELLOW' | 'RED';
export type SchoolStatus = 'OPEN' | 'PARTIALLY_OPEN' | 'CLOSED';
export type TaskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE';
export type TaskCategory = 
  | 'OFFLINE_CONTENT' 
  | 'STUDY_CIRCLE' 
  | 'COMMUNITY_CALL' 
  | 'EMERGENCY_PRINT' 
  | 'SOLAR_RADIO' 
  | 'BOAT_TRANSPORT';

export interface Official {
  id: string;
  name: string;
  role: string; // e.g. "Block Education Officer", "Cluster Resource Centre Coordinator (CRCC)", "District Disaster Management Liaison", "NGO Field Lead"
  phone: string;
  email: string;
  assignedBlocks: string[];
  assignedClusters: string[];
}

export interface School {
  id: string;
  code: string; // e.g. "SCH101"
  name: string;
  village: string;
  cluster: string;
  block: string;
  district: string;
  totalStudents: number;
  lat: number;
  lng: number;
  floodRiskZone: 'CRITICAL_BASIN' | 'HIGH_RISK' | 'MODERATE_RISK';
  headmasterName: string;
  headmasterPhone: string;
  assignedOfficialId: string;
  assignedOfficialName: string;
  assignedOfficialRole: string;
  assignedOfficialPhone: string;
  
  // Dynamic Scorecard metrics
  latestStatus: SchoolStatus;
  daysClosed: number;
  studentsEngaged: number;
  engagementPercent: number;
  materialsDelivered: boolean;
  latestScoreValue: number; // 0 - 100
  latestScoreColor: ScoreColor;
  lastReportedAt: string;
  activeOpenTasksCount: number;
  notes?: string;
}

export interface Report {
  id: string;
  schoolId: string;
  schoolCode: string;
  schoolName: string;
  reporterName: string;
  reporterPhone: string;
  reporterRole: string;
  timestamp: string;
  status: SchoolStatus;
  daysClosed: number;
  studentsEngaged: number;
  engagementPercent: number;
  materialsDelivered: boolean;
  rawMessage: string;
  channel: 'SMS' | 'WHATSAPP' | 'MANUAL_WEB';
  parsedConfidence: number;
  automatedTasksGenerated: string[];
  systemReplySent: string;
}

export interface Task {
  id: string;
  schoolId: string;
  schoolCode: string;
  schoolName: string;
  block: string;
  cluster: string;
  title: string;
  description: string;
  category: TaskCategory;
  severity: TaskSeverity;
  status: TaskStatus;
  triggerReason: string;
  assignedOfficialId: string;
  assignedOfficialName: string;
  assignedOfficialRole: string;
  assignedOfficialPhone: string;
  createdAt: string;
  dueAt: string;
  completedAt?: string;
  resolutionNotes?: string;
}

export interface ScoringRuleConfig {
  greenMinScore: number; // 65
  yellowMinScore: number; // 35
  maxDaysClosedForGreen: number; // 1
  minEngagementPercentForGreen: number; // 60
  maxDaysClosedForYellow: number; // 3
  minEngagementPercentForYellow: number; // 30
  weights: {
    daysClosedWeight: number; // max 30 pts
    engagementWeight: number; // max 45 pts
    materialsWeight: number; // max 25 pts
  };
}

export interface ParsedSMSResult {
  success: boolean;
  schoolCode: string;
  status: SchoolStatus;
  daysClosed: number;
  studentsEngaged: number;
  materialsDelivered: boolean;
  notes?: string;
  confidence: number;
  replyMessage: string;
  errorMessage?: string;
}

export type UserRole = 'DEO_DISTRICT' | 'CRCC_CLUSTER' | 'DISASTER_NGO' | 'TEACHER_VOLUNTEER' | 'ADMIN';
