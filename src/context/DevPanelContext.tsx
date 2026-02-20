"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { apiLogEmitter, ApiLogEntry } from '@/services/apiClient';

// Re-export type for convenience
export type { ApiLogEntry } from '@/services/apiClient';

// Types for mock scenario selection - now with flow phase context
export type FlowPhase = 
  | 'PRODUCT_SELECT'
  | 'PRODUCT_CLARIFY'
  | 'ADDRESS_SEARCH'
  | 'IDENTIFY'
  | 'MOVE_OFFER'
  | 'DETAILS'
  | 'TERMS'
  | 'SIGNING'
  | 'CONFIRMATION'
  | 'EXTRA_BIXIA_NARA'
  | 'EXTRA_REALTIME_METER'
  | 'APP_DOWNLOAD'
  | 'EXTRA_CONTACT';

export type MockScenarioType = 
  | 'NY_KUND'           // New customer
  | 'FLYTT'             // Move
  | 'BYTE'              // Extension/switch with binding
  | 'BYTE_NO_BINDING'   // Existing customer without binding
  | 'RANDOM';           // Default random

export type MockMarketingConsentType =
  | 'HAS_CONSENT'
  | 'NO_CONSENT';

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

export type MockAddressResult = 
  | 'FOUND'             // Normal results
  | 'NONE'              // No results
  | 'ERROR';            // API error

export type MockSigningResult = 
  | 'SUCCESS'           // Signing completed
  | 'CANCELLED'         // User cancelled
  | 'TIMEOUT'           // BankID timeout
  | 'ERROR';            // Technical error

interface DevPanelState {
  isOpen: boolean;
  apiLogs: ApiLogEntry[];
  currentPhase: FlowPhase;
  // Mock selections per phase
  mockScenario: MockScenarioType;
  mockMarketingConsent: MockMarketingConsentType;
  mockExistingExtras: MockExistingExtrasType;
  mockAddressResult: MockAddressResult;
  mockSigningResult: MockSigningResult;
}

interface DevPanelContextType {
  state: DevPanelState;
  togglePanel: () => void;
  clearLogs: () => void;
  setCurrentPhase: (phase: FlowPhase) => void;
  setMockScenario: (scenario: MockScenarioType) => void;
  setMockMarketingConsent: (consent: MockMarketingConsentType) => void;
  setMockExistingExtra: (service: keyof MockExistingExtrasType, selected: boolean) => void;
  setMockAddressResult: (result: MockAddressResult) => void;
  setMockSigningResult: (result: MockSigningResult) => void;
}

const DevPanelContext = createContext<DevPanelContextType | null>(null);

export const useDevPanel = () => {
  const context = useContext(DevPanelContext);
  if (!context) {
    // Return a no-op version if not wrapped (safety fallback)
    return {
      state: { 
        isOpen: false, 
        apiLogs: [], 
        currentPhase: 'PRODUCT_SELECT' as FlowPhase,
        mockScenario: 'RANDOM' as MockScenarioType, 
        mockMarketingConsent: 'HAS_CONSENT' as MockMarketingConsentType,
        mockExistingExtras: DEFAULT_MOCK_EXISTING_EXTRAS,
        mockAddressResult: 'FOUND' as MockAddressResult,
        mockSigningResult: 'SUCCESS' as MockSigningResult,
      },
      togglePanel: () => {},
      clearLogs: () => {},
      setCurrentPhase: () => {},
      setMockScenario: () => {},
      setMockMarketingConsent: () => {},
      setMockExistingExtra: () => {},
      setMockAddressResult: () => {},
      setMockSigningResult: () => {},
    };
  }
  return context;
};

export const DevPanelProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<DevPanelState>({
    isOpen: false,
    apiLogs: [],
    currentPhase: 'PRODUCT_SELECT',
    mockScenario: 'RANDOM',
    mockMarketingConsent: 'HAS_CONSENT',
    mockExistingExtras: DEFAULT_MOCK_EXISTING_EXTRAS,
    mockAddressResult: 'FOUND',
    mockSigningResult: 'SUCCESS',
  });

  // Subscribe to API log events from the central emitter
  useEffect(() => {
    const unsubscribe = apiLogEmitter.subscribe((entry: ApiLogEntry) => {
      setState(prev => ({
        ...prev,
        apiLogs: [entry, ...prev.apiLogs].slice(0, 50), // Keep last 50
      }));
    });
    return unsubscribe;
  }, []);

  const togglePanel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const clearLogs = useCallback(() => {
    setState(prev => ({ ...prev, apiLogs: [] }));
  }, []);

  const setCurrentPhase = useCallback((phase: FlowPhase) => {
    setState(prev => ({ ...prev, currentPhase: phase }));
  }, []);

  const setMockScenario = useCallback((scenario: MockScenarioType) => {
    setState(prev => ({ ...prev, mockScenario: scenario }));
  }, []);

  const setMockMarketingConsent = useCallback((consent: MockMarketingConsentType) => {
    setState(prev => ({ ...prev, mockMarketingConsent: consent }));
  }, []);

  const setMockExistingExtra = useCallback((service: keyof MockExistingExtrasType, selected: boolean) => {
    setState(prev => ({
      ...prev,
      mockExistingExtras: {
        ...prev.mockExistingExtras,
        [service]: selected,
      },
    }));
  }, []);

  const setMockAddressResult = useCallback((result: MockAddressResult) => {
    setState(prev => ({ ...prev, mockAddressResult: result }));
  }, []);

  const setMockSigningResult = useCallback((result: MockSigningResult) => {
    setState(prev => ({ ...prev, mockSigningResult: result }));
  }, []);

  return (
    <DevPanelContext.Provider value={{ 
      state, 
      togglePanel, 
      clearLogs, 
      setCurrentPhase,
      setMockScenario, 
      setMockMarketingConsent,
      setMockExistingExtra,
      setMockAddressResult,
      setMockSigningResult,
    }}>
      {children}
    </DevPanelContext.Provider>
  );
};
