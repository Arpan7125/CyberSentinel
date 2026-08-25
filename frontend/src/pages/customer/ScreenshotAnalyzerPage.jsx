import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { scanService } from '../../services/api';
import {
  ACCEPTED_IMAGE_TYPES,
  IMAGE_ACCEPT_ATTRIBUTE,
  MAX_UPLOAD_BYTES,
  formatBytes,
  validateUpload,
} from '../../utils/validation';
import '../../assets/analyzer.css';

export default function ScreenshotAnalyzerPage() {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  /**
   * Accept a chosen file only if it is plausibly a readable image of a workable
   * size. The server verifies the bytes properly with Pillow — a filename or a
   * declared MIME type is a claim, not proof — but checking here means the user
   * finds out immediately instead of after uploading ten megabytes.
   */
  const acceptFile = (chosen) => {
    if (!chosen) return;
    setResult(null);

    const problem = validateUpload(chosen, {
      maxBytes: MAX_UPLOAD_BYTES,
      acceptTypes: ACCEPTED_IMAGE_TYPES,
    });
    if (problem) {
      setError(problem);
      setFile(null);
      return;
    }

    setError('');
    setFile(chosen);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleFileSelect = (e) => {
    acceptFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const analyzeScreenshot = async () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await scanService.analyzeScreenshot(formData);
      setResult({
        riskLevel: res.risk_level,
        score: res.risk_score,
        findings: res.threat_indicators ? res.threat_indicators.map(ind => ({
          type: ind.type || 'Indicator',
          desc: ind.description,
          critical: res.risk_score > 50
        })) : [],
        extractedText: res.extracted_text,
        aiSummary: res.ai_summary || `OCR successfully extracted the text from the image. Threat assessment classified this content as ${res.risk_level} risk with a score of ${res.risk_score}%.`
      });
    } catch (err) {
      setError(err.message || 'Failed to analyze that screenshot.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="analyzer-page">
      <div className="analyzer-header">
        <h1>Visual AI Screenshot Analysis</h1>
        <p>Upload a screenshot of a suspicious email, text message, or website. Our AI vision model will extract text and identify visual spoofing attempts.</p>
      </div>

      <div className="analyzer-content">
        <div className="analyzer-input-card">
          {error && (
            <p className="field-error" role="alert" style={{ marginBottom: 16 }}>
              <AlertTriangle size={15} aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}

          <div 
            className="file-drop-zone" 
            role="button"
            tabIndex={0}
            aria-label="Choose a screenshot to analyze"
            onKeyDown={(e) => {
              // A div with a click handler is invisible to keyboard users
              // without this.
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('screenshot-upload').click();
              }
            }}
            onDragOver={(e) => e.preventDefault()} 
            onDrop={handleFileDrop}
            style={{ 
              border: '2px dashed var(--border-subtle)', 
              borderRadius: 12, 
              padding: 40, 
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('screenshot-upload').click()}
          >
            <input 
              id="screenshot-upload" 
              type="file" 
              accept={IMAGE_ACCEPT_ATTRIBUTE}
              className="visually-hidden"
              aria-describedby="screenshot-upload-limit"
              onChange={handleFileSelect} 
            />
            
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <ImageIcon size={48} color="var(--accent)" />
                <div style={{ fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatBytes(file.size)}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(175, 82, 222, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadCloud size={32} color="#AF52DE" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Drag &amp; drop a screenshot</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>or click to browse from your device</p>
                  {/* State the limits up front rather than after a failed upload. */}
                  <p id="screenshot-upload-limit" style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
                    PNG, JPEG, WebP, TIFF, or BMP &middot; up to {formatBytes(MAX_UPLOAD_BYTES)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <button 
            className="btn-pub btn-pub-primary" 
            style={{ width: '100%', marginTop: 24, padding: '14px 0', fontSize: 16, fontWeight: 600 }}
            onClick={analyzeScreenshot}
            disabled={!file || analyzing}
          >
            {analyzing ? 'Analyzing with Vision AI...' : 'Analyze Screenshot'}
          </button>
        </div>

        {analyzing && (
          <div className="analyzer-loading">
            <div className="spinner"></div>
            <p>Running OCR and visual heuristics...</p>
          </div>
        )}

        {result && (
          <div className="analyzer-result-card" style={{ marginTop: 32, borderTop: '1px solid var(--border-subtle)', paddingTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  Analysis Complete
                  <span style={{ 
                    fontSize: 12, padding: '4px 12px', borderRadius: 20, 
                    background: result.riskLevel === 'Critical' ? 'rgba(255, 69, 58, 0.1)' : 'rgba(50, 215, 75, 0.1)',
                    color: result.riskLevel === 'Critical' ? '#FF453A' : '#32D74B'
                  }}>
                    {result.riskLevel} Risk
                  </span>
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>Our Vision AI has completed its assessment.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: result.score > 80 ? '#FF453A' : '#32D74B' }}>{result.score}/100</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Threat Score</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 8, marginBottom: 24, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontWeight: 600, color: 'var(--accent)' }}>
                <Shield size={18} /> AI Conclusion
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>{result.aiSummary}</p>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Detected Anomalies</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {result.findings.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, background: 'rgba(255,69,58,0.05)', borderRadius: 8, border: '1px solid rgba(255,69,58,0.2)' }}>
                  <AlertTriangle size={20} color="#FF453A" style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#FF453A', marginBottom: 4 }}>{f.type}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Extracted Text</h3>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                {result.extractedText}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
