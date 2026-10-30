import React, { useState, useMemo } from 'react';
import { School, ScoreColor } from '../types';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  MessageSquare, 
  Send,
  Eye,
  FileSpreadsheet
} from 'lucide-react';

interface ScorecardViewProps {
  schools: School[];
  onSelectSchool: (school: School) => void;
  onOpenSmsModal: (schoolCode: string) => void;
  initialFilterRed?: boolean;
}

export const ScorecardView: React.FC<ScorecardViewProps> = ({
  schools,
  onSelectSchool,
  onOpenSmsModal,
  initialFilterRed = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [selectedColor, setSelectedColor] = useState<ScoreColor | 'ALL'>(
    initialFilterRed ? 'RED' : 'ALL'
  );
  const [sortOrder, setSortOrder] = useState<'WORST_FIRST' | 'BEST_FIRST' | 'DAYS_CLOSED' | 'NAME'>('WORST_FIRST');

  // Extract unique blocks
  const blocks = useMemo(() => {
    const set = new Set<string>();
    schools.forEach((s) => set.add(s.block));
    return Array.from(set);
  }, [schools]);

  // Filtered & Sorted schools
  const processedSchools = useMemo(() => {
    return schools
      .filter((school) => {
        // Search
        const q = searchQuery.toLowerCase().trim();
        if (q) {
          const matchName = school.name.toLowerCase().includes(q);
          const matchCode = school.code.toLowerCase().includes(q);
          const matchVillage = school.village.toLowerCase().includes(q);
          const matchOfficial = school.assignedOfficialName.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchVillage && !matchOfficial) return false;
        }

        // Block filter
        if (selectedBlock !== 'ALL' && school.block !== selectedBlock) {
          return false;
        }

        // Color filter
        if (selectedColor !== 'ALL' && school.latestScoreColor !== selectedColor) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'WORST_FIRST') {
          // Red first, then Yellow, then Green, then by lowest score
          const colorWeight = { RED: 1, YELLOW: 2, GREEN: 3 };
          if (colorWeight[a.latestScoreColor] !== colorWeight[b.latestScoreColor]) {
            return colorWeight[a.latestScoreColor] - colorWeight[b.latestScoreColor];
          }
          return a.latestScoreValue - b.latestScoreValue;
        }
        if (sortOrder === 'BEST_FIRST') {
          return b.latestScoreValue - a.latestScoreValue;
        }
        if (sortOrder === 'DAYS_CLOSED') {
          return b.daysClosed - a.daysClosed;
        }
        if (sortOrder === 'NAME') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [schools, searchQuery, selectedBlock, selectedColor, sortOrder]);

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffHours = Math.floor(diffMs / (3600 * 1000));
      if (diffHours <= 0) return 'Just now';
      if (diffHours === 1) return '1h ago';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search school name, code (SCH101), village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Filters & Sort options */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Block Filter */}
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Blocks ({schools.length})</option>
              {blocks.map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
            </select>

            {/* Score Color Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setSelectedColor('ALL')}
                className={`px-2.5 py-1.5 rounded-md transition-colors ${
                  selectedColor === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedColor('RED')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${
                  selectedColor === 'RED'
                    ? 'bg-rose-600 text-white shadow-xs font-semibold'
                    : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Red ({schools.filter((s) => s.latestScoreColor === 'RED').length})
              </button>
              <button
                onClick={() => setSelectedColor('YELLOW')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${
                  selectedColor === 'YELLOW'
                    ? 'bg-amber-600 text-white shadow-xs font-semibold'
                    : 'text-amber-700 hover:text-amber-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Yellow ({schools.filter((s) => s.latestScoreColor === 'YELLOW').length})
              </button>
              <button
                onClick={() => setSelectedColor('GREEN')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${
                  selectedColor === 'GREEN'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Green ({schools.filter((s) => s.latestScoreColor === 'GREEN').length})
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="WORST_FIRST">Priority: Worst First (Red on top)</option>
              <option value="BEST_FIRST">Score: High to Low</option>
              <option value="DAYS_CLOSED">Days Closed: Highest</option>
              <option value="NAME">School Name: A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Scorecard Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 w-16 text-center">Status</th>
                <th className="py-3 px-4">School & Village</th>
                <th className="py-3 px-3">Cluster / Block</th>
                <th className="py-3 px-3 text-right">Days Closed</th>
                <th className="py-3 px-3 text-right">Engagement</th>
                <th className="py-3 px-3 text-center">Materials Sent</th>
                <th className="py-3 px-3 text-center">Continuity Score</th>
                <th className="py-3 px-4">Assigned Official</th>
                <th className="py-3 px-3 text-center">Open Tasks</th>
                <th className="py-3 px-3 text-right">Last Report</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {processedSchools.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No schools match the current filter parameters.
                  </td>
                </tr>
              ) : (
                processedSchools.map((school) => {
                  const isRed = school.latestScoreColor === 'RED';
                  const isYellow = school.latestScoreColor === 'YELLOW';
                  const isGreen = school.latestScoreColor === 'GREEN';

                  return (
                    <tr
                      key={school.id}
                      onClick={() => onSelectSchool(school)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* 1. Status Indicator Badge */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-sm text-[11px] ${
                            isRed
                              ? 'bg-rose-100 text-rose-800'
                              : isYellow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {school.latestScoreColor}
                        </span>
                      </td>

                      {/* 2. School Name & Code */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{school.name}</span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 py-0.2 rounded-xs">
                            {school.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {school.village} · {school.floodRiskZone.replace('_', ' ')}
                        </div>
                      </td>

                      {/* 3. Cluster / Block */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{school.cluster}</div>
                        <div className="text-[11px] text-slate-500">{school.block}</div>
                      </td>

                      {/* 4. Days Closed */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {school.daysClosed > 0 ? (
                          <span className={school.daysClosed >= 3 ? 'text-rose-700 font-bold' : 'text-slate-800'}>
                            {school.daysClosed} days
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">0 (Open)</span>
                        )}
                      </td>

                      {/* 5. Engagement */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <div className="font-medium text-slate-900">
                          {school.studentsEngaged} / {school.totalStudents}
                        </div>
                        <div className={`text-[11px] ${school.engagementPercent < 30 ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                          {school.engagementPercent}% active
                        </div>
                      </td>

                      {/* 6. Materials Sent */}
                      <td className="py-3 px-3 text-center">
                        {school.materialsDelivered ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            YES
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-sm">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            NO
                          </span>
                        )}
                      </td>

                      {/* 7. Continuity Score (0-100) */}
                      <td className="py-3 px-3 text-center font-mono tabular-nums">
                        <div className="flex flex-col items-center">
                          <span className={`font-bold text-sm ${
                            isRed ? 'text-rose-700' : isYellow ? 'text-amber-700' : 'text-emerald-700'
                          }`}>
                            {school.latestScoreValue}
                          </span>
                          <div className="w-16 bg-slate-100 rounded-full h-1 mt-0.5 overflow-hidden">
                            <div 
                              className={`h-full ${
                                isRed ? 'bg-rose-500' : isYellow ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} 
                              style={{ width: `${school.latestScoreValue}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 8. Assigned Official */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {school.assignedOfficialName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {school.assignedOfficialRole} · <span className="font-mono">{school.assignedOfficialPhone}</span>
                        </div>
                      </td>

                      {/* 9. Open Tasks */}
                      <td className="py-3 px-3 text-center font-mono tabular-nums">
                        {school.activeOpenTasksCount > 0 ? (
                          <span className="px-2 py-0.5 text-xs font-bold rounded-sm bg-amber-100 text-amber-800">
                            {school.activeOpenTasksCount} pending
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </td>

                      {/* 10. Last Report Time */}
                      <td className="py-3 px-3 text-right text-slate-500 font-mono text-[11px] tabular-nums whitespace-nowrap">
                        {formatRelativeTime(school.lastReportedAt)}
                      </td>

                      {/* 11. Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            title="Simulate SMS Check-in for this school"
                            onClick={() => onOpenSmsModal(school.code)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="View School Dossier"
                            onClick={() => onSelectSchool(school)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info banner */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Showing <strong className="text-slate-900 font-mono tabular-nums">{processedSchools.length}</strong> of{' '}
            <strong className="text-slate-900 font-mono tabular-nums">{schools.length}</strong> flood district schools
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Algorithm: Days Closed (30%) + Student Engagement (45%) + Relief Materials (25%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
