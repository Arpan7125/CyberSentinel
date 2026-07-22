import React from 'react';
import SEOHead, { schemas } from '../utils/seo';
import { useForm, FormInput, FormTextArea, FormSelect, FormCheckbox, SubmitButton, FormStatus } from '../components/ui/FormComponents';

export default function ContactPage() {
  const initialValues = {
    fullName: '',
    email: '',
    company: '',
    interest: 'General Support',
    message: '',
    subscribe: false
  };

  const validate = (values) => {
    const errors = {};
    if (!values.fullName.trim()) errors.fullName = 'Full name is required';
    if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = 'Valid work email is required';
    }
    if (!values.message.trim()) errors.message = 'Message content is required';
    return errors;
  };

  const { values, errors, status, loading, handleChange, handleSubmit } = useForm(initialValues, validate);

  const onSubmit = async (formValues) => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const res = await fetch(`${API}/contact/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formValues.fullName,
        email: formValues.email,
        company: formValues.company,
        message: `[Interest: ${formValues.interest}] ${formValues.message}`,
        subscribe: formValues.subscribe
      }),
    });
    if (!res.ok) {
      let errorMsg = 'Could not submit contact request. Try again later.';
      try {
        const errorData = await res.json();
        if (errorData.detail) errorMsg = errorData.detail;
        else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
          errorMsg = Object.values(errorData).flat().join(', ');
        }
      } catch (e) {}
      throw new Error(errorMsg);
    }
  };

  const interestOptions = [
    { value: 'Book a Demo', label: 'Schedule Product Demo' },
    { value: 'Enterprise Pricing', label: 'Enterprise Custom Pricing' },
    { value: 'General Support', label: 'General Help & Support' }
  ];

  return (
    <>
      <SEOHead
        title="Contact Us"
        description="Book a demo or contact CyberSentinel sales and support teams. Protect your organization with enterprise-grade cybersecurity."
        path="/contact"
        structuredData={schemas.webpage('Contact', 'Get in touch with CyberSentinel teams.', '/contact')}
      />

      {/* Hero Section */}
      <section className="page-hero">
        <div className="pub-container">
          <span className="section-label">Get in Touch</span>
          <h1 className="page-hero-title">Connect with Our SOC Security Experts</h1>
          <p className="page-hero-desc">
            Submit a query to book a product demo, request enterprise contract pricing tables, or get support.
          </p>
        </div>
      </section>

      {/* Contact Forms & Cards Grid */}
      <section className="page-section">
        <div className="pub-container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48 }}>
          
          {/* Form Card */}
          <div className="glass-card" style={{ padding: 32 }}>
            <h3 className="section-title" style={{ marginBottom: 20 }}>Send an Incident Query</h3>
            <FormStatus type={status.type} message={status.message} />

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit); }} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormInput
                  label="Full Name"
                  id="fullName"
                  name="fullName"
                  value={values.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                  required
                />
                <FormInput
                  label="Work Email Address"
                  id="email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormInput
                  label="Company / Organization"
                  id="company"
                  name="company"
                  value={values.company}
                  onChange={handleChange}
                />
                <FormSelect
                  label="Area of Interest"
                  id="interest"
                  name="interest"
                  options={interestOptions}
                  value={values.interest}
                  onChange={handleChange}
                />
              </div>

              <FormTextArea
                label="Detailed Message"
                id="message"
                name="message"
                value={values.message}
                onChange={handleChange}
                error={errors.message}
                required
              />

              <FormCheckbox
                label="Opt-in to weekly Threat Intelligence briefings newsletter updates"
                id="subscribe"
                name="subscribe"
                checked={values.subscribe}
                onChange={handleChange}
              />

              <SubmitButton loading={loading}>Submit Request</SubmitButton>
            </form>
          </div>

          {/* Contact Details Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Global Headquarters</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                200 Sentinel Plaza, Suite 1500<br />
                San Francisco, CA 94105<br />
                United States
              </p>
            </div>

            <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Sales & Inquiries</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
                Email: sales@cybersentinel.ai<br />
                Phone: +1 (800) 736-8463
              </p>
            </div>

            <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Responsible Disclosure</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                If you believe you have identified a vulnerability on our platform, please refer to our <a href="/responsible-disclosure">Responsible Disclosure Policy</a> page.
              </p>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
