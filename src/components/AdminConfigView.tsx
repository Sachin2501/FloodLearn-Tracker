import React, { useState } from 'react';
import { School, Official, ScoringRuleConfig } from '../types';
import { 
  Settings, 
  School as SchoolIcon, 
  Users, 
  Sliders, 
  Plus, 
  RotateCcw, 
  Check, 
  Edit3,
  MapPin,
  Save
} from 'lucide-react';

interface AdminConfigViewProps {
  schools: School[];
  officials: Official[];
  config: ScoringRuleConfig;
  onUpdateConfig: (newConfig: ScoringRuleConfig) => void;
  onAddSchool: (schoolData: any) => void;
  onAssignOfficial: (schoolId: string, officialId: string) => void;
  onResetData: () => void;
}

export const AdminConfigView: React.FC<AdminConfigViewProps> = ({
  schools,
  officials,
  config,
  onUpdateConfig,
  onAddSchool,
  onAssignOfficial,
  onResetData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'thresholds' | 'schools' | 'officials'>('thresholds');

  // Config state
  const [greenMinScore, setGreenMinScore] = useState(config.greenMinScore);
  const [yellowMinScore, setYellowMinScore] = useState(config.yellowMinScore);
  const [maxDaysGreen, setMaxDaysGreen] = useState(config.maxDaysClosedForGreen);
  const [minEngGreen, setMinEngGreen] = useState(config.minEngagementPercentForGreen);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New School Form state
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolVillage, setNewSchoolVillage] = useState('');
  const [newSchoolCluster, setNewSchoolCluster] = useState('Mayong Central');
  const [newSchoolBlock, setNewSchoolBlock] = useState('Mayong Block');
  const [newSchoolStudents, setNewSchoolStudents] = useState(150);
  const [newSchoolLat, setNewSchoolLat] = useState('26.2550');
  const [newSchoolLng, setNewSchoolLng] = useState('92.0500');
  const [newSchoolHeadmaster, setNewSchoolHeadmaster] = useState('Gopal Das');
  const [newSchoolPhone, setNewSchoolPhone] = useState('+91 94350 77123');
  const [newSchoolOfficialId, setNewSchoolOfficialId] = useState(officials[0]?.id || '');

  const handleSaveConfig = () => {
    onUpdateConfig({
      ...config,
      greenMinScore,
      yellowMinScore,
      maxDaysClosedForGreen: maxDaysGreen,
      minEngagementPercentForGreen: minEngGreen,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName) return;

    const assignedOff = officials.find((o) => o.id === newSchoolOfficialId) || officials[0];

    onAddSchool({
      code: `SCH${101 + schools.length}`,
      name: newSchoolName,
      village: newSchoolVillage || newSchoolName,
      cluster: newSchoolCluster,
      block: newSchoolBlock,
      district: 'Morigaon District, Assam',
      totalStudents: newSchoolStudents,
      lat: parseFloat(newSchoolLat) || 26.25,
      lng: parseFloat(newSchoolLng) || 92.05,
      floodRiskZone: 'HIGH_RISK',
      headmasterName: newSchoolHeadmaster,
      headmasterPhone: newSchoolPhone,
      assignedOfficialId: assignedOff.id,
      assignedOfficialName: assignedOff.name,
      assignedOfficialRole: assignedOff.role,
      assignedOfficialPhone: assignedOff.phone,
      latestStatus: 'OPEN',
      daysClosed: 0,
      studentsEngaged: Math.round(newSchoolStudents * 0.8),
      materialsDelivered: true,
      notes: 'Newly enrolled flood monitoring school.',
    });

    setShowAddSchool(false);
    setNewSchoolName('');
    setNewSchoolVillage('');
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            System Administration & Rule Configurations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure scoring thresholds, school master records, and official responsibilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveSubTab('thresholds')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeSubTab === 'thresholds'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Scoring & Task Trigger Rules</span>
        </button>

        <button
          onClick={() => setActiveSubTab('schools')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeSubTab === 'schools'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SchoolIcon className="w-4 h-4" />
          <span>School Master Records ({schools.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('officials')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeSubTab === 'officials'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Officials & Cluster Mapping ({officials.length})</span>
        </button>
      </div>

      {/* Sub-Tab 1: Thresholds & Rules */}
      {activeSubTab === 'thresholds' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Continuity Scorecard Thresholds
            </h3>
            <p className="text-slate-500 text-[11px]">
              Adjust the numerical score cutoffs and parameters that trigger Green, Yellow, and Red alerts across the district.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Green Minimum Score Cutoff:</span>
                  <span className="font-mono text-emerald-700">{greenMinScore} / 100</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={85}
                  value={greenMinScore}
                  onChange={(e) => setGreenMinScore(parseInt(e.target.value, 10))}
                  className="w-full mt-1 accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Yellow Minimum Score Cutoff (Below this is RED):</span>
                  <span className="font-mono text-amber-700">{yellowMinScore} / 100</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={55}
                  value={yellowMinScore}
                  onChange={(e) => setYellowMinScore(parseInt(e.target.value, 10))}
                  className="w-full mt-1 accent-amber-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Max Days Closed for Green:</span>
                  <span className="font-mono">{maxDaysGreen} day(s)</span>
                </div>
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={maxDaysGreen}
                  onChange={(e) => setMaxDaysGreen(parseInt(e.target.value, 10))}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Minimum Student Engagement for Green:</span>
                  <span className="font-mono">{minEngGreen}%</span>
                </div>
                <input
                  type="number"
                  min={40}
                  max={90}
                  value={minEngGreen}
                  onChange={(e) => setMinEngGreen(parseInt(e.target.value, 10))}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-md"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {savedSuccess ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Thresholds Saved!
                </span>
              ) : <div />}
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Thresholds</span>
              </button>
            </div>
          </div>

          {/* Rules Engine Specifications Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Automatic Task Assignment Logic
            </h3>
            <p className="text-slate-500 text-[11px]">
              Every incoming SMS check-in is evaluated against these automated triggers:
            </p>

            <div className="space-y-2.5">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <span className="font-bold text-rose-900 block">
                  Rule 1: Emergency Offline Packets
                </span>
                <p className="text-rose-800 text-[11px] mt-0.5">
                  <strong>Condition:</strong> Score = RED and School closed &ge; 3 days.<br />
                  <strong>Action:</strong> Auto-assign "Deliver emergency offline content pack" to responsible CRCC/BEO. SLA 36h.
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="font-bold text-amber-900 block">
                  Rule 2: Community Study Circle Mobilization
                </span>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  <strong>Condition:</strong> Student engagement drops below 30%.<br />
                  <strong>Action:</strong> Auto-dispatch NGO volunteer team to organize study circles in highland shelters.
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="font-bold text-blue-900 block">
                  Rule 3: Headmaster Check-in & Attendance Audit
                </span>
                <p className="text-blue-800 text-[11px] mt-0.5">
                  <strong>Condition:</strong> YELLOW score and Materials = NO.<br />
                  <strong>Action:</strong> Auto-create check-in call task for assigned officer.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: School Master Records */}
      {activeSubTab === 'schools' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Registered Flood Zone Schools
            </h3>
            <button
              onClick={() => setShowAddSchool(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add School</span>
            </button>
          </div>

          {/* Add School Drawer */}
          {showAddSchool && (
            <form onSubmit={handleCreateSchool} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
              <h4 className="font-bold text-slate-900">New School Registration</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">School Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Borbari Tribal Primary School"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Village / Char</label>
                  <input
                    type="text"
                    placeholder="e.g. Borbari Island"
                    value={newSchoolVillage}
                    onChange={(e) => setNewSchoolVillage(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Total Enrolled Students</label>
                  <input
                    type="number"
                    value={newSchoolStudents}
                    onChange={(e) => setNewSchoolStudents(parseInt(e.target.value, 10))}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Cluster</label>
                  <select
                    value={newSchoolCluster}
                    onChange={(e) => setNewSchoolCluster(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="Mayong Central">Mayong Central</option>
                    <option value="Laharighat North">Laharighat North</option>
                    <option value="Bhuragaon Riverine">Bhuragaon Riverine</option>
                    <option value="Dhing Flood Plain">Dhing Flood Plain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Block</label>
                  <select
                    value={newSchoolBlock}
                    onChange={(e) => setNewSchoolBlock(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="Mayong Block">Mayong Block</option>
                    <option value="Laharighat Block">Laharighat Block</option>
                    <option value="Bhuragaon Block">Bhuragaon Block</option>
                    <option value="Dhing Block">Dhing Block</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Headmaster Name</label>
                  <input
                    type="text"
                    value={newSchoolHeadmaster}
                    onChange={(e) => setNewSchoolHeadmaster(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Assign Official</label>
                  <select
                    value={newSchoolOfficialId}
                    onChange={(e) => setNewSchoolOfficialId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  >
                    {officials.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSchool(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
                >
                  Save School
                </button>
              </div>
            </form>
          )}

          {/* School List Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Code</th>
                  <th className="p-2.5">School Name</th>
                  <th className="p-2.5">Village</th>
                  <th className="p-2.5">Cluster / Block</th>
                  <th className="p-2.5 text-right">Students</th>
                  <th className="p-2.5">Assigned Official</th>
                  <th className="p-2.5">Change Official</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-600">{school.code}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{school.name}</td>
                    <td className="p-2.5 text-slate-600">{school.village}</td>
                    <td className="p-2.5 text-slate-600">{school.cluster} ({school.block})</td>
                    <td className="p-2.5 text-right font-mono tabular-nums">{school.totalStudents}</td>
                    <td className="p-2.5 font-medium text-slate-800">{school.assignedOfficialName}</td>
                    <td className="p-2.5">
                      <select
                        value={school.assignedOfficialId}
                        onChange={(e) => onAssignOfficial(school.id, e.target.value)}
                        className="text-[11px] border border-slate-300 rounded px-1.5 py-1 bg-white"
                      >
                        {officials.map((o) => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Officials Directory */}
      {activeSubTab === 'officials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {officials.map((official) => (
            <div key={official.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-xs space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{official.name}</h4>
                  <div className="text-slate-600">{official.role}</div>
                </div>
                <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded-sm">
                  {official.id}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-600">
                <div>
                  <strong>Phone:</strong> <span className="font-mono">{official.phone}</span>
                </div>
                <div>
                  <strong>Email:</strong> {official.email}
                </div>
                <div>
                  <strong>Assigned Clusters:</strong> {official.assignedClusters.join(', ')}
                </div>
                <div>
                  <strong>Assigned Blocks:</strong> {official.assignedBlocks.join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
