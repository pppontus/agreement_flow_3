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
];

// Mock prices per region (öre/kWh)
export const REGIONAL_PRICES: Record<string, Record<string, number>> = {
  SE1: {
    '1': 85.50, '2': 75.20, '3': 80.00,
    'd1': 83.50, 'd2': 73.20, 'd3': 78.00,
  },
  SE2: {
    '1': 85.50, '2': 75.20, '3': 80.00,
    'd1': 83.50, 'd2': 73.20, 'd3': 78.00,
  },
  SE3: {
    '1': 115.00, '2': 95.50, '3': 105.25,
    'd1': 113.00, 'd2': 93.50, 'd3': 103.25,
  },
  SE4: {
    '1': 125.00, '2': 105.00, '3': 115.50,
    'd1': 123.00, 'd2': 103.00, 'd3': 113.50,
  },
};

export const getProductsForRegion = (region: string) => {
  const prices = REGIONAL_PRICES[region] || REGIONAL_PRICES['SE3']; // Default to SE3
  
  // Fastpris (FAST) availability logic 
  const availableProducts = PRODUCTS.filter(product => {
    if (product.type === 'FAST' && (region === 'SE1' || region === 'SE2')) {
      return false;
    }
    return true;
  });
  
  return availableProducts.map(product => ({
    ...product,
    pricePerKwh: prices[product.id],
  }));
};
