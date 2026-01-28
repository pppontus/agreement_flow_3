"use client";

import { Button } from '@/components/ui/Button';
import { Address } from '@/types';
import { formatAddress } from '@/services/addressService';
import styles from './MoveOfferDialog.module.css';

interface MoveOfferDialogProps {
  currentAddress: Address;
  newAddress: Address;
  onMove: () => void;
  onNew: () => void;
}

export const MoveOfferDialog = ({ currentAddress, newAddress, onMove, onNew }: MoveOfferDialogProps) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h2 className={styles.title}>Vi hittade ett befintligt avtal</h2>
        <p className={styles.text}>
          Det verkar som att du redan har elavtal hos oss på <strong>{formatAddress(currentAddress)}</strong>.
        </p>
        
        <div className={styles.choices}>
          <div className={styles.choice}>
            <h3 className={styles.choiceTitle}>Ska du flytta?</h3>
            <p className={styles.choiceDesc}>
              Flytta med ditt nuvarande avtal till den nya adressen <strong>{formatAddress(newAddress)}</strong>. 
              Smidigt och enkelt!
            </p>
            <Button variant="primary" fullWidth onClick={onMove}>
              Ja, jag vill flytta med mitt avtal
            </Button>
          </div>

          <div className={styles.divider}>eller</div>

          <div className={styles.choice}>
            <h3 className={styles.choiceTitle}>Är det en ny anläggning?</h3>
            <p className={styles.choiceDesc}>
              Om du ska ha kvar ditt gamla boende och vill teckna ett <strong>nytt avtal</strong> för den här adressen.
            </p>
            <Button variant="outline" fullWidth onClick={onNew}>
              Teckna nytt avtal för denna adress
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
