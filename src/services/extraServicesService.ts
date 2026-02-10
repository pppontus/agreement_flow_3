import { apiClient } from './apiClient';

export type ContactMeServiceId =
  | 'HOME_BATTERY'
  | 'CHARGER'
  | 'SOLAR'
  | 'ATTIC_INSULATION';

export const BIXIA_NARA_MONTHLY_SEK = 29;
export const REALTIME_METER_ONE_TIME_SEK = 695;
export const REALTIME_METER_MONTHLY_SEK = 19;

export type ExtraServicesSelection = {
  bixiaNara: {
    selected: boolean;
    county?: string;
  };
  realtimeMeter: {
    selected: boolean;
  };
  contactMeServices: ContactMeServiceId[];
};

export const saveExtraServicesSelection = async (
  orderId: string,
  selection: ExtraServicesSelection
): Promise<{ ok: true }> => {
  return apiClient.loggedApiCall(
    '/api/extra-services',
    'POST',
    { orderId, selection },
    async () => {
      // Simulated API for prototype.
      await new Promise(resolve => setTimeout(resolve, 700));
      return { ok: true as const };
    }
  );
};
