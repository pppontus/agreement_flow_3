"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CaseState, PrivateCaseState, Product, Address, IdMethod, Scenario, Elomrade, MoveChoice, FacilityHandling, Invoice, ScenarioCustomer } from '@/types';
import { CompanyState, CompanyLookupData, Facility } from '@/types/company';

const INITIAL_PRIVATE_STATE: PrivateCaseState = {
  customerType: 'PRIVATE',
  caseId: null,
  entryPoint: 'PRODUCT_FIRST',
  scenario: 'UNKNOWN',
  elomrade: null,
  valdAdress: null,
  moveChoice: null,
  facilityHandling: null,
  invoice: null,
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
    marketingConsent: { email: false, sms: false },
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

const INITIAL_COMPANY_STATE: CompanyState = {
  customerType: 'COMPANY',
  totalConsumption: 0,
  facilityCount: 0,
  orgNr: null,
  companyName: null,
  isCreditApproved: false,
  signatoryType: 'UNKNOWN',
  primarySigner: null,
  secondarySigner: null,
  facilities: [],
  selectedProduct: null,
  startDate: null,
  invoiceAddress: 'SAME_AS_VISITING',
  invoiceReference: null,
  termsAccepted: false,
  authorityDeclared: false,
};

const INITIAL_STATE: CaseState = INITIAL_PRIVATE_STATE;

const STORAGE_KEY = 'bixia_flow_state_v4'; // Bump version since structure changed

interface FlowStateContextType {
  state: CaseState;
  isInitialized: boolean;
  setCustomerType: (type: 'PRIVATE' | 'COMPANY') => void;
  // Private Flow Setters
  selectProduct: (product: Product) => void;
  setAddress: (address: Address, apartmentDetails?: { number: string | null; co: string | null }) => void;
  setAuthenticated: (pnr: string, method: IdMethod) => void;
  setCustomerScenario: (scenario: Scenario, customer: ScenarioCustomer) => void;
  setMoveChoice: (choice: MoveChoice) => void;
  setFacilityHandling: (handling: FacilityHandling | null) => void;
  setInvoice: (invoice: Invoice | null) => void;
  setCustomerDetails: (details: { email: string; phone: string; startDate: string; startDateMode: 'EARLIEST' | 'SPECIFIC' }) => void;
  setElomrade: (elomrade: Elomrade) => void;
  resolvePriceConflict: () => void;
  setConsents: (consents: { terms?: boolean; risk?: boolean; marketing?: { email: boolean; sms: boolean } }) => void;
  resetState: () => void;
  // Company Flow Setters
  setCompanyProduct: (product: Product) => void;
  setCompanyGatekeeper: (data: { totalConsumption: number; facilityCount: number }) => void;
  setCompanyLookupData: (data: CompanyLookupData) => void;
  setCompanyFacilities: (facilities: Facility[]) => void;
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

  // Load persisted state only after mount to avoid hydration mismatch.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setState(JSON.parse(stored) as CaseState);
      }
    } catch (e) {
      console.error('Failed to load flow state', e);
    } finally {
      setIsInitialized(true);
    }
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

  const setCustomerType = useCallback((type: 'PRIVATE' | 'COMPANY') => {
    if (type === 'PRIVATE') {
      setState(INITIAL_PRIVATE_STATE);
    } else {
      setState(INITIAL_COMPANY_STATE);
    }
  }, []);

  const selectProduct = useCallback((product: Product) => {
    setState(prev => {
      if (prev.customerType !== 'PRIVATE') return prev;
      return { ...prev, selectedProduct: product };
    });
  }, []);

  const setAddress = useCallback((address: Address, apartmentDetails?: { number: string | null, co: string | null }) => {
    setState(prev => {
      if (prev.customerType !== 'PRIVATE') return prev;
      
      let isConflict = false;
      if (address.elomrade && prev.elomrade && address.elomrade !== prev.elomrade) {
        isConflict = true;
      }
      
      return {
        ...prev,
        valdAdress: address,
        invoice: null,
        elomrade: address.elomrade || prev.elomrade,
        isPriceConflict: isConflict,
        addressDetails: {
          boendeform: address.type === 'LGH' ? 'lägenhet' : 'villa',
          apartmentNumber: apartmentDetails?.number || null,
          co: apartmentDetails?.co || null,
        }
      };
    });
  }, []);

  const setAuthenticated = useCallback((pnr: string, method: IdMethod) => {
    setState(prev => {
      if (prev.customerType !== 'PRIVATE') return prev;
      return {
        ...prev,
        personnummer: pnr,
        idMethod: method,
        isAuthenticated: true
      };
    });
  }, []);

  const setCustomerScenario = useCallback((scenario: Scenario, customer: ScenarioCustomer) => {
    setState(prev => {
      if (prev.customerType !== 'PRIVATE') return prev;
      return {
        ...prev,
        scenario,
        moveChoice: null,
        facilityHandling: null,
        invoice: null,
        marketingConsent: customer.marketingConsent || { email: false, sms: false },
        customer: {
          ...customer,
          folkbokforing: customer.folkbokforing || null, 
          marketingConsent: customer.marketingConsent || { email: false, sms: false },
        }
      };
    });
  }, []);

  const setMoveChoice = useCallback((choice: MoveChoice) => {
    setState(prev => {
      if (prev.customerType !== 'PRIVATE') return prev;
      return {
        ...prev,
        moveChoice: choice,
        invoice: null,
      };
    });
  }, []);

  const setFacilityHandling = useCallback((handling: FacilityHandling | null) => {
    setState(prev => {
      if (prev.customerType !== 'PRIVATE') return prev;
      return {
        ...prev,
        facilityHandling: handling,
      };
    });
  }, []);

  const setInvoice = useCallback((invoice: Invoice | null) => {
    setState(prev => {
      if (prev.customerType !== 'PRIVATE') return prev;
      return {
        ...prev,
        invoice,
      };
    });
  }, []);

  const setCustomerDetails = useCallback((details: { email: string; phone: string; startDate: string; startDateMode: 'EARLIEST' | 'SPECIFIC' }) => {
    setState(prev => {
      if (prev.customerType !== 'PRIVATE') return prev;
      return {
        ...prev,
        startDate: details.startDate,
        startDateMode: details.startDateMode === 'SPECIFIC' ? 'CHOOSE_DATE' : 'EARLIEST',
        customer: {
          ...prev.customer,
          email: details.email,
          phone: details.phone
        }
      };
    });
  }, []);

  const resetState = useCallback(() => {
    setState(prev => prev.customerType === 'PRIVATE' ? INITIAL_PRIVATE_STATE : INITIAL_COMPANY_STATE);
  }, []);

  const setElomrade = useCallback((elomrade: Elomrade) => {
    setState(prev => {
      if (prev.customerType !== 'PRIVATE') return prev;
      return { ...prev, elomrade };
    });
  }, []);

  const resolvePriceConflict = useCallback(() => {
    setState(prev => {
      if (prev.customerType !== 'PRIVATE') return prev;
      return { ...prev, isPriceConflict: false };
    });
  }, []);

  const setConsents = useCallback((consents: { terms?: boolean; risk?: boolean; marketing?: { email: boolean; sms: boolean } }) => {
    setState(prev => {
      if (prev.customerType !== 'PRIVATE') return prev;
      return {
        ...prev,
        termsAccepted: consents.terms ?? prev.termsAccepted,
        riskInfoAccepted: consents.risk ?? prev.riskInfoAccepted, 
        marketingConsent: consents.marketing ? { ...consents.marketing } : prev.marketingConsent
      };
    });
  }, []);

  const setCompanyProduct = useCallback((product: Product) => {
    setState(prev => {
      if (prev.customerType !== 'COMPANY') return prev;
      return {
        ...prev,
        selectedProduct: product,
      };
    });
  }, []);

  const setCompanyGatekeeper = useCallback((data: { totalConsumption: number; facilityCount: number }) => {
    setState(prev => {
      if (prev.customerType !== 'COMPANY') return prev;
      return {
        ...prev,
        totalConsumption: data.totalConsumption,
        facilityCount: data.facilityCount,
      };
    });
  }, []);

  const setCompanyLookupData = useCallback((data: CompanyLookupData) => {
    setState(prev => {
      if (prev.customerType !== 'COMPANY') return prev;
      return {
        ...prev,
        orgNr: data.orgNr,
        companyName: data.companyName,
        isCreditApproved: data.isCreditApproved,
        signatoryType: data.signatoryType,
      };
    });
  }, []);

  const setCompanyFacilities = useCallback((facilities: Facility[]) => {
    setState(prev => {
      if (prev.customerType !== 'COMPANY') return prev;
      return {
        ...prev,
        facilities,
        facilityCount: facilities.length || prev.facilityCount,
      };
    });
  }, []);

  return (
    <FlowStateContext.Provider value={{ 
      state, 
      isInitialized, 
      setCustomerType,
      selectProduct, 
      setAddress, 
      setAuthenticated, 
      setCustomerScenario,
      setMoveChoice,
      setFacilityHandling,
      setInvoice,
      setCustomerDetails,
      setElomrade,
      resolvePriceConflict,
      setConsents,
      resetState,
      setCompanyProduct,
      setCompanyGatekeeper,
      setCompanyLookupData,
      setCompanyFacilities,
    }}>
      {children}
    </FlowStateContext.Provider>
  );
};
