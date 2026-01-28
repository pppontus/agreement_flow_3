"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CaseState, Product, Address, IdMethod, Scenario } from '@/types';

const INITIAL_STATE: CaseState = {
  caseId: null,
  entryPoint: 'PRODUCT_FIRST',
  scenario: 'UNKNOWN',
  valdAdress: null,
  addressDetails: {
    boendeform: null,
    apartmentNumber: null,
    co: null,
  },
  idMethod: null,
  personnummer: null,
  isAuthenticated: false,
  customer: {
    isExistingCustomer: false,
    name: null,
    email: null,
    phone: null,
    folkbokforing: null,
  },
  selectedProduct: null,
  isPriceConflict: false,
  startDate: null,
  startDateMode: 'EARLIEST',
  marketingConsent: { email: false, sms: false },
  riskInfoAccepted: false,
  termsAccepted: false,
  stop: { isStopped: false, reason: null },
};

const STORAGE_KEY = 'bixia_flow_state_v1';

interface FlowStateContextType {
  state: CaseState;
  isInitialized: boolean;
  selectProduct: (product: Product) => void;
  setAddress: (address: Address, apartmentDetails?: { number: string | null; co: string | null }) => void;
  setAuthenticated: (pnr: string, method: IdMethod) => void;
  setCustomerScenario: (scenario: Scenario, customer: any) => void;
  setCustomerDetails: (details: { email: string; phone: string; startDate: string; startDateMode: 'EARLIEST' | 'SPECIFIC' }) => void;
  resetState: () => void;
}

const FlowStateContext = createContext<FlowStateContextType | null>(null);

export const useFlowState = () => {
  const context = useContext(FlowStateContext);
  if (!context) {
    throw new Error('useFlowState must be used within a FlowStateProvider');
  }
  return context;
};

export const FlowStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<CaseState>(INITIAL_STATE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setState(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load flow state', e);
    }
    setIsInitialized(true);
  }, []);

  // Save to storage on change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save flow state', e);
    }
  }, [state, isInitialized]);

  const updateState = useCallback((updates: Partial<CaseState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const selectProduct = useCallback((product: Product) => {
    updateState({ selectedProduct: product });
  }, [updateState]);

  const setAddress = useCallback((address: Address, apartmentDetails?: { number: string | null, co: string | null }) => {
    updateState({
      valdAdress: address,
      addressDetails: {
        boendeform: address.type === 'LGH' ? 'lägenhet' : 'villa',
        apartmentNumber: apartmentDetails?.number || null,
        co: apartmentDetails?.co || null,
      }
    });
  }, [updateState]);

  const setAuthenticated = useCallback((pnr: string, method: IdMethod) => {
    updateState({
      personnummer: pnr,
      idMethod: method,
      isAuthenticated: true
    });
  }, [updateState]);

  const setCustomerScenario = useCallback((scenario: Scenario, customer: any) => {
    updateState({
      scenario,
      customer: {
        ...customer,
        folkbokforing: customer.folkbokforing || null, 
      }
    });
  }, [updateState]);

  const setCustomerDetails = useCallback((details: { email: string; phone: string; startDate: string; startDateMode: 'EARLIEST' | 'SPECIFIC' }) => {
    setState(prev => ({
      ...prev,
      startDate: details.startDate,
      startDateMode: details.startDateMode === 'SPECIFIC' ? 'CHOOSE_DATE' : 'EARLIEST',
      customer: {
        ...prev.customer,
        email: details.email,
        phone: details.phone
      }
    }));
  }, []);

  const resetState = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return (
    <FlowStateContext.Provider value={{ 
      state, 
      isInitialized, 
      selectProduct, 
      setAddress, 
      setAuthenticated, 
      setCustomerScenario,
      setCustomerDetails,
      resetState 
    }}>
      {children}
    </FlowStateContext.Provider>
  );
};
