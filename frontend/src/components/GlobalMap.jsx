import React, { useState, useEffect } from 'react';

// Threat hotspots: [x%, y%, label, count, severity]
const THREAT_HOTSPOTS = [
  { x: 22, y: 28, label: 'North America', count: 1243, color: '#FF5A1F' },
  { x: 48, y: 24, label: 'Western Europe', count: 987, color: '#FF5A1F' },
  { x: 56, y: 26, label: 'Eastern Europe', count: 743, color: '#FF9E79' },
  { x: 77, y: 30, label: 'East Asia', count: 1102, color: '#FF5A1F' },
  { x: 28, y: 65, label: 'South America', count: 445, color: '#FBBF24' },
  { x: 48, y: 55, label: 'Africa', count: 321, color: '#FBBF24' },
  { x: 67, y: 44, label: 'South Asia', count: 876, color: '#FF9E79' },
  { x: 80, y: 70, label: 'Australia', count: 234, color: '#3EB649' },
  { x: 60, y: 38, label: 'Middle East', count: 521, color: '#FF9E79' },
];

// Attack lines from source to targets
const ATTACK_LINES = [
  { x1: 22, y1: 28, x2: 48, y2: 24 },
  { x1: 77, y1: 30, x2: 48, y2: 24 },
  { x1: 56, y1: 26, x2: 48, y2: 24 },
  { x1: 67, y1: 44, x2: 77, y2: 30 },
  { x1: 22, y1: 28, x2: 28, y2: 65 },
  { x1: 60, y1: 38, x2: 48, y2: 55 },
];

function PulseMarker({ x, y, color, size = 6 }) {
  return (
    <g>
      {/* Outer concentric pulse ring */}
      <circle cx={x} cy={y} r={size * 2} fill="none" stroke={color} strokeWidth="1.5" opacity="0.4">
        <animate attributeName="r" from={size} to={size * 5} dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Core solid dot */}
      <circle cx={x} cy={y} r={size} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r={2} fill="#FFFFFF" />
    </g>
  );
}

function AttackLine({ x1pct, y1pct, x2pct, y2pct, viewWidth, viewHeight, delay = 0 }) {
  const x1 = (x1pct / 100) * viewWidth;
  const y1 = (y1pct / 100) * viewHeight;
  const x2 = (x2pct / 100) * viewWidth;
  const y2 = (y2pct / 100) * viewHeight;
  
  // Create a curve for the attack line (simulating 3D globe curve)
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - 80; // Control point arches upwards
  
  const id = `line-${x1pct}-${y1pct}-${x2pct}-${y2pct}`;
  const pathD = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;

  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent-orange)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--accent-orange)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--accent-orange)" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      <path d={pathD} fill="none" stroke={`url(#${id})`} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
      
      {/* Moving signal particle */}
      <circle r="3.5" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 5px #FFF)' }}>
        <animateMotion dur={`${2.5 + delay}s`} repeatCount="indefinite" begin={`${delay}s`}>
          <mpath href={`#path-${id}`} />
        </animateMotion>
      </circle>
      <path id={`path-${id}`} d={pathD} fill="none" />
    </g>
  );
}

