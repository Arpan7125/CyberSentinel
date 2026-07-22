import React, { useMemo } from 'react';

const LEVELS = [
  { label: 'Very Weak', color: '#FF3B30', min: 0 },
  { label: 'Weak', color: '#FF9500', min: 1 },
  { label: 'Fair', color: '#FFD60A', min: 2 },
  { label: 'Strong', color: '#34C759', min: 3 },
  { label: 'Very Strong', color: '#00C7BE', min: 4 },
];

function calcStrength(password) {
  if (!password) return { score: 0, feedback: [] };
  let score = 0;
  const feedback = [];

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters');

  if (password.length >= 12) score++;
  else if (password.length >= 8) feedback.push('12+ characters for better security');

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  else feedback.push('Mix upper and lowercase letters');

  if (/\d/.test(password)) score++;
  else feedback.push('Add a number');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Add a special character (!@#$%^&*)');

  // Penalty for common patterns
  if (/^[a-zA-Z]+$/.test(password) || /^\d+$/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid using only letters or only numbers');
  }
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid repeated characters');
  }

  return { score: Math.min(score, 4), feedback: feedback.slice(0, 3) };
}

export function generatePassword(length = 20) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, v => chars[v % chars.length]).join('');
}

export default function PasswordStrength({ password }) {
  const { score, feedback } = useMemo(() => calcStrength(password), [password]);
  const level = LEVELS[score] || LEVELS[0];

  if (!password) return null;

  return (
    <div className="password-strength">
      <div className="password-strength-bar">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`password-strength-segment ${i < score ? 'filled' : ''} ${score >= 3 ? 'strong' : score >= 2 ? 'medium' : ''}`}
            style={i < score ? { background: level.color } : undefined}
          />
        ))}
      </div>
      <span className="password-strength-text" style={{ color: level.color }}>
        {level.label}
      </span>
      {feedback.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0' }}>
          {feedback.map((f, i) => (
            <li key={i} style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>• {f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
