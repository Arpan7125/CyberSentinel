import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { scanService } from '../../services/api';

export default function FileScannerPage() {
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setProgress(0);
    }
  };

  const simulateScan = async () => {
    if (!file) return;
    setIsScanning(true);
    setProgress(0);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90;
        return prev + Math.floor(Math.random() * 12) + 4;
      });
    }, 250);

    try {
      const res = await scanService.analyzeFile(formData);
      clearInterval(interval);
      setProgress(100);
      
      // Brief delay to make the scan feel satisfying
      setTimeout(() => {
        setIsScanning(false);
        setResult(res);
      }, 300);
    } catch (err) {
      clearInterval(interval);
      setIsScanning(false);
      console.error(err);
      alert('Failed to analyze file. Server might be down.');
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 40, maxWidth: 900, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <h1 className="page-title" style={{ fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <File size={40} color="var(--accent)" /> Advanced File Sandbox
        </h1>
        <p className="page-subtitle" style={{ maxWidth: 600, margin: '0 auto' }}>
          Upload any file (PDF, EXE, ZIP) up to 50MB. We will detonate it safely in our isolated cloud sandbox to detect hidden malware, ransomware, and exploits.
        </p>
      </div>

      {!result && !isScanning && (
        <div 
          className="glass-card" 
          style={{ 
            padding: 64, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            border: '2px dashed var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-purple)'; }}
          onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          onDrop={(e) => { 
            e.preventDefault(); 
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              setFile(e.dataTransfer.files[0]);
            }
          }}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
          
          <UploadCloud size={64} style={{ color: 'var(--text-muted)', marginBottom: 24 }} />
          <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Drag & Drop to Upload</h3>
          <p style={{ color: 'var(--text-secondary)' }}>or click to browse your computer</p>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <span style={{ fontSize: 12, padding: '4px 12px', background: 'var(--bg-tertiary)', borderRadius: 20 }}>PDF</span>
            <span style={{ fontSize: 12, padding: '4px 12px', background: 'var(--bg-tertiary)', borderRadius: 20 }}>EXE</span>
            <span style={{ fontSize: 12, padding: '4px 12px', background: 'var(--bg-tertiary)', borderRadius: 20 }}>ZIP</span>
            <span style={{ fontSize: 12, padding: '4px 12px', background: 'var(--bg-tertiary)', borderRadius: 20 }}>DOCX</span>
          </div>
        </div>
      )}

      {(file && !result && !isScanning) && (
        <div className="glass-card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <File size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{file.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-pub btn-pub-ghost" onClick={reset}>Cancel</button>
            <button className="btn-pub btn-pub-primary" onClick={simulateScan}>Scan File</button>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Analyzing File in Sandbox...</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Executing {file.name} in a secure virtual environment.</p>
          
          <div style={{ width: '100%', height: 8, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-purple)', transition: 'width 0.3s ease' }}></div>
          </div>
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: 'var(--accent-purple)' }}>{progress}% Complete</div>
          
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 24, color: 'var(--text-muted)', fontSize: 12 }}>
            <span> Static Analysis</span>
            <span style={{ opacity: progress > 30 ? 1 : 0.3 }}> Signature Check</span>
            <span style={{ opacity: progress > 60 ? 1 : 0.3 }}> Behavioral Execution</span>
          </div>
        </div>
      )}

      {result && (
        <div className="glass-card" style={{ padding: 32, animation: 'fadeIn 0.5s ease', border: result.isDangerous ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(62,182,73,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: result.isDangerous ? 'rgba(239,68,68,0.1)' : 'rgba(62,182,73,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: result.isDangerous ? '#EF4444' : '#3EB649' }}>
                {result.isDangerous ? <AlertTriangle size={40} /> : <ShieldCheck size={40} />}
              </div>
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: result.isDangerous ? '#EF4444' : '#3EB649', marginBottom: 4 }}>
                  {result.isDangerous ? 'Malicious File Detected' : 'File appears clean'}
                </h2>
                <div style={{ fontSize: 16, color: 'var(--text-primary)' }}>{result.fileName} ({result.fileSize})</div>
              </div>
            </div>
            <button className="btn-pub btn-pub-ghost" onClick={reset}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 16 }}>Analysis Summary</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Threat Label:</span>
                  <span style={{ fontWeight: 600, color: result.isDangerous ? '#EF4444' : 'var(--text-primary)' }}>{result.threatName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Engine Detections:</span>
                  <span style={{ fontWeight: 600, color: result.isDangerous ? '#EF4444' : '#3EB649' }}>{result.detections} / {result.engines}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Sandbox Execution:</span>
                  <span style={{ fontWeight: 600 }}>{result.sandboxStatus}</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 16 }}>File Signatures</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>SHA-256 Hash:</div>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', wordBreak: 'break-all', background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 4 }}>
                    {result.hash}
                  </div>
                </div>
                {result.isDangerous && (
                  <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', borderLeft: '3px solid #EF4444', fontSize: 13, color: '#ffb3b3', marginTop: 8 }}>
                    Do not execute this file on your host machine. Delete it immediately.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
