import { loggedApiCall } from './apiClient';

export type Elomrade = 'SE1' | 'SE2' | 'SE3' | 'SE4';

export interface RegionResponse {
  elomrade: Elomrade;
  ip: string;
  city: string;
}

/**
 * Simulates an IP-to-region lookup.
 * In reality this would call a geo-IP service.
 * Always returns SE3 as mock data.
 */
const doRegionLookup = async (): Promise<RegionResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Mock IP (would be detected server-side in reality)
  const fakeIp = '192.168.1.' + Math.floor(Math.random() * 255);
  
  // Always return SE3 for demo purposes
  return {
    elomrade: 'SE3',
    ip: fakeIp,
    city: 'Stockholm'
  };
};

/**
 * Detect user's elområde based on IP address.
 * Logged to DevPanel.
 */
export const detectRegion = async (): Promise<RegionResponse> => {
  return loggedApiCall(
    '/api/region/detect',
    'GET',
    { source: 'ip-geolocation' },
    () => doRegionLookup()
  );
};
