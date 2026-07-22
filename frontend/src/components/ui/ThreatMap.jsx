import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export default function ThreatMap() {
  const [threats, setThreats] = useState([]);
  const [pulseLine, setPulseLine] = useState(0);

  // Nodes representing major global hubs
  const nodes = [
    { id: 1, x: 20, y: 30, name: 'San Francisco' },
    { id: 2, x: 25, y: 35, name: 'New York' },
    { id: 3, x: 45, y: 25, name: 'London' },
    { id: 4, x: 50, y: 30, name: 'Frankfurt' },
    { id: 5, x: 75, y: 40, name: 'Singapore' },
    { id: 6, x: 85, y: 35, name: 'Tokyo' },
    { id: 7, x: 70, y: 65, name: 'Sydney' },
    { id: 8, x: 30, y: 60, name: 'São Paulo' }
  ];

  useEffect(() => {
    // Generate random threats
    const interval = setInterval(() => {
      const source = nodes[Math.floor(Math.random() * nodes.length)];
      let target = nodes[Math.floor(Math.random() * nodes.length)];
      while (target.id === source.id) {
        target = nodes[Math.floor(Math.random() * nodes.length)];
      }

      const newThreat = {
        id: Date.now(),
        source,
        target,
        color: Math.random() > 0.5 ? 'var(--accent-red)' : 'var(--accent-orange)'
      };

      setThreats(prev => [...prev, newThreat]);

      // Remove after animation
      setTimeout(() => {
        setThreats(prev => prev.filter(t => t.id !== newThreat.id));
      }, 2000);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Sweep effect
    const sweep = setInterval(() => {
      setPulseLine(p => (p > 100 ? 0 : p + 2));
    }, 50);
    return () => clearInterval(sweep);
  }, []);

  return (
    <div className="glass-card md-fade-up" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, zIndex: 10, position: 'relative' }}>
        <h3 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} color="var(--accent)" />
          Global Threat Intelligence
        </h3>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="live-indicator"></span> Live Feed
        </div>
      </div>

      <div style={{ width: '100%', height: 300, background: 'var(--bg-secondary)', borderRadius: 12, position: 'relative', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        
        {/* Radar Sweep Background */}
        <div style={{ 
          position: 'absolute', top: 0, bottom: 0, left: `${pulseLine}%`, width: '20%', 
          background: 'linear-gradient(90deg, rgba(59,130,246,0) 0%, rgba(59,130,246,0.1) 100%)',
          borderRight: '1px solid rgba(59,130,246,0.4)',
          zIndex: 1, transition: 'none'
        }} />

        {/* Abstract Map Nodes */}
        {nodes.map(node => (
          <div key={node.id} style={{
            position: 'absolute', left: `${node.x}%`, top: `${node.y}%`,
            width: 8, height: 8, borderRadius: 4, background: 'var(--accent-blue)',
            boxShadow: '0 0 10px var(--accent-blue)', zIndex: 3,
            transform: 'translate(-50%, -50%)'
          }}>
            <div style={{ position: 'absolute', top: -20, left: -10, fontSize: 10, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {node.name}
            </div>
          </div>
        ))}

        {/* Animated Threat Lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2 }}>
          {threats.map(threat => {
            const sx = `${threat.source.x}%`;
            const sy = `${threat.source.y}%`;
            const tx = `${threat.target.x}%`;
            const ty = `${threat.target.y}%`;

            return (
              <g key={threat.id}>
                {/* Attack Path */}
                <path 
                  d={`M ${threat.source.x * 10} ${threat.source.y * 3} Q ${(threat.source.x * 10 + threat.target.x * 10)/2} ${Math.min(threat.source.y * 3, threat.target.y * 3) - 50} ${threat.target.x * 10} ${threat.target.y * 3}`}
                  fill="none" 
                  stroke={threat.color} 
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.6"
                  className="threat-line-anim"
                  style={{ vectorEffect: 'non-scaling-stroke' }}
                />
              </g>
            );
          })}
        </svg>

        <style>{`
          .live-indicator { width: 8px; height: 8px; background: var(--accent-red); border-radius: 4px; animation: pulse 1s infinite alternate; }
          @keyframes pulse { 0% { opacity: 0.4; } 100% { opacity: 1; box-shadow: 0 0 8px var(--accent-red); } }
          .threat-line-anim { animation: drawLine 1s ease-out forwards; stroke-dashoffset: 100; stroke-dasharray: 100; }
          @keyframes drawLine { to { stroke-dashoffset: 0; } }
        `}</style>
      </div>
    </div>
  );
}
