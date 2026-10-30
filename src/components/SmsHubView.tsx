import React, { useState } from 'react';
import { Report, School } from '../types';
import { 
  MessageSquare, 
  Send, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Copy, 
  Check, 
  BookOpen, 
  PhoneCall, 
  HelpCircle 
} from 'lucide-react';

interface SmsHubViewProps {
  reports: Report[];
  schools: School[];
  onOpenSimulator: (code?: string) => void;
}

export const SmsHubView: React.FC<SmsHubViewProps> = ({
  reports,
  schools,
  onOpenSimulator,
}) => {
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [filterChannel, setFilterChannel] = useState<'ALL' | 'SMS' | 'WHATSAPP'>('ALL');

  const filteredReports = reports.filter((r) => {
    if (filterChannel !== 'ALL' && r.channel !== filterChannel) return false;
    return true;
  });

  const webhookEndpoint = `${window.location.origin}/api/sms-webhook`;

  const copyEndpoint = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Simulator Launch */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm">
              Low-Bandwidth Disaster Reporting
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            SMS & WhatsApp Webhook Management Hub
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Empowers flood-affected village headmasters, boat volunteers, and community educators to report school closures and student engagement via simple text messages.
          </p>
        </div>

        <button
          onClick={() => onOpenSimulator()}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shadow-xs shrink-0"
        >
          <Smartphone className="w-4 h-4" />
          <span>Open Interactive Mobile Simulator</span>
        </button>
      </div>

      {/* 2-Column: Live Reports Feed & Format Cheat Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Ingestion Stream (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Live Check-in Message Stream
              </h3>
              <p className="text-xs text-slate-500">
                Real-time log of raw messages parsed and acknowledged by FloodLearn.
              </p>
            </div>

            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setFilterChannel('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  filterChannel === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterChannel('SMS')}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  filterChannel === 'SMS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                SMS
              </button>
              <button
                onClick={() => setFilterChannel('WHATSAPP')}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  filterChannel === 'WHATSAPP' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                WhatsApp
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto p-2">
            {filteredReports.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No check-in messages found. Use the simulator to send the first check-in!
              </div>
            ) : (
              filteredReports.map((report) => (
                <div key={report.id} className="p-3 hover:bg-slate-50 transition-colors rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                        report.channel === 'WHATSAPP' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {report.channel}
                      </span>
                      <span className="font-semibold text-slate-900 text-xs">
                        {report.schoolCode} · {report.schoolName}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Raw incoming message bubble */}
                  <div className="mt-2 bg-slate-100 border border-slate-200/80 rounded-md p-2 font-mono text-xs text-slate-800">
                    "{report.rawMessage}"
                  </div>

                  {/* Parsed extraction */}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                    <span>
                      Status: <strong className="text-slate-900">{report.status}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Closed: <strong className="text-slate-900">{report.daysClosed} days</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Engaged: <strong className="text-slate-900">{report.studentsEngaged}</strong> ({report.engagementPercent}%)
                    </span>
                    <span>·</span>
                    <span>
                      Materials: <strong className="text-slate-900">{report.materialsDelivered ? 'YES' : 'NO'}</strong>
                    </span>
                    <span>·</span>
                    <span className="text-slate-400 font-mono">
                      Confidence: {Math.round(report.parsedConfidence * 100)}%
                    </span>
                  </div>

                  {/* Automated system response */}
                  <div className="mt-2 text-[11px] text-blue-700 bg-blue-50/70 border border-blue-100 rounded-md p-2">
                    <strong className="text-blue-900">Auto-Feedback Sent:</strong> {report.systemReplySent}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Webhook Setup & Cheat Sheet (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Webhook Endpoint Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-600" />
                Live Webhook Endpoint
              </h4>
              <span className="font-mono text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-sm font-semibold">
                ACTIVE
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Configure this webhook URL in your Twilio SMS, Gupshup, or WhatsApp Cloud API webhook console:
            </p>

            <div className="bg-slate-900 text-slate-100 rounded-lg p-2.5 font-mono text-[11px] flex items-center justify-between gap-2 overflow-x-auto">
              <span className="truncate">{webhookEndpoint}</span>
              <button
                onClick={copyEndpoint}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                title="Copy Webhook URL"
              >
                {copiedEndpoint ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Formats Cheat Sheet for Teachers */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-xs space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Teacher Field Format Cheat-Sheet
            </h4>
            <p className="text-slate-500 text-[11px]">
              Teachers are given this pocket card explaining how to send check-ins:
            </p>

            <div className="space-y-2">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <div className="font-bold text-slate-800">Format 1: Structured Key-Value</div>
                <code className="text-blue-600 block mt-0.5 font-mono text-[11px]">
                  SCH101 CLOSED DAYS=3 ENGAGED=15 MATERIALS=NO
                </code>
                <p className="text-[10px] text-slate-500 mt-1">
                  Ideal for smartphone copy-paste or saved templates.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <div className="font-bold text-slate-800">Format 2: Ultra-Short Positional</div>
                <code className="text-blue-600 block mt-0.5 font-mono text-[11px]">
                  SCH102 CLOSED 4 20 NO
                </code>
                <p className="text-[10px] text-slate-500 mt-1">
                  Optimized for basic 2G feature phones (Code, Status, Days, Engaged, Materials).
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <div className="font-bold text-slate-800">Format 3: Re-Opened / Active</div>
                <code className="text-blue-600 block mt-0.5 font-mono text-[11px]">
                  SCH101 OPEN 0 250 YES
                </code>
                <p className="text-[10px] text-slate-500 mt-1">
                  Restores school continuity score to GREEN.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
