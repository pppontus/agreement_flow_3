"use client";

import { Button } from '@/components/ui/Button';
import { Address, MoveChoice } from '@/types';
import { formatAddress } from '@/services/addressService';
import styles from './MoveOffer.module.css';

interface MoveOfferProps {
  currentAddress: Address;
  newAddress: Address;
  selectedChoice?: MoveChoice | null;
  onMove: () => void;
  onNew: () => void;
  onBack: () => void;
}

export const MoveOffer = ({ currentAddress, newAddress, selectedChoice, onMove, onNew, onBack }: MoveOfferProps) => {
  const selectedChoiceLabel =
    selectedChoice === 'MOVE_EXISTING'
      ? 'Flytta med befintligt avtal'
      : selectedChoice === 'NEW_ON_NEW_ADDRESS'
        ? 'Teckna nytt avtal för ytterligare adress'
        : null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Vi hittade ett befintligt avtal</h2>
        <p className={styles.subtitle}>
          Du har redan ett aktivt elavtal på <strong>{formatAddress(currentAddress)}</strong>.
        </p>
        {selectedChoiceLabel && (
          <p className={styles.subtitle}>
            Nuvarande val: <strong>{selectedChoiceLabel}</strong>.
          </p>
        )}
      </header>
      
      <div className={styles.choices}>
        <div className={styles.choice}>
          <div className={styles.iconWrapper}>🚚</div>
          <div className={styles.choiceContent}>
            <h3 className={styles.choiceTitle}>Flytta befintligt avtal</h3>
            <p className={styles.choiceDesc}>
              Flytta ditt nuvarande avtal till <strong>{formatAddress(newAddress)}</strong>. 
              Ditt avtal på den gamla adressen avslutas i samband med flytten.
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
            <h3 className={styles.choiceTitle}>Lägg till ytterligare adress</h3>
            <p className={styles.choiceDesc}>
              Behåll ditt nuvarande avtal på <strong>{formatAddress(currentAddress)}</strong> och teckna ett <strong>nytt avtal</strong> för <strong>{formatAddress(newAddress)}</strong>.
            </p>
            <Button variant="primary" fullWidth onClick={onNew}>
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
