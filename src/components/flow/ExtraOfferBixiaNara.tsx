"use client";

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Address } from '@/types';
import { BIXIA_NARA_MONTHLY_SEK } from '@/services/extraServicesService';
import styles from './ExtraOfferStep.module.css';

interface ExtraOfferBixiaNaraProps {
  address?: Address;
  initialSelected?: boolean;
  initialCounty?: string;
  onConfirm: (selection: { selected: boolean; county?: string }) => void;
  onBack: () => void;
}

const SWEDISH_COUNTIES = [
  'Blekinge län',
  'Dalarnas län',
  'Gotlands län',
  'Gävleborgs län',
  'Hallands län',
  'Jämtlands län',
  'Jönköpings län',
  'Kalmar län',
  'Kronobergs län',
  'Norrbottens län',
  'Skåne län',
  'Stockholms län',
  'Södermanlands län',
  'Uppsala län',
  'Värmlands län',
  'Västerbottens län',
  'Västernorrlands län',
  'Västmanlands län',
  'Västra Götalands län',
  'Örebro län',
  'Östergötlands län',
];

const CITY_TO_COUNTY: Record<string, string> = {
  Luleå: 'Norrbottens län',
  Kiruna: 'Norrbottens län',
  Umeå: 'Västerbottens län',
  Sundsvall: 'Västernorrlands län',
  Östersund: 'Jämtlands län',
  Stockholm: 'Stockholms län',
  Göteborg: 'Västra Götalands län',
  Uppsala: 'Uppsala län',
  Malmö: 'Skåne län',
  Lund: 'Skåne län',
  Växjö: 'Kronobergs län',
};

const inferCountyFromAddress = (address?: Address): string => {
  if (!address?.city) return '';
  return CITY_TO_COUNTY[address.city] || '';
};

export const ExtraOfferBixiaNara = ({
  address,
  initialSelected = false,
  initialCounty,
  onConfirm,
  onBack,
}: ExtraOfferBixiaNaraProps) => {
  const inferredCounty = useMemo(() => inferCountyFromAddress(address), [address]);
  const [county, setCounty] = useState(initialCounty || inferredCounty || '');
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!county) {
      setError('Välj län för Bixia nära innan du fortsätter.');
      return;
    }
    onConfirm({ selected: true, county });
  };

  const handleSkip = () => {
    onConfirm({ selected: false });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Vill du lägga till Bixia nära?</h2>
        <p className={styles.subtitle}>Stötta lokala elproducenter.</p>
      </header>

      <section className={styles.card}>
        <h3 className={styles.serviceName}>Bixia nära</h3>
        <p className={styles.description}>
          Ett tillval där du stöttar lokala elproducenter i ditt område.
        </p>
        <p className={styles.priceLine}>Pris: {BIXIA_NARA_MONTHLY_SEK} kr/mån</p>

        <div className={styles.section}>
          <Select
            id="bixia-nara-county"
            label="Välj län"
            value={county}
            onChange={(e) => {
              setCounty(e.target.value);
              setError('');
            }}
          >
            <option value="">Välj län</option>
            {SWEDISH_COUNTIES.map((countyOption) => (
              <option key={countyOption} value={countyOption}>
                {countyOption}
              </option>
            ))}
          </Select>
        </div>
      </section>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button onClick={handleAdd} fullWidth>
          {initialSelected ? 'Uppdatera val' : 'Lägg till Bixia nära'}
        </Button>
        <Button variant="outline" onClick={handleSkip} fullWidth>
          Nej tack
        </Button>
        <button className={styles.backLink} onClick={onBack}>
          ← Tillbaka
        </button>
      </div>
    </div>
  );
};
