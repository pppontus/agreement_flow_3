"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './TermsConsent.module.css';

interface TermsConsentProps {
  onConfirm: (data: { 
    termsAccepted: boolean; 
    marketing: { email: boolean; sms: boolean };
    facilityId?: { fetch: boolean; value?: string };
  }) => void;
  onBack: () => void;
  requiresFacilityId?: boolean; // If true, show facility ID section (e.g. for moves)
  existingMarketingConsent?: { email: boolean; sms: boolean };
  initialMarketingConsent?: { email: boolean; sms: boolean };
}

export const TermsConsent = ({
  onConfirm,
  onBack,
  requiresFacilityId = false,
  existingMarketingConsent = { email: false, sms: false },
  initialMarketingConsent = { email: false, sms: false },
}: TermsConsentProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingEmail, setMarketingEmail] = useState(initialMarketingConsent.email);
  const [marketingSms, setMarketingSms] = useState(initialMarketingConsent.sms);
  
  // Facility ID logic
  const [fetchFacilityId, setFetchFacilityId] = useState(true);
  const [manualFacilityId, setManualFacilityId] = useState('');
  const [facilityIdError, setFacilityIdError] = useState('');
  const hasExistingEmailConsent = existingMarketingConsent.email;
  const hasExistingSmsConsent = existingMarketingConsent.sms;
  const showMarketingOptions = !hasExistingEmailConsent || !hasExistingSmsConsent;

  const handleContinue = () => {
    if (requiresFacilityId && !fetchFacilityId && !manualFacilityId) {
      setFacilityIdError('Ange anläggnings-ID eller ge fullmakt');
      return;
    }

    if (termsAccepted) {
      onConfirm({
        termsAccepted,
        marketing: {
          // Existing CRM consent is preserved and cannot be removed in the UI.
          email: hasExistingEmailConsent || marketingEmail,
          sms: hasExistingSmsConsent || marketingSms,
        },
        facilityId: requiresFacilityId ? {
          fetch: fetchFacilityId,
          value: !fetchFacilityId ? manualFacilityId : undefined
        } : undefined
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
        {requiresFacilityId && (
          <div className={styles.facilitySection}>
            <p className={styles.facilityInfoText}>
              Ett anläggnings-ID är en unik kod för din elmätare som du hittar hos ditt nätbolag, oftast på din elfaktura.
            </p>
            
            <label className={`${styles.checkboxLabel} ${fetchFacilityId ? styles.checked : ''}`}>
              <input 
                type="checkbox" 
                checked={fetchFacilityId} 
                onChange={(e) => {
                  setFetchFacilityId(e.target.checked);
                  setFacilityIdError('');
                }}
                className={styles.checkbox}
              />
              <span className={styles.labelText}>
                Jag godkänner att Bixia hämtar mitt anläggnings-ID åt mig med fullmakt.
              </span>
            </label>

            {!fetchFacilityId && (
              <div className={styles.manualFacilityId}>
                <Input
                  label="Anläggnings-ID"
                  placeholder="735999..."
                  value={manualFacilityId}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setManualFacilityId(val);
                    setFacilityIdError('');
                  }}
                  error={facilityIdError}
                  maxLength={18}
                />
                <p className={styles.helperText}>Ditt anläggnings-ID består av 18 siffror och börjar oftast på 735999.</p>
              </div>
            )}
            <div className={styles.divider}></div>
          </div>
        )}

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

      {showMarketingOptions && (
        <>
          <div className={styles.divider}></div>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Håll dig uppdaterad (Valfritt)</h3>
            <p className={styles.sectionDesc}>
              Få smarta energitips och erbjudanden från Bixia.
            </p>
            
            <div className={styles.marketingOptions}>
              {!hasExistingEmailConsent && (
                <label className={styles.marketingLabel}>
                  <input 
                    type="checkbox" 
                    checked={marketingEmail} 
                    onChange={(e) => setMarketingEmail(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>E-post</span>
                </label>
              )}

              {!hasExistingSmsConsent && (
                <label className={styles.marketingLabel}>
                  <input 
                    type="checkbox" 
                    checked={marketingSms} 
                    onChange={(e) => setMarketingSms(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>SMS</span>
                </label>
              )}
            </div>
          </div>
        </>
      )}

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
