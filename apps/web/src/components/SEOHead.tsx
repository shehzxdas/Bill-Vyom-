import { useEffect } from "react";

export default function SEOHead() {
  useEffect(() => {
    // Set Document Title
    document.title = "Bill Vyom — Global Business Operating System | Unified Business Platform";

    // Set Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute(
      "content",
      "Bill Vyom is a Global Business Operating System connecting finance, sales, inventory, purchasing, POS, CRM, HR, and operations into one unified, multi-tenant platform."
    );

    // Add JSON-LD Structured Data for SEO / AEO / GEO / LLMs
    const schemaData = [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Bill Vyom",
        "url": "https://billvyom.com",
        "logo": "https://billvyom.com/logo.png",
        "description": "Global Business Operating System for modern enterprises and SMEs.",
        "sameAs": []
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Bill Vyom Operating System",
        "operatingSystem": "Web, Windows, macOS, Linux, Android, iOS, POS",
        "applicationCategory": "BusinessApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "description": "Early Access Enterprise Trial"
        },
        "description": "Unified platform for business finance, inventory, POS, accounting, sales, purchasing, and operations."
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is Bill Vyom?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Bill Vyom is a Global Business Operating System (GBOS) that unifies finance, accounting, sales, inventory, purchasing, POS, CRM, HR, analytics, and automation into a single connected platform."
            }
          },
          {
            "@type": "Question",
            "name": "Who is Bill Vyom for?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Bill Vyom is designed for growing SMEs, multi-branch retail stores, wholesalers, distributors, manufacturers, e-commerce brands, and global enterprise operations."
            }
          },
          {
            "@type": "Question",
            "name": "How does Bill Vyom differ from traditional billing or accounting software?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Unlike fragmented point solutions that force businesses to manually reconcile data across disconnected tools, Bill Vyom operates as a single connected platform where a sale automatically updates inventory, logs accounting entries, and refreshes analytics in real time."
            }
          },
          {
            "@type": "Question",
            "name": "Does Bill Vyom support multi-company, multi-branch, and multi-country operations?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Bill Vyom is architected from the ground up for multi-tenant, multi-company, multi-branch, multi-currency, and multi-jurisdiction compliance."
            }
          }
        ]
      }
    ];

    let scriptTag = document.getElementById("json-ld-schema");
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = "json-ld-schema";
      scriptTag.setAttribute("type", "application/ld+json");
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schemaData);
  }, []);

  return null;
}
