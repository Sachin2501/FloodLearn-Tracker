import React, { useState } from 'react';
import { School, Report, Task, ScoreColor } from '../types';
import { 
  X, 
  MapPin, 
  User, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Send,
  PlusCircle,
  FileText
} from 'lucide-react';

interface SchoolDetailModalProps {
  school: School | null;
  onClose: () => void;
  reports: Report[];
  tasks: Task[];
  onOpenSmsModal: (schoolCode: string) => void;
  onCreateTask: (school: School) => void;
}

export const SchoolDetailModal: React.FC<SchoolDetailModalProps> = ({
  school,
  onClose,
  reports,
  tasks,
  onOpenSmsModal,
  onCreateTask,
}) => {
  if (!school) return null;

  const schoolReports = reports.filter((r) => r.schoolId === school.id || r.schoolCode === school.code);
  const schoolTasks = tasks.filter((t) => t.schoolId === school.id);

  const isRed = school.latestScoreColor === 'RED';
  const isYellow = school.latestScoreColor === 'YELLOW';
  const isGreen = school.latestScoreColor === 'GREEN';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-sm">
                {school.code}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-sm ${
                isRed ? 'bg-rose-100 text-rose-800' : isYellow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {school.latestScoreColor} · Score {school.latestScoreValue}/100
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {school.name}
            </h2>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{school.village}</span>
              <span>·</span>
              <span>{school.cluster}</span>
              <span>·</span>
              <span>{school.block}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">
                School Status
              </span>
              <div className="text-base font-bold text-slate-900 mt-1">
                {school.latestStatus}
              </div>
              <div className="text-[11px] text-slate-500 font-sans">
                {school.daysClosed} days closed
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">
                Student Engagement
              </span>
              <div className="text-base font-bold text-slate-900 mt-1">
                {school.studentsEngaged} / {school.totalStudents}
              </div>
              <div className="text-[11px] text-slate-500 font-sans">
                {school.engagementPercent}% active learning
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">
                Materials Delivered
              </span>
              <div className={`text-base font-bold mt-1 ${school.materialsDelivered ? 'text-emerald-700' : 'text-rose-700'}`}>
                {school.materialsDelivered ? 'YES' : 'NO'}
              </div>
              <div className="text-[11px] text-slate-500 font-sans">
                {school.materialsDelivered ? 'Packets received' : 'Delivery pending'}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">
                Flood Risk Zone
              </span>
              <div className="text-sm font-bold text-slate-900 mt-1 font-sans">
                {school.floodRiskZone.replace('_', ' ')}
              </div>
              <div className="text-[11px] text-slate-500 font-sans">
                GPS: {school.lat.toFixed(4)}, {school.lng.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Responsible Official & Teacher Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-white text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Assigned Responsible Official
              </span>
              <div className="font-bold text-slate-900 text-sm">{school.assignedOfficialName}</div>
              <div className="text-slate-600">{school.assignedOfficialRole}</div>
              <div className="flex items-center gap-2 text-slate-700 pt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{school.assignedOfficialPhone}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-white text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                School Headmaster
              </span>
              <div className="font-bold text-slate-900 text-sm">{school.headmasterName}</div>
              <div className="text-slate-600">Headmaster / Primary Reporter</div>
              <div className="flex items-center gap-2 text-slate-700 pt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{school.headmasterPhone}</span>
              </div>
            </div>
          </div>

          {/* Action Tasks Associated with this school */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Associated Relief Tasks ({schoolTasks.length})
              </h3>
              <button
                onClick={() => onCreateTask(school)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {schoolTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No tasks currently assigned for this school.</p>
            ) : (
              <div className="space-y-2">
                {schoolTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 border border-slate-200 rounded-lg text-xs flex items-start justify-between gap-3 bg-slate-50"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{task.title}</div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{task.description}</p>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Trigger: {task.triggerReason}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase shrink-0 ${
                        task.status === 'DONE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Reports Timeline */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Check-in History ({schoolReports.length} reports)
            </h3>
            {schoolReports.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No historical check-ins recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {schoolReports.map((report) => (
                  <div key={report.id} className="p-3 border border-slate-200/80 rounded-lg text-xs bg-slate-50">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{report.reporterName} ({report.reporterPhone}) · {report.channel}</span>
                      <span className="font-mono">{new Date(report.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-slate-800 font-medium">
                      "{report.rawMessage}"
                    </div>
                    <div className="mt-1 text-[11px] text-blue-700">
                      Reply: {report.systemReplySent}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={() => onOpenSmsModal(school.code)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Simulate Check-in for {school.code}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
