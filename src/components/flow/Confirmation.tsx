"use client";

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Product, Address } from '@/types';
import { formatAddress } from '@/services/addressService';
import {
  BIXIA_NARA_MONTHLY_SEK,
  ContactMeServiceId,
  ExtraServicesSelection,
  REALTIME_METER_MONTHLY_SEK,
  REALTIME_METER_ONE_TIME_SEK,
} from '@/services/extraServicesService';
import styles from './Confirmation.module.css';

interface ConfirmationProps {
  orderId: string;
  product?: Product;
  address?: Address;
  email?: string;
  initialSelection?: ExtraServicesSelection | null;
  onSubmitSelections: (selection: ExtraServicesSelection) => Promise<void>;
  onBack?: () => void;
}

const CONTACT_ME_SERVICES: Array<{
  id: ContactMeServiceId;
  title: string;
  description: string;
}> = [
  {
    id: 'HOME_BATTERY',
    title: 'Hembatteri',
    description: 'Lagra solel och använd den när elen är som dyrast.',
  },
  {
    id: 'CHARGER',
    title: 'Laddbox',
    description: 'Säker och smart hemmaladdning med rätt effektstyrning.',
  },
  {
    id: 'SOLAR',
    title: 'Solceller',
    description: 'Producera egen el och sänk dina långsiktiga energikostnader.',
  },
  {
    id: 'ATTIC_INSULATION',
    title: 'Tilläggsisolera vinden',
    description: 'Minska värmeförluster och förbättra energiprestandan i hemmet.',
  },
];

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
  'Luleå': 'Norrbottens län',
  'Kiruna': 'Norrbottens län',
  'Umeå': 'Västerbottens län',
  'Sundsvall': 'Västernorrlands län',
  'Östersund': 'Jämtlands län',
  'Stockholm': 'Stockholms län',
  'Göteborg': 'Västra Götalands län',
  'Uppsala': 'Uppsala län',
  'Malmö': 'Skåne län',
  'Lund': 'Skåne län',
  'Växjö': 'Kronobergs län',
};

const inferCountyFromAddress = (address?: Address): string => {
  if (!address?.city) return '';
  return CITY_TO_COUNTY[address.city] || '';
};

