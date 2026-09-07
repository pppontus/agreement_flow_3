"use client";

import { useState, useEffect, useEffectEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { useFlowState } from '@/context/FlowStateContext';
import { formatAddress, formatInvoiceAddress } from '@/services/addressService';
import { areAddressesEqual } from '@/flow/privateFlow';
import { formatSwedishDate } from '@/utils/formatters';
import {
  calculateComparePriceOrePerKwh,
  getActiveCompareConsumptionKwh,
  STANDARD_COMPARE_KWH_LEVELS,
  isValidCustomConsumptionKwh,
} from '@/services/comparePriceService';
import styles from './SigningFlow.module.css';

interface SigningFlowProps {
  onSigned: () => void;
  onCancel: () => void;
}

const formatMonths = (months: number) => `${months} ${months === 1 ? 'månad' : 'månader'}`;

export const SigningFlow = ({ onSigned, onCancel }: SigningFlowProps) => {
  const { state: rawState } = useFlowState();
  const [status, setStatus] = useState<'INIT' | 'PENDING' | 'SUCCESS'>('INIT');

  const startSigning = () => {
    setStatus('PENDING');
  };

  const finish = useEffectEvent(onSigned);
  useEffect(() => {
    if (status === 'INIT') return;
    const timer = setTimeout(() => {
      if (status === 'PENDING') setStatus('SUCCESS');
      else finish();
    }, status === 'PENDING' ? 3000 : 1000);
    return () => clearTimeout(timer);
  }, [status]);

  if (rawState.customerType !== 'PRIVATE') return null;
  const state = rawState;
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
    !areAddressesEqual(state.invoice.address, state.valdAdress, { includeApartmentNumber: true });
  const signingDescription =
    state.moveChoice === 'MOVE_EXISTING'
      ? 'När du signerar flyttas ditt avtal till adressen ovan.'
      : state.moveChoice === 'NEW_ON_NEW_ADDRESS'
        ? 'När du signerar tecknar du ett nytt avtal för adressen ovan.'
        : 'När du signerar bekräftar du avtalet för adressen ovan.';
  const formatter = new Intl.NumberFormat('sv-SE');
  const activeCompareConsumption = getActiveCompareConsumptionKwh({
    compareProfileKwh: state.compareProfileKwh,
    customConsumptionKwh: state.customConsumptionKwh,
  });
  const selectedProduct = state.selectedProduct;
  const hasDetailedPrice =
    selectedProduct?.energyPriceOrePerKwh !== undefined &&
    selectedProduct?.surchargeOrePerKwh !== undefined &&
    selectedProduct?.fixedFeeSekPerMonth !== undefined &&
    selectedProduct?.otherFeeSekPerMonth !== undefined;
  const contractTerms = selectedProduct?.contractTerms;
  const bindingLabel = contractTerms?.bindingMonths
    ? formatMonths(contractTerms.bindingMonths)
    : 'Ingen bindningstid';
  const terminationLabel = contractTerms
    ? formatMonths(contractTerms.noticeMonths)
    : '-';
  const compareRows = STANDARD_COMPARE_KWH_LEVELS.reduce<Array<{ kwh: number; price: number }>>(
    (rows, kwh) => {
      const price = calculateComparePriceOrePerKwh(selectedProduct, kwh);
      if (price !== null) {
        rows.push({ kwh, price });
      }
      return rows;
    },
    []
  );
  const customComparePrice = isValidCustomConsumptionKwh(state.customConsumptionKwh)
    ? calculateComparePriceOrePerKwh(selectedProduct, state.customConsumptionKwh)
    : null;
  const activeProfilePrice = calculateComparePriceOrePerKwh(selectedProduct, activeCompareConsumption);

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
                     {selectedProduct?.name}
                     {selectedProduct?.isDiscounted && <span className={styles.summaryDiscountBadge}>Rabatterat</span>}
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
                   <span className={styles.summaryValue}>{state.startDate ? formatSwedishDate(state.startDate) : '-'}</span>
                 </div>
                 {state.scenario === 'BYTE' && state.customer.contractEndDate && (
                   <div className={styles.summaryItem}>
                     <span className={styles.summaryLabel}>Nuvarande avtal bundet till:</span>
                     <span className={styles.summaryValue}>{formatSwedishDate(state.customer.contractEndDate)}</span>
                   </div>
                 )}
                 <div className={styles.summaryItem}>
                   <span className={styles.summaryLabel}>Nya avtalets bindningstid:</span>
                   <span className={styles.summaryValue}>{bindingLabel}</span>
                 </div>
                 <div className={styles.summaryItem}>
                   <span className={styles.summaryLabel}>Uppsägningstid:</span>
                   <span className={styles.summaryValue}>{terminationLabel}</span>
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
                 {selectedProduct && selectedProduct.pricePerKwh !== undefined && (
                   <div className={styles.summaryItem}>
                   <span className={styles.summaryLabel}>Pris:</span>
                   <span className={styles.summaryValue}>{selectedProduct.pricePerKwh.toFixed(2)} öre/kWh</span>
                 </div>
                 )}

                 {hasDetailedPrice && (
                   <>
                     <div className={styles.summaryItem}>
                       <span className={styles.summaryLabel}>Elpris:</span>
                       <span className={styles.summaryValue}>
                         {selectedProduct?.energyPriceOrePerKwh?.toFixed(2)} öre/kWh
                       </span>
                     </div>
                     <div className={styles.summaryItem}>
                       <span className={styles.summaryLabel}>Påslag:</span>
                       <span className={styles.summaryValue}>
                         {selectedProduct?.surchargeOrePerKwh?.toFixed(2)} öre/kWh
                       </span>
                     </div>
                     <div className={styles.summaryItem}>
                       <span className={styles.summaryLabel}>Fast avgift:</span>
                       <span className={styles.summaryValue}>
                         {selectedProduct?.fixedFeeSekPerMonth?.toFixed(0)} kr/mån
                       </span>
                     </div>
                     <div className={styles.summaryItem}>
                       <span className={styles.summaryLabel}>Övriga avgifter:</span>
                       <span className={styles.summaryValue}>
                         {selectedProduct?.otherFeeSekPerMonth?.toFixed(0)} kr/mån
                       </span>
                     </div>
                     {activeProfilePrice !== null && (
                       <div className={`${styles.summaryItem} ${styles.summaryItemStrong}`}>
                         <span className={styles.summaryLabel}>Jämförpris (din profil):</span>
                         <span className={styles.summaryValue}>{activeProfilePrice.toFixed(2)} öre/kWh</span>
                       </div>
                     )}
                     {compareRows.map((row) => (
                       <div key={row.kwh} className={styles.summaryItem}>
                         <span className={styles.summaryLabel}>Jämförpris ({formatter.format(row.kwh)} kWh):</span>
                         <span className={styles.summaryValue}>{row.price.toFixed(2)} öre/kWh</span>
                       </div>
                     ))}
                     {customComparePrice !== null && state.customConsumptionKwh && (
                       <div className={styles.summaryItem}>
                         <span className={styles.summaryLabel}>Jämförpris (egen {formatter.format(state.customConsumptionKwh)} kWh):</span>
                         <span className={styles.summaryValue}>{customComparePrice.toFixed(2)} öre/kWh</span>
                       </div>
                     )}
                     <div className={styles.summaryNotice}>
                       Detta avser elhandelsavtalet med Bixia. Elnätsavgift och energiskatt faktureras av ditt nätbolag och ingår inte här.
                     </div>
                   </>
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
