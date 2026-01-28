"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import styles from './TermsConsent.module.css';

interface TermsConsentProps {
  onConfirm: (data: { 
    termsAccepted: boolean; 
    marketing: { email: boolean; sms: boolean } 
  }) => void;
  onBack: () => void;
}

export const TermsConsent = ({ onConfirm, onBack }: TermsConsentProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingEmail, setMarketingEmail] = useState(false);
  const [marketingSms, setMarketingSms] = useState(false);

  const handleContinue = () => {
    if (termsAccepted) {
      onConfirm({
        termsAccepted,
        marketing: { email: marketingEmail, sms: marketingSms }
      });
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Villkor & Samtycke</h2>
        <p className={styles.subtitle}>
          Nästan klart! Godkänn villkoren för att gå vidare till signering.
        </p>
      </header>

      <div className={styles.section}>
        <label className={`${styles.checkboxLabel} ${termsAccepted ? styles.checked : ''}`}>
          <input 
            type="checkbox" 
            checked={termsAccepted} 
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className={styles.checkbox}
          />
          <span className={styles.labelText}>
            Jag godkänner <a href="#" className={styles.link}>villkoren</a> samt intygar att jag tagit del av <a href="#" className={styles.link}>ångerrätt</a> och <a href="#" className={styles.link}>integritetspolicy</a>.
          </span>
        </label>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Håll dig uppdaterad (Valfritt)</h3>
        <p className={styles.sectionDesc}>
          Få smarta energitips och erbjudanden från Bixia.
        </p>
        
        <div className={styles.marketingOptions}>
          <label className={styles.marketingLabel}>
            <input 
              type="checkbox" 
              checked={marketingEmail} 
              onChange={(e) => setMarketingEmail(e.target.checked)}
              className={styles.checkbox}
            />
            <span>E-post</span>
          </label>

          <label className={styles.marketingLabel}>
            <input 
              type="checkbox" 
              checked={marketingSms} 
              onChange={(e) => setMarketingSms(e.target.checked)}
              className={styles.checkbox}
            />
            <span>SMS</span>
          </label>
        </div>
      </div>

      <div className={styles.footer}>
        <Button 
          disabled={!termsAccepted}
          onClick={handleContinue}
          className={styles.continueButton}
        >
          Gå vidare till signering
        </Button>
        <button className={styles.backLink} onClick={onBack}>
          ← Tillbaka
        </button>
      </div>
    </div>
  );
};
