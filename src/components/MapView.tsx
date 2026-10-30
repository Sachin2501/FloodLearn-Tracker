import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { School, ScoreColor } from '../types';
import { Layers, MapPin, Eye, PlusCircle, ShieldAlert, AlertCircle, CheckCircle } from 'lucide-react';

interface MapViewProps {
  schools: School[];
  selectedSchool: School | null;
  onSelectSchool: (school: School) => void;
  onOpenSmsModal: (schoolCode?: string) => void;
  onCreateTaskForSchool?: (school: School) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  schools,
  selectedSchool,
  onSelectSchool,
  onOpenSmsModal,
  onCreateTaskForSchool,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [colorFilter, setColorFilter] = useState<'ALL' | ScoreColor>('ALL');
  const [showFloodOverlay, setShowFloodOverlay] = useState<boolean>(true);
  const floodPolygonRef = useRef<L.Polygon | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered at Morigaon District / Brahmaputra basin, Assam
    const map = L.map(mapContainerRef.current, {
      center: [26.305, 92.26],
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    // Simulated Brahmaputra River Flood Inundation Buffer Zone
    const floodCoordinates: [number, number][] = [
      [26.395, 92.010],
      [26.420, 92.200],
      [26.435, 92.380],
      [26.370, 92.480],
      [26.315, 92.450],
      [26.310, 92.310],
      [26.270, 92.140],
      [26.260, 92.020],
    ];

    floodPolygonRef.current = L.polygon(floodCoordinates, {
      color: '#0284c7',
      weight: 2,
      fillColor: '#38bdf8',
      fillOpacity: 0.18,
      dashArray: '4, 6',
    }).addTo(map);

    floodPolygonRef.current.bindTooltip(
      'Brahmaputra River Active Flood & Erosion Inundation Zone',
      { sticky: true, className: 'text-xs font-semibold' }
    );

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when schools, filter, or selection changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = schools.filter((s) => {
      if (colorFilter === 'ALL') return true;
      return s.latestScoreColor === colorFilter;
    });

    filtered.forEach((school) => {
      const isSelected = selectedSchool?.id === school.id;
      
      // Marker color
      const colorBg = 
        school.latestScoreColor === 'RED' ? '#e11d48' : 
        school.latestScoreColor === 'YELLOW' ? '#d97706' : '#16a34a';

      const ringColor = 
        school.latestScoreColor === 'RED' ? 'rgba(225, 29, 72, 0.4)' : 
        school.latestScoreColor === 'YELLOW' ? 'rgba(217, 119, 6, 0.3)' : 'rgba(22, 163, 74, 0.3)';

      const markerHtml = `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          ${school.latestScoreColor === 'RED' ? `
            <div style="
              position: absolute;
              width: 44px;
              height: 44px;
              border-radius: 9999px;
              background-color: ${ringColor};
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
          ` : ''}
          <div style="
            width: ${isSelected ? '32px' : '26px'};
            height: ${isSelected ? '32px' : '26px'};
            background-color: ${colorBg};
            border: ${isSelected ? '3px solid #ffffff' : '2px solid #ffffff'};
            border-radius: 9999px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            font-family: monospace;
          ">
            ${school.latestScoreValue}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-school-marker',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([school.lat, school.lng], { icon: customIcon });

      // Popup Content
      const popupHtml = `
        <div style="min-width: 220px; font-family: system-ui, sans-serif; font-size: 12px; color: #1e293b; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <span style="font-weight: 700; font-size: 13px; color: #0f172a;">${school.name}</span>
            <span style="font-family: monospace; font-size: 11px; background: #f1f5f9; padding: 1px 4px; border-radius: 4px;">${school.code}</span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            ${school.village} · ${school.cluster}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px; background: #f8fafc; padding: 6px; border-radius: 6px;">
            <div>
              <span style="color: #64748b; font-size: 10px; display: block;">Status</span>
              <strong style="color: ${school.latestStatus === 'CLOSED' ? '#e11d48' : school.latestStatus === 'PARTIALLY_OPEN' ? '#d97706' : '#16a34a'}">
                ${school.latestStatus} (${school.daysClosed}d)
              </strong>
            </div>
            <div>
              <span style="color: #64748b; font-size: 10px; display: block;">Continuity Score</span>
              <strong style="font-family: monospace; color: ${colorBg}">${school.latestScoreValue} / 100 (${school.latestScoreColor})</strong>
            </div>
            <div>
              <span style="color: #64748b; font-size: 10px; display: block;">Engaged Kids</span>
              <strong style="font-family: monospace;">${school.studentsEngaged} / ${school.totalStudents} (${school.engagementPercent}%)</strong>
            </div>
            <div>
              <span style="color: #64748b; font-size: 10px; display: block;">Materials Sent</span>
              <strong>${school.materialsDelivered ? 'YES' : 'NO'}</strong>
            </div>
          </div>

          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
            <strong>Officer:</strong> ${school.assignedOfficialName} (${school.assignedOfficialPhone})
          </div>

          ${school.notes ? `<div style="font-size: 11px; color: #64748b; font-style: italic; margin-bottom: 8px;">"${school.notes}"</div>` : ''}

          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <button id="btn-popup-inspect-${school.id}" style="flex: 1; padding: 4px 8px; background: #0f172a; color: #ffffff; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;">
              View Details
            </button>
            <button id="btn-popup-sms-${school.id}" style="padding: 4px 8px; background: #2563eb; color: #ffffff; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
              Check-in
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectSchool(school);
        setTimeout(() => {
          const inspectBtn = document.getElementById(`btn-popup-inspect-${school.id}`);
          if (inspectBtn) {
            inspectBtn.onclick = () => onSelectSchool(school);
          }
          const smsBtn = document.getElementById(`btn-popup-sms-${school.id}`);
          if (smsBtn) {
            smsBtn.onclick = () => onOpenSmsModal(school.code);
          }
        }, 50);
      });

      marker.addTo(markersLayerRef.current!);
    });

