import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Apply saved theme before React renders (prevents flash of wrong theme) ──
const savedTheme = localStorage.getItem('cs_theme') || 'light';
if (savedTheme !== 'amber') {
  document.body.classList.add(`theme-${savedTheme}`);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
