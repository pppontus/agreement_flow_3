"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import styles from './RiskInfo.module.css';

interface RiskInfoProps {
  onConfirm: () => void;
  onBack: () => void;
  productType: string;
}

export const RiskInfo = ({ onConfirm, onBack, productType }: RiskInfoProps) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Viktig information om ditt avtal</h2>
        <p className={styles.subtitle}>
          Detta gäller för ditt {productType === 'FAST' ? 'fastprisavtal' : productType === 'KVARTS' ? 'kvartsprisavtal' : 'avtal'}.
        </p>
      </header>

      <div className={styles.infoBox}>
        <h3 className={styles.infoTitle}>Viktigt att veta</h3>
        <p className={styles.text}>
          {productType === 'FAST' 
            ? "Fast pris skyddar mot prishöjningar, men brytavgift kan tillkomma om avtalet avslutas i förtid."
            : "Priset varierar över tid och kan påverka din månadskostnad."
          }
        </p>
        <a href="#" className={styles.moreInfoLink}>Läs mer om risker</a>
      </div>

      <div className={styles.section}>
        <label className={`${styles.checkboxLabel} ${accepted ? styles.checked : ''}`}>
          <input 
            type="checkbox" 
            checked={accepted} 
            onChange={(e) => setAccepted(e.target.checked)}
            className={styles.checkbox}
          />
          <span className={styles.labelText}>
            Jag har tagit del av riskinformationen.
          </span>
        </label>
      </div>

      <div className={styles.footer}>
        <Button 
          disabled={!accepted}
          onClick={onConfirm}
          className={styles.continueButton}
        >
          Fortsätt
        </Button>
        <button className={styles.backLink} onClick={onBack}>
          ← Tillbaka
        </button>
      </div>
    </div>
  );
};
