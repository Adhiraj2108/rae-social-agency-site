export const SITE_URL = 'https://www.raesocialagency.com';
/** Kept on <html data-wf-site> because webflow.js reads it to run the site's IX3 interactions. */
export const WEBFLOW_SITE_ID = '6abe0e27763529229eb860de';

export const pages = {
  home: {
    title: 'Rae Social Agency | Content-focused social media & creative agency',
    description:
      'Rae Social Agency is a Melbourne content-focused social media and creative agency. Campaign production, content production, social media and influencer management, and paid media.',
    ogTitle: 'Rae Social Agency | Content-focused social media & creative agency',
    ogDescription:
      'Content-focused social media and creative agency in Melbourne. We find what makes you matter, then amplify it.',
    ogImage: '/images/hero-image.avif',
    wfPage: '6abe0e29763529229eb86151',
  },
  notFound: {
    title: 'Page not found | Rae Social Agency',
    description: 'This page could not be found. Head back to Rae Social Agency to see our work and services.',
    wfPage: '6abe0e29763529229eb86154',
  },
};

/** JSON-LD for the home page (from the Webflow page settings). */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": "https://www.raesocialagency.com/#organization",
      "name": "Rae Social Agency",
      "description": "Content-focused social media and creative agency offering campaign production, content production, social media management, influencer management and paid media.",
      "email": "hello@raesocialagency.com",
      "image": `${SITE_URL}/images/hero-image.avif`,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "8 Franklin St",
        "addressLocality": "Melbourne",
        "addressRegion": "VIC",
        "postalCode": "3000",
        "addressCountry": "AU"
      },
      "sameAs": [
        "https://www.instagram.com/raesocialagency/"
      ],
      "areaServed": "AU",
      "makesOffer": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Campaign production"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Content production"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Social media management"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Influencer management"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Paid media"
          }
        }
      ]
    },
    {
      "@type": "WebPage",
      "name": "Rae Social Agency",
      "about": {
        "@id": "https://www.raesocialagency.com/#organization"
      }
    }
  ]
};
