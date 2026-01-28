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
];

// Mock prices per region (öre/kWh)
export const REGIONAL_PRICES: Record<string, Record<string, number>> = {
  SE1: {
    '1': 85.50,
    '2': 75.20,
    '3': 80.00,
  },
  SE2: {
    '1': 85.50,
    '2': 75.20,
    '3': 80.00,
  },
  SE3: {
    '1': 115.00,
    '2': 95.50,
    '3': 105.25,
  },
  SE4: {
    '1': 125.00,
    '2': 105.00,
    '3': 115.50,
  },
};

export const getProductsForRegion = (region: string) => {
  const prices = REGIONAL_PRICES[region] || REGIONAL_PRICES['SE3']; // Default to SE3
  
  // Filter products based on region availability
  // Fastpris (FAST) is only available in SE3 and SE4
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
