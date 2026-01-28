"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IdMethod } from '@/types';
import styles from './Identification.module.css';

interface IdentificationProps {
  onAuthenticated: (pnr: string, method: IdMethod) => void;
  onBack: () => void;
}

type ViewState = 'METHOD_SELECT' | 'BANKID_PENDING' | 'MANUAL_PNR';

export const Identification = ({ onAuthenticated, onBack }: IdentificationProps) => {
  const [view, setView] = useState<ViewState>('METHOD_SELECT');
  const [pnr, setPnr] = useState('');
  const [pnrError, setPnrError] = useState('');

  // Simulation: Move from BankID pending to authenticated after a delay
  useEffect(() => {
    if (view === 'BANKID_PENDING') {
      const timer = setTimeout(() => {
        onAuthenticated('19850101-1234', 'BANKID_MOBILE');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [view, onAuthenticated]);

  const handleManualSubmit = () => {
    // Strip all non-digit characters
    const normalized = pnr.replace(/\D/g, '');
    
    // Check if it's 10 or 12 digits
    if (normalized.length === 10 || normalized.length === 12) {
      // For display/logic consistency, we could transform 10 to 12 or just keep as is
      // Here we just accept it and pass it on
      onAuthenticated(normalized, 'MANUAL_PNR');
    } else {
      setPnrError('Personnummer måste vara 10 eller 12 siffror');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Identifiering</h2>
        <p className={styles.subtitle}>
          Vi behöver veta vem du är för att hämta dina uppgifter.
        </p>
      </header>

      <div className={styles.content}>
        {view === 'METHOD_SELECT' && (
          <div className={styles.methodSelect}>
            <Button 
              variant="primary" 
              fullWidth 
              onClick={() => setView('BANKID_PENDING')}
              className={styles.bankIdButton}
            >
              <span className={styles.bankIdIcon}>📲</span>
              Mobilt BankID
            </Button>
            
            <div className={styles.divider}>
              <span>eller</span>
            </div>

            <button 
              className={styles.manualLink}
              onClick={() => setView('MANUAL_PNR')}
            >
              Jag har inte BankID / Vill ange manuellt
            </button>
          </div>
        )}

        {view === 'BANKID_PENDING' && (
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
            <p className={styles.pendingText}>Skanna QR-koden med din BankID-app för att logga in.</p>
            <div className={styles.bankIdActions}>
              <div className={styles.smallSpinner}></div>
              <span>Väntar på skanning...</span>
            </div>
            <Button variant="outline" onClick={() => setView('METHOD_SELECT')}>
              Avbryt
            </Button>
          </div>
        )}

        {view === 'MANUAL_PNR' && (
          <div className={styles.manualPnr}>
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
              <Button onClick={handleManualSubmit} disabled={!pnr}>
                Fortsätt
              </Button>
              <button 
                className={styles.backLink}
                onClick={() => setView('METHOD_SELECT')}
              >
                ← Tillbaka till metodval
              </button>
            </div>
          </div>
        )}
      </div>

      {view === 'METHOD_SELECT' && (
        <button className={styles.globalBackLink} onClick={onBack}>
          ← Tillbaka till adress
        </button>
      )}
    </div>
  );
};
