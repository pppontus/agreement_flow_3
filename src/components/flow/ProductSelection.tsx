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
}

export const ProductSelection = ({ onProductSelect }: ProductSelectionProps) => {
  const { state, setElomrade } = useFlowState();
  
  // Use elomrade from state, fallback to SE3
  const [region, setLocalRegion] = useState(state.elomrade || 'SE3');
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [showDiscounts, setShowDiscounts] = useState(false);
  
  // Sync local region when state.elomrade changes (e.g., after API detection)
  useEffect(() => {
    if (state.elomrade && state.elomrade !== region) {
      setLocalRegion(state.elomrade);
    }
  }, [state.elomrade]);
  
  const allProducts = getProductsForRegion(region);
  const standardProducts = allProducts.filter(p => !p.isDiscounted);
  const discountedProducts = allProducts.filter(p => p.isDiscounted);
  
  const displayedProducts = showDiscounts ? discountedProducts : standardProducts;

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRegion = e.target.value as 'SE1' | 'SE2' | 'SE3' | 'SE4';
    setLocalRegion(newRegion);
    setElomrade(newRegion); // Persist to state
  };

  const handleSelectProduct = (product: Product) => {
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  const handleAdvisorSelect = (type: 'FAST' | 'RORLIGT' | 'KVARTS') => {
    // Find matching product (prefer standard if unsure)
    const product = standardProducts.find(p => p.type === type);
    if (product && onProductSelect) {
      onProductSelect(product);
    }
    setShowAdvisor(false);
  };

  // Show advisor wizard if active
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
      {!state.valdAdress && (
        <section className={styles.conceptSection}>
          <p className={styles.conceptText}>
            Denna sida representerar en valfri undersida på bixia.se. I det här konceptet har vi brutit ut "produktkorten" 
            så att de kan placeras var som helst på hemsidan för att inleda avtalsflödet därifrån.
          </p>
        </section>
      )}

      <header className={styles.header}>
        <h2 className={styles.title}>Välj elavtal</h2>
        {!state.valdAdress && (
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
        <button 
          className={styles.advisorLink}
          onClick={() => setShowAdvisor(true)}
        >
          💡 Hjälp mig välja avtalsform
        </button>

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
        {displayedProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onSelect={() => handleSelectProduct(product)}
          />
        ))}
      </div>

      {!state.valdAdress && (
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
