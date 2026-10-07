import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useStats } from './shared.js';

/* Make a QR code (as an SVG string) for any link. Red on white scans fine; keep the quiet zone. */
export function useQR(url, { dark = '#0b0b0c', light = '#ffffff' } = {}) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(url, { type: 'svg', margin: 2, errorCorrectionLevel: 'M', color: { dark, light } }).then(setSvg).catch(() => {});
  }, [url, dark, light]);
  return svg;
}

export function QRBox({ url = location.origin, className = '', dark, light }) {
  const svg = useQR(url, { dark, light });
  return <div className={`qr-box ${className}`} role="img" aria-label={`QR code for ${url}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export default function QRPage() {
  const { count } = useStats(4000);
  const host = location.host;
  return (
    <main style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', background: 'var(--red)', color: '#fff', padding: 24, textAlign: 'center' }}>
      <div style={{ display: 'grid', gap: 18, justifyItems: 'center' }}>
        <h1 style={{ fontSize: 'clamp(56px, 11vw, 150px)' }}>Sell yourself.</h1>
        <div style={{ background: '#fff', padding: 14, border: '4px solid #0b0b0c', boxShadow: '12px 12px 0 #1b3fe0', width: 'min(70vw, 62vh)' }}>
          <QRBox url={location.origin} />
        </div>
        <p style={{ fontFamily: 'var(--display)', fontSize: 34, letterSpacing: '.02em' }}>{host}</p>
        <p style={{ fontFamily: 'var(--accent)', fontStyle: 'italic', fontSize: 26 }}>{count} {count === 1 ? 'person has' : 'people have'} sold themselves so far</p>
      </div>
    </main>
  );
}
