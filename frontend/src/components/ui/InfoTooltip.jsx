import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

export default function InfoTooltip({ content, children, width = 250, title }) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef(null);

  const handleMouseEnter = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8, // 8px padding below
        left: rect.left + window.scrollX + (rect.width / 2)
      });
      setShow(true);
    }
  };

  const handleMouseLeave = () => {
    setShow(false);
  };

  const tooltipPortal = show ? createPortal(
    <div
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        transform: 'translateX(-50%) translateY(0)', // Start state for animation
        width: width,
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
        zIndex: 99999,
        pointerEvents: 'none',
        animation: 'tooltip-fade-up 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
      }}
    >
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>
          <Info size={14} color="var(--accent)" />
          {title}
        </div>
      )}
      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {content}
      </div>

      {/* Up Arrow */}
      <div style={{
        position: 'absolute',
        top: -6,
        left: '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        width: 12,
        height: 12,
        background: 'var(--bg-primary)',
        borderLeft: '1px solid var(--border-subtle)',
        borderTop: '1px solid var(--border-subtle)',
      }} />

      <style>{`
        @keyframes tooltip-fade-up {
          0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  ) : null;

  return (
    <div 
      ref={wrapperRef} 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
    >
      {children || <Info size={16} color="var(--text-muted)" style={{ marginLeft: 4 }} />}
      {tooltipPortal}
    </div>
  );
}
