"use client";

import { Button } from '@/components/ui/Button';
import { Address, MoveChoice, DateSelection } from '@/types';
import { addDaysToDateInput, formatSwedishDate, toDateInputValue } from '@/utils/formatters';
import { isValidDateSelection } from '@/flow/validation';
import styles from './StartDatePicker.module.css';

interface StartDatePickerProps {
  value: DateSelection | null;
  onChange: (value: DateSelection) => void;
  onSelectDate: (date: string, mode: 'EARLIEST' | 'SPECIFIC') => void;
  onBack: () => void;
  address?: Address;
  isSwitching?: boolean;
  moveChoice?: MoveChoice | null;
  productName?: string;
  isExistingCustomer?: boolean;
  bindingEndDate?: string;
}

export const StartDatePicker = ({
  value, onChange,
  onSelectDate, 
  onBack, 
  address, 
  isSwitching, 
  moveChoice,
  productName,
  isExistingCustomer,
  bindingEndDate
}: StartDatePickerProps) => {
  const mode = bindingEndDate ? 'EARLIEST' : value?.mode ?? 'EARLIEST';
  const specificDate = value?.date ?? '';
  const setMode = (mode: DateSelection['mode']) => onChange({ mode, date: specificDate });
  const setSpecificDate = (date: string) => onChange({ mode, date });

  // Calculate "earliest" date (e.g., 14 days from now logic)
  // For prototype, we just mock it
  // Calculate "earliest" date
  const getEarliestDate = () => {
    if (bindingEndDate) {
      return addDaysToDateInput(bindingEndDate, 1);
    }
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return toDateInputValue(d);
  };

  const today = toDateInputValue(new Date());
  const earliest = getEarliestDate();
  const hasConfirmedNoBinding = isSwitching && isExistingCustomer && !bindingEndDate;
  const isMoveExisting = moveChoice === 'MOVE_EXISTING';
  const isNewOnNewAddress = moveChoice === 'NEW_ON_NEW_ADDRESS';

  const handleContinue = () => {
    if (mode === 'SPECIFIC' && !isValidDateSelection({ mode, date: specificDate })) return;
    if (mode === 'EARLIEST') {
      onSelectDate(earliest, 'EARLIEST');
    } else {
      onSelectDate(specificDate, 'SPECIFIC');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        {isSwitching ? (
          <>
            <h2 className={styles.title}>När ska bytet starta?</h2>
            <p className={styles.subtitle}>
              Välj startdatum för bytet till <strong>{productName || 'oss'}</strong> på <strong>{address?.street} {address?.number}</strong>.
            </p>
          </>
        ) : (
          <>
            <h2 className={styles.title}>
              {isMoveExisting
                ? 'När ska flytten börja gälla?'
                : isNewOnNewAddress
                  ? 'När ska det nya avtalet börja gälla?'
                  : 'När ska avtalet börja gälla?'}
            </h2>
            <p className={styles.subtitle}>
              {isMoveExisting ? (
                <>Vi flyttar ditt nuvarande avtal till <strong>{address?.street} {address?.number}</strong>.</>
              ) : isNewOnNewAddress ? (
                <>Du tecknar ett extra avtal för <strong>{address?.street} {address?.number}</strong>. Ditt nuvarande avtal ligger kvar.</>
              ) : (
                <>Välj när avtalet ska börja gälla på <strong>{address?.street} {address?.number}</strong>.</>
              )}
            </p>
          </>
        )}
      </header>
      
      {isSwitching && !isExistingCustomer && (
        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>💡</span>
          <p className={styles.infoText}>
            För att undvika brytavgift behöver vi veta när ditt nuvarande avtal kan avslutas.
          </p>
        </div>
      )}

      {bindingEndDate ? (
        <div className={styles.choices}>
          <label className={`${styles.choice} ${styles.selected}`}>
             <div className={styles.radioWrapper}>
              <input 
                type="radio" 
                checked={true}
                readOnly
                className={styles.radio}
              />
            </div>
            <div className={styles.textWrapper}>
              <span className={styles.choiceTitle}>
                När bindningstiden går ut ({formatSwedishDate(earliest)})
              </span>
              <span className={styles.choiceDesc}>
                Ditt nuvarande avtal är bundet till {formatSwedishDate(bindingEndDate)}. Vi startar det nya avtalet dagen efter.
              </span>
            </div>
          </label>
        </div>
      ) : (
        <div className={styles.choices}>
          <label className={`${styles.choice} ${mode === 'EARLIEST' ? styles.selected : ''}`}>
            <div className={styles.radioWrapper}>
              <input 
                type="radio" 
                name="startMode" 
                checked={mode === 'EARLIEST'}
                onChange={() => setMode('EARLIEST')}
                className={styles.radio}
              />
            </div>
            <div className={styles.textWrapper}>
              <span className={styles.choiceTitle}>
                {isSwitching ? 'Så snart det går' : 'Tidigast möjligt'}
              </span>
              <span className={styles.choiceDesc}>
                {isSwitching 
                  ? hasConfirmedNoBinding
                    ? `Vi påbörjar bytet så snart det är möjligt (cirka ${formatSwedishDate(earliest)}).`
                    : `Vi påbörjar bytet så snart det är möjligt (cirka ${formatSwedishDate(earliest)}). Kontrollera bindningstiden hos ditt nuvarande elbolag.`
                  : `Vi startar avtalet så snart det går (cirka ${formatSwedishDate(earliest)}).`
                }
              </span>
            </div>
          </label>

          <label className={`${styles.choice} ${mode === 'SPECIFIC' ? styles.selected : ''}`}>
            <div className={styles.radioWrapper}>
              <input 
                type="radio" 
                name="startMode" 
                checked={mode === 'SPECIFIC'}
                onChange={() => setMode('SPECIFIC')}
                className={styles.radio}
              />
            </div>
            <div className={styles.textWrapper}>
              <span className={styles.choiceTitle}>Välj startdatum själv</span>
              <span className={styles.choiceDesc}>
                Ange ett exakt datum.
              </span>
              
              {mode === 'SPECIFIC' && (
                <div className={styles.dateInputWrapper}>
                  <input 
                    type="date" 
                    min={today}
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className={styles.dateInput}
                  />
                </div>
              )}
            </div>
          </label>
        </div>
      )}

      <div className={styles.footer}>
        <Button 
          disabled={mode === 'SPECIFIC' && !specificDate}
          onClick={handleContinue}
          className={styles.continueButton}
        >
          {isSwitching ? 'Bekräfta startdatum' : 'Fortsätt'}
        </Button>
        <button className={styles.backLink} onClick={onBack}>
          ← Tillbaka
        </button>
      </div>
    </div>
  );
};
