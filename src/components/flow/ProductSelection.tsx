"use client";

import { ProductCard } from './ProductCard';
import { Select } from '@/components/ui/Select';
import { ContractAdvisor } from './ContractAdvisor';
import { getProductsForRegion } from '@/services/mockData';
import { useEffect, useState } from 'react';
import { CompareProfileKwh, Elomrade, HousingType, Product } from '@/types';
import { useFlowState } from '@/context/FlowStateContext';
import {
  COMPARE_PRICE_PROFILES,
  CUSTOM_CONSUMPTION_MAX_KWH,
  CUSTOM_CONSUMPTION_MIN_KWH,
  DEFAULT_COMPARE_PROFILE_ID,
  DEFAULT_COMPARE_PROFILE_KWH,
  getActiveCompareConsumptionKwh,
} from '@/services/comparePriceService';
import styles from './ProductSelection.module.css';

interface ProductSelectionProps {
  onProductSelect?: (product: Product, region: Elomrade) => void;
  onBack?: () => void;
  isCompany?: boolean;
  initialRegion?: string;
  hideRegionSelector?: boolean;
  requireRegionSelection?: boolean;
  visibleProductIds?: string[];
  allowAdvisor?: boolean;
  title?: string;
  notice?: string;
  showGenericOptionSection?: boolean;
  compareConfig?: {
    housingType: HousingType | null;
    compareProfileKwh: CompareProfileKwh | null;
    customConsumptionKwh: number | null;
  };
  onCompareConfigChange?: (profile: {
    housingType?: HousingType | null;
    compareProfileKwh?: CompareProfileKwh | null;
    customConsumptionKwh?: number | null;
  }) => void;
}

