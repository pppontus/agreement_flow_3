"use client";

import { Button } from '@/components/ui/Button';
import { Product, Address, FacilityHandling, Invoice } from '@/types';
import { formatAddress, formatInvoiceAddress } from '@/services/addressService';
import styles from './Confirmation.module.css';

interface ConfirmationProps {
  orderId: string;
  product?: Product;
  address?: Address;
  email?: string;
  invoice?: Invoice;
  facilityHandling?: FacilityHandling;
  canSelectExtraServices: boolean;
  onContinue: () => void;
}

export const Confirmation = ({
  orderId,
  product,
  address,
  email,
  invoice,
  facilityHandling,
  canSelectExtraServices,
  onContinue,
}: ConfirmationProps) => {
  const facilitySummaryText = (() => {
    if (!facilityHandling) return null;
    if (facilityHandling.mode === 'FROM_CRM') {
      return `${facilityHandling.facilityId || '-'} (hämtat från CRM)`;
    }
    if (facilityHandling.mode === 'FETCH_WITH_POWER_OF_ATTORNEY') {
      return 'Hämtas via fullmakt. Fullmakt skickas till dig.';
    }
    return facilityHandling.facilityId || '-';
  })();

  const invoiceSummaryText = invoice?.address ? formatInvoiceAddress(invoice) : null;

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>🎉</div>

      <header className={styles.header}>
        <h2 className={styles.title}>Tack för din beställning!</h2>
        <p className={styles.subtitle}>
          Du är nu kund hos Bixia. Din order <strong>{orderId}</strong> är mottagen.
        </p>
      </header>

      <div className={styles.summaryCard}>
        <div className={styles.row}>
          <span className={styles.label}>Produkt:</span>
          <span className={styles.value}>{product?.name || '-'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Adress:</span>
          <span className={styles.value}>{address ? formatAddress(address) : '-'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Bekräftelse skickad till:</span>
          <span className={styles.value}>{email || '-'}</span>
        </div>
        {invoiceSummaryText && (
          <div className={styles.row}>
            <span className={styles.label}>Fakturaadress:</span>
            <span className={styles.value}>{invoiceSummaryText}</span>
          </div>
        )}
        {facilitySummaryText && (
          <div className={styles.row}>
            <span className={styles.label}>Anläggnings-ID:</span>
            <span className={styles.value}>{facilitySummaryText}</span>
          </div>
        )}
      </div>

      <section className={styles.extrasSection}>
        {canSelectExtraServices ? (
          <>
            <h3 className={styles.extrasTitle}>Klart med avtalet. Vill du komplettera med extratjänster?</h3>
            <p className={styles.extrasSubtitle}>
              Fortsätt till val av extratjänster.
            </p>
          </>
        ) : (
          <>
            <h3 className={styles.extrasTitle}>Klart med avtalet.</h3>
            <p className={styles.extrasSubtitle}>
              Fortsätt till nästa steg.
            </p>
          </>
        )}
      </section>

      <div className={styles.actions}>
        <Button onClick={onContinue} fullWidth>
          {canSelectExtraServices ? 'Fortsätt till val av extratjänster' : 'Fortsätt'}
        </Button>
      </div>
    </div>
  );
};
