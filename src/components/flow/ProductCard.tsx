import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Product } from '@/types';
import { calculateComparePriceOrePerKwh } from '@/services/comparePriceService';
import { useEffect, useMemo, useState } from 'react';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onSelect: () => void;
  showVat?: boolean;
  comparisonKwh?: number;
  showCompareDetails?: boolean;
  isActionRestricted?: boolean;
  restrictedMessage?: string;
}

type PriceSegment = {
  key: string;
  label: string;
  annualCostSek: number;
  color: string;
};

const buildConicGradient = (segments: PriceSegment[], totalAnnualCostSek: number): string => {
  if (segments.length === 0 || totalAnnualCostSek <= 0) {
    return 'conic-gradient(#e0e0e0 0% 100%)';
  }
  let cursor = 0;
  const stops = segments
    .filter((segment) => segment.annualCostSek > 0)
    .map((segment) => {
      const start = cursor;
      const delta = (segment.annualCostSek / totalAnnualCostSek) * 100;
      cursor += delta;
      return `${segment.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    });

  if (stops.length === 0) {
    return 'conic-gradient(#e0e0e0 0% 100%)';
  }
  return `conic-gradient(${stops.join(', ')})`;
};

export const ProductCard = ({
  product,
  onSelect,
  showVat = true,
  comparisonKwh = 5000,
  showCompareDetails = true,
  isActionRestricted = false,
  restrictedMessage,
}: ProductCardProps) => {
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const closePriceModal = () => setIsPriceModalOpen(false);
  const vatFactor = showVat ? 1 : 0.8;
  const formatter = new Intl.NumberFormat('sv-SE');
  const annualConsumptionKwh = comparisonKwh > 0 ? comparisonKwh : 5000;
  const hasDetailedPrice =
    product.energyPriceOrePerKwh !== undefined &&
    product.surchargeOrePerKwh !== undefined &&
    product.fixedFeeSekPerMonth !== undefined &&
    product.otherFeeSekPerMonth !== undefined;
  const profileComparePrice = calculateComparePriceOrePerKwh(product, comparisonKwh);
  const displayProfileComparePrice =
    profileComparePrice !== null ? profileComparePrice * vatFactor : undefined;
  const fallbackPrice = showVat
    ? product.pricePerKwh
    : (product.pricePerKwh ? product.pricePerKwh * 0.8 : undefined);
  const showDetailsLink = showCompareDetails && hasDetailedPrice;

  const bixiaSegments = useMemo<PriceSegment[]>(() => {
    if (!hasDetailedPrice) return [];
    const energy = ((product.energyPriceOrePerKwh || 0) * annualConsumptionKwh * vatFactor) / 100;
    const surcharge = ((product.surchargeOrePerKwh || 0) * annualConsumptionKwh * vatFactor) / 100;
    const fixed = (product.fixedFeeSekPerMonth || 0) * 12 * vatFactor;
    const other = (product.otherFeeSekPerMonth || 0) * 12 * vatFactor;

    return [
      { key: 'energy', label: 'Elpris', annualCostSek: energy, color: '#1f2937' },
      { key: 'surcharge', label: 'Påslag', annualCostSek: surcharge, color: '#4b5563' },
      { key: 'fixed', label: 'Fast avgift', annualCostSek: fixed, color: '#9ca3af' },
      { key: 'other', label: 'Övriga avgifter', annualCostSek: other, color: '#d1d5db' },
    ].filter((segment) => segment.annualCostSek > 0);
  }, [annualConsumptionKwh, hasDetailedPrice, product, vatFactor]);

  const totalAnnualCostSek = useMemo(
    () => bixiaSegments.reduce((sum, segment) => sum + segment.annualCostSek, 0),
    [bixiaSegments]
  );
  const totalMonthlyCostSek = totalAnnualCostSek / 12;
  const chartBackground = useMemo(
    () => buildConicGradient(bixiaSegments, totalAnnualCostSek),
    [bixiaSegments, totalAnnualCostSek]
  );

  useEffect(() => {
    if (!isPriceModalOpen) return undefined;
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPriceModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [isPriceModalOpen]);

  return (
    <>
      <Card className={styles.productCard}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h3 className={styles.name}>{product.name}</h3>
            <p className={styles.description}>{product.description}</p>
            {(displayProfileComparePrice !== undefined || fallbackPrice !== undefined) && (
              <div className={styles.priceContainer}>
                <span className={styles.compareLabel}>Jämförpris</span>
                <div className={styles.priceRow}>
                  <span className={styles.price}>
                    {(displayProfileComparePrice ?? fallbackPrice)?.toFixed(2)} öre/kWh
                  </span>
                  <span className={styles.vatLabel}>{showVat ? 'inkl. moms' : 'exkl. moms'}</span>
                </div>
              </div>
            )}
            <p className={styles.assumptionText}>
              Exempelberäkning: {formatter.format(annualConsumptionKwh)} kWh/år.
            </p>
            {showDetailsLink && (
              <button
                type="button"
                className={styles.detailsLink}
                onClick={() => setIsPriceModalOpen(true)}
              >
                Visa prisdetaljer
              </button>
            )}
          </div>
          {product.isDiscounted && (
            <div className={styles.discountBadge}>
              <span className={styles.discountText}>{product.discountText}</span>
            </div>
          )}
        </div>
        <div className={styles.footer}>
          <Button
            variant={isActionRestricted ? 'secondary' : 'primary'}
            fullWidth
            onClick={onSelect}
            disabled={isActionRestricted}
          >
            Välj avtal
          </Button>
          {isActionRestricted && restrictedMessage && (
            <p className={styles.disabledMessage}>{restrictedMessage}</p>
          )}
        </div>
      </Card>

      {isPriceModalOpen && (
        <div className={styles.modalBackdrop} onClick={closePriceModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label={`Prisdetaljer för ${product.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Prisdetaljer - {product.name}</h4>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closePriceModal}
              >
                Stäng
              </button>
            </div>

            <p className={styles.modalAssumption}>
              Priserna här är ungefärliga och hjälper dig jämföra uppläggen.
            </p>
            <p className={styles.modalAssumptionSubtle}>
              Beräkningen utgår från normal villa ({formatter.format(annualConsumptionKwh)} kWh/år,{' '}
              {showVat ? 'inkl. moms' : 'exkl. moms'}). Ändra förbrukning i &quot;Anpassa jämförpris&quot;.
            </p>

            <div className={styles.chartSection}>
              <div className={styles.chartColumn}>
                <div className={styles.donutStack}>
                  <div
                    className={`${styles.donutLayer} ${styles.donutLayerVisible}`}
                    style={{ backgroundImage: chartBackground }}
                    aria-hidden="true"
                  />
                  <div className={styles.donutCenter}>
                    <span className={styles.totalLabel}>Totalt</span>
                    <strong className={styles.totalValue}>{totalMonthlyCostSek.toFixed(0)} kr/mån</strong>
                  </div>
                </div>
              </div>

              <div className={styles.segmentList}>
                {bixiaSegments.map((segment) => {
                  const share = totalAnnualCostSek > 0 ? (segment.annualCostSek / totalAnnualCostSek) * 100 : 0;
                  return (
                    <div key={segment.key} className={styles.segmentRow}>
                      <span className={styles.segmentLabel}>
                        <span
                          className={styles.segmentDot}
                          style={{ backgroundColor: segment.color }}
                          aria-hidden="true"
                        />
                        {segment.label}
                      </span>
                      <span className={styles.segmentValue}>
                        {(segment.annualCostSek / 12).toFixed(0)} kr/mån ({share.toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className={styles.modalNetworkNote}>
              Det här visar dina elhandelsavgifter hos Bixia. Du får även en separat faktura för elnätskostnader från
              ditt nätbolag.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
