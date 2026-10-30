import React, { useState } from 'react';
import { School, Official, TaskCategory, TaskSeverity } from '../types';
import { X, ShieldAlert, Plus } from 'lucide-react';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  schools: School[];
  officials: Official[];
  preselectedSchool?: School | null;
  onCreateTask: (taskData: {
    schoolId: string;
    schoolCode: string;
    schoolName: string;
    block: string;
    cluster: string;
    title: string;
    description: string;
    category: TaskCategory;
    severity: TaskSeverity;
    status: 'OPEN';
    triggerReason: string;
    assignedOfficialId: string;
    assignedOfficialName: string;
    assignedOfficialRole: string;
    assignedOfficialPhone: string;
    dueAt: string;
  }) => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  schools,
  officials,
  preselectedSchool,
  onCreateTask,
}) => {
  if (!isOpen) return null;

  const [selectedSchoolId, setSelectedSchoolId] = useState(
    preselectedSchool ? preselectedSchool.id : (schools[0]?.id || '')
  );
  const selectedSchool = schools.find((s) => s.id === selectedSchoolId) || schools[0];

  const [title, setTitle] = useState('Deliver emergency offline content pack');
  const [description, setDescription] = useState(
    'Dispatch 80 laminated pocket-lesson booklets and solar audio receiver for students cut off by flood water.'
  );
  const [category, setCategory] = useState<TaskCategory>('OFFLINE_CONTENT');
  const [severity, setSeverity] = useState<TaskSeverity>('HIGH');
  const [assignedOfficialId, setAssignedOfficialId] = useState(
    selectedSchool ? selectedSchool.assignedOfficialId : (officials[0]?.id || '')
  );
  const [dueHours, setDueHours] = useState(24);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;

    const official = officials.find((o) => o.id === assignedOfficialId) || officials[0];

    onCreateTask({
      schoolId: selectedSchool.id,
      schoolCode: selectedSchool.code,
      schoolName: selectedSchool.name,
      block: selectedSchool.block,
      cluster: selectedSchool.cluster,
      title,
      description,
      category,
      severity,
      status: 'OPEN',
      triggerReason: 'Manually logged by District Education Officer',
      assignedOfficialId: official.id,
      assignedOfficialName: official.name,
      assignedOfficialRole: official.role,
      assignedOfficialPhone: official.phone,
      dueAt: new Date(Date.now() + dueHours * 3600 * 1000).toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">
            Create Emergency Relief Task
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Select School</label>
            <select
              value={selectedSchoolId}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value);
                const s = schools.find((sc) => sc.id === e.target.value);
                if (s) setAssignedOfficialId(s.assignedOfficialId);
              }}
              className="w-full border border-slate-300 rounded-lg p-2 bg-white"
            >
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.code} - {school.name} ({school.latestScoreColor})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Task Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Description & Field Instructions</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Intervention Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
              >
                <option value="OFFLINE_CONTENT">Offline Content Pack</option>
                <option value="STUDY_CIRCLE">Community Study Circle</option>
                <option value="BOAT_TRANSPORT">Boat Delivery via Relief</option>
                <option value="SOLAR_RADIO">Solar Audio / Radio Broadcast</option>
                <option value="EMERGENCY_PRINT">Emergency Print Worksheets</option>
                <option value="COMMUNITY_CALL">Headmaster Check-in Call</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Severity / Priority</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as TaskSeverity)}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white font-semibold"
              >
                <option value="CRITICAL">CRITICAL (SLA 24h)</option>
                <option value="HIGH">HIGH (SLA 36h)</option>
                <option value="MEDIUM">MEDIUM (SLA 48h)</option>
                <option value="LOW">LOW (SLA 72h)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Assign Responsible Official</label>
              <select
                value={assignedOfficialId}
                onChange={(e) => setAssignedOfficialId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
              >
                {officials.map((official) => (
                  <option key={official.id} value={official.id}>
                    {official.name} ({official.role.split('(')[0].trim()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Resolution Due Window</label>
              <select
                value={dueHours}
                onChange={(e) => setDueHours(parseInt(e.target.value, 10))}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
              >
                <option value={12}>Within 12 Hours (Immediate)</option>
                <option value={24}>Within 24 Hours</option>
                <option value={36}>Within 36 Hours</option>
                <option value={48}>Within 48 Hours</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-md font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
            >
              Dispatch Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
