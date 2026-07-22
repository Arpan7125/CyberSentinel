import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, X, Sparkles } from 'lucide-react';

export default function GuidedTour({ steps, onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!currentStep) return;

    // Small delay to allow page rendering/animations
    const timer = setTimeout(() => {
      const element = document.getElementById(currentStep.targetId);
      if (element) {
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait for scroll to finish
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
        }, 500);
      } else {
        // Fallback if element not found: just center the bubble
        setTargetRect(null);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStep, windowSize]);

  if (!currentStep) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(i => i + 1);
    } else {
      onComplete();
    }
  };

  // Determine bubble position relative to target
  let bubbleStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10001
  };

  let overlayHole = null;

  if (targetRect) {
    const padding = 8;
    // Highlight hole
    overlayHole = {
      position: 'absolute',
      top: targetRect.top - padding + window.scrollY,
      left: targetRect.left - padding + window.scrollX,
      width: targetRect.width + padding * 2,
      height: targetRect.height + padding * 2,
      borderRadius: 8,
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
      pointerEvents: 'none',
      zIndex: 10000,
      transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
    };

    // Position bubble below the target if there's room, otherwise above
    const isRoomBelow = (targetRect.bottom + 250) < window.innerHeight;
    
    bubbleStyle = {
      position: 'absolute',
      top: isRoomBelow ? targetRect.bottom + padding + 16 + window.scrollY : targetRect.top - padding - 200 + window.scrollY,
      left: Math.max(20, Math.min(targetRect.left + (targetRect.width / 2) - 150 + window.scrollX, window.innerWidth - 320)),
      width: 300,
      zIndex: 10001,
      transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
    };
  } else {
    overlayHole = {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.65)',
      zIndex: 10000
    };
  }

  const content = (
    <>
      <div style={overlayHole} />
      <div style={bubbleStyle} className="glass-card md-fade-up">
        <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 12px 24px rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', position: 'relative' }}>
          
          <button onClick={onComplete} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} className="hover-bg">
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Sparkles size={18} color="var(--accent)" />
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{currentStep.title}</h4>
          </div>
          
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
            {currentStep.content}
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Step {currentStepIndex + 1} of {steps.length}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={onComplete} className="btn-pub btn-pub-ghost btn-pub-sm" style={{ fontSize: 13 }}>
                Skip
              </button>
              <button onClick={handleNext} className="btn-pub btn-pub-primary btn-pub-sm" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                {currentStepIndex < steps.length - 1 ? 'Next' : 'Finish'} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
