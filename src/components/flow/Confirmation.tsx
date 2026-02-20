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

  const facilitySummaryText = (() => {
    if (!facilityHandling) return null;
    if (facilityHandling.mode === 'FROM_CRM') {
      return facilityHandling.facilityId || '-';
    }
    if (facilityHandling.mode === 'FETCH_WITH_POWER_OF_ATTORNEY') {
      return 'Hämtas via fullmakt';
    }
    return facilityHandling.facilityId || '-';
  })();

  const invoiceSummaryText = invoice?.address ? formatInvoiceAddress(invoice) : null;
  const showInvoiceAddress =
    !!invoice?.address &&
    !isSameAddress(invoice.address, address);

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>🎉</div>

      <header className={styles.header}>
        <h2 className={styles.title}>Tack, din beställning är klar!</h2>
        <p className={styles.subtitle}>
          Ordernummer: <strong>{orderId}</strong>
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
          <span className={styles.label}>Bekräftelse skickas till:</span>
          <span className={styles.value}>{email || '-'}</span>
        </div>
        {showInvoiceAddress && invoiceSummaryText && (
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
            <h3 className={styles.extrasTitle}>Vill du lägga till extratjänster?</h3>
            <p className={styles.extrasSubtitle}>
              Fortsätt för att välja.
            </p>
          </>
        ) : (
          <>
            <h3 className={styles.extrasTitle}>Klart!</h3>
            <p className={styles.extrasSubtitle}>
              Du kan nu gå vidare till Mina sidor.
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
