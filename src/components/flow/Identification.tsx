"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IdMethod } from '@/types';
import styles from './Identification.module.css';

interface IdentificationProps {
  onAuthenticated: (pnr: string, method: IdMethod) => Promise<void>;
  onCancelRequest: () => void;
  onBack: () => void;
  bankIdOnly?: boolean; // If true, hide manual PNR option (for security verification)
  securityMessage?: string; // Optional message to show why BankID is required
  backLabel?: string;
}

type ViewState = 'METHOD_SELECT' | 'BANKID_PENDING' | 'MANUAL_PNR';

export const Identification = ({ onAuthenticated, onCancelRequest, onBack, bankIdOnly, securityMessage, backLabel = 'Tillbaka till adress' }: IdentificationProps) => {
  const [view, setView] = useState<ViewState>('METHOD_SELECT');
  const [pnr, setPnr] = useState('');
  const [pnrError, setPnrError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const callbacks = useRef({ onAuthenticated, onCancelRequest });
  useLayoutEffect(() => { callbacks.current = { onAuthenticated, onCancelRequest }; });
  const request = useRef(0);
  const retry = useRef<{ pnr: string; method: IdMethod } | null>(null);
  useEffect(() => () => { request.current += 1; callbacks.current.onCancelRequest(); }, []);
  const authenticate = useCallback(async (pnr: string, method: IdMethod) => {
    const id = ++request.current;
    retry.current = { pnr, method };
    setRequestError(''); setIsLoading(true);
    try {
      await callbacks.current.onAuthenticated(pnr, method);
      if (id === request.current) { setView('METHOD_SELECT'); setIsLoading(false); }
    } catch {
      if (id === request.current) {
        setIsLoading(false);
        setRequestError('Det gick inte att hämta dina uppgifter. Försök igen.');
      }
    }
  }, []);
  const cancel = () => {
    request.current += 1;
    callbacks.current.onCancelRequest();
    setIsLoading(false); setRequestError(''); setView('METHOD_SELECT');
    retry.current = null;
  };
  useEffect(() => {
    if (view !== 'BANKID_PENDING') return;
    const timer = setTimeout(() => { void authenticate('19850101-1234', 'BANKID_MOBILE'); }, 3000);
    return () => clearTimeout(timer);
  }, [view, authenticate]);

  const effectiveView: ViewState = bankIdOnly
    ? (view === 'BANKID_PENDING' ? 'BANKID_PENDING' : 'METHOD_SELECT')
    : view;

  const handleManualSubmit = () => {
    // Strip all non-digit characters
    const normalized = pnr.replace(/\D/g, '');
    
    // Check if it's 10 or 12 digits
    if (normalized.length === 10 || normalized.length === 12) {
      // For display/logic consistency, we could transform 10 to 12 or just keep as is
      // Here we just accept it and pass it on
      void authenticate(normalized, 'MANUAL_PNR');
    } else {
      setPnrError('Personnummer måste vara 10 eller 12 siffror');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>{bankIdOnly ? 'Verifiera med BankID' : 'Spara tid med BankID'}</h2>
        <p className={styles.subtitle}>
          {securityMessage || 'Med BankID fyller vi i dina uppgifter automatiskt.'}
        </p>
      </header>

      <div className={styles.content}>
        {isLoading && <p role="status">Hämtar dina uppgifter…</p>}
        {requestError && <div role="alert"><p>{requestError}</p><Button onClick={() => { if (retry.current) void authenticate(retry.current.pnr, retry.current.method); }}>Försök igen</Button></div>}
        {effectiveView === 'METHOD_SELECT' && (
          <div className={styles.methodSelect}>
            <div className={styles.stepsOverview}>
              <p className={styles.stepsHeading}>Så här går det till:</p>
              <ol className={styles.stepsList}>
                <li>Välj identifieringsmetod</li>
                <li>Vi hämtar dina uppgifter</li>
                <li>Du går vidare i flödet</li>
              </ol>
            </div>

            <div className={styles.methodOptions}>
              <button
                className={`${styles.methodCard} ${styles.methodCardPrimary}`}
                onClick={() => setView('BANKID_PENDING')}
              >
                <span className={styles.methodIcon}>📲</span>
                <span className={styles.methodText}>
                  <span className={styles.methodTitle}>Fortsätt med BankID</span>
                  <span className={styles.methodMeta}>Snabbast, vi fyller i uppgifter åt dig.</span>
                </span>
              </button>

              {!bankIdOnly && (
                <button
                  className={styles.methodCard}
                  onClick={() => setView('MANUAL_PNR')}
                >
                  <span className={styles.methodIcon}>📝</span>
                  <span className={styles.methodText}>
                    <span className={styles.methodTitle}>Fortsätt manuellt</span>
                    <span className={styles.methodMeta}>Du fyller i personnummer själv.</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {effectiveView === 'BANKID_PENDING' && (
          <div className={styles.bankIdPending}>
            <div className={styles.qrContainer}>
              {/* Simulated QR code */}
              <div className={styles.qrCode}>
                <div className={styles.qrBox}>
                  <div className={styles.qrPattern}></div>
                <div className={styles.qrOverlay}>
                  <span className={styles.qrIcon}>🔐</span>
                  <span className={styles.qrInfoText}>Prototyp – skanna ej</span>
                </div>
                </div>
              </div>
            </div>
            <p className={styles.pendingText}>Skanna QR-koden i BankID-appen.</p>
            <div className={styles.bankIdActions}>
              <div className={styles.smallSpinner}></div>
              <span>Väntar på BankID...</span>
            </div>
            <Button variant="outline" onClick={cancel}>
              Avbryt
            </Button>
          </div>
        )}

        {effectiveView === 'MANUAL_PNR' && (
          <div className={styles.manualPnr}>
            <p className={styles.manualInfo}>BankID krävs när du signerar avtalet.</p>
            <Input 
              label="Personnummer"
              placeholder="ÅÅÅÅMMDD-XXXX"
              value={pnr}
              onChange={(e) => {
                setPnr(e.target.value);
                setPnrError('');
              }}
              error={pnrError}
              autoFocus
            />
            <div className={styles.actions}>
              <Button onClick={handleManualSubmit} disabled={!pnr || isLoading}>
                Fortsätt
              </Button>
              <button 
                className={styles.backLink}
                onClick={cancel}
              >
                ← Tillbaka till val
              </button>
            </div>
          </div>
        )}
      </div>

      {effectiveView === 'METHOD_SELECT' && (
        <button className={styles.globalBackLink} onClick={onBack}>
          ← {backLabel}
        </button>
      )}
    </div>
  );
};