export const Confirmation = ({
  orderId,
  product,
  address,
  email,
  initialSelection,
  onSubmitSelections,
  onBack,
}: ConfirmationProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bixiaNaraSelected, setBixiaNaraSelected] = useState(initialSelection?.bixiaNara.selected ?? false);
  const [bixiaNaraCounty, setBixiaNaraCounty] = useState(initialSelection?.bixiaNara.county ?? '');
  const [realtimeMeterSelected, setRealtimeMeterSelected] = useState(initialSelection?.realtimeMeter.selected ?? false);
  const [contactMeSelections, setContactMeSelections] = useState<Record<ContactMeServiceId, boolean>>({
    HOME_BATTERY: initialSelection?.contactMeServices.includes('HOME_BATTERY') ?? false,
    CHARGER: initialSelection?.contactMeServices.includes('CHARGER') ?? false,
    SOLAR: initialSelection?.contactMeServices.includes('SOLAR') ?? false,
    ATTIC_INSULATION: initialSelection?.contactMeServices.includes('ATTIC_INSULATION') ?? false,
  });

  const selectedContactServices = useMemo(
    () =>
      CONTACT_ME_SERVICES
        .filter(service => contactMeSelections[service.id])
        .map(service => service.id),
    [contactMeSelections]
  );
  const inferredCounty = useMemo(() => inferCountyFromAddress(address), [address]);
  const selectedCountyValue = bixiaNaraCounty || inferredCounty || '';

  const hasAnySelection = bixiaNaraSelected || realtimeMeterSelected || selectedContactServices.length > 0;
  const submitLabel = hasAnySelection ? 'Spara val' : 'Gå vidare utan tjänster';

  const handleContactMeToggle = (serviceId: ContactMeServiceId, checked: boolean) => {
    setContactMeSelections(prev => ({ ...prev, [serviceId]: checked }));
  };

  const handleContinue = async () => {
    const countyToSave = bixiaNaraCounty || inferredCounty || '';

    if (bixiaNaraSelected && !countyToSave) {
      setError('Välj län för Bixia nära innan du fortsätter.');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await onSubmitSelections({
        bixiaNara: {
          selected: bixiaNaraSelected,
          county: bixiaNaraSelected ? countyToSave : undefined,
        },
        realtimeMeter: {
          selected: realtimeMeterSelected,
        },
        contactMeServices: selectedContactServices,
      });
    } catch {
      setError('Det gick inte att spara dina val just nu. Försök igen.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>🎉</div>
      
      <header className={styles.header}>
        <h2 className={styles.title}>Tack för din beställning!</h2>
        <p className={styles.subtitle}>
          Du är nu kund hos Bixia. Din order <strong>{orderId}</strong> är mottagen.
        </p>
      </header>

      <div className={styles.summaryCard}>
        <div className={styles.row}>
          <span className={styles.label}>Produkt:</span>
          <span className={styles.value}>{product?.name}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Adress:</span>
          <span className={styles.value}>{address ? formatAddress(address) : '-'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Bekräftelse skickad till:</span>
          <span className={styles.value}>{email}</span>
        </div>
      </div>

      <section className={styles.extrasSection}>
        <h3 className={styles.extrasTitle}>Nästa naturliga steg: lägg till extratjänster</h3>
        <p className={styles.extrasSubtitle}>
          Välj det som är relevant för dig nu. Du kan alltid justera detta senare.
        </p>

        <div className={styles.serviceCard}>
          <label className={styles.serviceHeader}>
            <input
              type="checkbox"
              checked={bixiaNaraSelected}
              onChange={(e) => {
                setBixiaNaraSelected(e.target.checked);
                setError(null);
              }}
              className={styles.checkbox}
            />
            <span className={styles.serviceTitle}>Bixia nära (lägg till direkt)</span>
          </label>
          <p className={styles.serviceDescription}>
            Få lokal och personlig energirådgivning nära dig, anpassad efter ditt område.
          </p>
          <p className={styles.priceLine}>Kostnad: {BIXIA_NARA_MONTHLY_SEK} kr/mån</p>
          {bixiaNaraSelected && (
            <div className={styles.areaSelect}>
              <Select
                id="bixia-nara-county"
                label="Välj län"
                value={selectedCountyValue}
                onChange={(e) => {
                  setBixiaNaraCounty(e.target.value);
                  setError(null);
                }}
              >
                <option value="">Välj län</option>
                {SWEDISH_COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div className={styles.serviceCard}>
          <label className={styles.serviceHeader}>
            <input
              type="checkbox"
              checked={realtimeMeterSelected}
              onChange={(e) => {
                setRealtimeMeterSelected(e.target.checked);
                setError(null);
              }}
              className={styles.checkbox}
            />
            <span className={styles.serviceTitle}>Realtidsmätare (lägg till direkt)</span>
          </label>
          <p className={styles.serviceDescription}>
            Få bättre koll på förbrukningen och kapa effekttoppar.
          </p>
          <p className={styles.priceLine}>
            Engångskostnad: {REALTIME_METER_ONE_TIME_SEK} kr. Månadsavgift: {REALTIME_METER_MONTHLY_SEK} kr/mån.
          </p>
        </div>

        <div className={styles.serviceCard}>
          <h4 className={styles.contactMeTitle}>Kontakta mig om</h4>
          <div className={styles.contactMeSection}>
            {CONTACT_ME_SERVICES.map(service => (
              <label key={service.id} className={styles.contactMeRow}>
                <input
                  type="checkbox"
                  checked={contactMeSelections[service.id]}
                  onChange={(e) => handleContactMeToggle(service.id, e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.contactMeText}>
                  <strong>{service.title}</strong> - {service.description}
                </span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button onClick={handleContinue} disabled={isSaving} fullWidth>
          {isSaving ? 'Sparar...' : submitLabel}
        </Button>
        {onBack && (
          <button className={styles.backLink} onClick={onBack}>
            ← Tillbaka
          </button>
        )}
      </div>
    </div>
  );
};
