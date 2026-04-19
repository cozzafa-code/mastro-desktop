'use client';
// ═══════════════════════════════════════════════════════════
// MASTRO — CostruttorePanel
// Wrapper React per il Costruttore Tipologie (HTML canvas)
// Carica costruttore.html in iframe fullscreen
// ═══════════════════════════════════════════════════════════
import React, { useRef, useEffect, useCallback } from 'react';

const DS = {
  teal: '#28A0A0',
  tealDark: '#156060',
  ink: '#0D1F1F',
  light: '#EEF8F8',
  border: '#C8E4E4',
  white: '#FFFFFF',
};

interface CostruttorePanelProps {
  onBack?: () => void;
}

export default function CostruttorePanel({ onBack }: CostruttorePanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for messages from the costruttore iframe
  const handleMessage = useCallback((e: MessageEvent) => {
    if (!e.data || e.data.source !== 'mastro-costruttore') return;

    switch (e.data.type) {
      case 'save-tipologia':
        // TODO: save to Supabase
        console.log('Tipologia salvata:', e.data.payload);
        break;
      case 'request-profili':
        // TODO: fetch from Supabase and send back
        console.log('Richiesta profili');
        break;
      case 'back':
        onBack?.();
        break;
    }
  }, [onBack]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        src="/costruttore.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        title="Costruttore Tipologie"
      />
    </div>
  );
}
