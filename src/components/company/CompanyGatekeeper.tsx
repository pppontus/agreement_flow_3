"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import styles from './CompanyGatekeeper.module.css';

interface CompanyGatekeeperProps {
  onContinue: (consumption: number, facilities: number) => void;
}

type CompanySize = 'SMALL' | 'MEDIUM' | 'LARGE';

export const CompanyGatekeeper = ({ onContinue }: CompanyGatekeeperProps) => {
  const [blockedSize, setBlockedSize] = useState<CompanySize | null>(null);

  const handleChooseSize = (size: CompanySize) => {
    if (size === 'SMALL') {
      // MVP: we only capture size segment here, not exact kWh.
      onContinue(0, 1);
      return;
    }
    setBlockedSize(size);
  };

  if (blockedSize) {
    return (
      <div className={styles.container}>
        <div className={styles.icon}>📞</div>
        <h2 className={styles.title}>Vi hjälper dig gärna personligen!</h2>
        <p className={styles.description}>
          {blockedSize === 'MEDIUM'
            ? 'För mellanstora företag vill vi ge ett mer träffsäkert erbjudande med rätt upplägg från start.'
            : 'För stora företag vill vi ge ett skräddarsytt erbjudande med personlig rådgivning.'}
        </p>
        <div className={styles.contactBox}>
          <p>Kontakta våra företagssäljare:</p>
          <a href="tel:0771-603030" className={styles.phoneLink}>0771-60 30 30</a>
          <p className={styles.subtext}>Öppet vardagar 08.00–16.00</p>
        </div>
        <Button onClick={() => window.location.href = 'https://www.bixia.se/foretag/kontakta-oss'}>
          Gå till kontaktsidan
        </Button>
        <button className={styles.backLink} onClick={() => setBlockedSize(null)}>
          ← Välj företagsstorlek igen
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Välkommen Företag!</h2>
      <p className={styles.description}>
        Välj den storlek som passar bäst. Om du är osäker, börja med det alternativ som känns närmast.
      </p>

      <div className={styles.options}>
        <button className={styles.optionCard} onClick={() => handleChooseSize('SMALL')}>
          <div className={styles.optionIcon}>🏪</div>
          <div className={styles.optionContent}>
            <h3 className={styles.optionTitle}>Litet företag</h3>
            <p className={styles.optionText}>Upp till 150 000 kWh/år. Fortsätt direkt i webbflödet.</p>
          </div>
        </button>

        <button className={styles.optionCard} onClick={() => handleChooseSize('MEDIUM')}>
          <div className={styles.optionIcon}>🏢</div>
          <div className={styles.optionContent}>
            <h3 className={styles.optionTitle}>Mellanföretag</h3>
            <p className={styles.optionText}>Över 150 000 kWh/år. Vi slussar dig till företagssäljare.</p>
          </div>
        </button>

        <button className={styles.optionCard} onClick={() => handleChooseSize('LARGE')}>
          <div className={styles.optionIcon}>🏭</div>
          <div className={styles.optionContent}>
            <h3 className={styles.optionTitle}>Stort företag</h3>
            <p className={styles.optionText}>Större energibehov. Vi slussar dig till företagssäljare.</p>
          </div>
        </button>
      </div>
    </div>
  );
};
