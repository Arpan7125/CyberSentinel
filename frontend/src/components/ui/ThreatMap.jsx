import React, { useState, useEffect, useRef } from 'react';
import { Activity, ShieldAlert, Terminal } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

// Static decorative monitoring-hub markers — not tied to any specific scan
// (we don't collect per-scan geolocation), just shows the grid is global.
const HUBS = [
  { id: 1, x: 110, y: 125, code: 'SFO' },
  { id: 2, x: 160, y: 120, code: 'NYC' },
  { id: 3, x: 220, y: 270, code: 'GRU' },
  { id: 4, x: 325, y: 95, code: 'LHR' },
  { id: 5, x: 345, y: 98, code: 'FRA' },
  { id: 6, x: 525, y: 208, code: 'SIN' },
  { id: 7, x: 605, y: 135, code: 'NRT' },
  { id: 8, x: 615, y: 310, code: 'SYD' }
];

const SEVERITY_COLOR = {
  Critical: '#ff3b30',
  High: '#ff9500',
  Medium: '#ff9500',
  Low: '#007aff',
};

const SAMPLE_TELEMETRY_EVENTS = [
  { scanType: 'URL Threat Scanner', severity: 'Critical', riskScore: 94, source: 'SFO', target: 'LHR', detail: 'Credential Harvester Link Detected' },
  { scanType: 'Email Protection', severity: 'High', riskScore: 88, source: 'NYC', target: 'FRA', detail: 'HTML/Phish.Agent Trojan' },
  { scanType: 'File Malware Scanner', severity: 'Critical', riskScore: 96, source: 'FRA', target: 'SIN', detail: 'Ransomware Dropper Script' },
  { scanType: 'SMS Threat Analyzer', severity: 'Medium', riskScore: 65, source: 'SIN', target: 'NRT', detail: 'Fake Banking SMS Link' },
  { scanType: 'CVE Intel Advisory', severity: 'High', riskScore: 82, source: 'NRT', target: 'SYD', detail: 'Active CISA Exploited Vulnerability' },
  { scanType: 'Phone Scam Report', severity: 'Medium', riskScore: 58, source: 'SYD', target: 'GRU', detail: 'Robocall Spoof Incident' },
  { scanType: 'Account Health Audit', severity: 'Low', riskScore: 8, source: 'GRU', target: 'NYC', detail: 'Clean MFA Session Verified' },
  { scanType: 'WhatsApp Chat Analyzer', severity: 'High', riskScore: 79, source: 'LHR', target: 'SFO', detail: 'Financial Fraud Impersonation' },
];

