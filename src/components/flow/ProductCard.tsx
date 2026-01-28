import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Product } from '@/types';
import styles from './ProductCard.module.css';

interface ProductWithPrice extends Product {
  pricePerKwh: number;
}

interface ProductCardProps {
  product: ProductWithPrice;
  onSelect: () => void;
}

export const ProductCard = ({ product, onSelect }: ProductCardProps) => {
  return (
    <Card className={styles.productCard}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.name}>{product.name}</h3>
          <span className={styles.price}>{product.pricePerKwh.toFixed(2)} öre/kWh</span>
        </div>
        <p className={styles.description}>{product.description}</p>
      </div>
      <div className={styles.footer}>
        <Button 
          variant="primary" 
          fullWidth 
          onClick={onSelect}
        >
          Teckna
        </Button>
      </div>
    </Card>
  );
};
