import React from 'react';
import { Link } from 'react-router-dom';
import NewsletterForm from '../ui/NewsletterForm';

const footerLinks = {
  'Platform': [
    { label: 'Threat Intelligence', href: '/solutions#threat-intelligence' },
    { label: 'Email Security', href: '/solutions#email-security' },
    { label: 'Endpoint Protection', href: '/solutions#endpoint-protection' },
    { label: 'Cloud Security', href: '/solutions#cloud-security' },
    { label: 'Pricing', href: '/pricing' },
  ],
  'Products': [
    { label: 'CyberSentinel Shield', href: '/products#shield' },
    { label: 'CyberSentinel Eye', href: '/products#eye' },
    { label: 'CyberSentinel Vault', href: '/products#vault' },
    { label: 'Platform Overview', href: '/app' },
  ],
  'Services': [
    { label: 'Managed Detection & Response', href: '/services#mdr' },
    { label: 'Penetration Testing', href: '/services#pen-testing' },
    { label: 'Incident Response', href: '/services#incident-response' },
    { label: 'Security Consulting', href: '/services#consulting' },
    { label: 'Security Training', href: '/services#training' },
  ],
  'Resources': [
    { label: 'Blog', href: '/blog' },
    { label: 'Case Studies', href: '/case-studies' },
    { label: 'Documentation', href: '/docs' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Resources Hub', href: '/resources' },
  ],
  'Company': [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Trust Center', href: '/trust' },
    { label: 'Partners', href: '/contact' },
  ],
};

const socialLinks = [];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'Security Policy', href: '/security' },
  { label: 'Responsible Disclosure', href: '/responsible-disclosure' },
];

export default function Footer() {
  return (
    <footer className="pub-footer" role="contentinfo">
      {/* Newsletter Section */}
      <div className="footer-newsletter">
        <div className="footer-newsletter-inner">
          <div className="footer-newsletter-text">
            <h3 className="footer-newsletter-title">Stay Ahead of Emerging Threats</h3>
            <p className="footer-newsletter-desc">Get weekly threat intelligence briefings, security research, and product updates delivered to your inbox.</p>
          </div>
          <div className="footer-newsletter-form">
            <NewsletterForm variant="footer" />
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="footer-main">
        <div className="footer-main-inner">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo" aria-label="CyberSentinel home">
              <img src="/logo.png" alt="" width="32" height="32" />
              <span className="footer-logo-text">CyberSentinel</span>
            </Link>
            <p className="footer-brand-desc">
              Enterprise cybersecurity platform providing AI-powered threat intelligence, endpoint protection, and managed detection & response services.
            </p>
            <div className="footer-certifications">
              <span className="footer-cert">SOC 2</span>
              <span className="footer-cert">ISO 27001</span>
              <span className="footer-cert">FedRAMP</span>
            </div>
            <div className="footer-social">
              {socialLinks.map(s => (
                <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label={`Follow us on ${s.name}`} title={s.name}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="footer-col">
              <h4 className="footer-col-title">{title}</h4>
              <ul className="footer-col-links">
                {links.map(link => (
                  <li key={link.href}>
                    <Link to={link.href} className="footer-link">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p className="footer-copyright">© {new Date().getFullYear()} CyberSentinel, Inc. All rights reserved.</p>
          <nav className="footer-legal" aria-label="Legal links">
            {legalLinks.map(link => (
              <Link key={link.href} to={link.href} className="footer-legal-link">{link.label}</Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
