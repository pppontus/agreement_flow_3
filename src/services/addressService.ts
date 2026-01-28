import { Address } from '@/types';
import { loggedApiCall } from './apiClient';
import { MockAddressResult } from '@/context/DevPanelContext';

// City to elområde mapping (simplified)
const CITY_TO_ELOMRADE: Record<string, 'SE1' | 'SE2' | 'SE3' | 'SE4'> = {
  'Luleå': 'SE1',
  'Umeå': 'SE2',
  'Sundsvall': 'SE2',
  'Stockholm': 'SE3',
  'Uppsala': 'SE3',
  'Göteborg': 'SE3',
  'Malmö': 'SE4',
  'Exempelstad': 'SE3',
  'Testort': 'SE3',
};

// Mock addresses for search simulation
export const MOCK_ADDRESSES: Address[] = [
  // SE1
  { street: 'Luleåvägen', number: '10', postalCode: '97231', city: 'Luleå', type: 'LGH', elomrade: 'SE1' },
  { street: 'Kirunagatan', number: '5', postalCode: '98131', city: 'Kiruna', type: 'VILLA', elomrade: 'SE1' },
  
  // SE2
  { street: 'Umeåvägen', number: '3', postalCode: '90325', city: 'Umeå', type: 'VILLA', elomrade: 'SE2' },
  { street: 'Sundsvallsgatan', number: '8', postalCode: '85231', city: 'Sundsvall', type: 'LGH', elomrade: 'SE2' },
  { street: 'Östersundsvägen', number: '12', postalCode: '83131', city: 'Östersund', type: 'VILLA', elomrade: 'SE2' },

  // SE3
  { street: 'Storgatan', number: '1', postalCode: '11122', city: 'Stockholm', type: 'LGH', elomrade: 'SE3' },
  { street: 'Drottninggatan', number: '14', postalCode: '11122', city: 'Stockholm', type: 'VILLA', elomrade: 'SE3' },
  { street: 'Avenyn', number: '5', postalCode: '41118', city: 'Göteborg', type: 'LGH', elomrade: 'SE3' },
  { street: 'Kungsgatan', number: '7', postalCode: '41118', city: 'Göteborg', type: 'VILLA', elomrade: 'SE3' },
  { street: 'Villavägen', number: '8', postalCode: '75236', city: 'Uppsala', type: 'VILLA', elomrade: 'SE3' },

  // SE4
  { street: 'Malmövägen', number: '22', postalCode: '21141', city: 'Malmö', type: 'LGH', elomrade: 'SE4' },
  { street: 'Lundavägen', number: '4', postalCode: '22221', city: 'Lund', type: 'VILLA', elomrade: 'SE4' },
  { street: 'Växjövägen', number: '6', postalCode: '35231', city: 'Växjö', type: 'LGH', elomrade: 'SE4' },
];

// Internal search logic (without logging)
const doSearch = async (
  query: string, 
  mockResult?: MockAddressResult
): Promise<Address[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Handle mock overrides
  if (mockResult === 'NONE') {
    return [];
  }
  if (mockResult === 'ERROR') {
    throw new Error('Simulerat API-fel vid adresshämtning');
  }
  
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase();
  
  // 1. Filter hardcoded ones
  let filtered = MOCK_ADDRESSES.filter(addr => 
    addr.street.toLowerCase().includes(normalizedQuery) ||
    addr.city.toLowerCase().includes(normalizedQuery) ||
    addr.postalCode.includes(normalizedQuery)
  );

  // 2. Generate dynamic ones for testing if query doesn't match much
  const capitalizedQuery = query.charAt(0).toUpperCase() + query.slice(1);
  let dynamic: Address[] = [
    { street: `${capitalizedQuery}vägen`, number: '1', postalCode: '97200', city: 'Luleå', type: 'VILLA', elomrade: 'SE1' },
    { street: `${capitalizedQuery}gatan`, number: '2', postalCode: '90300', city: 'Umeå', type: 'LGH', elomrade: 'SE2' },
    { street: `${capitalizedQuery}gränd`, number: '3', postalCode: '11100', city: 'Stockholm', type: 'LGH', elomrade: 'SE3' },
    { street: `${capitalizedQuery}allén`, number: '4', postalCode: '41100', city: 'Göteborg', type: 'VILLA', elomrade: 'SE3' },
    { street: `${capitalizedQuery}stigen`, number: '5', postalCode: '21100', city: 'Malmö', type: 'VILLA', elomrade: 'SE4' },
  ];

  // Combine and limit
  let results = [...filtered, ...dynamic].slice(0, 15); // Show more results to ensure variety
  
  return results;
};

/**
 * Search for addresses - now with logging via apiClient.
 * Pass mockResult to override behavior when DevPanel is open.
 * Pass mockElomrade to force all results to a specific elområde.
 */
export const searchAddresses = async (
  query: string, 
  mockResult?: MockAddressResult
): Promise<Address[]> => {
  return loggedApiCall(
    '/api/address/search',
    'ADDRESS_SEARCH',
    { query, mockOverride: mockResult },
    () => doSearch(query, mockResult)
  );
};

// Format address for display
export const formatAddress = (addr: Address): string => {
  return `${addr.street} ${addr.number}, ${addr.postalCode} ${addr.city}`;
};

/**
 * Mock API to fetch apartment numbers for a given address.
 */
export const fetchApartmentNumbers = async (address: Address): Promise<string[]> => {
  return loggedApiCall(
    '/api/address/apartments',
    'ADDRESS_DETAILS',
    { address },
    async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Generate some mock apartment numbers (usually 4 digits starting with 10xx, 11xx etc.)
      const apartments: string[] = [];
      const floors = 4;
      const unitsPerFloor = 3;
      
      for (let f = 0; f < floors; f++) {
        for (let u = 1; u <= unitsPerFloor; u++) {
          apartments.push(`${10 + f}${u < 10 ? '0' : ''}${u}`);
        }
      }
      
      return apartments;
    }
  );
};

