import { Address } from '@/types';
import { loggedApiCall } from './apiClient';
import { MockAddressResult } from '@/context/DevPanelContext';

// Mock addresses for search simulation
export const MOCK_ADDRESSES: Address[] = [
  { street: 'Storgatan', number: '12', postalCode: '11122', city: 'Stockholm', type: 'LGH' },
  { street: 'Storgatan', number: '14', postalCode: '11122', city: 'Stockholm', type: 'VILLA' },
  { street: 'Storgatan', number: '16A', postalCode: '11123', city: 'Stockholm', type: 'LGH' },
  { street: 'Kungsgatan', number: '5', postalCode: '41118', city: 'Göteborg', type: 'LGH' },
  { street: 'Kungsgatan', number: '7', postalCode: '41118', city: 'Göteborg', type: 'VILLA' },
  { street: 'Drottninggatan', number: '22', postalCode: '21141', city: 'Malmö', type: 'LGH' },
  { street: 'Villavägen', number: '8', postalCode: '75236', city: 'Uppsala', type: 'VILLA' },
  { street: 'Parkvägen', number: '3', postalCode: '90325', city: 'Umeå', type: 'VILLA' },
  { street: 'Norrlandsgatan', number: '10', postalCode: '97231', city: 'Luleå', type: 'LGH' },
];

// Internal search logic (without logging)
const doSearch = async (query: string, mockResult?: MockAddressResult): Promise<Address[]> => {
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
  const filtered = MOCK_ADDRESSES.filter(addr => 
    addr.street.toLowerCase().includes(normalizedQuery) ||
    addr.city.toLowerCase().includes(normalizedQuery) ||
    addr.postalCode.includes(normalizedQuery)
  );

  // 2. Generate dynamic ones if query doesn't match much
  const dynamic: Address[] = [
    { street: `${query}gatan`, number: '1', postalCode: '12345', city: 'Exempelstad', type: 'LGH' },
    { street: `${query}vägen`, number: '10', postalCode: '54321', city: 'Testort', type: 'VILLA' },
  ];

  // Combine and limit
  const results = [...filtered, ...dynamic].slice(0, 8);
  return results;
};

/**
 * Search for addresses - now with logging via apiClient.
 * Pass mockResult to override behavior when DevPanel is open.
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
