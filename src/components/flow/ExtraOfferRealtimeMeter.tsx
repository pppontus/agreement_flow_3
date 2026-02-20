"use client";

import { Button } from '@/components/ui/Button';
import { REALTIME_METER_MONTHLY_SEK, REALTIME_METER_ONE_TIME_SEK } from '@/services/extraServicesService';
import styles from './ExtraOfferStep.module.css';

interface ExtraOfferRealtimeMeterProps {
  initialSelected?: boolean;
  onConfirm: (selected: boolean) => void;
  onBack: () => void;
}

export const ExtraOfferRealtimeMeter = ({
  initialSelected = false,
  onConfirm,
  onBack,
}: ExtraOfferRealtimeMeterProps) => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Vill du lägga till realtidsmätare?</h2>
        <p className={styles.subtitle}>Få bättre koll på förbrukning och effekttoppar i hemmet.</p>
      </header>

      <section className={styles.card}>
        <h3 className={styles.serviceName}>Realtidsmätare</h3>
        <p className={styles.description}>
          Se din elanvändning i närtid och få bättre underlag för att flytta förbrukning till smartare tider.
        </p>
        <p className={styles.priceLine}>Engångskostnad: {REALTIME_METER_ONE_TIME_SEK} kr</p>
        <p className={styles.priceLine}>Månadsavgift: {REALTIME_METER_MONTHLY_SEK} kr/mån</p>
      </section>

      <div className={styles.actions}>
        <Button onClick={() => onConfirm(true)} fullWidth>
          {initialSelected ? 'Behåll realtidsmätare' : 'Ja, lägg till realtidsmätare'}
        </Button>
        <Button variant="outline" onClick={() => onConfirm(false)} fullWidth>
          Nej tack
        </Button>
        <button className={styles.backLink} onClick={onBack}>
          ← Tillbaka
        </button>
      </div>
    </div>
  );
};
