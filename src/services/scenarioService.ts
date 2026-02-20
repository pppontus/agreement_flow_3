import { Address, ContactInterestServiceId, Scenario, ScenarioCustomer } from '@/types';
import { loggedApiCall } from './apiClient';
import { MockScenarioType, MockMarketingConsentType, MockExistingExtrasType } from '@/context/DevPanelContext';

export interface ScenarioResponse {
  scenario: Scenario;
  customer: ScenarioCustomer;
  currentContractAddress?: Address; // For move scenarios
}

// Mock addresses
const ADDR_STHLM: Address = { street: 'Birger Jarlsgatan', number: '10', postalCode: '11145', city: 'Stockholm', type: 'LGH' };

const getMockMarketingConsent = (override?: MockMarketingConsentType) => {
  if (override === 'NO_CONSENT') {
    return { email: false, sms: false };
  }
  return { email: true, sms: true };
};

const getMockExistingExtras = (override?: MockExistingExtrasType): NonNullable<ScenarioCustomer['extraServices']> => {
  const extras = override ?? {
    BIXIA_NARA: false,
    REALTIME_METER: false,
    HOME_BATTERY: false,
    CHARGER: false,
    SOLAR: false,
    ATTIC_INSULATION: false,
  };

  const contactMeServices: ContactInterestServiceId[] = [
    extras.HOME_BATTERY ? 'HOME_BATTERY' : null,
    extras.CHARGER ? 'CHARGER' : null,
    extras.SOLAR ? 'SOLAR' : null,
    extras.ATTIC_INSULATION ? 'ATTIC_INSULATION' : null,
  ].filter((service): service is ContactInterestServiceId => !!service);

  return {
    bixiaNara: extras.BIXIA_NARA
      ? { selected: true, county: 'Stockholms län' }
      : { selected: false },
    realtimeMeter: { selected: extras.REALTIME_METER },
    contactMeServices,
  };
};

/**
 * Internal scenario determination logic
 */
const doScenarioDetermination = async (
  pnr: string, 
  selectedAddress: Address,
  mockScenarioOverride?: MockScenarioType,
  mockMarketingConsentOverride?: MockMarketingConsentType,
  mockExistingExtrasOverride?: MockExistingExtrasType
): Promise<ScenarioResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const normalizedPnr = pnr.replace(/\D/g, '');

  // Determine which scenario to use
  let effectiveScenario: 'NY' | 'FLYTT' | 'BYTE' | 'BYTE_NO_BINDING' = 'NY';

  if (mockScenarioOverride && mockScenarioOverride !== 'RANDOM') {
    switch (mockScenarioOverride) {
      case 'NY_KUND':
        effectiveScenario = 'NY';
        break;
      case 'FLYTT':
        effectiveScenario = 'FLYTT';
        break;
      case 'BYTE':
        effectiveScenario = 'BYTE';
        break;
      case 'BYTE_NO_BINDING':
        effectiveScenario = 'BYTE_NO_BINDING';
        break;
    }
  } else {
    // Use PNR-based logic (original behavior)
    if (normalizedPnr.endsWith('0000')) {
      effectiveScenario = 'NY';
    } else if (normalizedPnr.endsWith('1111')) {
      effectiveScenario = 'FLYTT';
    } else if (normalizedPnr.endsWith('2222')) {
      effectiveScenario = 'BYTE';
    } else {
      effectiveScenario = 'NY'; // Default
    }
  }

  // Generate response based on effective scenario
  switch (effectiveScenario) {
    case 'NY':
      return {
        scenario: 'NY',
        customer: {
          isExistingCustomer: false,
          name: 'Ny Kundsson',
          email: null,
          phone: null,
          folkbokforing: { ...selectedAddress },
          facilityId: null,
          marketingConsent: { email: false, sms: false }
        }
      };

    case 'FLYTT':
      return {
        scenario: 'FLYTT',
        customer: {
          isExistingCustomer: true,
          name: 'Flytt Flyttsson',
          email: 'flytt@example.com',
          phone: '070-1111111',
          folkbokforing: ADDR_STHLM,
          facilityId: null,
          extraServices: getMockExistingExtras(mockExistingExtrasOverride),
          marketingConsent: getMockMarketingConsent(mockMarketingConsentOverride),
        },
        currentContractAddress: ADDR_STHLM
      };

    case 'BYTE':
      return {
        scenario: 'BYTE',
        customer: {
          isExistingCustomer: true,
          name: 'Stanna Kvarsson',
          email: 'stanna@example.com',
          phone: '070-2222222',
          folkbokforing: selectedAddress,
          facilityId: '735999222222222222',
          extraServices: getMockExistingExtras(mockExistingExtrasOverride),
          contractEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 months binding
          marketingConsent: getMockMarketingConsent(mockMarketingConsentOverride),
        },
        currentContractAddress: selectedAddress
      };

    case 'BYTE_NO_BINDING':
      return {
        scenario: 'BYTE',
        customer: {
          isExistingCustomer: true,
          name: 'Stanna Utanbindning',
          email: 'stanna.utan@example.com',
          phone: '070-3333333',
          folkbokforing: selectedAddress,
          facilityId: '735999333333333333',
          extraServices: getMockExistingExtras(mockExistingExtrasOverride),
          contractEndDate: null, // No binding
          marketingConsent: getMockMarketingConsent(mockMarketingConsentOverride),
        },
        currentContractAddress: selectedAddress
      };

    default:
      return {
        scenario: 'NY',
        customer: {
          isExistingCustomer: false,
          name: 'Sven Svensson',
          email: null,
          phone: null,
          folkbokforing: null,
          facilityId: null,
          marketingConsent: { email: false, sms: false }
        }
      };
  }
};

/**
 * Determines the scenario based on PNR and the selected address.
 * If a mockScenarioOverride is provided (from DevPanel), it will use that instead of PNR-based logic.
 * All calls are logged to DevPanel via apiClient.
 */
export const determineScenario = async (
  pnr: string, 
  selectedAddress: Address,
  mockScenarioOverride?: MockScenarioType,
  mockMarketingConsentOverride?: MockMarketingConsentType,
  mockExistingExtrasOverride?: MockExistingExtrasType
): Promise<ScenarioResponse> => {
  return loggedApiCall(
    '/api/scenario/determine',
    'SCENARIO',
    { 
      personnummer: pnr.substring(0, 8) + '****', // Mask last 4 digits
      address: selectedAddress, 
      mockOverride: mockScenarioOverride,
      mockMarketingConsent: mockMarketingConsentOverride,
      mockExistingExtras: mockExistingExtrasOverride,
    },
    () => doScenarioDetermination(
      pnr,
      selectedAddress,
      mockScenarioOverride,
      mockMarketingConsentOverride,
      mockExistingExtrasOverride
    )
  );
};
