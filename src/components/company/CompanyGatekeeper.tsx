"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './CompanyGatekeeper.module.css';

interface CompanyGatekeeperProps {
  onContinue: (consumption: number, facilities: number) => void;
}

export const CompanyGatekeeper = ({ onContinue }: CompanyGatekeeperProps) => {
  const [consumption, setConsumption] = useState<string>('');
  const [facilities, setFacilities] = useState<string>('');
  const [isBlocked, setIsBlocked] = useState(false);

  const MAX_CONSUMPTION = 150000;
  const MAX_FACILITIES = 5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cons = parseInt(consumption.replace(/\s/g, ''), 10);
    // Facilities input removed, defaulting to 1 for logic compatibility
    const fac = 1; 

    if (isNaN(cons)) return;

    if (cons > MAX_CONSUMPTION) {
      setIsBlocked(true);
    } else {
      onContinue(cons, fac);
    }
  };

  if (isBlocked) {
    return (
      <div className={styles.container}>
        <div className={styles.icon}>📞</div>
        <h2 className={styles.title}>Vi hjälper dig gärna personligen!</h2>
        <p className={styles.description}>
          Då ditt företag har en årsförbrukning över 150 000 kWh eller fler än 5 anläggningar 
          vill vi ge er ett skräddarsytt erbjudande.
        </p>
        <div className={styles.contactBox}>
          <p>Kontakta våra företagssäljare:</p>
          <a href="tel:0771-603030" className={styles.phoneLink}>0771-60 30 30</a>
          <p className={styles.subtext}>Öppet vardagar 08.00–16.00</p>
        </div>
        <Button onClick={() => window.location.href = 'https://www.bixia.se/foretag/kontakta-oss'} variant="outline">
          Gå till kontaktsidan
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Välkommen Företag!</h2>
      <p className={styles.description}>
        För att ge dig rätt erbjudande behöver vi veta lite om din verksamhet.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Total årsförbrukning (kWh)"
          value={consumption}
          onChange={(e) => setConsumption(e.target.value)}
          placeholder="t.ex. 50 000"
          type="number"
          required
        />
        
        {/* Facility count removed for Linear First flow */}

        <Button type="submit" disabled={!consumption} className={styles.submitBtn}>
          Gå vidare
        </Button>
      </form>
    </div>
  );
};
