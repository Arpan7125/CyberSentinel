import React, { useState, useEffect, useCallback } from 'react';
import { 
  GraduationCap, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Award, 
  Mail, 
  HelpCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function AwarenessCenter() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // true = Phishing, false = Legitimate
  const [submitted, setSubmitted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/quiz/');
      if (!response.ok) {
        throw new Error('Failed to load quiz');
      }
      const data = await response.json();
      setQuestions(data);
    } catch (err) {
      console.warn("Backend unavailable. Loading offline security training simulation data...", err);
      setQuestions([
        {
          "id": 1,
          "scenario_name": "IRS Tax Refund SMS Alert",
          "sender": "+1 (800) 492-9102",
          "subject": "SMS Text Message",
          "body": "IRS Alert: We detected an unpaid tax refund of $432.10 under your name. Claim your tax credit now by filling this secure form: http://irs-tax-refund-portal.org",
          "is_phishing": true,
          "explanation": "This is a typical tax phishing scam. The IRS never contacts taxpayers via text message to request bank details or offer refunds. Additionally, the domain 'irs-tax-refund-portal.org' is fake; the official IRS domain is irs.gov.",
          "clues": ["irs-tax-refund-portal.org", "refund of $432.10", "Claim your tax credit now"]
        },
        {
          "id": 2,
          "scenario_name": "Netflix Billing Issue Email",
          "sender": "billing-support@netflix-alerts-billing.com",
          "subject": "Action Required: Update payment card immediately",
          "body": "Dear Netflix Member, your monthly subscription payment failed. We will suspend your service in 24 hours if payment is not updated. Click here to confirm billing profile details: http://netflix-payment-check.net/billing",
          "is_phishing": true,
          "explanation": "This email uses a generic greeting ('Dear Netflix Member') instead of your name, creates artificial urgency (24 hours), and uses a spoofed domain 'netflix-alerts-billing.com' and destination link 'netflix-payment-check.net' instead of official netflix.com.",
          "clues": ["netflix-alerts-billing.com", "suspend your service in 24 hours", "netflix-payment-check.net"]
        },
        {
          "id": 3,
          "scenario_name": "Company IT Team Software Update",
          "sender": "it-support@corporatesecurity-hub.com",
          "subject": "Mandatory Security Upgrade for Slack Portal",
          "body": "Hi team, we are upgrading our internal Slack client security protocols. Please download the patch executable from our secure engineering file store and run it immediately: http://internal-engineering-shares.info/slack_patch.exe",
          "is_phishing": true,
          "explanation": "This is an internal spear-phishing attack attempting to distribute malware. IT support will rarely ask you to run an arbitrary executable file from an external '.info' domain. Always confirm software updates with your administrators first.",
          "clues": ["slack_patch.exe", "corporatesecurity-hub.com", "internal-engineering-shares.info"]
        },
        {
          "id": 4,
          "scenario_name": "Amazon Package Delivery Confirm",
          "sender": "auto-confirm@amazon.com",
          "subject": "Your Amazon order #409-918274-12847 has shipped",
          "body": "Hello Joshua, thanks for shopping. Your order was successfully packed and shipped. You can trace its shipment status securely on your official Amazon portal dashboard or mobile app.",
          "is_phishing": false,
          "explanation": "This is a legitimate order notification. The sender domain matches amazon.com, it uses the recipient's actual name, it provides a realistic order tracking number, and it does not link to any suspicious external portals.",
          "clues": []
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleAnswerSelection = (answer) => {
    if (submitted) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || submitted) return;
    
    const currentQ = questions[currentIdx];
    if (selectedAnswer === currentQ.is_phishing) {
      setScore(score + 1);
    }
    setSubmitted(true);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIdx(0);
    setScore(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setQuizFinished(false);
  };

  const getRank = (scoreVal, totalVal) => {
    const ratio = scoreVal / totalVal;
    if (ratio === 1) return { title: "Sentinel Elite", desc: "You have a perfect score! Flawless threat identification skills.", border: 'var(--accent-green)', color: 'var(--accent-green)' };
    if (ratio >= 0.7) return { title: "Sentinel Guardian", desc: "Great work! You spotted almost all the social engineering tricks.", border: 'var(--accent-orange)', color: 'var(--accent-orange)' };
    return { title: "Entry Recruit", desc: "Further practice required. Review the red flag descriptions carefully.", border: '#EF4444', color: '#EF4444' };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
        <RefreshCw className="spinner" style={{ width: 24, height: 24 }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Loading simulation bank...</span>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const progressPercent = questions.length ? ((currentIdx + 1) / questions.length) * 100 : 0;

  return (
    <div className="page-container reveal-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title text-gradient-orange">PHISHING SIMULATION</h2>
          <p className="page-subtitle">AWARENESS ASSESSMENT SCENARIOS FOR RECURRING TRAININGS</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>
          <GraduationCap size={16} style={{ color: 'var(--accent-orange)' }} /> AWARENESS UNIT
        </div>
      </div>

      {!quizFinished ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 28 }}>
          {/* Main Quiz Reader Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Progress Meter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800 }}>
                <span>SCENARIO {currentIdx + 1} OF {questions.length}</span>
                <span>{Math.round(progressPercent)}% RESOLVED</span>
              </div>
              <div style={{ width: '100%', background: 'var(--bg-secondary)', height: 3 }}>
                <div style={{ 
                  background: 'var(--accent-orange)', 
                  height: '100%', 
                  width: `${progressPercent}%`,
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

            {/* Email Client Sandbox Screen */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Mail top header */}
              <div style={{ 
                background: '#0a0b10', padding: '12px 20px', 
                borderBottom: '1px solid var(--border-subtle)', 
                display: 'flex', alignItems: 'center', gap: 10 
              }}>
                <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
                  SECURED SANDBOX MAIL AGENT
                </span>
              </div>

              {/* Envelope Metadata fields */}
              <div style={{ 
                padding: 16, borderBottom: '1px solid var(--border-subtle)', 
                display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)', width: 60, textAlign: 'right', fontWeight: 800, textTransform: 'uppercase' }}>From:</span>
                  <div style={{ 
                    padding: '4px 10px', background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', 
                    fontFamily: 'monospace', fontSize: 11.5, borderRadius: 'var(--radius-sm)'
                  }}>
                    {currentQuestion.sender || 'Unknown Sender'}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)', width: 60, textAlign: 'right', fontWeight: 800, textTransform: 'uppercase' }}>Subject:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{currentQuestion.subject || 'No Subject'}</span>
                </div>
              </div>

              {/* Envelope Body */}
              <div style={{ padding: 24, height: 220, overflowY: 'auto', background: '#07080a', borderBottom: '1px solid var(--border-subtle)' }}>
                <p className="mono-display" style={{ color: 'var(--text-primary)', fontSize: 13.5, lineHeight: 1.7, whitespace: 'pre-wrap' }}>
                  {currentQuestion.body}
                </p>
              </div>

              {/* Decision Choice Panel */}
              <div style={{ padding: 18, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Cast Security Verdict:
                </span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => handleAnswerSelection(true)}
                    disabled={submitted}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: '99px',
                      background: selectedAnswer === true ? 'rgba(239,68,68,0.08)' : 'transparent',
                      border: `1px solid ${selectedAnswer === true ? '#EF4444' : 'var(--border-subtle)'}`,
                      color: selectedAnswer === true ? '#EF4444' : 'var(--text-secondary)',
                      fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s'
                    }}
                  >
                    <ShieldAlert size={14} /> PHISHING VECTOR
                  </button>
                  
                  <button
                    onClick={() => handleAnswerSelection(false)}
                    disabled={submitted}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: '99px',
                      background: selectedAnswer === false ? 'rgba(62,182,73,0.08)' : 'transparent',
                      border: `1px solid ${selectedAnswer === false ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
                      color: selectedAnswer === false ? 'var(--accent-green)' : 'var(--text-secondary)',
                      fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s'
                    }}
                  >
                    <ShieldCheck size={14} /> LEGITIMATE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback & Analytics Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {!submitted ? (
              <div className="glass-card" style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 340, textAlign: 'center', gap: 16 }}>
                <div style={{ 
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)',
                  animation: 'pulseGlow 2s infinite'
                }}>
                  <HelpCircle size={28} />
                </div>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>DECISION PENDING</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, maxWidth: 220, lineHeight: 1.6 }}>
                    Evaluate sender DNS parameters and content language cues to submit your scan log verdict.
                  </p>
                </div>
                {selectedAnswer !== null && (
                  <button
                    onClick={handleSubmit}
                    className="cta-btn"
                    style={{ padding: '10px 24px', marginTop: 12 }}
                  >
                    <span className="cta-btn-inner">
                      <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                        <span className="cta-btn-text" style={{ fontSize: 11 }}>CAST VERDICT</span>
                        <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>CAST VERDICT</span>
                      </span>
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <div className="glass-card slide-up-item" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {selectedAnswer === currentQuestion.is_phishing ? (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    background: 'rgba(62,182,73,0.06)', border: '1px solid rgba(62,182,73,0.25)',
                    color: 'var(--accent-green)', fontSize: 11, fontWeight: 850, borderRadius: 'var(--radius-sm)'
                  }}>
                    <CheckCircle size={16} /> ACCURATE DIAGNOSTIC (+1 SCORE)
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
                    color: '#EF4444', fontSize: 11, fontWeight: 850, borderRadius: 'var(--radius-sm)'
                  }}>
                    <AlertTriangle size={16} /> DATA BREACH SIMULATION FLAG
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="form-label" style={{ fontSize: 10 }}>TELEMETRY ANALYSIS EXPLANATION</span>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {currentQuestion.explanation}
                  </p>
                </div>

                {currentQuestion.clues && currentQuestion.clues.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span className="form-label" style={{ fontSize: 10 }}>SIGNATURE ALERTS</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {currentQuestion.clues.map((clue, idx) => (
                        <span key={idx} style={{ 
                          fontSize: 9.5, fontWeight: 900, border: '1px solid rgba(239,68,68,0.2)', 
                          background: 'rgba(239,68,68,0.03)', color: '#FF7B7B', px: 8, py: 4, borderRadius: '4px'
                        }}>
                          {clue}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleNext}
                  className="cta-btn"
                  style={{ width: '100%', padding: '12px' }}
                >
                  <span className="cta-btn-inner">
                    <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                      <span className="cta-btn-text" style={{ fontSize: 11 }}>
                        {currentIdx < questions.length - 1 ? 'NEXT SCENARIO →' : 'FINISH ASSESSMENT'}
                      </span>
                      <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>
                        {currentIdx < questions.length - 1 ? 'NEXT SCENARIO →' : 'FINISH ASSESSMENT'}
                      </span>
                    </span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Results Complete screen */
        <div className="glass-card reveal-up" style={{ padding: 48, maxWidth: 640, marginInline: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
          <div style={{ 
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-orange)'
          }}>
            <Award size={36} />
          </div>

          <div>
            <h3 style={{ fontSize: 24, fontWeight: 900 }}>SIMULATION REPORT RESOLVED</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 6 }}>
              Threat profiling training logs are successfully compiled.
            </p>
          </div>

          {/* Stats summary rows */}
          <div style={{ 
            display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: 400,
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', 
            padding: '20px 10px', borderRadius: 'var(--radius-sm)'
          }}>
            <div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>scenarios</span>
              <span className="mono-display" style={{ fontSize: 22, fontWeight: 900 }}>{questions.length}</span>
            </div>
            <div style={{ width: 1, background: 'var(--border-subtle)' }} />
            <div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>correct</span>
              <span className="mono-display" style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent-orange)' }}>{score}</span>
            </div>
            <div style={{ width: 1, background: 'var(--border-subtle)' }} />
            <div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>accuracy</span>
              <span className="mono-display" style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent-green)' }}>
                {questions.length ? Math.round((score / questions.length) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Rank Description */}
          {questions.length > 0 && (
            <div style={{ 
              padding: 20, border: `1px solid ${getRank(score, questions.length).border}`, 
              borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              width: '100%', maxWidth: 400, textAlign: 'left' 
            }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>
                CLEARANCE LEVEL VERDICT
              </span>
              <h4 style={{ fontSize: 14, fontWeight: 900, color: getRank(score, questions.length).color, textTransform: 'uppercase' }}>
                {getRank(score, questions.length).title}
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>{getRank(score, questions.length).desc}</p>
            </div>
          )}

          <button
            onClick={resetQuiz}
            className="cta-btn"
            style={{ padding: '12px 28px' }}
          >
            <span className="cta-btn-inner">
              <span className="cta-btn-text-wrapper" style={{ height: 16 }}>
                <span className="cta-btn-text" style={{ fontSize: 11 }}>RESET SYSTEM SIMULATOR</span>
                <span className="cta-btn-text-hover" style={{ fontSize: 11 }}>RESET SYSTEM SIMULATOR</span>
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
