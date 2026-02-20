"use client";

import { Button } from '@/components/ui/Button';
import styles from './ExistingContractExtrasIntro.module.css';

interface ExistingContractExtrasIntroProps {
  productName?: string;
  hasAnyExtrasToOffer: boolean;
  onContinue: () => void;
  onDone: () => void;
  onBack: () => void;
}

export const ExistingContractExtrasIntro = ({
  productName,
  hasAnyExtrasToOffer,
  onContinue,
  onDone,
  onBack,
}: ExistingContractExtrasIntroProps) => {
  const normalizedProductName = productName?.trim();

  return (
    <div className={styles.container}>
      <div className={styles.icon}>✅</div>
      <h2 className={styles.title}>
        {normalizedProductName
          ? `Du har redan ${normalizedProductName} på adressen`
          : 'Du har redan ett aktivt avtal på adressen'}
      </h2>
      <p className={styles.description}>
        Du har redan avtalet här, men du kan fortfarande lägga till extratjänster.
      </p>

      <div className={styles.actions}>
        {hasAnyExtrasToOffer ? (
          <Button fullWidth onClick={onContinue}>
            Fortsätt till val av extratjänster
          </Button>
        ) : (
          <Button fullWidth onClick={onDone}>
            Gå till Mina Sidor
          </Button>
        )}
        <button className={styles.backLink} onClick={onBack}>
          ← Tillbaka
        </button>
      </div>
    </div>
  );
};
