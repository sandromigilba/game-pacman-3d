import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'PACMAN 3D // Cyber Arcade Web Game',
  description = 'Experience the ultimate 3D Pacman arcade reimagined in gorgeous retro-neon web graphics. Play instantly on mobile or desktop with synthesized chiptune audio, customizable themes, and smooth 60fps performance.',
  keywords = 'pacman, 3d pacman, play pacman 3d, pacman online, retro arcade, react three fiber, three.js game, webgl games',
  canonicalUrl = 'https://game-pacman-3d.vercel.app',
}) => {
  const schemaJsonLD = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": "PACMAN 3D // Cyber Arcade",
    "description": description,
    "genre": ["Arcade", "Action"],
    "playMode": "SinglePlayer",
    "applicationCategory": "Game",
    "operatingSystem": "Web / Browser",
    "author": {
      "@type": "Organization",
      "name": "Cyber Arcade Studios"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Cyber Arcade Studios"
    },
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD",
      "category": "free"
    }
  };

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${canonicalUrl}/hero-preview.png`} />
      <meta property="og:site_name" content="PACMAN 3D Cyber Arcade" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${canonicalUrl}/hero-preview.png`} />

      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaJsonLD)}
      </script>
    </Helmet>
  );
};
export default SEO;
