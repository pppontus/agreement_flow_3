import { Product } from '@/types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Bixia Fastpris',
    type: 'FAST',
    description: 'Ett tryggt val med samma pris hela avtalsperioden. Ingen bindningstid.',
  },
  {
    id: '2',
    name: 'Bixia Rörligt Pris',
    type: 'RORLIGT',
    description: 'Följer elbörsens svängningar. Passar dig som vill vara aktiv och flexibel.',
  },
  {
    id: '3',
    name: 'Bixia Kvartspris',
    type: 'KVARTS',
    description: 'Ett mellanting mellan fast och rörligt. Priset sätts kvartalsvis.',
  },
  // Company specific
  {
    id: 'c1',
    name: 'Bixia Förvaltat Pris',
    type: 'FORVALTAT',
    description: 'En tryggare portföljförvaltning som sprider riskerna över tid.',
    isCompanyOnly: true,
  },
  // Discounted variants
  {
    id: 'd1',
    name: 'Bixia Fastpris (Partner)',
    type: 'FAST',
    description: 'Samma trygghet som Fastpris men med exklusiv partner-rabatt.',
    isDiscounted: true,
    discountText: 'Partner-rabatt: -2 öre/kWh',
  },
  {
    id: 'd2',
    name: 'Bixia Rörligt (Partner)',
    type: 'RORLIGT',
    description: 'Rörligt elpris med förmånlig partner-rabatt på påslaget.',
    isDiscounted: true,
    discountText: 'Partner-rabatt: -2 öre/kWh',
  },
  {
    id: 'd3',
    name: 'Bixia Kvartspris (Partner)',
    type: 'KVARTS',
    description: 'Kvartspris för samarbetspartners. Optimerat pris med rabatt.',
    isDiscounted: true,
    discountText: 'Partner-rabatt: -2 öre/kWh',
  },
  // Company discounted
  {
    id: 'cd1',
    name: 'Bixia Förvaltat Pris (Partner)',
    type: 'FORVALTAT',
    description: 'Förvaltat elpris med förmånlig partner-rabatt.',
    isDiscounted: true,
    isCompanyOnly: true,
    discountText: 'Partner-rabatt: -2 öre/kWh',
  },
];

// Mock prices per region (öre/kWh)
export const REGIONAL_PRICES: Record<string, Record<string, number>> = {
  SE1: {
    '1': 85.50, '2': 75.20, '3': 80.00,
    'd1': 83.50, 'd2': 73.20, 'd3': 78.00,
    'c1': 79.50, 'cd1': 77.50,
  },
  SE2: {
    '1': 85.50, '2': 75.20, '3': 80.00,
    'd1': 83.50, 'd2': 73.20, 'd3': 78.00,
    'c1': 79.50, 'cd1': 77.50,
  },
  SE3: {
    '1': 115.00, '2': 95.50, '3': 105.25,
    'd1': 113.00, 'd2': 93.50, 'd3': 103.25,
    'c1': 100.50, 'cd1': 98.50,
  },
  SE4: {
    '1': 125.00, '2': 105.00, '3': 115.50,
    'd1': 123.00, 'd2': 103.00, 'd3': 113.50,
    'c1': 110.50, 'cd1': 108.50,
  },
};

export const getProductsForRegion = (
  region: string,
  isCompany = false,
  includeRestrictedFast = false
) => {
  const prices = REGIONAL_PRICES[region] || REGIONAL_PRICES['SE3']; // Default to SE3
  
  const availableProducts = PRODUCTS.filter(product => {
    // Company logic: Show Managed (FORVALTAT), Hide Fixed (FAST)
    if (isCompany) {
      if (product.type === 'FAST') return false; 
      if (product.isCompanyOnly) return true;
      // Allow others (RORLIGT, KVARTS) if not restricted
      return !product.isCompanyOnly;
    }
    
    // Private logic: Hide CompanyOnly
    if (product.isCompanyOnly) return false;
    // Restrict fixed price in SE1/SE2 unless explicitly included for UI preview
    if (product.type === 'FAST' && (region === 'SE1' || region === 'SE2')) {
      return includeRestrictedFast;
    }

    return true;
  });
  
  return availableProducts.map(product => ({
    ...product,
    pricePerKwh: prices[product.id],
  }));
};
