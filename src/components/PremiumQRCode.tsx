'use client';

/**
 * PremiumQRCode — SVG QR rendered via qr-code-styling.
 *
 * Props
 *   data     – The URL the QR encodes.
 *   color    – Main accent colour (dots + corner dots).
 *   pattern  – 'dots' | 'squares' — drives dot/corner shape variants.
 *   logoUrl  – Optional image URL to embed in the centre.
 */

import { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

interface PremiumQRCodeProps {
  data: string;
  color: string;
  pattern?: string;
  logoUrl?: string;
}

// Inline SVG data-URI — "Q" badge fallback when no logoUrl is provided.
const FALLBACK_LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230f172a'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui%2C sans-serif' font-weight='800' font-size='36' fill='white'%3EQ%3C/text%3E%3C/svg%3E";

/** Derive shape tokens from the free-form pattern string. */
function getShapes(pattern?: string) {
  const isSquare = pattern?.toLowerCase().includes('square') ?? false;
  return {
    dotShape:         isSquare ? 'square'       : 'rounded',
    cornerDotShape:   isSquare ? 'square'       : 'dot',
    cornerSquareShape: isSquare ? 'square'      : 'extra-rounded',
  } as const;
}

export default function PremiumQRCode({ data, color, pattern, logoUrl }: PremiumQRCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef        = useRef<QRCodeStyling | null>(null);

  // ── Mount: create instance once and append to DOM ───────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const { dotShape, cornerDotShape, cornerSquareShape } = getShapes(pattern);

    const qrCode = new QRCodeStyling({
      width: 300,
      height: 300,
      type: 'svg',           // resolution-independent — perfect for print
      data,
      image: logoUrl ?? FALLBACK_LOGO,
      dotsOptions: {
        type: dotShape,
        color,
      },
      cornersSquareOptions: {
        type: cornerSquareShape,
        color: '#020617',
      },
      cornersDotOptions: {
        type: cornerDotShape,
        color,
      },
      backgroundOptions: {
        color: 'transparent',
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 10,
      },
      qrOptions: {
        errorCorrectionLevel: 'M',
      },
    });

    qrRef.current = qrCode;
    qrCode.append(containerRef.current);

    return () => {
      if (containerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.innerHTML = '';
      }
      qrRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once — prop changes handled below

  // ── Update: propagate prop changes without re-mounting ──────────────────
  useEffect(() => {
    if (!qrRef.current) return;

    const { dotShape, cornerDotShape, cornerSquareShape } = getShapes(pattern);

    qrRef.current.update({
      data,
      image: logoUrl ?? FALLBACK_LOGO,
      dotsOptions: {
        type: dotShape,
        color,
      },
      cornersSquareOptions: {
        type: cornerSquareShape,
        color: '#020617',
      },
      cornersDotOptions: {
        type: cornerDotShape,
        color,
      },
    });
  }, [data, color, pattern, logoUrl]);

  return (
    <div
      ref={containerRef}
      /**
       * w-full h-full fills the fixed-size parent box completely.
       * The child-selector overrides force the injected 300×300 SVG/canvas
       * to respect the parent's dimensions and never overflow vertically.
       */
      className="w-full h-full flex items-center justify-center [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:max-w-full [&>canvas]:object-contain [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full"
    />
  );
}
