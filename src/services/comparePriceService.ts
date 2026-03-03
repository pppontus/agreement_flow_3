import { CompareProfileKwh, HousingType, Product } from '@/types';

export const STANDARD_COMPARE_KWH_LEVELS: readonly CompareProfileKwh[] = [2000, 5000, 20000];
export const DEFAULT_COMPARE_PROFILE_KWH: CompareProfileKwh = 5000;
export const CUSTOM_CONSUMPTION_MIN_KWH = 1000;
export const CUSTOM_CONSUMPTION_MAX_KWH = 40000;

export type ComparePriceProfile = {
  id: HousingType;
  label: string;
  annualConsumptionKwh: CompareProfileKwh;
  assumptionContext: string;
};

export const COMPARE_PRICE_PROFILES: readonly ComparePriceProfile[] = [
  {
    id: 'KWH_2000',
    label: '2 000 kWh/år · mindre hushåll',
    annualConsumptionKwh: 2000,
    assumptionContext: 'mindre hushåll',
  },
  {
    id: 'KWH_5000',
    label: '5 000 kWh/år · större lägenhet/radhus',
    annualConsumptionKwh: 5000,
    assumptionContext: 'större lägenhet eller radhus',
  },
  {
    id: 'KWH_20000',
    label: '20 000 kWh/år · villa',
    annualConsumptionKwh: 20000,
    assumptionContext: 'villa',
  },
] as const;

export const DEFAULT_COMPARE_PROFILE_ID: HousingType = 'KWH_5000';

export const HOUSING_TYPE_DEFAULT_KWH: Record<HousingType, CompareProfileKwh> = {
  KWH_2000: 2000,
  KWH_5000: 5000,
  KWH_20000: 20000,
};

export const getDefaultCompareProfileKwh = (housingType: HousingType | null | undefined): CompareProfileKwh => {
  if (!housingType) return DEFAULT_COMPARE_PROFILE_KWH;
  return HOUSING_TYPE_DEFAULT_KWH[housingType];
};

export const isValidCustomConsumptionKwh = (value: number | null | undefined): value is number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return false;
  return value >= CUSTOM_CONSUMPTION_MIN_KWH && value <= CUSTOM_CONSUMPTION_MAX_KWH;
};

export const getActiveCompareConsumptionKwh = (params: {
  compareProfileKwh: CompareProfileKwh | null | undefined;
  customConsumptionKwh: number | null | undefined;
}): number => {
  if (isValidCustomConsumptionKwh(params.customConsumptionKwh)) {
    return params.customConsumptionKwh;
  }
  return params.compareProfileKwh || DEFAULT_COMPARE_PROFILE_KWH;
};

export const calculateComparePriceOrePerKwh = (product: Product | null | undefined, annualConsumptionKwh: number): number | null => {
  if (!product || annualConsumptionKwh <= 0) return null;
  if (
    product.energyPriceOrePerKwh === undefined ||
    product.surchargeOrePerKwh === undefined ||
    product.fixedFeeSekPerMonth === undefined ||
    product.otherFeeSekPerMonth === undefined
  ) {
    return null;
  }

  const variableCostSek =
    ((product.energyPriceOrePerKwh + product.surchargeOrePerKwh) * annualConsumptionKwh) / 100;
  const fixedCostSek = (product.fixedFeeSekPerMonth + product.otherFeeSekPerMonth) * 12;
  const totalYearCostSek = variableCostSek + fixedCostSek;

  return (totalYearCostSek * 100) / annualConsumptionKwh;
};
