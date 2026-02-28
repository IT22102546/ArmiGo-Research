import type { Metadata } from "next";
import { Inter, Comic_Neue } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

// Optional: Add a playful font for child-friendly headings
const comicNeue = Comic_Neue({
  variable: "--font-comic",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArmiGo - Rehabilitation Through Play for Hemiplegic Children",
  description:
    "Innovative IoT devices and VR games that make rehabilitation fun for children aged 6-14 with hemiplegia. Track progress, engage kids, and empower families.",
  keywords: [
    "pediatric rehabilitation",
    "hemiplegia treatment",
    "children therapy",
    "VR rehabilitation",
    "IoT medical devices",
    "arm therapy for children",
    "hemiplegic children",
    "rehabilitation games"
  ],
  authors: [{ name: "ArmiGo" }],
  openGraph: {
    title: "ArmiGo - Rehabilitation Through Play",
    description: "Turn rehab into adventure with smart devices and VR games for children with hemiplegia.",
    url: "https://armigo.com",
    siteName: "ArmiGo",
    images: [
      {
        url: "/assets/logo.png",
        width: 1200,
        height: 630,
        alt: "ArmiGo - Rehabilitation Through Play",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ArmiGo - Rehabilitation Through Play",
    description: "Turn rehab into adventure with smart devices and VR games for children with hemiplegia.",
    images: ["/assets/logo.png"],
  },
  icons: {
    icon: "/assets/logo.png",
    shortcut: "/assets/logo.png",
    apple: "/assets/logo.png",
  },
  manifest: "/manifest.json",
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${comicNeue.variable}`}>
      <head>
        {/* Preload logo for better performance */}
        <link rel="preload" as="image" href="/assets/logo.png" />
        
        {/* Add theme color for mobile browsers */}
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Structured data for better SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalOrganization",
              "name": "ArmiGo",
              "description": "Rehabilitation through play for hemiplegic children",
              "url": "https://armigo.com",
              "logo": "/assets/logo.png",
              "sameAs": [
                "https://facebook.com/armigo",
                "https://twitter.com/armigo",
                "https://linkedin.com/company/armigo"
              ],
              "medicalSpecialty": "Pediatric Rehabilitation",
              "availableService": [
                {
                  "@type": "MedicalTherapy",
                  "name": "IoT-based Arm Rehabilitation",
                  "description": "Smart devices for finger, wrist, elbow, and shoulder therapy"
                },
                {
                  "@type": "MedicalTherapy",
                  "name": "VR-based Play Therapy",
                  "description": "Engaging games for pediatric rehabilitation"
                }
              ]
            })
          }}
        />
      </head>
      <body className="antialiased font-sans">
        {children}
        
        {/* Optional: Add a simple script to handle service worker registration for PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}