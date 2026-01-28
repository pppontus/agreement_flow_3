"use client";

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Facility } from '@/types/company';
import styles from './CompanySummary.module.css';

interface CompanySummaryProps {
  facilities: Facility[];
  onConfigure: (facilityIndex: number) => void;
  onContinue: () => void;
  isLoading?: boolean;
}

export const CompanySummary = ({ 
  facilities, 
  onConfigure, 
  onContinue,
  isLoading = false 
}: CompanySummaryProps) => {

  const allConfigured = facilities.every(f => f.address && f.annualConsumption > 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Dina lokaler</h2>
        <p className={styles.description}>
          Här ser du en översikt av företagets lokaler. Klicka på en lokal för att välja avtal och ange adress.
        </p>
      </header>

      <div className={styles.grid}>
        {facilities.map((facility, index) => {
          const isConfigured = !!facility.address && facility.annualConsumption > 0;
          
          return (
            <button 
              key={facility.id} 
              className={`${styles.card} ${isConfigured ? styles.configured : ''}`}
              onClick={() => onConfigure(index)}
            >
              <div className={styles.icon}>
                {isConfigured ? '✅' : '🏢'}
              </div>
              <div className={styles.info}>
                <h3 className={styles.id}>Lokal {index + 1}</h3>
                <p className={styles.status}>
                  {isConfigured 
                    ? facility.address 
                    : 'Ej konfigurerad'
                  }
                </p>
                {isConfigured && (
                  <span className={styles.productBadge}>
                    {facility.annualConsumption.toLocaleString('sv-SE')} kWh
                  </span>
                )}
              </div>
              <div className={styles.arrow}>→</div>
            </button>
          );
        })}
      </div>

      <div className={styles.footer}>
        <Button 
          fullWidth 
          disabled={!allConfigured || isLoading} 
          onClick={onContinue}
        >
          Gå vidare till uppgifter
        </Button>
      </div>
    </div>
  );
};
