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
          Eftersom du valt ett {productType === 'FAST' ? 'fastprisavtal' : productType === 'KVARTS' ? 'kvartsprisavtal' : 'avtal'} behöver vi informera om följande.
        </p>
      </header>

      <div className={styles.infoBox}>
        <h3 className={styles.infoTitle}>Viktigt att veta</h3>
        <p className={styles.text}>
          {productType === 'FAST' 
            ? "Eftersom du valt ett fastprisavtal är du skyddad mot prishöjningar, men om du bryter avtalet i förtid kan en brytavgift tillkomma."
            : "Priset på elmarknaden varierar och kan påverka din månadskostnad över tid."
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
