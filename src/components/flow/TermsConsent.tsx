"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FacilityHandling, Product } from '@/types';
import styles from './TermsConsent.module.css';

interface TermsConsentProps {
  onConfirm: (data: { 
    termsAccepted: boolean; 
    riskAccepted: boolean;
    marketing: { email: boolean; sms: boolean };
    facilityHandling?: FacilityHandling;
  }) => void;
  onBack: () => void;
  requiresFacilityId?: boolean; // If true, show facility ID section (e.g. for moves)
  productType?: Product['type'];
  initialRiskAccepted?: boolean;
  existingMarketingConsent?: { email: boolean; sms: boolean };
  initialMarketingConsent?: { email: boolean; sms: boolean };
  initialFacilityHandling?: FacilityHandling | null;
}

export const TermsConsent = ({
  onConfirm,
  onBack,
  requiresFacilityId = false,
  productType,
  initialRiskAccepted = false,
  existingMarketingConsent = { email: false, sms: false },
  initialMarketingConsent = { email: false, sms: false },
  initialFacilityHandling = null,
}: TermsConsentProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [riskAccepted, setRiskAccepted] = useState(initialRiskAccepted);
  const [marketingEmail, setMarketingEmail] = useState(initialMarketingConsent.email);
  const [marketingSms, setMarketingSms] = useState(initialMarketingConsent.sms);
  
  // Facility ID logic
  const [fetchFacilityId, setFetchFacilityId] = useState(initialFacilityHandling?.mode !== 'MANUAL');
  const [manualFacilityId, setManualFacilityId] = useState(
    initialFacilityHandling?.mode === 'MANUAL' ? (initialFacilityHandling.facilityId || '') : ''
  );
  const [facilityIdError, setFacilityIdError] = useState('');
  const hasExistingEmailConsent = existingMarketingConsent.email;
  const hasExistingSmsConsent = existingMarketingConsent.sms;
  const showMarketingOptions = !hasExistingEmailConsent || !hasExistingSmsConsent;
  const requiresRiskInfo = productType === 'FAST' || productType === 'KVARTS';
  const canContinue = termsAccepted && (!requiresRiskInfo || riskAccepted);

  const handleContinue = () => {
    if (requiresFacilityId && !fetchFacilityId && !manualFacilityId) {
      setFacilityIdError('Ange anläggnings-ID eller ge fullmakt');
      return;
    }

    if (canContinue) {
      onConfirm({
        termsAccepted,
        riskAccepted: requiresRiskInfo ? riskAccepted : false,
        marketing: {
          // Existing CRM consent is preserved and cannot be removed in the UI.
          email: hasExistingEmailConsent || marketingEmail,
          sms: hasExistingSmsConsent || marketingSms,
        },
        facilityHandling: requiresFacilityId
          ? fetchFacilityId
            ? { mode: 'FETCH_WITH_POWER_OF_ATTORNEY', facilityId: null }
            : { mode: 'MANUAL', facilityId: manualFacilityId }
          : undefined
      });
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Godkänn villkor</h2>
        <p className={styles.subtitle}>
          Godkänn villkoren för att gå vidare till signering.
        </p>
      </header>

      <div className={styles.section}>
        {requiresFacilityId && (
          <div className={styles.facilitySection}>
            <p className={styles.facilityInfoText}>
              Anläggnings-ID är 18 siffror och finns oftast på fakturan från ditt nätbolag.
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
                Jag ger Bixia fullmakt att hämta anläggnings-ID.
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
                <p className={styles.helperText}>Anläggnings-ID börjar oftast med 735999.</p>
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
            Jag godkänner <a href="#" className={styles.link}>avtalsvillkoren</a> och har läst <a href="#" className={styles.link}>ångerrätt</a> och <a href="#" className={styles.link}>integritetspolicy</a>.
          </span>
        </label>
      </div>

      {requiresRiskInfo && (
        <>
          <div className={styles.divider}></div>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Viktig information</h3>
            <p className={styles.sectionDesc}>
              Detta gäller för ditt {productType === 'FAST' ? 'fastprisavtal' : 'kvartsprisavtal'}.
            </p>
            <div className={styles.riskInfoBox}>
              <p className={styles.riskInfoText}>
                {productType === 'FAST'
                  ? 'Fast pris skyddar mot prishöjningar, men brytavgift kan tillkomma om avtalet avslutas i förtid.'
                  : 'Priset varierar över tid och kan påverka din månadskostnad.'}
              </p>
              <a href="#" className={styles.riskInfoLink}>Läs mer om risker</a>
            </div>
            <label className={`${styles.checkboxLabel} ${riskAccepted ? styles.checked : ''}`}>
              <input
                type="checkbox"
                checked={riskAccepted}
                onChange={(e) => setRiskAccepted(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.labelText}>
                Jag har tagit del av riskinformationen.
              </span>
            </label>
          </div>
        </>
      )}

      {showMarketingOptions && (
        <>
          <div className={styles.divider}></div>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Utskick (valfritt)</h3>
            <p className={styles.sectionDesc}>
              Jag vill få tips och erbjudanden från Bixia.
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
          disabled={!canContinue}
          onClick={handleContinue}
          className={styles.continueButton}
        >
          Till signering
        </Button>
        <button className={styles.backLink} onClick={onBack}>
          ← Tillbaka
        </button>
      </div>
    </div>
  );
};
