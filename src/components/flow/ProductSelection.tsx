"use client";

import { ProductCard } from './ProductCard';
import { Select } from '@/components/ui/Select';
import { getProductsForRegion } from '@/services/mockData';
import { useState } from 'react';
import { Product } from '@/types';
import styles from './ProductSelection.module.css';

interface ProductSelectionProps {
  onProductSelect?: (product: Product) => void;
}

export const ProductSelection = ({ onProductSelect }: ProductSelectionProps) => {
  // Local UI state for region
  const [region, setLocalRegion] = useState('SE3');
  const products = getProductsForRegion(region);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalRegion(e.target.value);
  };

  const handleSelectProduct = (product: any) => {
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Välj elavtal</h2>
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
      </header>

      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onSelect={() => handleSelectProduct(product)}
          />
        ))}
      </div>
    </div>
  );
};
