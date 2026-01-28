"use client";

import { Button } from '@/components/ui/Button';
import { Address } from '@/types';
import { formatAddress } from '@/services/addressService';
import styles from './MoveOffer.module.css';

interface MoveOfferProps {
  currentAddress: Address;
  newAddress: Address;
  onMove: () => void;
  onNew: () => void;
  onBack: () => void;
}

export const MoveOffer = ({ currentAddress, newAddress, onMove, onNew, onBack }: MoveOfferProps) => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Vi hittade ett befintligt avtal</h2>
        <p className={styles.subtitle}>
          Det verkar som att du redan har elavtal hos oss på <strong>{formatAddress(currentAddress)}</strong>.
        </p>
      </header>
      
      <div className={styles.choices}>
        <div className={styles.choice}>
          <div className={styles.iconWrapper}>🚚</div>
          <div className={styles.choiceContent}>
            <h3 className={styles.choiceTitle}>Ska du flytta?</h3>
            <p className={styles.choiceDesc}>
              Flytta med ditt nuvarande avtal till den nya adressen <strong>{formatAddress(newAddress)}</strong>. 
              Smidigt och enkelt!
            </p>
            <Button variant="primary" fullWidth onClick={onMove}>
              Ja, jag vill flytta med mitt avtal
            </Button>
          </div>
        </div>

        <div className={styles.divider}>
          <span>ELLER</span>
        </div>

        <div className={styles.choice}>
          <div className={styles.iconWrapper}>🏠</div>
          <div className={styles.choiceContent}>
            <h3 className={styles.choiceTitle}>Är det en ny anläggning?</h3>
            <p className={styles.choiceDesc}>
              Om du ska ha kvar ditt gamla boende och vill teckna ett <strong>nytt avtal</strong> för den här adressen.
            </p>
            <Button variant="secondary" fullWidth onClick={onNew}>
              Teckna nytt avtal för denna adress
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.backLink} onClick={onBack}>
          ← Tillbaka
        </button>
      </div>
    </div>
  );
};
