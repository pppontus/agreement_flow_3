import type { PrivateFlowStep } from './index';

export type FlowPhase = PrivateFlowStep;

export type MockScenarioType =
  | 'ERROR'
  | 'NY_KUND'
  | 'FLYTT'
  | 'BYTE'
  | 'BYTE_NO_BINDING'
  | 'STOPP_KAN_INTE_LEVERERA'
  | 'BEFINTLIG_ADRESS_SAMMA_AVTAL'
  | 'AUTO_DETERMINISTIC';

export type MockEntryPreset = 'GENERAL' | 'PRODUCT_PAGE' | 'PARTNER';

export type MockMarketingConsentType = 'HAS_CONSENT' | 'NO_CONSENT';

export type MockExistingExtrasType = {
  BIXIA_NARA: boolean;
  REALTIME_METER: boolean;
  HOME_BATTERY: boolean;
  CHARGER: boolean;
  SOLAR: boolean;
  ATTIC_INSULATION: boolean;
};

export const DEFAULT_MOCK_EXISTING_EXTRAS: MockExistingExtrasType = {
  BIXIA_NARA: false,
  REALTIME_METER: false,
  HOME_BATTERY: false,
  CHARGER: false,
  SOLAR: false,
  ATTIC_INSULATION: false,
};

export type MockAddressResult = 'FOUND' | 'NONE' | 'ERROR';
