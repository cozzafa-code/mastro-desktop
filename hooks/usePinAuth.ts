import { useState, useCallback } from 'react';

export function usePinAuth(azId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyPin = useCallback(async (memberId: string, pin: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/mastro/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', memberId, pin, azId }),
      });
      const data = await r.json();
      if (!data.ok) { setError(data.error); return false; }
      return true;
    } catch {
      setError('Errore di rete');
      return false;
    } finally {
      setLoading(false);
    }
  }, [azId]);

  const setPin = useCallback(async (memberId: string, pin: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/mastro/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set', memberId, pin, azId }),
      });
      const data = await r.json();
      if (!data.ok) { setError(data.error); return false; }
      return true;
    } catch {
      setError('Errore di rete');
      return false;
    } finally {
      setLoading(false);
    }
  }, [azId]);

  const removePin = useCallback(async (memberId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/mastro/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', memberId, azId }),
      });
      const data = await r.json();
      if (!data.ok) { setError(data.error); return false; }
      return true;
    } catch {
      setError('Errore di rete');
      return false;
    } finally {
      setLoading(false);
    }
  }, [azId]);

  const unlockMember = useCallback(async (memberId: string): Promise<boolean> => {
    const r = await fetch('/api/mastro/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unlock', memberId, azId }),
    });
    return (await r.json()).ok === true;
  }, [azId]);

  return { verifyPin, setPin, removePin, unlockMember, loading, error };
}
