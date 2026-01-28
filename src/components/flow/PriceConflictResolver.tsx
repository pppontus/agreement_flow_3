"use client";

import { useFlowState } from '@/hooks/useFlowState';
import { getProductsForRegion } from '@/services/mockData';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/Button';
import styles from './PriceConflictResolver.module.css';

export const PriceConflictResolver = () => {
  const { state, selectProduct, resolvePriceConflict } = useFlowState();
  const { elomrade, selectedProduct } = state;

  if (!elomrade || !selectedProduct) return null;

  // Get products for the new region
  const allRegionalProducts = getProductsForRegion(elomrade);
  
  // Find if the currently selected product exists in the new region
  const updatedProduct = allRegionalProducts.find(p => p.id === selectedProduct.id);
  
  // Filter alternatives to only include non-discounted items (per user request)
  const alternativeProducts = allRegionalProducts.filter(p => !p.isDiscounted);

  // Handle case: Product unavailable in new region
  if (!updatedProduct) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.icon}>⚠️</div>
          <h2 className={styles.title}>Avtalet finns inte i elområde {elomrade}</h2>
          <p className={styles.description}>
            Det valda avtalet "{selectedProduct.name}" är tyvärr inte tillgängligt för den adress du valt.
            Vänligen välj ett av de tillgängliga avtalen nedan för att gå vidare.
          </p>
        </div>

        <div className={styles.grid}>
          {alternativeProducts.map(product => (
            <ProductCard 
              key={product.id}
              product={product}
              onSelect={() => {
                selectProduct(product);
                resolvePriceConflict();
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Handle case: Price changed
  const oldPrice = selectedProduct.pricePerKwh;
  const newPrice = updatedProduct.pricePerKwh;

  const handleAcceptPrice = () => {
    // Update to the new product (with correct price) and resolve conflict
    selectProduct(updatedProduct);
    resolvePriceConflict();
  };

  return (
    <div className={styles.container}>
      <div className={styles.confirmer}>
        <div className={styles.icon}>ℹ️</div>
        <h2 className={styles.title}>Priset har uppdaterats</h2>
        <p className={styles.description}>
          Adressen du har valt ligger i elområde <strong>{elomrade}</strong>. 
          För detta område gäller ett annat pris än det som visades tidigare.
        </p>

        <div className={styles.priceBox}>
          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>Tidigare pris (uppskattat):</span>
            <span className={styles.oldPrice}>{oldPrice?.toFixed(2)} öre/kWh</span>
          </div>
          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>Gällande pris för {elomrade}:</span>
            <span className={styles.newPrice}>{newPrice?.toFixed(2)} öre/kWh</span>
          </div>
        </div>

        <Button onClick={handleAcceptPrice} className={styles.confirmButton}>
          Godkänn nytt pris och fortsätt
        </Button>
      </div>
    </div>
  );
};
