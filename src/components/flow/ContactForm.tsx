"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './ContactForm.module.css';

interface ContactFormProps {
  initialData?: {
    email: string | null;
    phone: string | null;
  };
  onConfirm: (data: { email: string; phone: string }) => void;
  onBack: () => void;
}

export const ContactForm = ({ initialData, onConfirm, onBack }: ContactFormProps) => {
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  
  // New state for confirmation mode
  const [isConfirming, setIsConfirming] = useState(!!(initialData?.email && initialData?.phone));
  
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; phone?: string } = {};
    
    // Basic email validation
    if (!email) {
      newErrors.email = 'E-post måste anges';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Ange en giltig e-postadress';
    }

    // Basic phone validation (07x...)
    if (!phone) {
      newErrors.phone = 'Mobilnummer måste anges';
    } else if (!/^07[02369]\d{7}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Ange ett giltigt mobilnummer (07xxxxxxxx)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onConfirm({ email, phone });
    }
  };

  // If in confirmation mode
  if (isConfirming) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>Stämmer dina uppgifter?</h2>
          <p className={styles.subtitle}>
            Vi behöver bekräfta dina kontaktuppgifter.
          </p>
        </header>

        <div className={styles.confirmationBox}>
          <div className={styles.confirmRow}>
            <span className={styles.confirmLabel}>E-post:</span>
            <span className={styles.confirmValue}>{email}</span>
          </div>
          <div className={styles.confirmRow}>
            <span className={styles.confirmLabel}>Mobil:</span>
            <span className={styles.confirmValue}>{phone}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <Button 
            onClick={handleSubmit} 
            className={styles.continueButton}
          >
            Ja, fortsätt
          </Button>
          <button 
            className={styles.backLink} 
            onClick={() => setIsConfirming(false)}
          >
            Nej, ändra uppgifter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Dina kontaktuppgifter</h2>
        <p className={styles.subtitle}>
          Vart ska vi skicka bekräftelsen och fakturan?
        </p>
      </header>

      <div className={styles.form}>
        <Input 
          label="E-postadress"
          type="email"
          placeholder="namn.efternamn@exempel.se"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors(prev => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          autoComplete="email"
        />

        <Input 
          label="Mobilnummer"
          type="tel"
          placeholder="070 123 45 67"
          value={phone}
          onChange={(e) => {
            // Allow only digits and spaces/dashes
            const val = e.target.value;
            if (/^[\d\s-]*$/.test(val)) {
              setPhone(val);
              setErrors(prev => ({ ...prev, phone: undefined }));
            }
          }}
          error={errors.phone}
          autoComplete="tel"
        />
        

      </div>

      <div className={styles.footer}>
        <Button 
          onClick={handleSubmit}
          className={styles.continueButton}
        >
          Gå till signering
        </Button>
        <button className={styles.backLink} onClick={onBack}>
          ← Tillbaka
        </button>
      </div>
    </div>
  );
};
