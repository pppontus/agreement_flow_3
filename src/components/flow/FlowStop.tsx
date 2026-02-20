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
      'Du kan inte teckna avtal för den här adressen just nu. Kontrollera adressen eller kontakta kundservice.',
  },
  DUPLICATE_SAME_CONTRACT: {
    title: 'Det finns redan ett aktivt avtal på adressen',
    description:
      'Samma avtal finns redan på adressen. Gå tillbaka och välj ett annat avtal, eller kontakta oss.',
  },
  PENDING_CASE: {
    title: 'Det finns redan ett pågående ärende',
    description:
      'Du har redan en pågående beställning. Vänta tills den är klar eller kontakta kundservice.',
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
