import React from 'react';
import { School, Task } from '../types';
import { School as SchoolIcon, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';

interface MetricsRibbonProps {
  schools: School[];
  tasks: Task[];
  onFilterRedClick?: () => void;
}

export const MetricsRibbon: React.FC<MetricsRibbonProps> = ({ schools, tasks, onFilterRedClick }) => {
  const totalSchools = schools.length;
  const redCount = schools.filter((s) => s.latestScoreColor === 'RED').length;
  const yellowCount = schools.filter((s) => s.latestScoreColor === 'YELLOW').length;
  const greenCount = schools.filter((s) => s.latestScoreColor === 'GREEN').length;

  const totalStudents = schools.reduce((acc, s) => acc + s.totalStudents, 0);
  const totalEngaged = schools.reduce((acc, s) => acc + s.studentsEngaged, 0);
  const overallEngagementPercent = totalStudents > 0 ? Math.round((totalEngaged / totalStudents) * 100) : 0;

  const openTasks = tasks.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
  const resolvedTasks = tasks.filter((t) => t.status === 'DONE');
  const resolutionRate = tasks.length > 0 ? Math.round((resolvedTasks.length / tasks.length) * 100) : 0;

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Schools Under Flood Watch */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Schools Monitored
              </span>
              <SchoolIcon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {totalSchools}
              </span>
              <span className="text-xs text-slate-500">in Morigaon District</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 font-mono tabular-nums">
              <span className="text-emerald-700 font-medium">{greenCount} Open</span>
              <span className="text-slate-300">/</span>
              <span className="text-amber-700 font-medium">{yellowCount} Partial</span>
              <span className="text-slate-300">/</span>
              <span className="text-rose-700 font-medium">{redCount} Closed</span>
            </div>
          </div>

          {/* Card 2: Critical Learning Loss Alert (Red) */}
          <div 
            onClick={onFilterRedClick}
            className={`border rounded-xl p-4 transition-all cursor-pointer ${
              redCount > 0 
                ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300' 
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
                Critical Score (Red)
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-rose-900">
                {redCount}
              </span>
              <span className="text-xs text-rose-700 font-medium">
                ({totalSchools > 0 ? Math.round((redCount / totalSchools) * 100) : 0}% of district)
              </span>
            </div>
            <p className="mt-2 text-xs text-rose-800/80">
              Immediate intervention required (Click to filter)
            </p>
          </div>

          {/* Card 3: Student Learning Continuity */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Learning Continuity
              </span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {overallEngagementPercent}%
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                ({totalEngaged.toLocaleString()} / {totalStudents.toLocaleString()} kids)
              </span>
            </div>
            <div className="mt-2.5 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  overallEngagementPercent > 65 ? 'bg-emerald-600' : overallEngagementPercent > 40 ? 'bg-amber-500' : 'bg-rose-600'
                }`}
                style={{ width: `${overallEngagementPercent}%` }}
              />
            </div>
          </div>

          {/* Card 4: Relief Tasks & Resolution */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Automated Relief Tasks
              </span>
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {openTasks.length}
              </span>
              <span className="text-xs text-slate-500">Active / {tasks.length} Total</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
              <span className="text-emerald-700 font-medium font-mono tabular-nums">
                {resolvedTasks.length} Completed
              </span>
              <span className="text-slate-500 font-mono tabular-nums">
                {resolutionRate}% resolution rate
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
