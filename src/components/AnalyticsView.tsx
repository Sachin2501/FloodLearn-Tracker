import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { School, Task } from '../types';
import { 
  generate30DayDistrictTrend, 
  generateSchoolTrajectory, 
  INTERVENTION_IMPACT_STATS, 
  BLOCK_COMPARISONS 
} from '../data/analyticsData';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  BookOpen, 
  Calendar, 
  Layers, 
  ArrowUpRight,
  Filter,
  BarChart3,
  Download,
  Check,
  FileSpreadsheet
} from 'lucide-react';

interface AnalyticsViewProps {
  schools: School[];
  tasks: Task[];
  onSelectSchool?: (school: School) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  schools,
  tasks,
  onSelectSchool,
}) => {
  const [timeRange, setTimeRange] = useState<'30D' | '14D' | '7D'>('30D');
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string>(
    schools.find((s) => s.latestScoreColor === 'RED')?.code || schools[0]?.code || 'SCH102'
  );

  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isSchoolDownloaded, setIsSchoolDownloaded] = useState(false);

  // Raw 30-day trend data
  const rawTrendData = useMemo(() => generate30DayDistrictTrend(), []);

  // Filter trend by selected timeRange
  const trendData = useMemo(() => {
    if (timeRange === '7D') return rawTrendData.slice(-7);
    if (timeRange === '14D') return rawTrendData.slice(-14);
    return rawTrendData;
  }, [rawTrendData, timeRange]);

  // Export displayed learning continuity trend data with dates, scores, and school identifiers
  const handleDownloadCSV = () => {
    // Filter schools matching currently active block filter
    const targetSchools = selectedBlock === 'ALL'
      ? schools
      : schools.filter((s) => s.block === selectedBlock);

    // Number of days in the displayed timeframe
    const numDays = timeRange === '7D' ? 7 : timeRange === '14D' ? 14 : 30;

    const csvLines: string[] = [];

    // Formal Header Block for Offline District Education & Disaster Management reporting
    csvLines.push('"===================================================================================================="');
    csvLines.push('"DISTRICT ELEMENTARY EDUCATION OFFICE & DDMA - MORIGAON DISTRICT, ASSAM"');
    csvLines.push('"EMERGENCY LEARNING CONTINUITY TRACKER - OFFLINE DISTRICT RESPONSE & ASSESSMENT REPORT"');
    csvLines.push(`"Report Scope: ${selectedBlock === 'ALL' ? 'All Blocks (District-wide Comprehensive)' : selectedBlock}"`);
    csvLines.push(`"Timeframe: Last ${numDays} Days (October 2026 Monsoon Flood Period)"`);
    csvLines.push(`"Generated On: ${new Date().toISOString()}"`);
    csvLines.push(`"Total Monitored Schools: ${targetSchools.length}"`);
    csvLines.push('"===================================================================================================="');
    csvLines.push('');

    // Table 1: School-Level Daily Continuity Trend Records
    csvLines.push('"SECTION 1: SCHOOL-LEVEL DAILY LEARNING CONTINUITY TRENDS & INTERVENTIONS"');
    const schoolHeaders = [
      'Date',
      'Day Index',
      'School Code',
      'School Name',
      'Village',
      'Cluster',
      'Block',
      'District',
      'Total Enrolled Students',
      'Learning Continuity Score (0-100)',
      'Score Status Color',
      'School Status',
      'Days Closed',
      'Students Actively Engaged',
      'Engagement Rate (%)',
      'Emergency Materials Delivered',
      'Flood Risk Zone',
      'Headmaster Name',
      'Headmaster Phone',
      'Assigned Responsible Official',
      'Official Designation',
      'Official Phone',
      'Field Observations & Milestones'
    ];
    csvLines.push(schoolHeaders.join(','));

    // Populate daily records for each school over the displayed timeframe
    targetSchools.forEach((school) => {
      const fullTrajectory = generateSchoolTrajectory(school);
      const displayedPoints = fullTrajectory.slice(-numDays);

      displayedPoints.forEach((pt) => {
        const fullDateStr = `2026-10-${pt.dayIndex.toString().padStart(2, '0')}`;
        const scoreColor = pt.score >= 65 ? 'GREEN' : pt.score >= 35 ? 'YELLOW' : 'RED';
        const estDaysClosed = pt.status === 'CLOSED' ? Math.max(1, Math.min(6, pt.dayIndex - 6)) : pt.status === 'PARTIALLY_OPEN' ? 2 : 0;
        const engagedCount = Math.round((pt.engagementPercent / 100) * school.totalStudents);

        const row = [
          `"${fullDateStr}"`,
          pt.dayIndex,
          `"${school.code}"`,
          `"${school.name.replace(/"/g, '""')}"`,
          `"${school.village.replace(/"/g, '""')}"`,
          `"${school.cluster}"`,
          `"${school.block}"`,
          `"${school.district}"`,
          school.totalStudents,
          pt.score,
          `"${scoreColor}"`,
          `"${pt.status}"`,
          estDaysClosed,
          engagedCount,
          `${pt.engagementPercent}%`,
          pt.materialsDelivered ? 'YES' : 'NO',
          `"${school.floodRiskZone.replace(/_/g, ' ')}"`,
          `"${school.headmasterName.replace(/"/g, '""')}"`,
          `"${school.headmasterPhone}"`,
          `"${school.assignedOfficialName.replace(/"/g, '""')}"`,
          `"${school.assignedOfficialRole.replace(/"/g, '""')}"`,
          `"${school.assignedOfficialPhone}"`,
          `"${(pt.eventNote || (pt.status === 'CLOSED' ? 'Inundated road access cut off' : pt.status === 'PARTIALLY_OPEN' ? 'Classes operating in temporary shelter' : 'Regular classes active')).replace(/"/g, '""')}"`
        ];
        csvLines.push(row.join(','));
      });
    });

    csvLines.push('');
    csvLines.push('"===================================================================================================="');
    csvLines.push('"SECTION 2: DISTRICT-WIDE AGGREGATED DAILY CONTINUITY SCORECARD SUMMARY"');
    const districtHeaders = [
      'Date',
      'Full Date',
      'Day Index',
      'Avg District Continuity Score (0-100)',
      'Students Engaged (%)',
      'Green Schools (%)',
      'Yellow Schools (%)',
      'Red Schools (%)',
      'Active Red Schools Count',
      'Cumulative Relief Tasks Completed',
      'River Water Level vs Danger Mark',
      'Flood Phase',
      'District Phase Notes'
    ];
    csvLines.push(districtHeaders.join(','));

    trendData.forEach((d) => {
      const dRow = [
        `"${d.date}"`,
        `"${d.fullDate}"`,
        d.dayIndex,
        d.avgDistrictScore,
        `${d.studentsEngagedPercent}%`,
        `${d.greenPercent}%`,
        `${d.yellowPercent}%`,
        `${d.redPercent}%`,
        d.activeRedSchools,
        d.tasksCompletedCumulative,
        `"${d.riverWaterLevelMeters > 0 ? `+${d.riverWaterLevelMeters}m` : `${d.riverWaterLevelMeters}m`}"`,
        `"${d.floodPhase.replace(/_/g, ' ')}"`,
        `"${(d.phaseNote || '').replace(/"/g, '""')}"`
      ];
      csvLines.push(dRow.join(','));
    });

    // Create file and trigger browser download
    const csvContent = csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const blockSlug = selectedBlock === 'ALL' ? 'district' : selectedBlock.toLowerCase().replace(/\s+/g, '_');
    const filename = `floodlearn_continuity_report_${blockSlug}_${timeRange.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2500);
  };

  // Export individual school trajectory to CSV
  const handleDownloadSchoolCSV = () => {
    if (!focusedSchool) return;
    const headers = [
      'Date',
      'Day Index',
      'School Code',
      'School Name',
      'Cluster',
      'Block',
      'Continuity Score (0-100)',
      'Status',
      'Student Engagement (%)',
      'Materials Delivered',
      'Milestone / Event Note'
    ];

    const rows = schoolTrajectory.map((p) => [
      `"${p.date}"`,
      p.dayIndex,
      `"${focusedSchool.code}"`,
      `"${focusedSchool.name.replace(/"/g, '""')}"`,
      `"${focusedSchool.cluster}"`,
      `"${focusedSchool.block}"`,
      p.score,
      `"${p.status}"`,
      `${p.engagementPercent}%`,
      p.materialsDelivered ? 'YES' : 'NO',
      `"${(p.eventNote || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filename = `${focusedSchool.code}_learning_continuity_trajectory_${timeRange.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsSchoolDownloaded(true);
    setTimeout(() => setIsSchoolDownloaded(false), 2500);
  };

  // Selected school for deep-dive trajectory
  const focusedSchool = useMemo(() => {
    return schools.find((s) => s.code === selectedSchoolCode) || schools[0];
  }, [schools, selectedSchoolCode]);

  // Trajectory points for focused school
  const schoolTrajectory = useMemo(() => {
    if (!focusedSchool) return [];
    const pts = generateSchoolTrajectory(focusedSchool);
    if (timeRange === '7D') return pts.slice(-7);
    if (timeRange === '14D') return pts.slice(-14);
    return pts;
  }, [focusedSchool, timeRange]);

  // Comparative Treatment data (Schools with Completed Tasks vs Untreated)
  const treatmentComparisonData = useMemo(() => {
    return [
      {
        category: 'Offline Pack Delivered',
        withIntervention: 64,
        withoutIntervention: 22,
        gain: '+42 pts',
      },
      {
        category: 'Study Circle Mobilized',
        withIntervention: 58,
        withoutIntervention: 19,
        gain: '+39 pts',
      },
      {
        category: 'Headmaster Check-in',
        withIntervention: 71,
        withoutIntervention: 44,
        gain: '+27 pts',
      },
      {
        category: 'Overall District Average',
        withIntervention: 66,
        withoutIntervention: 28,
        gain: '+38 pts',
      },
    ];
  }, []);

  return (
    <div className="space-y-6">
      {/* Analytics Header & Scope Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm">
                Impact Assessment & Response Efficacy
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              30-Day Learning Continuity Trend & Intervention Impact
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
              Empirical tracking of school continuity scores before, during, and after flood-relief interventions across Morigaon District.
            </p>
          </div>

          {/* Timeframe & Block Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Time Range Pills */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 font-medium">
              <button
                onClick={() => setTimeRange('7D')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  timeRange === '7D'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeRange('14D')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  timeRange === '14D'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 14 Days
              </button>
              <button
                onClick={() => setTimeRange('30D')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  timeRange === '30D'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Full 30 Days (Flood Arc)
              </button>
            </div>

            {/* Block Filter */}
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Blocks (District Overview)</option>
              <option value="Mayong Block">Mayong Block</option>
              <option value="Laharighat Block">Laharighat Block</option>
              <option value="Bhuragaon Block">Bhuragaon Block</option>
              <option value="Dhing Block">Dhing Block</option>
            </select>

            {/* Download CSV Button */}
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Download learning continuity trend data with dates, scores, and school identifiers for offline district reporting"
            >
              {isDownloaded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Download CSV</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quantitative Impact Proof KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Avg Score Gain Post Intervention */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Avg Score Recovery
            </span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              +{INTERVENTION_IMPACT_STATS.avgScoreGainPostIntervention} pts
            </span>
            <span className="text-xs text-slate-500 font-medium">gain</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Average continuity rebound within 7 days of task completion
          </p>
        </div>

        {/* Metric 2: Treatment vs Untreated Recovery Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Intervention Efficacy
            </span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-blue-700">
              {INTERVENTION_IMPACT_STATS.treatedSchoolsRecoveryRate}%
            </span>
            <span className="text-xs text-slate-500">vs 18.2% untreated</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Red schools that reached Yellow/Green after receiving offline packs
          </p>
        </div>

        {/* Metric 3: Response Latency SLA */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Time to Intervention
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {INTERVENTION_IMPACT_STATS.averageDaysToIntervene} days
            </span>
            <span className="text-xs text-slate-500">avg speed</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            From initial RED SMS report to task assignment in field
          </p>
        </div>

        {/* Metric 4: Cumulative Learning Hours Preserved */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Learning Hours Saved
            </span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-purple-900">
              {INTERVENTION_IMPACT_STATS.totalStudentHoursRecovered}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Student learning hours preserved via pocket kits & study circles
          </p>
        </div>
      </div>

      {/* Primary Chart: 30-Day District Continuity Trend with Flood Milestones */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>District Learning Continuity Trend vs. Flood Interventions</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tracking average continuity scores (0–100) and student engagement (%) through pre-flood, breach, peak crisis, and relief rollout.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-blue-600">
              <span className="w-3 h-0.5 bg-blue-600 inline-block" />
              <span>District Continuity Score</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
              <span>% Students Engaged</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-500">
              <span className="w-3 h-0.5 bg-rose-500 border-b border-dashed inline-block" />
              <span>Critical Alert Threshold (35)</span>
            </div>
          </div>
        </div>

        {/* Recharts Area / Line Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="engagedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickLine={false} 
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickLine={false}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as typeof trendData[0];
                    return (
                      <div className="bg-slate-900 text-white rounded-lg p-3 text-xs shadow-xl border border-slate-700 min-w-[200px]">
                        <div className="font-bold border-b border-slate-700 pb-1 mb-1.5 flex justify-between">
                          <span>{label}</span>
                          <span className="text-amber-400 font-mono">{data.floodPhase.replace('_', ' ')}</span>
                        </div>
                        <div className="space-y-1 font-mono tabular-nums">
                          <div className="flex justify-between text-blue-300">
                            <span>Continuity Score:</span>
                            <span className="font-bold">{data.avgDistrictScore} / 100</span>
                          </div>
                          <div className="flex justify-between text-emerald-300">
                            <span>Students Engaged:</span>
                            <span className="font-bold">{data.studentsEngagedPercent}%</span>
                          </div>
                          <div className="flex justify-between text-rose-300">
                            <span>Red (Critical) Schools:</span>
                            <span className="font-bold">{data.activeRedSchools} schools</span>
                          </div>
                          <div className="flex justify-between text-purple-300">
                            <span>Tasks Resolved:</span>
                            <span className="font-bold">{data.tasksCompletedCumulative} total</span>
                          </div>
                        </div>
                        {data.phaseNote && (
                          <div className="mt-2 text-[10px] text-amber-200 border-t border-slate-800 pt-1 italic font-sans">
                            Note: {data.phaseNote}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Critical threshold line at score 35 */}
              <ReferenceLine y={35} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'CRITICAL THRESHOLD (35)', fill: '#e11d48', fontSize: 10, position: 'insideTopRight' }} />
              {/* Recovery target threshold line at score 65 */}
              <ReferenceLine y={65} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'GREEN CONTINUITY TARGET (65)', fill: '#059669', fontSize: 10, position: 'insideTopRight' }} />

              <Area 
                type="monotone" 
                dataKey="avgDistrictScore" 
                name="Continuity Score" 
                stroke="#2563eb" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#scoreGradient)" 
              />
              <Line 
                type="monotone" 
                dataKey="studentsEngagedPercent" 
                name="% Students Engaged" 
                stroke="#059669" 
                strokeWidth={2} 
                dot={{ r: 2 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Phase Timeline Annotation Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Phase 1: Pre-Flood</span>
            <span className="font-semibold text-slate-800">Days 1–5 (Oct 1–5)</span>
            <p className="text-[11px] text-slate-500 mt-0.5">District score 82. Normal schooling.</p>
          </div>
          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
            <span className="text-[10px] font-bold uppercase text-rose-700 block">Phase 2: River Surge</span>
            <span className="font-semibold text-rose-900">Days 6–12 (Oct 6–12)</span>
            <p className="text-[11px] text-rose-800 mt-0.5">Brahmaputra breach. Score plunges to 30.</p>
          </div>
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-[10px] font-bold uppercase text-amber-700 block">Phase 3: Auto-Tasks Dispatched</span>
            <span className="font-semibold text-amber-900">Days 13–19 (Oct 13–19)</span>
            <p className="text-[11px] text-amber-800 mt-0.5">FloodLearn creates tasks; boats mobilize.</p>
          </div>
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="text-[10px] font-bold uppercase text-emerald-700 block">Phase 4: Intervention Recovery</span>
            <span className="font-semibold text-emerald-900">Days 20–30 (Oct 20–29)</span>
            <p className="text-[11px] text-emerald-800 mt-0.5">Score rebounds from 30 to 66 (+36 pts).</p>
          </div>
        </div>
      </div>

      {/* 2-Column Split: School Status Distribution (Area) + Before/After Impact Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 30-Day Scorecard Status Distribution (Green / Yellow / Red %) (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                School Status Composition Trend (30 Days)
              </h3>
              <p className="text-xs text-slate-500">
                % of district schools classified as Green, Yellow, or Red over time.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block" /> Green
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs inline-block" /> Yellow
              </span>
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs inline-block" /> Red
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <Tooltip 
                  formatter={(val: any, name: any) => [`${val}%`, name]}
                />
                <Area type="monotone" dataKey="redPercent" name="Red (Critical)" stackId="1" stroke="#e11d48" fill="#f43f5e" fillOpacity={0.7} />
                <Area type="monotone" dataKey="yellowPercent" name="Yellow (At Risk)" stackId="1" stroke="#d97706" fill="#f59e0b" fillOpacity={0.7} />
                <Area type="monotone" dataKey="greenPercent" name="Green (Active)" stackId="1" stroke="#16a34a" fill="#10b981" fillOpacity={0.7} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <strong>Key Insight:</strong> Red schools surged to 50% on Day 12 during peak water levels. Following automated kit dispatches and volunteer study circles, Red status contracted to 15%.
          </div>
        </div>

        {/* Right: Comparative Intervention Impact (With vs Without) (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Continuity Score: Treated vs. Untreated Schools
              </h3>
              <p className="text-xs text-slate-500">
                Score comparison across intervention categories (with completed task vs pending).
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs inline-block" /> With Intervention
              </span>
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-2.5 h-2.5 bg-rose-400 rounded-xs inline-block" /> Without / Pending
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={treatmentComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <Tooltip 
                  formatter={(val: any, name: any) => [`${val} / 100`, name]}
                />
                <Bar dataKey="withIntervention" name="With Completed Task" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withoutIntervention" name="Untreated / Pending Task" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <strong>Accountability Proof:</strong> Schools with completed offline learning pack dispatches scored an average of <strong className="text-slate-900">64</strong> vs <strong className="text-slate-900">22</strong> for untreated schools, validating intervention value.
          </div>
        </div>
      </div>

      {/* Drill-Down Section: Individual School 30-Day Response Trajectory */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>School-Level 30-Day Response Trajectory</span>
            </h3>
            <p className="text-xs text-slate-500">
              Inspect an individual school's day-by-day score recovery following automated task assignment.
            </p>
          </div>

          {/* School Selector & Export */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Select School:</span>
            <select
              value={selectedSchoolCode}
              onChange={(e) => setSelectedSchoolCode(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.code} - {s.name} ({s.latestScoreColor})
                </option>
              ))}
            </select>

            <button
              onClick={handleDownloadSchoolCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title={`Export ${focusedSchool.code} 30-day response trajectory to CSV`}
            >
              {isSchoolDownloaded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Exported</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export School CSV</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Selected School Metadata Banner */}
        {focusedSchool && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-xs">
                  {focusedSchool.code}
                </span>
                <span className="font-bold text-slate-900 text-sm">{focusedSchool.name}</span>
                <span className="text-slate-500">· {focusedSchool.village} ({focusedSchool.cluster})</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                Official: <strong>{focusedSchool.assignedOfficialName}</strong> ({focusedSchool.assignedOfficialRole})
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono tabular-nums">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-sans">CURRENT SCORE</span>
                <span className={`text-base font-bold ${
                  focusedSchool.latestScoreColor === 'RED' ? 'text-rose-700' : focusedSchool.latestScoreColor === 'YELLOW' ? 'text-amber-700' : 'text-emerald-700'
                }`}>
                  {focusedSchool.latestScoreValue} / 100 ({focusedSchool.latestScoreColor})
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-sans">DAYS CLOSED</span>
                <span className="text-base font-bold text-slate-800">{focusedSchool.daysClosed}d</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-sans">ACTIVE ENGAGEMENT</span>
                <span className="text-base font-bold text-slate-800">{focusedSchool.engagementPercent}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Trajectory Line Chart */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={schoolTrajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as typeof schoolTrajectory[0];
                    return (
                      <div className="bg-slate-900 text-white rounded-lg p-2.5 text-xs shadow-xl border border-slate-700 font-mono">
                        <div className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-200">
                          {label} · {focusedSchool.code}
                        </div>
                        <div className="text-blue-300">Score: <strong>{data.score} / 100</strong></div>
                        <div className="text-emerald-300">Engagement: <strong>{data.engagementPercent}%</strong></div>
                        <div className="text-slate-300">Status: {data.status}</div>
                        {data.eventNote && (
                          <div className="mt-1.5 text-[10px] text-amber-300 border-t border-slate-800 pt-1 italic font-sans">
                            Milestone: {data.eventNote}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={35} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'CRITICAL (35)', fill: '#e11d48', fontSize: 9 }} />
              <ReferenceLine y={65} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'GREEN (65)', fill: '#059669', fontSize: 9 }} />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#2563eb" 
                strokeWidth={3} 
                dot={{ r: 3, fill: '#2563eb' }} 
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                dataKey="engagementPercent" 
                stroke="#059669" 
                strokeWidth={1.5} 
                strokeDasharray="4 4" 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Block-by-Block Resilience Summary Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Block-by-Block 30-Day Resilience & Recovery Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Comparative analysis of flood impact, trough severity, and post-task recovery across administrative blocks.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4">Block Name</th>
                <th className="py-2.5 px-3 text-right">Pre-Flood Baseline</th>
                <th className="py-2.5 px-3 text-right">Flood Trough (Lowest)</th>
                <th className="py-2.5 px-3 text-right">Current Score</th>
                <th className="py-2.5 px-3 text-right">Net Recovery Rate</th>
                <th className="py-2.5 px-3 text-center">Tasks Completed</th>
                <th className="py-2.5 px-4">Resilience Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700 font-mono tabular-nums">
              {BLOCK_COMPARISONS.map((block) => (
                <tr key={block.block} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                    {block.block}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    {block.baselineScore}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-700 font-bold">
                    {block.lowestScore}
                  </td>
                  <td className="py-3 px-3 text-right text-blue-700 font-bold">
                    {block.currentScore}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                    +{block.recoveryRatePercent}%
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-sm font-bold">
                      {block.tasksCompleted} tasks
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-xs">
                    {block.recoveryRatePercent >= 70 ? (
                      <span className="text-emerald-700 font-medium">Strong Rebound (Rapid kit distribution)</span>
                    ) : block.recoveryRatePercent >= 55 ? (
                      <span className="text-blue-700 font-medium">Moderate Recovery (Active study circles)</span>
                    ) : (
                      <span className="text-amber-700 font-medium">Island Chars Cut Off (Boat delivery ongoing)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