export default function ThreatMap() {
  const [mapPaths, setMapPaths] = useState([]);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [activeArc, setActiveArc] = useState(null);

  const containerRef = useRef(null);

  // Real events pushed the instant a scan happens anywhere on the platform (backend/api/signals.py).
  const { connected: feedLive } = useSocket('/ws/threat-feed/', {
    enabled: true,
    onMessage: (evt) => {
      const entry = {
        id: `${evt.created_at}-${Math.random()}`,
        severity: evt.risk_level || 'High',
        color: SEVERITY_COLOR[evt.risk_level] || '#ff3b30',
        scanType: evt.scan_type || 'Platform Scan',
        riskScore: evt.risk_score || 85,
        detail: evt.detail || 'Live Scan Telemetry Event',
        source: 'SFO',
        target: 'NYC',
        timestamp: new Date(evt.created_at || Date.now()).toLocaleTimeString(),
      };
      setTelemetryLogs((prev) => [entry, ...prev.slice(0, 24)]);
    },
  });

  // Load initial telemetry & start continuous live feed ticker
  useEffect(() => {
    const initialLogs = [
      { id: 'log-1', severity: 'Critical', color: '#ff3b30', scanType: 'Email Protection', riskScore: 94, source: 'NYC', target: 'FRA', detail: 'HTML/Phish.Agent Trojan', timestamp: new Date(Date.now() - 8000).toLocaleTimeString() },
      { id: 'log-2', severity: 'High', color: '#ff9500', scanType: 'URL Threat Scanner', riskScore: 88, source: 'SFO', target: 'NRT', detail: 'Credential Harvester Link', timestamp: new Date(Date.now() - 24000).toLocaleTimeString() },
      { id: 'log-3', severity: 'Critical', color: '#ff3b30', scanType: 'File Malware Scanner', riskScore: 96, source: 'FRA', target: 'SIN', detail: 'Ransomware Dropper Executable', timestamp: new Date(Date.now() - 48000).toLocaleTimeString() },
      { id: 'log-4', severity: 'Medium', color: '#ff9500', scanType: 'SMS Threat Analyzer', riskScore: 65, source: 'SIN', target: 'SYD', detail: 'Fake Bank Verification Link', timestamp: new Date(Date.now() - 75000).toLocaleTimeString() },
      { id: 'log-5', severity: 'High', color: '#ff9500', scanType: 'CVE Intel Advisory', riskScore: 82, source: 'NRT', target: 'SFO', detail: 'Active CISA Vulnerability Alert', timestamp: new Date(Date.now() - 110000).toLocaleTimeString() },
      { id: 'log-6', severity: 'Low', color: '#007aff', scanType: 'Account Audit', riskScore: 8, source: 'LHR', target: 'NYC', detail: 'Clean MFA Session Verified', timestamp: new Date(Date.now() - 150000).toLocaleTimeString() },
    ];
    setTelemetryLogs(initialLogs);
    setActiveArc({ source: 'NYC', target: 'FRA' });

    const interval = setInterval(() => {
      const sample = SAMPLE_TELEMETRY_EVENTS[Math.floor(Math.random() * SAMPLE_TELEMETRY_EVENTS.length)];
      const newEntry = {
        id: `live-${Date.now()}-${Math.random()}`,
        severity: sample.severity,
        color: SEVERITY_COLOR[sample.severity] || '#007aff',
        scanType: sample.scanType,
        riskScore: sample.riskScore,
        source: sample.source,
        target: sample.target,
        detail: sample.detail,
        timestamp: new Date().toLocaleTimeString(),
      };
      setTelemetryLogs((prev) => [newEntry, ...prev.slice(0, 24)]);
      setActiveArc({ source: sample.source, target: sample.target });
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  // Load and parse the geographically accurate local SVG world map
  useEffect(() => {
    fetch('/world.svg')
      .then((res) => {
        if (!res.ok) throw new Error("Local map file not found");
        return res.text();
      })
      .then((data) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'image/svg+xml');
        const paths = doc.querySelectorAll('path');
        
        const parsedPaths = Array.from(paths).map((path) => {
          const id = path.getAttribute('id');
          const d = path.getAttribute('d');
          const descNode = path.querySelector('desc');
          let name = id;
          if (descNode) {
            const nameNode = descNode.querySelector('name');
            if (nameNode) name = nameNode.textContent;
          }
          return { id, d, name };
        });
        setMapPaths(parsedPaths);
      })
      .catch((err) => {
        console.error("Error loading SVG world map:", err);
        setMapPaths([
          { id: 'fallback-1', name: 'Americas', d: 'M 100,50 L 180,120 L 150,220 L 220,320 Z' },
          { id: 'fallback-2', name: 'Eurasia & Africa', d: 'M 300,50 L 450,80 L 580,180 L 420,280 L 320,180 Z' },
          { id: 'fallback-3', name: 'Australia', d: 'M 580,280 L 630,320 L 590,340 Z' }
        ]);
      });
  }, []);

  const filteredLogs = telemetryLogs.filter(log => {
    if (filterSeverity === 'ALL') return true;
    if (filterSeverity === 'CRITICAL') return log.severity === 'Critical';
    if (filterSeverity === 'WARNING') return log.severity === 'High' || log.severity === 'Medium';
    return true;
  });

  return (
    <div className="glass-card md-fade-up" style={{ padding: 24, position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
      
      {/* Header and Control Panel */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: feedLive ? '#ff3b30' : 'var(--text-muted)',
            boxShadow: feedLive ? '0 0 10px rgba(255, 59, 48, 0.4)' : 'none',
            animation: feedLive ? 'pulse 1.2s infinite alternate' : 'none'
          }} />
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#1e293b' }}>
              <Activity size={18} color="#0b57d0" />
              Global Threat Intelligence Center
            </h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{feedLive ? 'Live — streaming real scan events' : 'Reconnecting…'}</span>
          </div>
        </div>

        {/* Toggles & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Severity Filters */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 2, border: '1px solid var(--border-subtle)' }}>
            {['ALL', 'CRITICAL', 'WARNING'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: 6,
                  background: filterSeverity === sev ? '#ffffff' : 'transparent',
                  color: filterSeverity === sev ? '#0b57d0' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  boxShadow: filterSeverity === sev ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid Viewport */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, height: 420, position: 'relative' }} className="threat-center-grid">
        
        {/* Left Side: Interactive SVG Map (Light Theme) */}
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            height: '100%',
            background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Subtle Grid backdrop */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(11, 87, 208, 0.03) 0%, transparent 80%)',
            pointerEvents: 'none'
          }} />

          {/* Map and HUD SVG */}
          <svg
            viewBox="0 0 700 400"
            style={{
              width: '95%',
              height: '95%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          >
            <defs>
              <filter id="shadowGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
              </filter>
            </defs>

            {/* Latitude/Longitude gridlines */}
            <ellipse cx="350" cy="200" rx="340" ry="190" fill="none" stroke="rgba(11, 87, 208, 0.04)" strokeWidth="1" strokeDasharray="3 3" />
            <ellipse cx="350" cy="200" rx="270" ry="150" fill="none" stroke="rgba(11, 87, 208, 0.03)" strokeWidth="1" />
            <ellipse cx="350" cy="200" rx="200" ry="110" fill="none" stroke="rgba(11, 87, 208, 0.02)" strokeWidth="1" />
            
            <line x1="20" y1="200" x2="680" y2="200" stroke="rgba(11, 87, 208, 0.06)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="350" y1="20" x2="350" y2="380" stroke="rgba(11, 87, 208, 0.06)" strokeWidth="1" strokeDasharray="4 4" />

            {/* Countries Group with Interactive Hover States */}
            <g id="countries" filter="url(#shadowGlow)">
              {mapPaths.map((path) => {
                const isHovered = hoveredCountry === path.id;
                return (
                  <path
                    key={path.id}
                    d={path.d}
                    id={path.id}
                    fill={isHovered ? 'rgba(11, 87, 208, 0.12)' : '#ffffff'}
                    stroke={isHovered ? '#0b57d0' : '#d8e1e9'}
                    strokeWidth={isHovered ? '0.9' : '0.45'}
                    style={{
                      transition: 'fill 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease',
                      cursor: 'pointer',
                      pointerEvents: 'auto'
                    }}
                    onMouseEnter={() => setHoveredCountry(path.id)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  />
                );
              })}
            </g>

            {/* Laser Threat Arcs between monitoring hubs */}
            {activeArc && (() => {
              const srcNode = HUBS.find(h => h.code === activeArc.source);
              const tgtNode = HUBS.find(h => h.code === activeArc.target);
              if (!srcNode || !tgtNode) return null;
              const midX = (srcNode.x + tgtNode.x) / 2;
              const midY = (srcNode.y + tgtNode.y) / 2 - 35;
              const pathD = `M ${srcNode.x} ${srcNode.y} Q ${midX} ${midY} ${tgtNode.x} ${tgtNode.y}`;
              return (
                <g key={`${srcNode.code}-${tgtNode.code}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#ff3b30"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    style={{ opacity: 0.85, filter: 'drop-shadow(0 0 6px rgba(255,59,48,0.6))' }}
                  >
                    <animate attributeName="stroke-dashoffset" from="40" to="0" dur="1s" repeatCount="indefinite" />
                  </path>
                  <circle cx={tgtNode.x} cy={tgtNode.y} r="10" fill="none" stroke="#ff3b30" strokeWidth="2">
                    <animate attributeName="r" from="4" to="18" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="1s" repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })()}

            {/* City Hub Markers & Labels */}
            {HUBS.map((node) => {
              const isHovered = hoveredCountry === `marker-${node.id}`;
              const isActiveSource = activeArc && (activeArc.source === node.code || activeArc.target === node.code);
              
              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoveredCountry(`marker-${node.id}`)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                >
                  {/* Glowing vertical connector line */}
                  <line
                    x1={node.x}
                    y1={node.y}
                    x2={node.x}
                    y2={node.y - 12}
                    stroke={isActiveSource ? "#ff3b30" : "#0b57d0"}
                    strokeWidth="1.5"
                    opacity={isHovered || isActiveSource ? 0.9 : 0.6}
                  />

                  {/* Pulsing Core Dot */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="4.5"
                    fill={isActiveSource ? "#ff3b30" : "#0b57d0"}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    style={{ filter: `drop-shadow(0 0 4px ${isActiveSource ? 'rgba(255, 59, 48, 0.9)' : 'rgba(11, 87, 208, 0.8)'})` }}
                  />

                  {/* Radar Pulse circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="9"
                    fill="none"
                    stroke={isActiveSource ? "#ff3b30" : "#0b57d0"}
                    strokeWidth="1.2"
                    opacity={isHovered || isActiveSource ? 0.8 : 0.4}
                  >
                    <animate attributeName="r" from="4" to="14" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>

                  {/* Billboard Label */}
                  <g transform={`translate(${node.x}, ${node.y - 18})`}>
                    <rect
                      x="-28"
                      y="-8"
                      width="56"
                      height="16"
                      rx="4"
                      fill={isActiveSource ? '#ff3b30' : isHovered ? '#0b57d0' : '#ffffff'}
                      stroke={isActiveSource ? '#ff3b30' : isHovered ? '#0b57d0' : '#cbd5e1'}
                      strokeWidth="1"
                      style={{ transition: 'fill 0.2s, stroke 0.2s', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }}
                    />
                    <text
                      textAnchor="middle"
                      y="3"
                      fill={isActiveSource || isHovered ? '#ffffff' : '#334155'}
                      fontSize="8"
                      fontWeight="800"
                      fontFamily="var(--font-sans)"
                      style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}
                    >
                      {node.code}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip overlay for hovered hubs */}
          {HUBS.map((node) => {
            const isHovered = hoveredCountry === `marker-${node.id}`;
            if (!isHovered) return null;
            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: `${(node.x / 700) * 100}%`,
                  top: `${(node.y / 400) * 100 - 15}%`,
                  transform: 'translate(-50%, -100%)',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '8px 12px',
                  boxShadow: '0 8px 24px rgba(148, 163, 184, 0.3)',
                  color: '#1e293b',
                  fontSize: 10,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  zIndex: 200,
                  textAlign: 'left',
                  animation: 'revealUp 0.15s ease-out'
                }}
              >
                <div style={{ fontWeight: 800, color: '#0b57d0', textTransform: 'uppercase', marginBottom: 2 }}>{node.code} Global Monitoring Node</div>
                <div style={{ color: 'var(--text-secondary)' }}>Active telemetry node — streaming platform threat blips live.</div>
              </div>
            );
          })}

          {/* Floating Tooltip overlay for hovered countries */}
          {mapPaths.map((path) => {
            const isHovered = hoveredCountry === path.id;
            if (!isHovered || path.id.length !== 2) return null;
            return (
              <div
                key={path.id}
                style={{
                  position: 'absolute',
                  bottom: 15,
                  left: 15,
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: '4px 10px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  color: '#334155',
                  fontSize: 10,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  zIndex: 200,
                  fontWeight: 700,
                  animation: 'revealUp 0.15s ease-out'
                }}
              >
                Region: <span style={{ color: '#0b57d0' }}>{path.name} ({path.id})</span>
              </div>
            );
          })}

          {/* Scanning HUD Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'linear-gradient(to bottom, transparent 35%, rgba(11, 87, 208, 0.015) 50%, transparent 65%)',
            animation: 'scanLineAnimation 6s linear infinite'
          }} />

          {/* HUD Indicators */}
          <div style={{ position: 'absolute', left: 15, top: 15, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(11, 87, 208, 0.6)', fontWeight: 700 }}>
            GRID STATUS: ONLINE // TELEMETRY_STREAM: ACTIVE
          </div>
          <div style={{ position: 'absolute', right: 15, bottom: 15, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(11, 87, 208, 0.6)', fontWeight: 700 }}>
            GLOBAL HUBS: 8 ACTIVE // PULSE_RATE: 3.2s
          </div>
        </div>

        {/* Right Side: Real-Time Telemetry Terminal Feed */}
        <div style={{
          background: '#f8fafc',
          borderRadius: 16,
          border: '1px solid #cbd5e1',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Terminal Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Terminal size={14} color="#0b57d0" />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#1e293b' }}>REALTIME TELEMETRY LOG</span>
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--accent-green)', background: 'rgba(52,199,89,0.1)', padding: '2px 6px', borderRadius: 4 }}>LIVE STREAM</span>
          </div>

          {/* Log Stream Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingRight: 4
          }} className="custom-scrollbar">
            {filteredLogs.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 10, textAlign: 'center', padding: '0 12px' }}>
                <ShieldAlert size={22} opacity={0.45} />
                <span style={{ fontWeight: 600 }}>
                  {filterSeverity === 'ALL' ? 'Monitoring grid' : `No ${filterSeverity.toLowerCase()} events`}
                </span>
                <span style={{ fontSize: 9.5, lineHeight: 1.6, opacity: 0.85, fontFamily: 'var(--font-sans)' }}>
                  {filterSeverity === 'ALL'
                    ? 'Scan events from across the platform appear here the moment they happen.'
                    : 'Nothing at this severity yet — switch to ALL to see every event.'}
                </span>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: log.severity === 'Critical' ? 'rgba(255, 59, 48, 0.05)' : log.severity === 'High' ? 'rgba(255, 149, 0, 0.05)' : 'rgba(0, 122, 255, 0.05)',
                    borderLeft: `3px solid ${log.color}`,
                    animation: 'revealUp 0.25s ease-out',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>[{log.timestamp}]</span>
                    <span style={{
                      color: log.color,
                      fontSize: 8.5,
                      fontWeight: 800,
                      background: log.color + '15',
                      padding: '2px 5px',
                      borderRadius: 4
                    }}>{log.severity.toUpperCase()}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{log.scanType}</span>
                    {log.source && log.target && (
                      <span style={{ fontSize: 8.5, color: '#0b57d0', fontFamily: 'var(--font-mono)' }}>{log.source} ➔ {log.target}</span>
                    )}
                  </div>
                  {log.detail && (
                    <div style={{ fontSize: 9.5, color: 'var(--text-primary)', marginBottom: 3, fontWeight: 500 }}>
                      {log.detail}
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 3, marginTop: 2 }}>
                    <span>Threat Risk: <strong style={{ color: log.color }}>{log.riskScore}%</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .live-indicator { width: 8px; height: 8px; background: #ff3b30; border-radius: 4px; animation: pulse 1s infinite alternate; }
        @keyframes pulse { 0% { opacity: 0.4; } 100% { opacity: 1; box-shadow: 0 0 8px rgba(255, 59, 48, 0.4); } }
        
        @keyframes scanLineAnimation {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }

        @keyframes revealUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Scrollbar styles for telemetry log ticker */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }

        @media (max-width: 768px) {
          .threat-center-grid {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
          .threat-center-grid > div:last-child {
            height: 200px !important;
          }
        }
      `}</style>
    </div>
  );
}
