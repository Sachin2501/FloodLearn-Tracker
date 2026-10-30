import { 
  School, 
  Report, 
  Task, 
  Official, 
  ScoringRuleConfig, 
  ParsedSMSResult,
  SchoolStatus
} from '../types';
import { 
  INITIAL_OFFICIALS, 
  INITIAL_SCHOOLS, 
  INITIAL_TASKS, 
  INITIAL_REPORTS, 
  DEFAULT_SCORING_CONFIG 
} from '../data/mockData';
import { calculateLearningContinuityScore, evaluateAutomaticTasks } from '../utils/rulesEngine';
import { parseIncomingReportMessage } from '../utils/smsParser';

const STORAGE_KEYS = {
  SCHOOLS: 'floodlearn_schools_v1',
  REPORTS: 'floodlearn_reports_v1',
  TASKS: 'floodlearn_tasks_v1',
  OFFICIALS: 'floodlearn_officials_v1',
  CONFIG: 'floodlearn_config_v1',
};

class DataService {
  private schools: School[] = [];
  private reports: Report[] = [];
  private tasks: Task[] = [];
  private officials: Official[] = [];
  private config: ScoringRuleConfig = DEFAULT_SCORING_CONFIG;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initData();
  }

  private initData() {
    try {
      const storedSchools = localStorage.getItem(STORAGE_KEYS.SCHOOLS);
      const storedReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
      const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const storedOfficials = localStorage.getItem(STORAGE_KEYS.OFFICIALS);
      const storedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);

      this.schools = storedSchools ? JSON.parse(storedSchools) : INITIAL_SCHOOLS;
      this.reports = storedReports ? JSON.parse(storedReports) : INITIAL_REPORTS;
      this.tasks = storedTasks ? JSON.parse(storedTasks) : INITIAL_TASKS;
      this.officials = storedOfficials ? JSON.parse(storedOfficials) : INITIAL_OFFICIALS;
      this.config = storedConfig ? JSON.parse(storedConfig) : DEFAULT_SCORING_CONFIG;
    } catch {
      this.schools = INITIAL_SCHOOLS;
      this.reports = INITIAL_REPORTS;
      this.tasks = INITIAL_TASKS;
      this.officials = INITIAL_OFFICIALS;
      this.config = DEFAULT_SCORING_CONFIG;
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(this.schools));
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(this.reports));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
      localStorage.setItem(STORAGE_KEYS.OFFICIALS, JSON.stringify(this.officials));
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to persist in localStorage', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // Getters
  public getSchools(): School[] {
    // sync active tasks count
    return this.schools.map((school) => {
      const activeCount = this.tasks.filter(
        (t) => t.schoolId === school.id && t.status !== 'DONE'
      ).length;
      return { ...school, activeOpenTasksCount: activeCount };
    });
  }

  public getReports(): Report[] {
    return [...this.reports].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getTasks(): Task[] {
    return [...this.tasks].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getOfficials(): Official[] {
    return this.officials;
  }

  public getConfig(): ScoringRuleConfig {
    return this.config;
  }

  // Process incoming SMS or WhatsApp Message
  public processIncomingMessage(
    rawMessage: string,
    channel: 'SMS' | 'WHATSAPP' | 'MANUAL_WEB' = 'SMS',
    reporterPhone: string = '+91 94351 00000',
    reporterName: string = 'Field Reporter'
  ): { parsedResult: ParsedSMSResult; newTasks: Task[]; reportId?: string } {
    const parsed = parseIncomingReportMessage(rawMessage, this.schools);

    if (!parsed.success) {
      return { parsedResult: parsed, newTasks: [] };
    }

    const schoolIndex = this.schools.findIndex((s) => s.code === parsed.schoolCode);
    if (schoolIndex === -1) {
      return { parsedResult: parsed, newTasks: [] };
    }

    const currentSchool = this.schools[schoolIndex];

    // Compute new score
    const { scoreValue, scoreColor, engagementPercent } = calculateLearningContinuityScore(
      parsed.status,
      parsed.daysClosed,
      parsed.studentsEngaged,
      currentSchool.totalStudents,
      parsed.materialsDelivered,
      this.config
    );

    // Update School state
    const updatedSchool: School = {
      ...currentSchool,
      latestStatus: parsed.status,
      daysClosed: parsed.daysClosed,
      studentsEngaged: parsed.studentsEngaged,
      engagementPercent,
      materialsDelivered: parsed.materialsDelivered,
      latestScoreValue: scoreValue,
      latestScoreColor: scoreColor,
      lastReportedAt: new Date().toISOString(),
      notes: `Latest ${channel} check-in: ${parsed.status}, ${parsed.daysClosed}d closed, ${parsed.studentsEngaged} students engaged.`,
    };

    // Run Automatic Task Rules Engine
    const generatedTasks = evaluateAutomaticTasks(updatedSchool, this.tasks);

    // Add generated tasks to task store
    if (generatedTasks.length > 0) {
      this.tasks = [...generatedTasks, ...this.tasks];
    }

    // Save report log
    const reportId = `REP-${Date.now()}`;
    const newReport: Report = {
      id: reportId,
      schoolId: currentSchool.id,
      schoolCode: currentSchool.code,
      schoolName: currentSchool.name,
      reporterName,
      reporterPhone,
      reporterRole: 'Teacher / Volunteer Check-in',
      timestamp: new Date().toISOString(),
      status: parsed.status,
      daysClosed: parsed.daysClosed,
      studentsEngaged: parsed.studentsEngaged,
      engagementPercent,
      materialsDelivered: parsed.materialsDelivered,
      rawMessage,
      channel,
      parsedConfidence: parsed.confidence,
      automatedTasksGenerated: generatedTasks.map((t) => t.title),
      systemReplySent: parsed.replyMessage + (generatedTasks.length > 0 
        ? ` Auto-task created: ${generatedTasks[0].title}`
        : ''),
    };

    this.reports = [newReport, ...this.reports];
    this.schools[schoolIndex] = updatedSchool;

    this.persist();

    return {
      parsedResult: parsed,
      newTasks: generatedTasks,
      reportId,
    };
  }

  // Update Task Status
  public updateTaskStatus(
    taskId: string, 
    status: 'OPEN' | 'IN_PROGRESS' | 'DONE', 
    resolutionNotes?: string
  ): boolean {
    const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return false;

    const task = this.tasks[taskIndex];
    this.tasks[taskIndex] = {
      ...task,
      status,
      completedAt: status === 'DONE' ? new Date().toISOString() : undefined,
      resolutionNotes: resolutionNotes || task.resolutionNotes,
    };

    this.persist();
    return true;
  }

  // Create Manual Task
  public createTask(taskData: Omit<Task, 'id' | 'createdAt'>): Task {
    const newTask: Task = {
      ...taskData,
      id: `TSK-MANUAL-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.tasks = [newTask, ...this.tasks];
    this.persist();
    return newTask;
  }

  // Update Config
  public updateConfig(newConfig: ScoringRuleConfig) {
    this.config = newConfig;
    // Recalculate scores for all schools with new config
    this.schools = this.schools.map((school) => {
      const { scoreValue, scoreColor, engagementPercent } = calculateLearningContinuityScore(
        school.latestStatus,
        school.daysClosed,
        school.studentsEngaged,
        school.totalStudents,
        school.materialsDelivered,
        this.config
      );
      return {
        ...school,
        latestScoreValue: scoreValue,
        latestScoreColor: scoreColor,
        engagementPercent,
      };
    });
    this.persist();
  }

  // Add School
  public addSchool(school: Omit<School, 'id' | 'activeOpenTasksCount' | 'engagementPercent' | 'latestScoreValue' | 'latestScoreColor' | 'lastReportedAt'>): School {
    const { scoreValue, scoreColor, engagementPercent } = calculateLearningContinuityScore(
      school.latestStatus,
      school.daysClosed,
      school.studentsEngaged,
      school.totalStudents,
      school.materialsDelivered,
      this.config
    );

    const newSchool: School = {
      ...school,
      id: `SCH-${100 + this.schools.length + 1}`,
      latestScoreValue: scoreValue,
      latestScoreColor: scoreColor,
      engagementPercent,
      lastReportedAt: new Date().toISOString(),
      activeOpenTasksCount: 0,
    };

    this.schools = [...this.schools, newSchool];
    this.persist();
    return newSchool;
  }

  // Re-assign school official
  public assignOfficialToSchool(schoolId: string, officialId: string): boolean {
    const school = this.schools.find((s) => s.id === schoolId);
    const official = this.officials.find((o) => o.id === officialId);
    if (!school || !official) return false;

    school.assignedOfficialId = official.id;
    school.assignedOfficialName = official.name;
    school.assignedOfficialRole = official.role;
    school.assignedOfficialPhone = official.phone;

    this.persist();
    return true;
  }

  // Reset to initial demo state
  public resetData() {
    this.schools = INITIAL_SCHOOLS;
    this.reports = INITIAL_REPORTS;
    this.tasks = INITIAL_TASKS;
    this.officials = INITIAL_OFFICIALS;
    this.config = DEFAULT_SCORING_CONFIG;
    this.persist();
  }
}

export const dataService = new DataService();
