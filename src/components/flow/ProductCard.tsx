import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Product } from '@/types';
import styles from './ProductCard.module.css';

interface ProductWithPrice extends Product {
  pricePerKwh: number;
}

interface ProductCardProps {
  product: Product;
  onSelect: () => void;
  showVat?: boolean;
  isActionDisabled?: boolean;
  disabledMessage?: string;
}

export const ProductCard = ({
  product,
  onSelect,
  showVat = true,
  isActionDisabled = false,
  disabledMessage,
}: ProductCardProps) => {
  const displayPrice = showVat 
    ? product.pricePerKwh 
    : (product.pricePerKwh ? product.pricePerKwh * 0.8 : undefined);

  return (
    <Card className={styles.productCard}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.name}>{product.name}</h3>
          {displayPrice !== undefined && (
            <div className={styles.priceContainer}>
              <span className={styles.price}>{displayPrice.toFixed(2)} öre/kWh</span>
              <span className={styles.vatLabel}>{showVat ? 'inkl. moms' : 'exkl. moms'}</span>
            </div>
          )}
        </div>
        {product.isDiscounted && (
          <div className={styles.discountBadge}>
            <span className={styles.discountText}>{product.discountText}</span>
          </div>
        )}
        <p className={styles.description}>{product.description}</p>
      </div>
      <div className={styles.footer}>
        <Button 
          variant="primary" 
          fullWidth 
          disabled={isActionDisabled}
          onClick={onSelect}
        >
          Teckna
        </Button>
        {isActionDisabled && disabledMessage && (
          <p className={styles.disabledMessage}>{disabledMessage}</p>
        )}
      </div>
    </Card>
  );
};
