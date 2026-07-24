import React, { useState, useEffect, useRef } from 'react';
import { Activity, ShieldAlert, Play, Pause, Terminal, RefreshCw } from 'lucide-react';

export default function ThreatMap() {
  const [mapPaths, setMapPaths] = useState([]);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [threats, setThreats] = useState([]);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [pulseOffset, setPulseOffset] = useState(0);

  const containerRef = useRef(null);

  // Exact coordinates for Miller projection (700x400 viewBox)
  const nodes = [
    { id: 1, x: 110, y: 125, name: 'San Francisco', code: 'SFO' },
    { id: 2, x: 160, y: 120, name: 'New York', code: 'NYC' },
    { id: 3, x: 220, y: 270, name: 'São Paulo', code: 'GRU' },
    { id: 4, x: 325, y: 95, name: 'London', code: 'LHR' },
    { id: 5, x: 345, y: 98, name: 'Frankfurt', code: 'FRA' },
    { id: 6, x: 525, y: 208, name: 'Singapore', code: 'SIN' },
    { id: 7, x: 605, y: 135, name: 'Tokyo', code: 'NRT' },
    { id: 8, x: 615, y: 310, name: 'Sydney', code: 'SYD' }
  ];

  const attackTypes = [
    { name: 'DDoS Attack', severity: 'CRITICAL', color: '#ff3b30' },
    { name: 'SQL Injection', severity: 'CRITICAL', color: '#ff3b30' },
    { name: 'Phishing Alert', severity: 'WARNING', color: '#ff9500' },
    { name: 'Malicious URL', severity: 'WARNING', color: '#ff9500' },
    { name: 'Port Scan', severity: 'INFO', color: '#007aff' },
    { name: 'Brute Force Attempt', severity: 'CRITICAL', color: '#ff3b30' },
    { name: 'Ransomware Blocked', severity: 'CRITICAL', color: '#ff3b30' },
    { name: 'Credential Harvesting', severity: 'CRITICAL', color: '#ff3b30' }
  ];

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
        // Minimal fallback layout to prevent crashes if file load fails
        setMapPaths([
          { id: 'fallback-1', name: 'Americas', d: 'M 100,50 L 180,120 L 150,220 L 220,320 Z' },
          { id: 'fallback-2', name: 'Eurasia & Africa', d: 'M 300,50 L 450,80 L 580,180 L 420,280 L 320,180 Z' },
          { id: 'fallback-3', name: 'Australia', d: 'M 580,280 L 630,320 L 590,340 Z' }
        ]);
      });
  }, []);

  // Generate simulated threats
  const triggerSimulation = () => {
    const sourceIdx = Math.floor(Math.random() * nodes.length);
    let targetIdx = Math.floor(Math.random() * nodes.length);
    while (targetIdx === sourceIdx) {
      targetIdx = Math.floor(Math.random() * nodes.length);
    }

    const source = nodes[sourceIdx];
    const target = nodes[targetIdx];
    const attack = attackTypes[Math.floor(Math.random() * attackTypes.length)];
    const riskScore = Math.floor(Math.random() * 30) + (attack.severity === 'CRITICAL' ? 70 : attack.severity === 'WARNING' ? 45 : 15);
    const timestamp = new Date().toLocaleTimeString();

    const newThreat = {
      id: Date.now() + Math.random(),
      source,
      target,
      attackName: attack.name,
      severity: attack.severity,
      color: attack.color,
      riskScore,
      timestamp
    };

    // Add to active threat arcs
    setThreats(prev => [...prev, newThreat]);

    // Add to telemetry log ticker
    setTelemetryLogs(prev => [newThreat, ...prev.slice(0, 24)]);

    // Cleanup threat arc after animation completes (2 seconds)
    setTimeout(() => {
      setThreats(prev => prev.filter(t => t.id !== newThreat.id));
    }, 2000);
  };

  // Loop for simulated live threats
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      triggerSimulation();
    }, 1800);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Dashoffset flow animation loop
  useEffect(() => {
    let animFrame;
    const animate = () => {
      setPulseOffset(prev => (prev - 1.2) % 100);
      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const filteredLogs = telemetryLogs.filter(log => {
    if (filterSeverity === 'ALL') return true;
    return log.severity === filterSeverity;
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
            background: isPlaying ? '#ff3b30' : 'var(--text-muted)',
            boxShadow: isPlaying ? '0 0 10px rgba(255, 59, 48, 0.4)' : 'none',
            animation: isPlaying ? 'pulse 1.2s infinite alternate' : 'none'
          }} />
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#1e293b' }}>
              <Activity size={18} color="#0b57d0" />
              Global Threat Intelligence Center
            </h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Interactive geographic telemetry and 3D threat tracking</span>
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

          {/* Action buttons */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: '#ffffff',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            title={isPlaying ? 'Pause Feed' : 'Start Feed'}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          
          <button
            onClick={triggerSimulation}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              padding: '0 12px',
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: '#ffffff',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <RefreshCw size={12} />
            Simulate Attack
          </button>
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

            {/* 3D Attack Arc Vectors */}
            {threats.map((t) => {
              const sx = t.source.x;
              const sy = t.source.y;
              const tx = t.target.x;
              const ty = t.target.y;

              // Bezier curve calculations
              const cx = (sx + tx) / 2;
              // Arch the line upward
              const cy = Math.min(sy, ty) - Math.abs(sx - tx) * 0.28 - 25;

              const pathD = `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`;

              return (
                <g key={t.id} style={{ pointerEvents: 'none' }}>
                  {/* Glowing Core Wave */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={t.color}
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    opacity="0.9"
                    style={{
                      filter: `drop-shadow(0 0 4px ${t.color})`,
                      strokeDashoffset: pulseOffset,
                      vectorEffect: 'non-scaling-stroke'
                    }}
                  />

                  {/* Faded Background Arc */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={t.color}
                    strokeWidth="1"
                    opacity="0.25"
                  />

                  {/* Animated Attack Photon (Particle) */}
                  <circle r="4.5" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 3px #fff)' }}>
                    <animateMotion dur="1.8s" repeatCount="1" fill="freeze" path={pathD} />
                  </circle>
                </g>
              );
            })}

            {/* City Hub Markers & Labels */}
            {nodes.map((node) => {
              const isHovered = hoveredCountry === `marker-${node.id}`;
              
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
                    stroke="#0b57d0"
                    strokeWidth="1.5"
                    opacity={isHovered ? 0.9 : 0.6}
                  />

                  {/* Pulsing Core Dot */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="4"
                    fill="#0b57d0"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    style={{ filter: 'drop-shadow(0 0 3px rgba(11, 87, 208, 0.8))' }}
                  />

                  {/* Radar Pulse circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="9"
                    fill="none"
                    stroke="#0b57d0"
                    strokeWidth="1"
                    opacity={isHovered ? 0.8 : 0.4}
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
                      fill={isHovered ? '#0b57d0' : '#ffffff'}
                      stroke={isHovered ? '#0b57d0' : '#cbd5e1'}
                      strokeWidth="1"
                      style={{ transition: 'fill 0.2s, stroke 0.2s', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }}
                    />
                    <text
                      textAnchor="middle"
                      y="3"
                      fill={isHovered ? '#ffffff' : '#334155'}
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

          {/* Floating Tooltip overlay for hovered cities */}
          {nodes.map((node) => {
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
                <div style={{ fontWeight: 800, color: '#0b57d0', textTransform: 'uppercase', marginBottom: 2 }}>{node.name} Hub</div>
                <div style={{ color: 'var(--text-secondary)' }}>Status: <span style={{ color: '#146c2e', fontWeight: 700 }}>ONLINE</span></div>
                <div style={{ color: 'var(--text-secondary)' }}>Telemetry: <span style={{ color: '#1e293b', fontWeight: 600 }}>Active</span></div>
              </div>
            );
          })}

          {/* Floating Tooltip overlay for hovered countries */}
          {mapPaths.map((path) => {
            const isHovered = hoveredCountry === path.id;
            // Only show tooltip if it is a real country path (i.e. length of id is 2, like US, BR, JP)
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
                Country: <span style={{ color: '#0b57d0' }}>{path.name} ({path.id})</span>
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
          <div style={{ position: 'absolute', left: 15, top: 15, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(11, 87, 208, 0.5)', fontWeight: 600 }}>
            MAP_PROJ: //MILLER_MEDIUM
          </div>
          <div style={{ position: 'absolute', right: 15, bottom: 15, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(11, 87, 208, 0.5)', fontWeight: 600 }}>
            GRID SEC: M-12 // STATIC
          </div>
        </div>

        {/* Right Side: Real-Time Telemetry Terminal Feed (Light Theme) */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
            <Terminal size={14} color="#0b57d0" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#1e293b' }}>REALTIME TELEMETRY LOG</span>
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 8 }}>
                <ShieldAlert size={20} opacity={0.4} />
                <span>Monitoring grid...</span>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    background: log.severity === 'CRITICAL' ? 'rgba(255, 59, 48, 0.04)' : 'rgba(255, 149, 0, 0.04)',
                    borderLeft: `3px solid ${log.color}`,
                    animation: 'revealUp 0.25s ease-out',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>[{log.timestamp}]</span>
                    <span style={{
                      color: log.color,
                      fontSize: 8,
                      fontWeight: 800,
                      background: log.color + '12',
                      padding: '1px 4px',
                      borderRadius: 4
                    }}>{log.severity}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{log.attackName}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
                    {log.source.code} &rarr; {log.target.code} (Conf: {log.riskScore}%)
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
