export type Elomrade = 'SE1' | 'SE2' | 'SE3' | 'SE4';

export type Address = {
  street: string;
  number: string;
  postalCode: string;
  city: string;
  type?: 'LGH' | 'VILLA' | 'UNKNOWN';
  elomrade?: Elomrade;
  apartmentNumber?: string;
};

export type Product = {
  id: string;
  name: string;
  type: 'FAST' | 'RORLIGT' | 'KVARTS' | 'FORVALTAT';
  description: string;
  energyPriceOrePerKwh?: number;
  surchargeOrePerKwh?: number;
  fixedFeeSekPerMonth?: number;
  otherFeeSekPerMonth?: number;
  pricePerKwh?: number;
  isDiscounted?: boolean;
  discountText?: string;
  isCompanyOnly?: boolean;
  contractTerms: {
    bindingMonths: number | null;
    noticeMonths: number;
  };
};
