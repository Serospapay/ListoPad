import type { SyntheticEvent } from 'react';

const FALLBACK_COVER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1f2937"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="600" height="900" fill="url(#bg)"/>
  <rect x="48" y="48" width="504" height="804" fill="none" stroke="#374151" stroke-width="2"/>
  <text x="300" y="430" text-anchor="middle" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="42" font-weight="700">
    NO COVER
  </text>
  <text x="300" y="485" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="24">
    Image unavailable
  </text>
</svg>
`.trim();

export const FALLBACK_COVER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(FALLBACK_COVER_SVG)}`;

export const withCoverFallback = (event: SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === '1') {
    return;
  }
  image.dataset.fallbackApplied = '1';
  image.src = FALLBACK_COVER_IMAGE;
};