export const ProductSelection = ({ 
  onProductSelect, 
  onBack,
  isCompany = false,
  initialRegion,
  hideRegionSelector = false,
  requireRegionSelection = false,
  visibleProductIds,
  allowAdvisor = true,
  title = 'Välj elavtal',
  notice,
  showGenericOptionSection = true,
  compareConfig,
  onCompareConfigChange,
}: ProductSelectionProps) => {
  const { state: rawState, setElomrade } = useFlowState();
  
  // Safely get private state if applicable
  const privateState = rawState.customerType === 'PRIVATE' ? rawState : null;
  const effectiveRegion = initialRegion || (typeof privateState?.elomrade === 'string' ? privateState.elomrade : '');
  const fallbackRegion = isCompany && !effectiveRegion ? 'SE3' : effectiveRegion;

  const [region, setLocalRegion] = useState(requireRegionSelection && !effectiveRegion ? '' : fallbackRegion);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [isCustomInputOpen, setIsCustomInputOpen] = useState(!!compareConfig?.customConsumptionKwh);
  const [customConsumptionInput, setCustomConsumptionInput] = useState(
    compareConfig?.customConsumptionKwh ? String(compareConfig.customConsumptionKwh) : ''
  );
  const [customConsumptionError, setCustomConsumptionError] = useState<string | null>(null);
  
  // Sync local region when state.elomrade changes (only for private flow)
  useEffect(() => {
    if (privateState?.elomrade && privateState.elomrade !== region) {
      const timer = window.setTimeout(() => {
        setLocalRegion(privateState.elomrade!);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [privateState?.elomrade, region]);

  // Pass isCompany to getProductsForRegion
  const hasRegion = region === 'SE1' || region === 'SE2' || region === 'SE3' || region === 'SE4';
  const allProducts = hasRegion ? getProductsForRegion(region, isCompany, true) : [];
  const standardProducts = allProducts.filter(p => !p.isDiscounted);
  const configuredProducts = visibleProductIds
    ? allProducts.filter((product) => visibleProductIds.includes(product.id))
    : standardProducts;
  const isFastprisLikelyUnavailable = (product: Product) =>
    product.type === 'FAST' && (region === 'SE1' || region === 'SE2');
  const configuredOfferUnavailable = !!visibleProductIds && configuredProducts.some(isFastprisLikelyUnavailable);
  const offerIsDiscounted = configuredProducts.some((product) => product.isDiscounted);
  const displayedProducts = configuredOfferUnavailable
    ? allProducts.filter(
        (product) =>
          !!product.isDiscounted === offerIsDiscounted &&
          !isFastprisLikelyUnavailable(product)
      )
    : configuredProducts;
  const selectedProfileId = compareConfig?.housingType || DEFAULT_COMPARE_PROFILE_ID;
  const selectedProfile =
    COMPARE_PRICE_PROFILES.find((profile) => profile.id === selectedProfileId) || COMPARE_PRICE_PROFILES[0];
  const selectedProfileKwh = compareConfig?.compareProfileKwh || selectedProfile?.annualConsumptionKwh || DEFAULT_COMPARE_PROFILE_KWH;
  const selectedCustomConsumptionKwh = compareConfig?.customConsumptionKwh || null;
  const activeCompareConsumption = getActiveCompareConsumptionKwh({
    compareProfileKwh: selectedProfileKwh,
    customConsumptionKwh: selectedCustomConsumptionKwh,
  });
  const hasCustomOverride = typeof selectedCustomConsumptionKwh === 'number';
  const showCompareControls = !isCompany && !!onCompareConfigChange && !!compareConfig;
  const formatter = new Intl.NumberFormat('sv-SE');

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRegion = e.target.value as 'SE1' | 'SE2' | 'SE3' | 'SE4';
    setLocalRegion(newRegion);
    if (!isCompany) {
      setElomrade(newRegion); // Only persist to global state for private flow
    }
  };

  const handleSelectProduct = (product: Product) => {
    if (onProductSelect && hasRegion) {
      onProductSelect(product, region);
    }
  };

  const handleProfileChange = (value: string) => {
    if (!onCompareConfigChange) return;
    const profile = COMPARE_PRICE_PROFILES.find((candidate) => candidate.id === value);
    if (!profile) return;
    onCompareConfigChange({
      housingType: profile.id,
      compareProfileKwh: profile.annualConsumptionKwh,
      customConsumptionKwh: null,
    });
    setIsCustomInputOpen(false);
    setCustomConsumptionInput('');
    setCustomConsumptionError(null);
  };

  const applyCustomConsumption = () => {
    if (!onCompareConfigChange) return;
    const value = customConsumptionInput.replace(/\D/g, '');
    const consumptionKwh = Number(value);
    if (!value || Number.isNaN(consumptionKwh)) {
      setCustomConsumptionError('Ange en giltig förbrukning.');
      return;
    }
    if (consumptionKwh < CUSTOM_CONSUMPTION_MIN_KWH || consumptionKwh > CUSTOM_CONSUMPTION_MAX_KWH) {
      setCustomConsumptionError(
        `Ange ett värde mellan ${formatter.format(CUSTOM_CONSUMPTION_MIN_KWH)} och ${formatter.format(CUSTOM_CONSUMPTION_MAX_KWH)} kWh/år.`
      );
      return;
    }
    onCompareConfigChange({
      housingType: selectedProfile.id,
      compareProfileKwh: selectedProfile.annualConsumptionKwh,
      customConsumptionKwh: consumptionKwh,
    });
    setIsCustomInputOpen(false);
    setCustomConsumptionError(null);
  };

  const clearCustomConsumption = () => {
    if (!onCompareConfigChange) return;
    onCompareConfigChange({
      housingType: selectedProfile.id,
      compareProfileKwh: selectedProfile.annualConsumptionKwh,
      customConsumptionKwh: null,
    });
    setCustomConsumptionInput('');
    setCustomConsumptionError(null);
    setIsCustomInputOpen(false);
  };

  const handleAdvisorSelect = (type: 'FAST' | 'RORLIGT' | 'KVARTS') => {
    const product = standardProducts.find(p => p.type === type);
    if (product && onProductSelect && hasRegion) {
      onProductSelect(product, region);
    }
    setShowAdvisor(false);
  };

  if (showAdvisor) {
    return (
      <ContractAdvisor
        onSelectType={handleAdvisorSelect}
        onCancel={() => setShowAdvisor(false)}
      />
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {!hideRegionSelector && (
          <div className={styles.controls}>
            <Select 
              label="Elområde"
              value={region}
              onChange={handleRegionChange}
              id="region-select"
            >
              {requireRegionSelection && <option value="">Välj elområde</option>}
              <option value="SE1">SE1 (Luleå)</option>
              <option value="SE2">SE2 (Sundsvall)</option>
              <option value="SE3">SE3 (Stockholm)</option>
              <option value="SE4">SE4 (Malmö)</option>
            </Select>
          </div>
        )}
      </header>

      {hideRegionSelector && hasRegion && (
        <p className={styles.regionContext}>Elområde {region}, utifrån den valda adressen.</p>
      )}

      {requireRegionSelection && !hasRegion && (
        <p className={styles.regionPrompt}>Välj elområde för att se rätt pris på erbjudandet.</p>
      )}

      {configuredOfferUnavailable && (
        <p className={styles.regionPrompt}>
          Det förvalda avtalet finns inte i elområde {region}. Välj ett av alternativen nedan.
        </p>
      )}

      {showCompareControls && hasRegion && (
        <section className={styles.compareSection}>
          <h3 className={styles.compareTitle}>Anpassa jämförpris</h3>
          <div className={styles.compareSentenceRow}>
            <span className={styles.compareSentenceText}>
              Det pris vi använt för jämförpris motsvarar
            </span>
            <span className={styles.inlineSelectWrap}>
              <select
                className={styles.inlineSelect}
                value={selectedProfile.id}
                onChange={(e) => handleProfileChange(e.target.value)}
                aria-label="Profil för jämförpris"
              >
                {COMPARE_PRICE_PROFILES.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label}
                  </option>
                ))}
              </select>
            </span>
          </div>
          {!isCustomInputOpen && !hasCustomOverride && (
            <p className={styles.compareNote}>
              {formatter.format(selectedProfile.annualConsumptionKwh)} kWh/år är ett vanligt antagande för {selectedProfile.assumptionContext}. Förbrukningen varierar mellan hushåll.
              Om du känner till din förbrukning kan du{' '}
              <button
                type="button"
                className={styles.inlineAction}
                onClick={() => {
                  setIsCustomInputOpen(true);
                  setCustomConsumptionInput(selectedCustomConsumptionKwh ? String(selectedCustomConsumptionKwh) : '');
                  setCustomConsumptionError(null);
                }}
              >
                Ange egen förbrukning
              </button>
              {' '}för att få en mer relevant jämförelse.
            </p>
          )}

          {isCustomInputOpen && (
            <div className={styles.customInlinePanel}>
              <div className={styles.customInlineRow}>
                <div className={styles.customField}>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={styles.customInlineInput}
                    placeholder={`${formatter.format(CUSTOM_CONSUMPTION_MIN_KWH)}-${formatter.format(CUSTOM_CONSUMPTION_MAX_KWH)}`}
                    value={customConsumptionInput}
                    onChange={(e) => {
                      setCustomConsumptionInput(e.target.value.replace(/\D/g, ''));
                      if (customConsumptionError) {
                        setCustomConsumptionError(null);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyCustomConsumption();
                      }
                    }}
                    aria-label="Egen förbrukning i kWh per år"
                  />
                  <span className={styles.customInlineUnit}>kWh/år</span>
                </div>
                <button type="button" className={styles.inlineButtonPrimary} onClick={applyCustomConsumption}>
                  Använd
                </button>
                <button
                  type="button"
                  className={styles.inlineButtonMuted}
                  onClick={() => {
                    setIsCustomInputOpen(false);
                    setCustomConsumptionError(null);
                  }}
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}

          {customConsumptionError && <p className={styles.customError}>{customConsumptionError}</p>}

          {hasCustomOverride && !isCustomInputOpen && (
            <p className={styles.customActive}>
              Egen förbrukning används: {formatter.format(activeCompareConsumption)} kWh/år.
              {' '}
              <button type="button" className={styles.inlineActionMuted} onClick={clearCustomConsumption}>
                Återställ profilvärde
              </button>
            </p>
          )}
        </section>
      )}

      {notice && (
        <p className={styles.notice}>{notice}</p>
      )}

      <div className={styles.optionsRow}>
        {!isCompany && allowAdvisor && !visibleProductIds && hasRegion && (
          <button 
            className={styles.advisorLink}
            onClick={() => setShowAdvisor(true)}
          >
            💡 Hjälp mig välja
          </button>
        )}

      </div>

      <div className={styles.grid}>
        {displayedProducts.map((product) => {
          const isRestricted = isFastprisLikelyUnavailable(product);
          return (
          <ProductCard 
            key={product.id} 
            product={product} 
            onSelect={() => handleSelectProduct(product)}
            showVat={!isCompany}
            comparisonKwh={activeCompareConsumption}
            showCompareDetails={!isCompany}
            isActionRestricted={isRestricted}
            restrictedMessage={isRestricted ? 'Detta avtal finns inte i det här området.' : undefined}
          />
          );
        })}
      </div>

      {!privateState?.valdAdress && showGenericOptionSection && hasRegion && (
        <section className={styles.unspecifiedSection}>
          <header className={styles.header} style={{ marginTop: 'var(--space-2xl)' }}>
            <h2 className={styles.title}>Osäker på avtalsform?</h2>
          </header>
          <div className={styles.unspecifiedGrid}>
            <ProductCard 
              product={{
                id: 'GENERIC',
                name: 'Teckna elavtal',
                type: 'RORLIGT',
                description: 'Välj senare. Vi guidar dig utifrån adressen.',
                contractTerms: { bindingMonths: null, noticeMonths: 1 },
              }} 
              onSelect={() => handleSelectProduct({
                id: 'GENERIC',
                name: 'Teckna elavtal',
                type: 'RORLIGT',
                description: 'Välj senare. Vi guidar dig utifrån adressen.',
                contractTerms: { bindingMonths: null, noticeMonths: 1 },
              })}
            />
          </div>
        </section>
      )}

      {onBack && (
        <button type="button" className={styles.backLink} onClick={onBack}>
          ← Tillbaka
        </button>
      )}
    </div>
  );
};
