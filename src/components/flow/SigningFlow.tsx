"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useFlowState } from '@/hooks/useFlowState';
import { formatAddress } from '@/services/addressService';
import styles from './SigningFlow.module.css';

interface SigningFlowProps {
  onSigned: () => void;
  onCancel: () => void;
}

export const SigningFlow = ({ onSigned, onCancel }: SigningFlowProps) => {
  const { state } = useFlowState();
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
             <div className={styles.summaryContainer}>
               <h3 className={styles.summaryTitle}>Sammanfattning</h3>
               <div className={styles.summaryGrid}>
                 <div className={styles.summaryItem}>
                   <span className={styles.summaryLabel}>Avtal:</span>
                   <span className={styles.summaryValue}>
                     {state.selectedProduct?.name}
                     {state.selectedProduct?.isDiscounted && <span className={styles.summaryDiscountBadge}>Rabatterat</span>}
                   </span>
                 </div>
                 <div className={styles.summaryItem}>
                   <span className={styles.summaryLabel}>Adress:</span>
                   <span className={styles.summaryValue}>
                     {state.valdAdress ? formatAddress(state.valdAdress) : '-'}
                   </span>
                 </div>
                 <div className={styles.summaryItem}>
                   <span className={styles.summaryLabel}>Startdatum:</span>
                   <span className={styles.summaryValue}>{state.startDate || '-'}</span>
                 </div>
                 {state.selectedProduct?.pricePerKwh !== undefined && (
                   <div className={styles.summaryItem}>
                     <span className={styles.summaryLabel}>Pris:</span>
                     <span className={styles.summaryValue}>{state.selectedProduct.pricePerKwh.toFixed(2)} öre/kWh</span>
                   </div>
                 )}
               </div>
             </div>
             
             <p className={styles.initText}>
               Klicka på knappen nedan för att starta signering med BankID. Genom att signera godkänner du att ett nytt elavtal tecknas för ovanstående adress.
             </p>
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

      <div className={styles.footer}>
        {status === 'INIT' ? (
          <Button onClick={startSigning} className={styles.signButton}>
            Signera med BankID
          </Button>
        ) : status === 'PENDING' ? (
          <div className={styles.pendingPlaceholder} />
        ) : null}

        {status !== 'SUCCESS' && (
          <button className={styles.backLink} onClick={onCancel}>
            {status === 'PENDING' ? 'Avbryt' : '← Tillbaka'}
          </button>
        )}
      </div>
    </div>
  );
};
