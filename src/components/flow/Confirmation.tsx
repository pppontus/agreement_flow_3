"use client";

import { Button } from '@/components/ui/Button';
import { Product, Address } from '@/types';
import { formatAddress } from '@/services/addressService';
import styles from './Confirmation.module.css';

interface ConfirmationProps {
  orderId: string;
  product?: Product;
  address?: Address;
  email?: string;
  onReset: () => void;
}

export const Confirmation = ({ orderId, product, address, email, onReset }: ConfirmationProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>🎉</div>
      
      <header className={styles.header}>
        <h2 className={styles.title}>Tack för din beställning!</h2>
        <p className={styles.subtitle}>
          Din order <strong>{orderId}</strong> är mottagen.
        </p>
      </header>

      <div className={styles.summaryCard}>
        <div className={styles.row}>
          <span className={styles.label}>Produkt:</span>
          <span className={styles.value}>{product?.name}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Adress:</span>
          <span className={styles.value}>{address ? formatAddress(address) : '-'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Bekräftelse skickad till:</span>
          <span className={styles.value}>{email}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={onReset} fullWidth>
          Gå till Mina Sidor
        </Button>
      </div>
    </div>
  );
};
