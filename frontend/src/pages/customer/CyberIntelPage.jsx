import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, Biohazard, CalendarClock, RefreshCw, Search, ShieldAlert, Wifi, WifiOff } from 'lucide-react';
import { saasService } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import { useMotion } from '../../components/ui/motion';
import '../../assets/analyzer.css';

/**
 * Live threat intelligence, sourced from the public internet.
 *
 * Items come from CISA's Known Exploited Vulnerabilities catalogue via
 * backend/api/intel_views.py — real CVEs with confirmed in-the-wild
 * exploitation, each linking back to its NVD record so a reader can verify it.
 *
 * The page inherits a hard rule from its own history: it once shipped a
 * fabricated "CVE-2023-XXXXX" advisory credited to analysts who never wrote
 * it. Invented advisories in a security product are not filler — a reader can
 * act on them. So when the feed is unreachable this renders an honest outage
 * notice, never cached-looking filler.
 */
export default function CyberIntelPage() {
  const [vendor, setVendor] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const m = useMotion();

  const { data, loading, error, refetch } = useApiData(() => saasService.getThreatIntelFeed(48), []);

  const items = useMemo(() => (Array.isArray(data?.items) ? data.items : []), [data]);
  const source = data?.source;

  const vendors = useMemo(() => {
    const counts = new Map();
    items.forEach((i) => {
      if (i.vendor) counts.set(i.vendor, (counts.get(i.vendor) || 0) + 1);
    });
    // Only vendors with more than one advisory earn a filter chip, otherwise the
    // rail becomes longer than the results it filters.
    const frequent = [...counts.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).map(([v]) => v);
    return ['All', ...frequent.slice(0, 8)];
  }, [items]);

  const visible = useMemo(() => {
    return items.filter((i) => {
      const matchesVendor = vendor === 'All' || i.vendor === vendor;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (i.cve_id && i.cve_id.toLowerCase().includes(q)) ||
        (i.title && i.title.toLowerCase().includes(q)) ||
        (i.summary && i.summary.toLowerCase().includes(q)) ||
        (i.vendor && i.vendor.toLowerCase().includes(q)) ||
        (i.product && i.product.toLowerCase().includes(q));
      return matchesVendor && matchesSearch;
    });
  }, [items, vendor, searchQuery]);

  const ransomwareCount = useMemo(() => items.filter((i) => i.known_ransomware).length, [items]);

  return (
    <div className="analyzer-page">
      <div className="analyzer-header">
        <h1 style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
          Cyber Intel Center
        </h1>
        <p style={{ fontSize: '17px', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: '680px' }}>
          Vulnerabilities under confirmed active exploitation, published by CISA. Every entry links
          to its primary source — nothing on this page is written or inferred by us.
        </p>
      </div>

      <div className="analyzer-content" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Live feed metadata & quick stats overview */}
        {!loading && !error && source && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14,
                padding: '14px 20px', borderRadius: 12,
                background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--accent-green)' }}>
                <Wifi size={16} aria-hidden="true" /> Live feed
              </span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {source.name}
                {source.released ? ` · updated ${new Date(source.released).toLocaleDateString()}` : ''}
                {data?.total_in_catalog ? ` · ${data.total_in_catalog.toLocaleString()} in catalog` : ''}
              </span>
              {ransomwareCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: 'var(--sev-critical)', background: 'color-mix(in oklab, var(--sev-critical) 12%, transparent)', padding: '4px 12px', borderRadius: 999 }}>
                  <Biohazard size={14} aria-hidden="true" /> {ransomwareCount} linked to ransomware
                </span>
              )}
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pub btn-pub-ghost btn-pub-sm"
                style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                View at CISA <ArrowUpRight size={15} />
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Threat CVEs</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{items.length}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sev-critical)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ransomware Campaigns</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--sev-critical)', marginTop: 4 }}>{ransomwareCount}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Vendors Tracked</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>{vendors.length > 1 ? vendors.length - 1 : 0}</div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse" style={{ height: 260, borderRadius: 16, background: 'var(--bg-tertiary)' }} />
            ))}
          </div>
        )}

        {/* Honest outage notice. No stale cache, no invented advisories. */}
        {!loading && error && (
          <div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              gap: 14, padding: '56px 24px', borderRadius: 16,
              background: 'var(--bg-secondary)', border: '1px dashed var(--border-strong)',
            }}
            role="alert"
          >
            <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%', background: 'color-mix(in oklab, var(--accent-red) 12%, transparent)', color: 'var(--accent-red)' }}>
              <WifiOff size={30} />
            </span>
            <h3 style={{ fontSize: 20, fontWeight: 700 }}>Live intelligence is unavailable</h3>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 520, lineHeight: 1.6 }}>
              {error.message || 'The CISA threat feed could not be reached.'} Rather than show stale
              or invented advisories, this page stays empty until the connection recovers.
            </p>
            <button className="btn-pub btn-pub-secondary btn-pub-sm" onClick={refetch} style={{ marginTop: 8, fontSize: 14, padding: '8px 18px' }}>
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        )}

        {/* Controls Bar: Search & Vendor Filter Rail */}
        {!loading && !error && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search CVE ID, vendor, or vulnerability..."
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 42px',
                    fontSize: 14.5,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
              </div>

              {/* Vendor Filters */}
              {vendors.length > 2 && (
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }} role="group" aria-label="Filter by vendor">
                  {vendors.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVendor(v)}
                      aria-pressed={vendor === v}
                      style={{
                        background: v === vendor ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: v === vendor ? '#ffffff' : 'var(--text-secondary)',
                        border: `1px solid ${v === vendor ? 'var(--accent)' : 'var(--border-subtle)'}`,
                        padding: '8px 18px', borderRadius: 24, fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .2s ease',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Advisory grid */}
        {!loading && !error && visible.length > 0 && (
          <motion.div
            variants={m.staggerContainer}
            initial="hidden"
            animate="visible"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}
          >
            {visible.map((item) => (
              <motion.a
                key={item.cve_id || item.title}
                variants={m.fadeUp}
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="intel-card"
                style={{
                  background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border-subtle)',
                  padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
                  textDecoration: 'none', color: 'inherit', position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Header row: CVE Badge & Ransomware Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '5px 12px', borderRadius: 6, letterSpacing: '0.02em' }}>
                    {item.cve_id || 'Advisory'}
                  </span>
                  {item.known_ransomware && (
                    <span
                      title="CISA has linked this vulnerability to known ransomware campaigns"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--sev-critical)', background: 'color-mix(in oklab, var(--sev-critical) 12%, transparent)', padding: '5px 10px', borderRadius: 6 }}
                    >
                      <Biohazard size={13} aria-hidden="true" /> Ransomware
                    </span>
                  )}
                  <div className="intel-card-icon" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    <ArrowUpRight size={18} style={{ color: 'var(--text-muted)', transition: 'color 0.2s, transform 0.2s' }} aria-hidden="true" />
                  </div>
                </div>

                {/* Vulnerability Title */}
                <h3 style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.38, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  {item.title}
                </h3>

                {/* Summary Description */}
                {item.summary && (
                  <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.65, flex: 1 }}>
                    {item.summary}
                  </p>
                )}

                {/* Required Action Callout */}
                {item.required_action && (
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--accent)', borderRadius: '0 8px 8px 0', padding: '12px 16px', lineHeight: 1.6 }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <ShieldAlert size={15} style={{ color: 'var(--accent)' }} aria-hidden="true" /> Required action:
                    </span>
                    <div style={{ marginTop: 2 }}>{item.required_action}</div>
                  </div>
                )}

                {/* Footer Meta info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 'auto', fontSize: 13.5, color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {[item.vendor, item.product].filter(Boolean).join(' · ')}
                  </span>
                  {item.due_date && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }} title="CISA remediation due date for federal agencies">
                      <CalendarClock size={13} aria-hidden="true" /> {item.due_date}
                    </span>
                  )}
                </div>
              </motion.a>
            ))}
          </motion.div>
        )}

        {/* Feed reachable but genuinely empty */}
        {!loading && !error && items.length === 0 && (
          <div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              padding: '64px 24px', background: 'var(--bg-secondary)',
              border: '1px dashed var(--border-subtle)', borderRadius: 16,
            }}
          >
            <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <ShieldAlert size={30} />
            </span>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginTop: 20 }}>No advisories returned</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 8, maxWidth: 480, lineHeight: 1.65 }}>
              The feed responded but carried no entries. The scanners in the sidebar will still
              assess anything you paste into them.
            </p>
            <Link to="/dashboard/url-scanner" className="btn-pub btn-pub-secondary btn-pub-sm" style={{ marginTop: 20, fontSize: 14, padding: '10px 20px' }}>
              Scan a link
            </Link>
          </div>
        )}

        {/* Filter matched nothing */}
        {!loading && !error && items.length > 0 && visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', fontSize: 15, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'var(--bg-secondary)', borderRadius: 16, border: '1px dashed var(--border-subtle)' }}>
            <AlertTriangle size={24} style={{ color: 'var(--accent-yellow)' }} aria-hidden="true" />
            <span>No advisories matching your search query or vendor filter.</span>
            <button
              onClick={() => { setVendor('All'); setSearchQuery(''); }}
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      <style>{`
        .intel-card {
          transition: transform .25s var(--ease-out-expo), box-shadow .25s var(--ease-out-expo), border-color .25s;
        }
        .intel-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent) !important;
          box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--accent-soft);
        }
        .intel-card:hover .intel-card-icon svg {
          color: var(--accent) !important;
          transform: translate(2px, -2px);
        }
        @media (prefers-reduced-motion: reduce) {
          .intel-card { transition: none; }
          .intel-card:hover { transform: none; }
          .intel-card:hover .intel-card-icon svg { transform: none; }
        }
      `}</style>
    </div>
  );
}

