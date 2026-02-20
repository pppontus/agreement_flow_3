"use client";

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CONTACT_ME_SERVICE_IDS, ContactMeServiceId, ExtraServicesSelection } from '@/services/extraServicesService';
import styles from './ExtraOfferStep.module.css';

interface ExtraOfferContactMeProps {
  initialSelection?: ExtraServicesSelection | null;
  availableServiceIds?: ContactMeServiceId[];
  phone?: string;
  onSubmit: (contactMeServices: ContactMeServiceId[]) => Promise<void>;
  onDone: () => void;
  onBack: () => void;
}

const CONTACT_ME_SERVICES: Array<{
  id: ContactMeServiceId;
  title: string;
  description: string;
}> = [
  {
    id: 'HOME_BATTERY',
    title: 'Hembatteri',
    description: 'Lagra solel och använd den när elen är dyr.',
  },
  {
    id: 'CHARGER',
    title: 'Laddbox',
    description: 'Smart och säker laddning hemma.',
  },
  {
    id: 'SOLAR',
    title: 'Solceller',
    description: 'Producera egen el och sänk dina elkostnader.',
  },
  {
    id: 'ATTIC_INSULATION',
    title: 'Tilläggsisolera vinden',
    description: 'Minska värmeförluster i hemmet.',
  },
];

export const ExtraOfferContactMe = ({
  initialSelection,
  availableServiceIds = CONTACT_ME_SERVICE_IDS,
  phone,
  onSubmit,
  onDone,
  onBack,
}: ExtraOfferContactMeProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<ContactMeServiceId, boolean>>({
    HOME_BATTERY: initialSelection?.contactMeServices.includes('HOME_BATTERY') ?? false,
    CHARGER: initialSelection?.contactMeServices.includes('CHARGER') ?? false,
    SOLAR: initialSelection?.contactMeServices.includes('SOLAR') ?? false,
    ATTIC_INSULATION: initialSelection?.contactMeServices.includes('ATTIC_INSULATION') ?? false,
  });

  const selectableServiceIds = useMemo(() => new Set(availableServiceIds), [availableServiceIds]);
  const availableServices = useMemo(
    () => CONTACT_ME_SERVICES.filter((service) => selectableServiceIds.has(service.id)),
    [selectableServiceIds]
  );
  const selectedServices = useMemo(
    () =>
      availableServices
        .filter((service) => selections[service.id])
        .map((service) => service.id),
    [availableServices, selections]
  );
  const selectedServiceTitles = useMemo(
    () =>
      availableServices
        .filter((service) => selections[service.id])
        .map((service) => service.title),
    [availableServices, selections]
  );

  const submitSelection = async (serviceIds: ContactMeServiceId[], showConfirmation: boolean) => {
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(serviceIds);
      if (showConfirmation && serviceIds.length > 0) {
        const serviceText =
          selectedServiceTitles.length > 0
            ? ` om ${selectedServiceTitles.join(', ')}`
            : '';
        const phoneText = phone ? ` på nummer ${phone}` : '';
        setSuccessMessage(`Tack, vi hör av oss inom kort${phoneText}${serviceText}.`);
      } else {
        onDone();
      }
    } catch {
      setError('Det gick inte att spara dina val just nu. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>Tack för ditt intresse!</h2>
          <p className={styles.subtitle}>Vi har sparat dina önskemål.</p>
        </header>

        <section className={styles.card}>
          <p className={styles.description}>{successMessage}</p>
        </section>

        <div className={styles.actions}>
          <Button onClick={onDone} fullWidth>
            Gå till Mina Sidor
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Vill du bli kontaktad om fler tjänster?</h2>
        <p className={styles.subtitle}>
          Valfritt. Välj det du vill veta mer om.
        </p>
      </header>

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Jag vill veta mer om</h3>
        {availableServices.length > 0 ? (
          <div className={styles.checkboxList}>
            {availableServices.map((service) => (
              <label key={service.id} className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={selections[service.id]}
                  onChange={(e) => {
                    setSelections((prev) => ({ ...prev, [service.id]: e.target.checked }));
                  }}
                />
                <span>
                  <strong>{service.title}</strong> - {service.description}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className={styles.description}>
            Du har redan alla tjänster i denna kategori.
          </p>
        )}
      </section>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button onClick={() => submitSelection(selectedServices, true)} disabled={isSubmitting} fullWidth>
          {isSubmitting ? 'Sparar...' : 'Spara och fortsätt'}
        </Button>
        <Button variant="outline" onClick={() => submitSelection([], false)} disabled={isSubmitting} fullWidth>
          Hoppa över
        </Button>
        <button className={styles.backLink} onClick={onBack}>
          ← Tillbaka
        </button>
      </div>
    </div>
  );
};
