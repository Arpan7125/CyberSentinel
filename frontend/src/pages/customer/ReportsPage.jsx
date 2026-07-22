import React from 'react';

export default function ReportsPage() {
  const reports = [
    { id: 'rep-1', title: 'June Monthly Threat Analysis Report', date: '2026-07-01', size: '1.4 MB', type: 'PDF' },
    { id: 'rep-2', title: 'Q2 Compliance & Audit Readiness Report', date: '2026-07-01', size: '4.8 MB', type: 'PDF' },
    { id: 'rep-3', title: 'GDPR Data Processing Impact Assessment', date: '2026-06-15', size: '2.1 MB', type: 'PDF' },
    { id: 'rep-4', title: 'Endpoint System Penetration Testing Log', date: '2026-05-30', size: '920 KB', type: 'CSV' },
  ];

  const handleDownload = (title) => {
    alert(`Initiating download for: ${title}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="page-title">Security Reports</h1>
        <p className="page-subtitle">Download audit logs, threat analyses, and compliance document metrics</p>
      </div>

      {/* Compliance Index Widget */}
      <div className="glass-card" style={{ padding: 28 }}>
        <h3 className="section-title" style={{ marginBottom: 16 }}>Audit & Compliance Readiness</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>SOC 2 Compliance</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)', marginTop: 8 }}>100% READY</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ISO 27001 Alignment</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)', marginTop: 8 }}>94% ALIGNED</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>GDPR Compliance Score</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)', marginTop: 8 }}>PASSING</div>
          </div>
        </div>
      </div>

      {/* Reports Table List */}
      <div className="glass-card" style={{ padding: 28 }}>
        <h3 className="section-title" style={{ marginBottom: 16 }}>Available Security Documents</h3>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>Generation Date</th>
                <th>File Format</th>
                <th>File Size</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(rep => (
                <tr key={rep.id}>
                  <td style={{ fontWeight: 650 }}>{rep.title}</td>
                  <td>{rep.date}</td>
                  <td><span className="badge badge-admin" style={{ padding: '3px 8px' }}>{rep.type}</span></td>
                  <td>{rep.size}</td>
                  <td>
                    <button
                      className="btn-pub btn-pub-primary btn-pub-sm"
                      onClick={() => handleDownload(rep.title)}
                    >
                      Download 
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