    // If a school is selected, center on it
    if (selectedSchool && mapInstanceRef.current) {
      mapInstanceRef.current.setView([selectedSchool.lat, selectedSchool.lng], 13);
    }
  }, [schools, colorFilter, selectedSchool]);

  // Toggle Flood overlay
  useEffect(() => {
    if (!mapInstanceRef.current || !floodPolygonRef.current) return;
    if (showFloodOverlay) {
      if (!mapInstanceRef.current.hasLayer(floodPolygonRef.current)) {
        floodPolygonRef.current.addTo(mapInstanceRef.current);
      }
    } else {
      if (mapInstanceRef.current.hasLayer(floodPolygonRef.current)) {
        mapInstanceRef.current.removeLayer(floodPolygonRef.current);
      }
    }
  }, [showFloodOverlay]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-180px)] min-h-[580px]">
      {/* Map View Area */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden relative flex flex-col shadow-xs">
        {/* Floating Controls Bar */}
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-1.5 shadow-md flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-700 px-2">Filter Pins:</span>
          
          <button
            onClick={() => setColorFilter('ALL')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              colorFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({schools.length})
          </button>

          <button
            onClick={() => setColorFilter('RED')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
              colorFilter === 'RED'
                ? 'bg-rose-600 text-white'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            Critical Red ({schools.filter((s) => s.latestScoreColor === 'RED').length})
          </button>

          <button
            onClick={() => setColorFilter('YELLOW')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
              colorFilter === 'YELLOW'
                ? 'bg-amber-600 text-white'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            At-Risk Yellow ({schools.filter((s) => s.latestScoreColor === 'YELLOW').length})
          </button>

          <button
            onClick={() => setColorFilter('GREEN')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
              colorFilter === 'GREEN'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            Green ({schools.filter((s) => s.latestScoreColor === 'GREEN').length})
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          <button
            onClick={() => setShowFloodOverlay(!showFloodOverlay)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
              showFloodOverlay
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3 h-3 text-blue-600" />
            Flood Inundation Layer
          </button>
        </div>

        {/* Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Legend Overlay at bottom */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs text-slate-700 flex items-center gap-4">
          <span className="font-semibold text-slate-900">Scorecard Map Key:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
            <span>Green (&ge;65, Active Learning)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span>Yellow (35-64, At Risk)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" />
            <span>Red (&lt;35, Inundated / Interrupted)</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-700">
            <span className="w-3 h-3 border border-dashed border-blue-500 bg-blue-200/50 inline-block" />
            <span>Brahmaputra Flood Plain Buffer</span>
          </div>
        </div>
      </div>

      {/* Side Details Drawer */}
      <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-xl p-4 flex flex-col shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          {selectedSchool ? 'Selected School Focus' : 'Flood Zone Overview'}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Click any pin on the map to inspect status, pending tasks, or log check-ins.
        </p>

        {selectedSchool ? (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600">
                      {selectedSchool.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedSchool.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {selectedSchool.village} · {selectedSchool.block}
                    </p>
                  </div>
                  <div
                    className={`px-2 py-0.5 text-xs font-bold rounded-sm ${
                      selectedSchool.latestScoreColor === 'RED'
                        ? 'bg-rose-100 text-rose-800'
                        : selectedSchool.latestScoreColor === 'YELLOW'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedSchool.latestScoreColor} ({selectedSchool.latestScoreValue})
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-slate-200 pt-2 font-mono tabular-nums">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans">STATUS</span>
                    <span className="font-semibold text-slate-800">{selectedSchool.latestStatus}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans">DAYS CLOSED</span>
                    <span className="font-semibold text-slate-800">{selectedSchool.daysClosed} days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans">ENGAGED STUDENTS</span>
                    <span className="font-semibold text-slate-800">
                      {selectedSchool.studentsEngaged} / {selectedSchool.totalStudents} ({selectedSchool.engagementPercent}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans">MATERIALS SENT</span>
                    <span className="font-semibold text-slate-800">
                      {selectedSchool.materialsDelivered ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg p-3">
                <div className="font-semibold text-slate-900">Responsible Official:</div>
                <div className="font-medium text-slate-800">{selectedSchool.assignedOfficialName}</div>
                <div className="text-slate-500">{selectedSchool.assignedOfficialRole}</div>
                <div className="font-mono text-slate-700">{selectedSchool.assignedOfficialPhone}</div>
              </div>

              {selectedSchool.notes && (
                <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-600 italic">
                  "{selectedSchool.notes}"
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => onOpenSmsModal(selectedSchool.code)}
                className="w-full py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Simulate Report for {selectedSchool.code}</span>
              </button>
              {onCreateTaskForSchool && (
                <button
                  onClick={() => onCreateTaskForSchool(selectedSchool)}
                  className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Create Manual Relief Task</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-lg text-xs text-blue-900">
                <strong>Flood Plain Alert:</strong> Morigaon District experiences severe waterlogging along the Laharighat and Bhuragaon river bank. Red markers indicate schools submerged &gt;3 days or with &lt;30% learning access.
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Priority Action List
                </span>
                {schools
                  .filter((s) => s.latestScoreColor === 'RED')
                  .slice(0, 4)
                  .map((school) => (
                    <div
                      key={school.id}
                      onClick={() => onSelectSchool(school)}
                      className="p-2 border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 rounded-md cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-rose-950">
                        <span>{school.name}</span>
                        <span className="font-mono">{school.latestScoreValue}</span>
                      </div>
                      <div className="text-[11px] text-rose-800 mt-0.5">
                        Closed {school.daysClosed}d · {school.studentsEngaged} kids active · Materials: {school.materialsDelivered ? 'YES' : 'NO'}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <button
              onClick={() => onOpenSmsModal()}
              className="mt-4 w-full py-2 px-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Simulate Any School Check-in</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
