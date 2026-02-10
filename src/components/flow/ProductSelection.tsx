"use client";

import { ProductCard } from './ProductCard';
import { Select } from '@/components/ui/Select';
import { ContractAdvisor } from './ContractAdvisor';
import { getProductsForRegion } from '@/services/mockData';
import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { useFlowState } from '@/hooks/useFlowState';
import styles from './ProductSelection.module.css';

interface ProductSelectionProps {
  onProductSelect?: (product: Product) => void;
  isCompany?: boolean;
  initialRegion?: string;
  hideRegionSelector?: boolean;
}

export const ProductSelection = ({ 
  onProductSelect, 
  isCompany = false,
  initialRegion,
  hideRegionSelector = false
}: ProductSelectionProps) => {
  const { state: rawState, setElomrade } = useFlowState();
  
  // Safely get private state if applicable
  const privateState = rawState.customerType === 'PRIVATE' ? rawState : null;
  const effectiveRegion = initialRegion || (typeof privateState?.elomrade === 'string' ? privateState.elomrade : 'SE3');
  const hasSelectedAddress = hideRegionSelector || !!privateState?.valdAdress;

  const [region, setLocalRegion] = useState(effectiveRegion);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [showDiscounts, setShowDiscounts] = useState(false);
  
  // Sync local region when state.elomrade changes (only for private flow)
  useEffect(() => {
    if (privateState?.elomrade && privateState.elomrade !== region) {
      setLocalRegion(privateState.elomrade);
    }
  }, [privateState?.elomrade]);
  
  // Pass isCompany to getProductsForRegion
  const allProducts = getProductsForRegion(region, isCompany, true);
  const standardProducts = allProducts.filter(p => !p.isDiscounted);
  const discountedProducts = allProducts.filter(p => p.isDiscounted);
  
  const displayedProducts = showDiscounts ? discountedProducts : standardProducts;
  const isFastprisLikelyUnavailable = (product: Product) =>
    product.type === 'FAST' && (region === 'SE1' || region === 'SE2');

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRegion = e.target.value as 'SE1' | 'SE2' | 'SE3' | 'SE4';
    setLocalRegion(newRegion);
    if (!isCompany) {
      setElomrade(newRegion); // Only persist to global state for private flow
    }
  };

  const handleSelectProduct = (product: Product) => {
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  const handleAdvisorSelect = (type: 'FAST' | 'RORLIGT' | 'KVARTS') => {
    const product = standardProducts.find(p => p.type === type);
    if (product && onProductSelect) {
      onProductSelect(product);
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
      {!hasSelectedAddress && (
        <section className={styles.conceptSection}>
          <p className={styles.conceptText}>
            Denna sida representerar en valfri undersida på bixia.se. I det här konceptet har vi brutit ut "produktkorten" 
            så att de kan placeras var som helst på hemsidan för att inleda avtalsflödet därifrån.
          </p>
        </section>
      )}

      <header className={styles.header}>
        <h2 className={styles.title}>Välj elavtal</h2>
        {!hasSelectedAddress && (
          <div className={styles.controls}>
            <Select 
              label="Elområde"
              value={region}
              onChange={handleRegionChange}
              id="region-select"
            >
              <option value="SE1">SE1 (Luleå)</option>
              <option value="SE2">SE2 (Sundsvall)</option>
              <option value="SE3">SE3 (Stockholm)</option>
              <option value="SE4">SE4 (Malmö)</option>
            </Select>
          </div>
        )}
      </header>

      <div className={styles.optionsRow}>
        {!isCompany && (
          <button 
            className={styles.advisorLink}
            onClick={() => setShowAdvisor(true)}
          >
            💡 Hjälp mig välja avtalsform
          </button>
        )}

        {discountedProducts.length > 0 && (
          <div className={styles.toggleWrapper}>
            <span className={styles.toggleLabel}>Visa rabatterade avtal</span>
            <label className={styles.switch}>
              <input 
                type="checkbox" 
                checked={showDiscounts}
                onChange={(e) => setShowDiscounts(e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
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
            isActionRestricted={isRestricted}
            restrictedMessage={isRestricted ? 'Avtalet verkar inte tillgängligt i ditt område.' : undefined}
          />
          );
        })}
      </div>

      {!hasSelectedAddress && (
        <section className={styles.unspecifiedSection}>
          <header className={styles.header} style={{ marginTop: 'var(--space-2xl)' }}>
            <h2 className={styles.title}>Ej specificerat avtal</h2>
          </header>
          <div className={styles.unspecifiedGrid}>
            <ProductCard 
              product={{
                id: 'GENERIC',
                name: 'Teckna elavtal',
                type: 'RORLIGT',
                description: 'Vi hjälper dig välja rätt avtal baserat på din adress och behov.'
              }} 
              onSelect={() => handleSelectProduct({ id: 'GENERIC', name: 'Teckna elavtal', type: 'RORLIGT' } as Product)}
            />
          </div>
        </section>
      )}
    </div>
  );
};
