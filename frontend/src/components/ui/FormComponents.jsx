import React, { useState } from 'react';

/* ── Reusable Form Input ────────────────────────────────────────────── */
export function FormInput({ label, id, type = 'text', placeholder, value, onChange, error, required, icon, ...props }) {
  return (
    <div className="form-group">
      {label && <label htmlFor={id} className="form-label-pub">{label}{required && <span className="form-required">*</span>}</label>}
      <div className="form-input-wrap">
        {icon && <span className="form-input-icon-pub">{icon}</span>}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`form-input-pub${icon ? ' has-icon' : ''}${error ? ' has-error' : ''}`}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
      </div>
      {error && <p id={`${id}-error`} className="form-error" role="alert">{error}</p>}
    </div>
  );
}

/* ── Reusable TextArea ──────────────────────────────────────────────── */
export function FormTextArea({ label, id, placeholder, value, onChange, error, required, rows = 4, ...props }) {
  return (
    <div className="form-group">
      {label && <label htmlFor={id} className="form-label-pub">{label}{required && <span className="form-required">*</span>}</label>}
      <textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className={`form-textarea-pub${error ? ' has-error' : ''}`}
        required={required}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}

/* ── Reusable Select ────────────────────────────────────────────────── */
export function FormSelect({ label, id, options, value, onChange, error, required, placeholder, ...props }) {
  return (
    <div className="form-group">
      {label && <label htmlFor={id} className="form-label-pub">{label}{required && <span className="form-required">*</span>}</label>}
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`form-select-pub${error ? ' has-error' : ''}`}
        required={required}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}

/* ── Reusable Checkbox ──────────────────────────────────────────────── */
export function FormCheckbox({ label, id, checked, onChange, ...props }) {
  return (
    <div className="form-checkbox-wrap">
      <input type="checkbox" id={id} checked={checked} onChange={onChange} className="form-checkbox" {...props} />
      <label htmlFor={id} className="form-checkbox-label">{label}</label>
    </div>
  );
}

/* ── Form Submit Button with loading state ──────────────────────────── */
export function SubmitButton({ children, loading, disabled, variant = 'primary', ...props }) {
  return (
    <button
      type="submit"
      className={`btn-pub btn-pub-${variant}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <span className="btn-loading">
          <span className="btn-spinner" />
          Processing...
        </span>
      ) : children}
    </button>
  );
}

/* ── Form Success / Error Status Messages ───────────────────────────── */
export function FormStatus({ type, message }) {
  if (!message) return null;
  return (
    <div className={`form-status form-status-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span className="form-status-icon">{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span>{message}</span>
    </div>
  );
}

/* ── useForm hook — shared validation + submission logic ────────────── */
export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (onSubmit) => {
    const validationErrors = validate ? validate(values) : {};
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      await onSubmit(values);
      setStatus({ type: 'success', message: 'Submitted successfully! We\'ll be in touch shortly.' });
      setValues(initialValues);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setStatus({ type: '', message: '' });
  };

  return { values, errors, status, loading, handleChange, handleSubmit, setErrors, setStatus, reset };
}
