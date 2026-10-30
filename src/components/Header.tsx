import React from 'react';
import { ShieldAlert, Radio, Send, Bell } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  activeTab: 'map' | 'scorecard' | 'tasks' | 'analytics' | 'sms-hub' | 'admin';
  setActiveTab: (tab: 'map' | 'scorecard' | 'tasks' | 'analytics' | 'sms-hub' | 'admin') => void;
  openSmsModal: () => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  openTasksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openSmsModal,
  userRole,
  setUserRole,
  openTasksCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <a 
              href="#dashboard" 
              onClick={(e) => { e.preventDefault(); setActiveTab('scorecard'); }}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-600 transition-colors"
            >
              FloodLearn Tracker
            </a>
          </div>

          {/* Zone 2: Navigation Links (single-line, 1-2 word labels) */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('scorecard')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 text-sm ${
                activeTab === 'scorecard'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Scorecard
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 text-sm ${
                activeTab === 'map'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Map Board
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`relative transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 text-sm ${
                activeTab === 'tasks'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Relief Tasks
              {openTasksCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-amber-100 text-amber-800 rounded-sm">
                  {openTasksCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('sms-hub')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 text-sm ${
                activeTab === 'sms-hub'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              SMS / WhatsApp Hub
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 text-sm ${
                activeTab === 'admin'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Admin Config
            </button>
          </nav>

          {/* Zone 3: Primary Action & Role View */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2">
              <label htmlFor="user-role-select" className="text-xs text-slate-500 whitespace-nowrap">
                Role:
              </label>
              <select
                id="user-role-select"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="DEO_DISTRICT">District Education Officer (DEO)</option>
                <option value="CRCC_CLUSTER">Cluster Coordinator (CRCC)</option>
                <option value="DISASTER_NGO">Disaster Lead (DDMA/NGO)</option>
                <option value="TEACHER_VOLUNTEER">Teacher / Field Volunteer</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>

            <button
              onClick={openSmsModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate Check-in</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto gap-4 py-2 border-t border-slate-100 text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('scorecard')}
            className={`whitespace-nowrap ${activeTab === 'scorecard' ? 'text-blue-600 font-bold' : ''}`}
          >
            Scorecard
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`whitespace-nowrap ${activeTab === 'map' ? 'text-blue-600 font-bold' : ''}`}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`whitespace-nowrap ${activeTab === 'tasks' ? 'text-blue-600 font-bold' : ''}`}
          >
            Tasks ({openTasksCount})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`whitespace-nowrap ${activeTab === 'analytics' ? 'text-blue-600 font-bold' : ''}`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('sms-hub')}
            className={`whitespace-nowrap ${activeTab === 'sms-hub' ? 'text-blue-600 font-bold' : ''}`}
          >
            SMS
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`whitespace-nowrap ${activeTab === 'admin' ? 'text-blue-600 font-bold' : ''}`}
          >
            Config
          </button>
        </div>
      </div>
    </header>
  );
};
