'use client';
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  includeMargin?: boolean;
}

export const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({
  value,
  size = 200,
  className = '',
  includeMargin = true
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value, {
      width: size * 2, // 2x for retina crispness
      margin: includeMargin ? 2 : 0,
      color: {
        dark: '#1e293b', // Slate 800
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, includeMargin]);

  if (error) {
    return <div className="text-red-500 text-xs p-2">Erreur QR Code: {error}</div>;
  }

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400 text-xs"
      >
        Génération du QR Code...
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Code ${value}`}
      width={size}
      height={size}
      className={`rounded-lg shadow-inner ${className}`}
    />
  );
};
