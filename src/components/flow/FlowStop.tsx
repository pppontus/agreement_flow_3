"use client";

import { Button } from '@/components/ui/Button';
import { StopReason } from '@/types';
import styles from './FlowStop.module.css';

interface FlowStopProps {
  reason: StopReason;
  onBack: () => void;
  onRestart: () => void;
}

const STOP_CONTENT: Record<StopReason, { title: string; description: string }> = {
  CANNOT_DELIVER: {
    title: 'Vi kan inte leverera till denna adress just nu',
    description:
      'Det går tyvärr inte att teckna avtal för den valda adressen i nuläget. Du kan kontrollera adressen eller kontakta kundservice för hjälp.',
  },
  DUPLICATE_SAME_CONTRACT: {
    title: 'Det finns redan ett aktivt avtal på adressen',
    description:
      'Vi kan inte skapa ett nytt identiskt avtal ovanpå det som redan finns. Gå tillbaka för att justera dina val eller kontakta oss.',
  },
  PENDING_CASE: {
    title: 'Det finns redan ett pågående ärende',
    description:
      'Vi har redan en pågående beställning kopplad till dina uppgifter. Vänta tills ärendet är klart eller kontakta kundservice.',
  },
};

export const FlowStop = ({ reason, onBack, onRestart }: FlowStopProps) => {
  const content = STOP_CONTENT[reason];

  return (
    <div className={styles.container}>
      <div className={styles.icon}>⚠️</div>
      <h2 className={styles.title}>{content.title}</h2>
      <p className={styles.description}>{content.description}</p>

      <div className={styles.actions}>
        <Button fullWidth onClick={onBack}>
          Gå tillbaka
        </Button>
        <Button fullWidth variant="outline" onClick={onRestart}>
          Börja om
        </Button>
      </div>
    </div>
  );
};
