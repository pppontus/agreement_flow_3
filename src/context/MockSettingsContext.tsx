'use client';
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  DEFAULT_MOCK_EXISTING_EXTRAS,
  type MockAddressResult,
  type MockEntryPreset,
  type MockExistingExtrasType,
  type MockMarketingConsentType,
  type MockScenarioType,
} from '@/types/dev';

const initialSettings = {
  mockScenario: 'AUTO_DETERMINISTIC' as MockScenarioType,
  mockEntryPreset: 'GENERAL' as MockEntryPreset,
  mockEntryProductId: '2',
  mockMarketingConsent: 'HAS_CONSENT' as MockMarketingConsentType,
  mockExistingExtras: DEFAULT_MOCK_EXISTING_EXTRAS,
  mockAddressResult: 'FOUND' as MockAddressResult,
};
function useSettings() {
  const [state, setState] = useState(initialSettings);
  const setMockScenario = useCallback((scenario: MockScenarioType) => {
    setState((prev) => ({ ...prev, mockScenario: scenario }));
  }, []);

  const setMockEntryPreset = useCallback((preset: MockEntryPreset) => {
    setState((prev) => ({
      ...prev,
      mockEntryPreset: preset,
      mockEntryProductId:
        preset === 'PARTNER'
          ? 'd2'
          : preset === 'PRODUCT_PAGE'
            ? '2'
            : prev.mockEntryProductId,
    }));
  }, []);

  const setMockEntryProductId = useCallback((productId: string) => {
    setState((prev) => ({ ...prev, mockEntryProductId: productId }));
  }, []);

  const setMockMarketingConsent = useCallback(
    (consent: MockMarketingConsentType) => {
      setState((prev) => ({ ...prev, mockMarketingConsent: consent }));
    },
    [],
  );

  const setMockExistingExtra = useCallback(
    (service: keyof MockExistingExtrasType, selected: boolean) => {
      setState((prev) => ({
        ...prev,
        mockExistingExtras: {
          ...prev.mockExistingExtras,
          [service]: selected,
        },
      }));
    },
    [],
  );

  const setMockAddressResult = useCallback((result: MockAddressResult) => {
    setState((prev) => ({ ...prev, mockAddressResult: result }));
  }, []);

  return {
    state,
    setMockScenario,
    setMockEntryPreset,
    setMockEntryProductId,
    setMockMarketingConsent,
    setMockExistingExtra,
    setMockAddressResult,
  };
}
const MockSettingsContext = createContext<ReturnType<
  typeof useSettings
> | null>(null);
export function MockSettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSettings();
  return (
    <MockSettingsContext.Provider value={settings}>
      {children}
    </MockSettingsContext.Provider>
  );
}
export function useMockSettings() {
  const settings = useContext(MockSettingsContext);
  if (!settings) throw new Error('MockSettingsProvider saknas');
  return settings;
}
