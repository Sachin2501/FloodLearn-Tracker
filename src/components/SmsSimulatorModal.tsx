import React, { useState } from 'react';
import { School, ParsedSMSResult, Report } from '../types';
import { 
  X, 
  Send, 
  Smartphone, 
  MessageSquare, 
  CheckCheck, 
  Sparkles, 
  FileText, 
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

interface SmsSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  schools: School[];
  defaultSchoolCode?: string;
  onSendMessage: (
    message: string,
    channel: 'SMS' | 'WHATSAPP',
    phone: string,
    name: string
  ) => { parsedResult: ParsedSMSResult; reportId?: string };
}

export const SmsSimulatorModal: React.FC<SmsSimulatorModalProps> = ({
  isOpen,
  onClose,
  schools,
  defaultSchoolCode,
  onSendMessage,
}) => {
  if (!isOpen) return null;

  const [channel, setChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');
  const [senderName, setSenderName] = useState('Headmaster Jatin Das');
  const [senderPhone, setSenderPhone] = useState('+91 94351 98711');
  const [inputMessage, setInputMessage] = useState(
    defaultSchoolCode ? `${defaultSchoolCode} CLOSED DAYS=3 ENGAGED=25 MATERIALS=NO` : 'SCH102 CLOSED DAYS=4 ENGAGED=28 MATERIALS=NO'
  );
  
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'system'; text: string; time: string; channel: 'SMS' | 'WHATSAPP' }>>([
    {
      sender: 'system',
      text: 'FloodLearn Reporting System ready. Send status check-in for your school code, e.g.: SCH102 CLOSED 3 20 NO',
      time: '10:00 AM',
      channel: 'WHATSAPP',
    },
  ]);

  const [copiedCurl, setCopiedCurl] = useState(false);

  const presets = [
    {
      label: 'Critical Flood Inundation',
      code: 'SCH102',
      text: 'SCH102 CLOSED DAYS=4 ENGAGED=20 MATERIALS=NO',
      desc: 'Triggers RED score + auto-task for offline content packs',
    },
    {
      label: 'Short Positional Check-in',
      code: 'SCH103',
      text: 'SCH103 CLOSED 5 44 NO',
      desc: 'Positional syntax (Status, Days, Engaged, Materials)',
    },
    {
      label: 'Partial Shelter Study Circle',
      code: 'SCH104',
      text: 'SCH104 PARTIAL DAYS=2 ENGAGED=72 MATERIALS=YES',
      desc: 'Yellow continuity score, shifted to camp upper hall',
    },
    {
      label: 'Normal Re-Opened School',
      code: 'SCH101',
      text: 'SCH101 OPEN 0 265 YES',
      desc: 'Restores GREEN score (88 pts), classes functioning',
    },
    {
      label: 'Conversational Field Message',
      code: 'SCH106',
      text: 'Reporting for SCH106: School completely submerged for 6 days. Only 14 children studying on boats. No books received.',
      desc: 'Natural language regex parser handling',
    },
  ];

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add user message
    const updatedMessages = [
      ...messages,
      { sender: 'user' as const, text: userText, time: currentTime, channel },
    ];
    setMessages(updatedMessages);

    // 2. Process via Data Service
    const result = onSendMessage(userText, channel, senderPhone, senderName);

    // 3. Add system reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'system',
          text: result.parsedResult.replyMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel,
        },
      ]);
    }, 400);

    setInputMessage('');
  };

  const handleSelectPreset = (text: string) => {
    setInputMessage(text);
  };

  const curlExample = `curl -X POST https://ais-dev-sbuvcdpwc37qgg764xvsnf-757074591332.asia-east1.run.app/api/sms-webhook \\
  -H "Content-Type: application/json" \\
  -d '{"From": "${senderPhone}", "Body": "${inputMessage || 'SCH102 CLOSED 3 20 NO'}", "channel": "${channel}"}'`;

  const copyCurlToClipboard = () => {
    navigator.clipboard.writeText(curlExample);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                SMS & WhatsApp Field Check-in Simulator
              </h3>
              <p className="text-[11px] text-slate-500">
                Test how teachers & volunteers submit flood reports from 2G feature phones or WhatsApp.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split into Interactive Phone & Controls */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-100">
          {/* Left Column: Preset Scenarios & Payload Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Quick Test Scenarios (1-Click)
              </h4>
              <p className="text-xs text-slate-600 mb-3">
                Click any scenario below to load the check-in format into the message composer:
              </p>

              <div className="space-y-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPreset(preset.text)}
                    className="w-full text-left p-2.5 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all text-xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 group-hover:text-blue-700">
                        {preset.label}
                      </span>
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-sm text-slate-600">
                        {preset.code}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-blue-600 mt-1 truncate">
                      {preset.text}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {preset.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reporter Meta & Format Reference */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-xs space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Reporter Configuration
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block">Reporter Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full p-1.5 text-xs border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Phone Number</label>
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full p-1.5 text-xs border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-700 block uppercase">
                  Accepted SMS Syntaxes:
                </span>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4 mt-1 font-mono">
                  <li><code>SCH101 CLOSED DAYS=3 ENGAGED=25 MATERIALS=NO</code></li>
                  <li><code>SCH102 CLOSED 4 20 NO</code></li>
                  <li><code>SCH103 PARTIAL 2 60 YES</code></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Simulated Mobile Phone UI (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* Phone Bezel */}
            <div className="w-full max-w-sm bg-slate-900 rounded-[32px] p-3 shadow-2xl border-4 border-slate-800">
              {/* Phone Speaker & Notch */}
              <div className="flex justify-center mb-2">
                <div className="w-16 h-1 bg-slate-700 rounded-full" />
              </div>

              {/* Phone Screen Container */}
              <div className="bg-white rounded-[24px] overflow-hidden flex flex-col h-[460px] border border-slate-200">
                {/* Channel Header (WhatsApp or SMS styling) */}
                <div className={`px-4 py-2.5 flex items-center justify-between text-white ${
                  channel === 'WHATSAPP' ? 'bg-[#075E54]' : 'bg-slate-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                      FL
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">
                        FloodLearn Emergency Hub
                      </div>
                      <div className="text-[10px] text-white/80">
                        {channel === 'WHATSAPP' ? 'WhatsApp Verified Official' : 'Toll-free SMS +91-7002-FLOOD'}
                      </div>
                    </div>
                  </div>

                  {/* Channel Switcher */}
                  <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-md text-[10px]">
                    <button
                      onClick={() => setChannel('WHATSAPP')}
                      className={`px-1.5 py-0.5 rounded ${
                        channel === 'WHATSAPP' ? 'bg-white text-slate-900 font-bold' : 'text-white/80'
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setChannel('SMS')}
                      className={`px-1.5 py-0.5 rounded ${
                        channel === 'SMS' ? 'bg-white text-slate-900 font-bold' : 'text-white/80'
                      }`}
                    >
                      SMS
                    </button>
                  </div>
                </div>

                {/* Messages Scroll Area */}
                <div className={`flex-1 overflow-y-auto p-3 space-y-2.5 ${
                  channel === 'WHATSAPP' ? 'bg-[#ECE5DD]' : 'bg-slate-50'
                }`}>
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        msg.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-2.5 text-xs shadow-xs ${
                          msg.sender === 'user'
                            ? channel === 'WHATSAPP'
                              ? 'bg-[#DCF8C6] text-slate-900 rounded-tr-none'
                              : 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-900 border border-slate-200/80 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        <div
                          className={`mt-1 text-[9px] flex items-center justify-end gap-1 ${
                            msg.sender === 'user'
                              ? channel === 'WHATSAPP'
                                ? 'text-slate-500'
                                : 'text-blue-100'
                              : 'text-slate-400'
                          }`}
                        >
                          <span>{msg.time}</span>
                          {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Composer Bar */}
                <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type check-in report..."
                    className="flex-1 text-xs border border-slate-300 rounded-full px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputMessage.trim()}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors shrink-0 ${
                      channel === 'WHATSAPP'
                        ? 'bg-[#128C7E] hover:bg-[#075E54]'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } disabled:opacity-40`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Webhook cURL button */}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <button
                onClick={copyCurlToClipboard}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCurl ? 'cURL Copied!' : 'Copy cURL for POST /api/sms-webhook'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
