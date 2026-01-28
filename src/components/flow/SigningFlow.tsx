"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import styles from './SigningFlow.module.css';

interface SigningFlowProps {
  onSigned: () => void;
  onCancel: () => void;
}

export const SigningFlow = ({ onSigned, onCancel }: SigningFlowProps) => {
  const [status, setStatus] = useState<'INIT' | 'PENDING' | 'SUCCESS'>('INIT');

  const startSigning = () => {
    setStatus('PENDING');
  };

  useEffect(() => {
    if (status === 'PENDING') {
      const timer = setTimeout(() => {
        setStatus('SUCCESS');
        setTimeout(onSigned, 1000); // Wait a second before redirecting
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, onSigned]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Signera avtalet</h2>
        <p className={styles.subtitle}>
          {status === 'INIT' 
            ? "Du är ett klick från att bli Bixia-kund!" 
            : "Öppna BankID-appen i din mobil och signera."}
        </p>
      </header>

      <div className={styles.content}>
        {status === 'INIT' && (
          <div className={styles.initView}>
             <div className={styles.iconWrapper}>✍️</div>
             <p className={styles.initText}>
               Klicka på knappen nedan för att starta signering med BankID.
             </p>
             <Button onClick={startSigning} className={styles.signButton}>
               Signera med BankID
             </Button>
          </div>
        )}

        {status === 'PENDING' && (
          <div className={styles.pendingView}>
            <div className={styles.spinner}></div>
            <p className={styles.pendingText}>Väntar på din underskrift...</p>
            <div className={styles.qrPlaceholder}>
              (QR KOD HÄR)
            </div>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className={styles.successView}>
            <div className={styles.successIcon}>✅</div>
            <p className={styles.successText}>Signering klar!</p>
          </div>
        )}
      </div>

      {status !== 'SUCCESS' && (
        <div className={styles.footer}>
           <button className={styles.backLink} onClick={onCancel}>
            {status === 'PENDING' ? 'Avbryt' : '← Tillbaka'}
          </button>
        </div>
      )}
    </div>
  );
};
