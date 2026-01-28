"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Address } from '@/types';
import styles from './StartDatePicker.module.css';

interface StartDatePickerProps {
  onSelectDate: (date: string, mode: 'EARLIEST' | 'SPECIFIC') => void;
  onBack: () => void;
  address?: Address;
}

export const StartDatePicker = ({ onSelectDate, onBack, address }: StartDatePickerProps) => {
  const [mode, setMode] = useState<'EARLIEST' | 'SPECIFIC'>('EARLIEST');
  const [specificDate, setSpecificDate] = useState('');

  // Calculate "earliest" date (e.g., 14 days from now logic)
  // For prototype, we just mock it
  const getEarliestDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  const today = new Date().toISOString().split('T')[0];
  const earliest = getEarliestDate();

  const handleContinue = () => {
    if (mode === 'EARLIEST') {
      onSelectDate(earliest, 'EARLIEST');
    } else {
      onSelectDate(specificDate, 'SPECIFIC');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>När ska avtalet starta?</h2>
        <p className={styles.subtitle}>
          Vi ser till att elen flyter på till <strong>{address?.street} {address?.number}</strong>.
        </p>
      </header>

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
            <span className={styles.choiceTitle}>Tidigast möjligt</span>
            <span className={styles.choiceDesc}>
              Vi startar avtalet så snart det går (ca {earliest}).
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
            <span className={styles.choiceTitle}>Välj eget startdatum</span>
            <span className={styles.choiceDesc}>
              Välj detta om du vet exakt vilket datum du flyttar in eller vill byta.
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

      <div className={styles.footer}>
        <Button 
          disabled={mode === 'SPECIFIC' && !specificDate}
          onClick={handleContinue}
          className={styles.continueButton}
        >
          Fortsätt
        </Button>
        <button className={styles.backLink} onClick={onBack}>
          ← Tillbaka
        </button>
      </div>
    </div>
  );
};
