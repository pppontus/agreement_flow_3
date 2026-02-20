"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useFlowState } from '@/hooks/useFlowState';
import { formatAddress, formatInvoiceAddress } from '@/services/addressService';
import styles from './SigningFlow.module.css';

interface SigningFlowProps {
  onSigned: () => void;
  onCancel: () => void;
}

export const SigningFlow = ({ onSigned, onCancel }: SigningFlowProps) => {
  const { state: rawState } = useFlowState();
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

  if (rawState.customerType !== 'PRIVATE') return null;
  const state = rawState;
  const isSameAddress = (
    a: { street: string; number: string; postalCode: string; city: string; apartmentNumber?: string } | null | undefined,
    b: { street: string; number: string; postalCode: string; city: string; apartmentNumber?: string } | null | undefined
  ) => {
    if (!a || !b) return false;
    return (
      a.street === b.street &&
      a.number === b.number &&
      a.postalCode === b.postalCode &&
      a.city === b.city &&
      (a.apartmentNumber || '') === (b.apartmentNumber || '')
    );
  };
  const moveChoiceLabel =
    state.moveChoice === 'MOVE_EXISTING'
      ? 'Flytta med befintligt avtal'
      : state.moveChoice === 'NEW_ON_NEW_ADDRESS'
        ? 'Teckna nytt avtal på ny adress'
        : null;
  const agreementPathLabel =
    state.scenario === 'FLYTT'
      ? moveChoiceLabel || 'Flytt'
      : state.scenario === 'BYTE'
        ? 'Byte på befintlig adress'
        : state.scenario === 'NY'
          ? 'Nyteckning'
          : state.scenario === 'EXTRA'
            ? 'Befintlig adress med samma avtal'
            : '-';
  const facilityHandlingValue =
    state.facilityHandling?.mode === 'FROM_CRM'
      ? (state.facilityHandling.facilityId || '-')
      : state.facilityHandling?.mode === 'FETCH_WITH_POWER_OF_ATTORNEY'
      ? 'Hämtas via fullmakt'
      : state.facilityHandling?.mode === 'MANUAL'
        ? (state.facilityHandling.facilityId || '-')
        : null;
  const facilityHandlingLabel =
    'Anläggnings-ID';
  const invoiceAddressValue =
    state.invoice?.address
      ? formatInvoiceAddress(state.invoice)
      : '-';
  const showInvoiceAddress =
    !!state.invoice?.address &&
    !isSameAddress(state.invoice.address, state.valdAdress || undefined);
  const signingDescription =
    state.moveChoice === 'MOVE_EXISTING'
      ? 'När du signerar flyttas ditt avtal till adressen ovan.'
      : state.moveChoice === 'NEW_ON_NEW_ADDRESS'
        ? 'När du signerar tecknar du ett nytt avtal för adressen ovan.'
        : 'När du signerar bekräftar du avtalet för adressen ovan.';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Signera avtalet</h2>
        <p className={styles.subtitle}>
          {status === 'INIT' 
            ? "Sista steget. Signera med BankID." 
            : "Öppna BankID och signera."}
        </p>
      </header>

      <div className={styles.content}>
        {status === 'INIT' && (
          <div className={styles.initView}>
             <div className={styles.summaryContainer}>
               <h3 className={styles.summaryTitle}>Det här signerar du</h3>
               <div className={styles.summaryGrid}>
                 <div className={styles.summaryItem}>
                   <span className={styles.summaryLabel}>Avtal:</span>
                   <span className={styles.summaryValue}>
                     {state.selectedProduct?.name}
                     {state.selectedProduct?.isDiscounted && <span className={styles.summaryDiscountBadge}>Rabatterat</span>}
                   </span>
                 </div>
                 <div className={styles.summaryItem}>
                   <span className={styles.summaryLabel}>Ärende:</span>
                   <span className={styles.summaryValue}>{agreementPathLabel}</span>
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
                 {showInvoiceAddress && (
                   <div className={styles.summaryItem}>
                     <span className={styles.summaryLabel}>Fakturaadress:</span>
                     <span className={styles.summaryValue}>{invoiceAddressValue}</span>
                   </div>
                 )}
                 {facilityHandlingValue && (
                   <div className={styles.summaryItem}>
                     <span className={styles.summaryLabel}>{facilityHandlingLabel}:</span>
                     <span className={styles.summaryValue}>{facilityHandlingValue}</span>
                   </div>
                 )}
                 {state.selectedProduct?.pricePerKwh !== undefined && (
                   <div className={styles.summaryItem}>
                   <span className={styles.summaryLabel}>Pris:</span>
                   <span className={styles.summaryValue}>{state.selectedProduct.pricePerKwh.toFixed(2)} öre/kWh</span>
                 </div>
                 )}
               </div>
             </div>
             
             <p className={styles.initText}>
               {signingDescription}
             </p>
          </div>
        )}

        {status === 'PENDING' && (
          <div className={styles.pendingView}>
            <div className={styles.spinner}></div>
            <p className={styles.pendingText}>Väntar på signering...</p>
            <div className={styles.qrPlaceholder}>
              (QR KOD HÄR)
            </div>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className={styles.successView}>
            <div className={styles.successIcon}>✅</div>
            <p className={styles.successText}>Signering genomförd!</p>
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
