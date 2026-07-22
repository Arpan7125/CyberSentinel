import { useEffect } from 'react';

const SITE_NAME = 'CyberSentinel';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://cybersentinel.ai';

/**
 * SEOHead — Updates document <head> meta tags for the current page.
 * Call this at the top of every page component.
 *
 * @param {object} props
 * @param {string} props.title - Page title (appended to site name)
 * @param {string} props.description - Meta description (max 160 chars)
 * @param {string} [props.path] - Canonical path (e.g. "/about")
 * @param {string} [props.image] - OG image URL
 * @param {string} [props.type] - OG type (default: "website")
 * @param {object} [props.structuredData] - JSON-LD structured data object
 */
export default function SEOHead({ title, description, path = '', image, type = 'website', structuredData }) {
  useEffect(() => {
    // Title
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Enterprise Cybersecurity Platform`;
    document.title = fullTitle;

    // Helper to set or create a meta tag
    const setMeta = (attribute, key, content) => {
      let el = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attribute, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard meta
    setMeta('name', 'description', description || 'CyberSentinel delivers enterprise-grade cybersecurity solutions including threat intelligence, endpoint protection, and managed detection & response.');

    // Canonical URL
    const canonicalUrl = `${SITE_URL}${path}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // Open Graph
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description || '');
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', SITE_NAME);
    if (image) setMeta('property', 'og:image', image);

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description || '');
    if (image) setMeta('name', 'twitter:image', image);

    // Structured Data (JSON-LD)
    const existingLd = document.querySelector('script[data-seo-ld]');
    if (existingLd) existingLd.remove();

    if (structuredData) {
      const script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-seo-ld', 'true');
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup structured data on unmount
      const ld = document.querySelector('script[data-seo-ld]');
      if (ld) ld.remove();
    };
  }, [title, description, path, image, type, structuredData]);

  return null; // This component renders nothing — it only manages <head>
}

/**
 * Pre-built structured data generators for common page types.
 */
export const schemas = {
  organization: () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CyberSentinel',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Enterprise cybersecurity platform providing threat intelligence, endpoint protection, and managed detection & response services.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '200 Sentinel Plaza, Suite 1500',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94105',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-800-SENTINEL',
      contactType: 'sales',
      availableLanguage: ['English'],
    },
    sameAs: [
      'https://twitter.com/cybersentinel',
      'https://linkedin.com/company/cybersentinel',
      'https://github.com/cybersentinel',
    ],
  }),

  webpage: (name, description, url) => ({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: `${SITE_URL}${url}`,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
  }),

  article: (title, description, datePublished, authorName, url) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished,
    author: { '@type': 'Person', name: authorName },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    url: `${SITE_URL}${url}`,
  }),

  faqPage: (questions) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  }),

  product: (name, description, price, currency = 'USD') => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
    },
  }),
};