export default function GlobalMap({ height = 400 }) {
  const [tooltip, setTooltip] = useState(null);
  const [liveCount, setLiveCount] = useState(0);
  const VW = 1000;
  const VH = 500;

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount(c => c + Math.floor(Math.random() * 4));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {/* Live threat counters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-orange)',
            boxShadow: '0 0 10px var(--accent-orange)',
            animation: 'pulseGlow 1.5s infinite',
          }} />
          <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            GLOBAL TELEMETRY
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>
            THREATS ENCOUNTERED: <span className="mono-display" style={{ color: 'var(--accent-orange)', fontWeight: 900 }}>{(126234 + liveCount).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { color: '#FF5A1F', label: 'CRITICAL' }, 
              { color: '#FBBF24', label: 'WARNING' }, 
              { color: '#3EB649', label: 'SAFE' }
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: l.color }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.04em' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map container - 3D Sphere Illusion */}
      <div
        className="threat-map-container"
        style={{ 
          height, 
          position: 'relative', 
          overflow: 'hidden',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.1)'
        }}
        onMouseLeave={() => setTooltip(null)}
      >
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ width: '100%', height: '100%', maxWidth: '900px' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* 3D Sphere Gradients */}
            <radialGradient id="sphere-glow" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="rgba(0, 122, 255, 0.15)" />
              <stop offset="70%" stopColor="rgba(0, 122, 255, 0.03)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0.2)" />
            </radialGradient>
            
            <radialGradient id="ocean-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(5, 10, 24, 0.1)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0.5)" />
            </radialGradient>
          </defs>

          {/* Spherical Base */}
          <circle cx={VW / 2} cy={VH / 2} r={VH / 2.1} fill="url(#ocean-bg)" />
          <circle cx={VW / 2} cy={VH / 2} r={VH / 2.1} fill="url(#sphere-glow)" stroke="rgba(0,122,255,0.2)" strokeWidth="1" />

          {/* 3D Latitude/Longitude Grid Lines */}
          <ellipse cx={VW/2} cy={VH/2} rx={VH/2.1} ry={VH/6} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <ellipse cx={VW/2} cy={VH/2} rx={VH/2.1} ry={VH/12} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <ellipse cx={VW/2} cy={VH/2} rx={VH/6} ry={VH/2.1} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <ellipse cx={VW/2} cy={VH/2} rx={VH/12} ry={VH/2.1} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          
          <line x1={VW/2 - VH/2.1} y1={VH/2} x2={VW/2 + VH/2.1} y2={VH/2} stroke="var(--border-subtle)" strokeWidth="1" />
          <line x1={VW/2} y1={VH/2 - VH/2.1} x2={VW/2} y2={VH/2 + VH/2.1} stroke="var(--border-subtle)" strokeWidth="1" />

          {/* Adjusted Continents for Sphere Projection - We scale them slightly to fit the globe */}
          <g transform="translate(140, 25) scale(0.72)">
            {/* North America */}
            <path d="M 130,60 Q 180,50 220,70 L 280,150 L 260,210 L 200,240 L 160,220 L 130,180 Z"
              fill="rgba(0,122,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 2px rgba(0,122,255,0.3))' }} />
            {/* Greenland */}
            <path d="M 200,20 Q 240,10 270,30 L 260,60 L 220,65 Z" fill="rgba(0,122,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            {/* South America */}
            <path d="M 230,260 Q 260,250 280,270 L 310,340 L 290,400 L 250,420 L 220,380 L 210,310 Z" fill="rgba(0,122,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            {/* Europe */}
            <path d="M 420,60 Q 480,50 520,70 L 530,100 L 500,130 L 450,140 L 420,120 Z" fill="rgba(0,122,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            {/* Africa */}
            <path d="M 430,160 Q 480,150 520,170 L 530,250 L 510,320 L 470,360 L 440,340 L 420,270 L 420,200 Z" fill="rgba(0,122,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            {/* Asia */}
            <path d="M 550,50 Q 680,40 780,70 L 800,100 L 780,150 L 720,180 L 650,170 L 580,150 L 540,110 Z" fill="rgba(0,122,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            {/* India */}
            <path d="M 640,170 Q 670,165 690,180 L 680,240 L 650,250 L 630,220 Z" fill="rgba(0,122,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            {/* Southeast Asia */}
            <path d="M 730,180 Q 770,170 790,190 L 800,230 L 760,240 L 730,220 Z" fill="rgba(0,122,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            {/* Australia */}
            <path d="M 740,300 Q 800,285 840,310 L 850,360 L 820,390 L 770,390 L 740,360 Z" fill="rgba(0,122,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            {/* Japan */}
            <path d="M 800,90 Q 820,85 830,100 L 820,120 L 800,115 Z" fill="rgba(0,122,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          </g>

          {/* 3D Attack vectors (curved) */}
          {ATTACK_LINES.map((line, i) => (
            <AttackLine key={i}
              x1pct={line.x1} y1pct={line.y1}
              x2pct={line.x2} y2pct={line.y2}
              viewWidth={VW} viewHeight={VH}
              delay={i * 0.4}
            />
          ))}

          {/* Threat hotspots markers */}
          {THREAT_HOTSPOTS.map((spot, i) => {
            const cx = (spot.x / 100) * VW;
            const cy = (spot.y / 100) * VH;
            return (
              <g key={i} style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.closest('svg').parentElement.getBoundingClientRect();
                  setTooltip({ ...spot, screenX: e.clientX - rect.left, screenY: e.clientY - rect.top });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <PulseMarker
                  x={cx} y={cy}
                  color={spot.color}
                  size={spot.count > 900 ? 5.5 : spot.count > 500 ? 4.5 : 3.5}
                />
              </g>
            );
          })}
          
          {/* Inner Globe Shadow for true 3D edge */}
          <circle cx={VW / 2} cy={VH / 2} r={VH / 2.1} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="12" style={{ filter: 'blur(8px)' }} pointerEvents="none" />
        </svg>

        {/* Scan line overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(0, 122, 255, 0) 40%, rgba(0, 122, 255, 0.05) 50%, rgba(0, 122, 255, 0) 60%)',
          animation: 'scanLineAnimation 6s linear infinite'
        }} />

        {/* Interactive Tooltip popup - Glassmorphic */}
        {tooltip && (
          <div style={{
            position: 'absolute',
            left: tooltip.screenX + 16,
            top: tooltip.screenY - 60,
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-card)',
            backdropFilter: 'blur(20px)',
            borderRadius: 12,
            padding: '12px 16px',
            pointerEvents: 'none',
            zIndex: 100,
            boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
            animation: 'revealUp 0.2s ease-out'
          }}>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontSize: 12 }}>
              {tooltip.label}
            </div>
            <div style={{ color: tooltip.color, fontWeight: 900, fontSize: 13 }} className="mono-display">
              {tooltip.count.toLocaleString()} ACTIVE THREATS
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
