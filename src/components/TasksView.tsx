import React, { useState } from 'react';
import { Task, TaskStatus, TaskSeverity } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Phone, 
  Filter, 
  Calendar, 
  UserCheck, 
  Layers,
  Sparkles,
  Check,
  PlayCircle
} from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  onUpdateStatus: (taskId: string, status: TaskStatus, resolutionNotes?: string) => void;
  onOpenCreateTaskModal: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onUpdateStatus,
  onOpenCreateTaskModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | TaskSeverity>('ALL');
  const [selectedTaskForResolve, setSelectedTaskForResolve] = useState<Task | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && t.severity !== severityFilter) return false;
    return true;
  });

  const openCount = tasks.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;

  const handleConfirmResolve = () => {
    if (!selectedTaskForResolve) return;
    onUpdateStatus(
      selectedTaskForResolve.id,
      'DONE',
      resolutionInput || 'Resolved and confirmed by field coordinator.'
    );
    setSelectedTaskForResolve(null);
    setResolutionInput('');
  };

  return (
    <div className="space-y-4">
      {/* Task Header & Stats */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Emergency Action & Task Assignment Board
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rules-engine auto-dispatches tasks to Block Officers & NGOs when continuity scores drop.
            </p>
          </div>

          <button
            onClick={onOpenCreateTaskModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Emergency Task</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status Segmented Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setStatusFilter('OPEN')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'OPEN'
                  ? 'bg-rose-600 text-white shadow-xs font-semibold'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              Open ({openCount})
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'IN_PROGRESS'
                  ? 'bg-amber-600 text-white shadow-xs font-semibold'
                  : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setStatusFilter('DONE')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'DONE'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              Resolved ({doneCount})
            </button>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
            No tasks found in this status category.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isOpen = task.status === 'OPEN';
            const isInProgress = task.status === 'IN_PROGRESS';
            const isDone = task.status === 'DONE';

            const severityBadgeColor =
              task.severity === 'CRITICAL'
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : task.severity === 'HIGH'
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-blue-100 text-blue-800 border-blue-200';

            return (
              <div
                key={task.id}
                className={`bg-white border rounded-xl p-4 flex flex-col justify-between transition-all shadow-xs ${
                  isDone 
                    ? 'border-slate-200 opacity-80' 
                    : isOpen && task.severity === 'CRITICAL'
                    ? 'border-rose-300 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      {task.schoolCode} · {task.cluster}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${severityBadgeColor}`}
                    >
                      {task.severity}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {task.description}
                  </p>

                  {/* Trigger Reason */}
                  <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-md p-2 text-[11px] text-slate-600">
                    <strong className="text-slate-800">Trigger:</strong> {task.triggerReason}
                  </div>

                  {/* Resolution Notes if Done */}
                  {task.resolutionNotes && (
                    <div className="mt-2 bg-emerald-50 border border-emerald-200/80 rounded-md p-2 text-[11px] text-emerald-800">
                      <strong className="text-emerald-950">Resolution Note:</strong> {task.resolutionNotes}
                    </div>
                  )}

                  {/* Assigned Official */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                        Assigned To
                      </span>
                      <span className="font-semibold text-slate-800">{task.assignedOfficialName}</span>
                      <span className="text-[11px] text-slate-500 block">{task.assignedOfficialRole}</span>
                    </div>
                    <a
                      href={`tel:${task.assignedOfficialPhone}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Call Official"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Due: {new Date(task.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isOpen && (
                      <button
                        onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                      >
                        <PlayCircle className="w-3 h-3" />
                        <span>Start</span>
                      </button>
                    )}
                    {(isOpen || isInProgress) && (
                      <button
                        onClick={() => setSelectedTaskForResolve(task)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark Done</span>
                      </button>
                    )}
                    {isDone && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolution Notes Modal */}
      {selectedTaskForResolve && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">
              Resolve Task: {selectedTaskForResolve.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Add verification details (e.g. materials received date, volunteer confirmation, boat delivery log).
            </p>

            <textarea
              rows={3}
              value={resolutionInput}
              onChange={(e) => setResolutionInput(e.target.value)}
              placeholder="e.g. Headmaster confirmed receipt of 120 pocket booklets via SDRF boat. Study circle resumed."
              className="mt-3 w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedTaskForResolve(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolve}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
