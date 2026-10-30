import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MetricsRibbon } from './components/MetricsRibbon';
import { ScorecardView } from './components/ScorecardView';
import { MapView } from './components/MapView';
import { TasksView } from './components/TasksView';
import { AnalyticsView } from './components/AnalyticsView';
import { SmsHubView } from './components/SmsHubView';
import { AdminConfigView } from './components/AdminConfigView';
import { SmsSimulatorModal } from './components/SmsSimulatorModal';
import { SchoolDetailModal } from './components/SchoolDetailModal';
import { NewTaskModal } from './components/NewTaskModal';
import { dataService } from './services/dataService';
import { School, Task, Report, Official, ScoringRuleConfig, UserRole, TaskStatus } from './types';
import { AlertTriangle, CheckCircle, Info, Sparkles, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'scorecard' | 'tasks' | 'analytics' | 'sms-hub' | 'admin'>('scorecard');
  const [userRole, setUserRole] = useState<UserRole>('DEO_DISTRICT');
  
  // Data state from DataService
  const [schools, setSchools] = useState<School[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [config, setConfig] = useState<ScoringRuleConfig>(dataService.getConfig());

  // Modals state
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsDefaultSchoolCode, setSmsDefaultSchoolCode] = useState<string | undefined>(undefined);
  const [selectedSchoolForDetail, setSelectedSchoolForDetail] = useState<School | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskPreselectedSchool, setNewTaskPreselectedSchool] = useState<School | null>(null);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Sync state with DataService
  const syncFromService = () => {
    setSchools(dataService.getSchools());
    setTasks(dataService.getTasks());
    setReports(dataService.getReports());
    setOfficials(dataService.getOfficials());
    setConfig(dataService.getConfig());
  };

  useEffect(() => {
    syncFromService();
    const unsubscribe = dataService.subscribe(() => {
      syncFromService();
    });
    return () => unsubscribe();
  }, []);

  // Handlers
  const handleOpenSmsModal = (schoolCode?: string) => {
    setSmsDefaultSchoolCode(schoolCode);
    setIsSmsModalOpen(true);
  };

  const handleSendMessage = (
    message: string,
    channel: 'SMS' | 'WHATSAPP',
    phone: string,
    name: string
  ) => {
    const result = dataService.processIncomingMessage(message, channel, phone, name);
    if (result.parsedResult.success) {
      if (result.newTasks.length > 0) {
        showToast(`Auto-assigned: "${result.newTasks[0].title}" to ${result.newTasks[0].assignedOfficialName}`);
      } else {
        showToast(`Check-in logged for ${result.parsedResult.schoolCode}. Scorecard updated.`);
      }
    }
    return result;
  };

  const handleUpdateTaskStatus = (
    taskId: string, 
    status: TaskStatus, 
    resolutionNotes?: string
  ) => {
    const success = dataService.updateTaskStatus(taskId, status, resolutionNotes);
    if (success) {
      showToast(`Task marked as ${status}`);
    }
  };

  const handleCreateTask = (taskData: any) => {
    const created = dataService.createTask(taskData);
    showToast(`Task "${created.title}" dispatched.`);
  };

  const handleOpenCreateTaskModal = (school?: School) => {
    setNewTaskPreselectedSchool(school || null);
    setIsNewTaskModalOpen(true);
  };

  const openTasksCount = tasks.filter((t) => t.status !== 'DONE').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Notification Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSmsModal={() => handleOpenSmsModal()}
        userRole={userRole}
        setUserRole={setUserRole}
        openTasksCount={openTasksCount}
      />

      {/* District Situation Alert Banner */}
      <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Active Flood Advisory:</strong> Morigaon District (Assam). Brahmaputra river level is +0.78m above danger mark. 4 riverine schools cut off. Emergency boat routes active.
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono">
            <span>Incoming Check-in SMS: +91-7002-FLOOD</span>
          </div>
        </div>
      </div>

      {/* High-Density KPI Ribbon */}
      <MetricsRibbon
        schools={schools}
        tasks={tasks}
        onFilterRedClick={() => {
          setActiveTab('scorecard');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'scorecard' && (
          <ScorecardView
            schools={schools}
            onSelectSchool={(school) => setSelectedSchoolForDetail(school)}
            onOpenSmsModal={(code) => handleOpenSmsModal(code)}
          />
        )}

        {activeTab === 'map' && (
          <MapView
            schools={schools}
            selectedSchool={selectedSchoolForDetail}
            onSelectSchool={(school) => setSelectedSchoolForDetail(school)}
            onOpenSmsModal={(code) => handleOpenSmsModal(code)}
            onCreateTaskForSchool={(school) => handleOpenCreateTaskModal(school)}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            onUpdateStatus={handleUpdateTaskStatus}
            onOpenCreateTaskModal={() => handleOpenCreateTaskModal()}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            schools={schools}
            tasks={tasks}
            onSelectSchool={(school) => setSelectedSchoolForDetail(school)}
          />
        )}

        {activeTab === 'sms-hub' && (
          <SmsHubView
            reports={reports}
            schools={schools}
            onOpenSimulator={(code) => handleOpenSmsModal(code)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminConfigView
            schools={schools}
            officials={officials}
            config={config}
            onUpdateConfig={(newConf) => {
              dataService.updateConfig(newConf);
              showToast('Scoring thresholds updated.');
            }}
            onAddSchool={(scData) => {
              const sc = dataService.addSchool(scData);
              showToast(`Added ${sc.code} - ${sc.name}`);
            }}
            onAssignOfficial={(schoolId, officialId) => {
              dataService.assignOfficialToSchool(schoolId, officialId);
              showToast('Official re-assigned.');
            }}
            onResetData={() => {
              dataService.resetData();
              showToast('Reset to original demonstration data.');
            }}
          />
        )}
      </main>

      {/* Modals */}
      <SmsSimulatorModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        schools={schools}
        defaultSchoolCode={smsDefaultSchoolCode}
        onSendMessage={handleSendMessage}
      />

      <SchoolDetailModal
        school={selectedSchoolForDetail}
        onClose={() => setSelectedSchoolForDetail(null)}
        reports={reports}
        tasks={tasks}
        onOpenSmsModal={(code) => {
          setSelectedSchoolForDetail(null);
          handleOpenSmsModal(code);
        }}
        onCreateTask={(school) => {
          setSelectedSchoolForDetail(null);
          handleOpenCreateTaskModal(school);
        }}
      />

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        schools={schools}
        officials={officials}
        preselectedSchool={newTaskPreselectedSchool}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}
