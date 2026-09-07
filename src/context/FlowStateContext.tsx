'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useReducer,
  type ReactNode,
} from 'react';
import type {
  Address,
  ContactDraft,
  DateSelection,
  CaseState,
  CompareProfileKwh,
  Elomrade,
  EntryOffer,
  EntryPoint,
  ExtraServicesSelection,
  FacilityHandling,
  HousingType,
  IdMethod,
  Invoice,
  MoveChoice,
  PrivateDetailsStep,
  PrivateFlowStep,
  Product,
  Scenario,
  ScenarioCustomer,
  StopReason,
} from '@/types';
import type { CompanyLookupData, Facility } from '@/types/company';
import { createInitialPrivateState, flowStateReducer } from '@/state/flowState';
import {
  FLOW_STATE_STORAGE_KEY,
  LEGACY_FLOW_STATE_STORAGE_KEYS,
  parsePersistedCaseState,
  serializeCaseState,
} from '@/state/persistence';

type StartPrivateFlowOptions = {
  entryPoint: EntryPoint;
  entryOffer: EntryOffer | null;
};

interface FlowStateContextType {
  state: CaseState;
  isInitialized: boolean;
  storageUnavailable: boolean;
  setCustomerType: (type: 'PRIVATE' | 'COMPANY') => void;
  startPrivateFlow: (options: StartPrivateFlowOptions) => void;
  selectProduct: (product: Product) => void;
  setAddress: (
    address: Address,
    apartmentDetails?: { number: string | null; co: string | null },
  ) => void;
  setAuthenticated: (pnr: string, method: IdMethod) => void;
  setCustomerScenario: (scenario: Scenario, customer: ScenarioCustomer) => void;
  setMoveChoice: (choice: MoveChoice) => void;
  setCompareProfile: (profile: {
    housingType?: HousingType | null;
    compareProfileKwh?: CompareProfileKwh | null;
    customConsumptionKwh?: number | null;
  }) => void;
  setFacilityHandling: (handling: FacilityHandling | null) => void;
  setInvoice: (invoice: Invoice | null) => void;
  setCustomerDetails: (details: {
    email: string;
    phone: string;
    startDate: string;
    startDateMode: 'EARLIEST' | 'SPECIFIC';
  }) => void;
  setElomrade: (elomrade: Elomrade) => void;
  resolvePriceConflict: () => void;
  setConsents: (consents: {
    terms?: boolean;
    risk?: boolean;
    marketing?: { email: boolean; sms: boolean };
  }) => void;
  navigatePrivate: (
    step: PrivateFlowStep,
    detailsStep?: PrivateDetailsStep,
  ) => void;
  setPrivateDetailsStep: (step: PrivateDetailsStep) => void;
  setDateDraft: (value: DateSelection) => void;
  confirmDate: (value: DateSelection) => void;
  setContactDraft: (value: ContactDraft) => void;
  completeSigning: () => void;
  setPrivateStop: (reason: StopReason | null) => void;
  setExtraServicesSelection: (selection: ExtraServicesSelection | null) => void;
  resetState: () => void;
  clearPersistedState: () => void;
  setCompanyProduct: (product: Product) => void;
  setCompanyGatekeeper: (data: {
    totalConsumption: number;
    facilityCount: number;
  }) => void;
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
  const [state, dispatch] = useReducer(flowStateReducer, undefined, () =>
    createInitialPrivateState({ createCaseId: false }),
  );
  const [storageUnavailable, markStorageUnavailable] = useReducer(
    () => true,
    false,
  );
  const [isInitialized, markInitialized] = useReducer(() => true, false);

  useEffect(() => {
    try {
      for (const key of [
        FLOW_STATE_STORAGE_KEY,
        ...LEGACY_FLOW_STATE_STORAGE_KEYS,
      ]) {
        const stored = sessionStorage.getItem(key);
        const restored = stored ? parsePersistedCaseState(stored) : null;
        if (restored) {
          dispatch({ type: 'HYDRATE', state: restored });
          break;
        }
      }
    } catch {
      markStorageUnavailable();
    }
    markInitialized();
  }, []);

  useLayoutEffect(() => {
    if (!isInitialized || storageUnavailable) return;
    try {
      sessionStorage.setItem(FLOW_STATE_STORAGE_KEY, serializeCaseState(state));
      LEGACY_FLOW_STATE_STORAGE_KEYS.forEach((key) =>
        sessionStorage.removeItem(key),
      );
    } catch {
      markStorageUnavailable();
    }
  }, [state, isInitialized, storageUnavailable]);

  const setCustomerType = useCallback((customerType: 'PRIVATE' | 'COMPANY') => {
    dispatch({ type: 'SET_CUSTOMER_TYPE', customerType });
  }, []);

  const startPrivateFlow = useCallback((options: StartPrivateFlowOptions) => {
    dispatch({ type: 'START_PRIVATE_FLOW', ...options });
  }, []);

  const selectProduct = useCallback((product: Product) => {
    dispatch({ type: 'SELECT_PRIVATE_PRODUCT', product });
  }, []);

  const setAddress = useCallback(
    (
      address: Address,
      apartmentDetails?: { number: string | null; co: string | null },
    ) => {
      dispatch({ type: 'SET_PRIVATE_ADDRESS', address, apartmentDetails });
    },
    [],
  );

  const setAuthenticated = useCallback(
    (personnummer: string, method: IdMethod) => {
      dispatch({ type: 'SET_PRIVATE_AUTHENTICATED', personnummer, method });
    },
    [],
  );

  const setCustomerScenario = useCallback(
    (scenario: Scenario, customer: ScenarioCustomer) => {
      dispatch({ type: 'SET_PRIVATE_SCENARIO', scenario, customer });
    },
    [],
  );

  const setMoveChoice = useCallback((choice: MoveChoice) => {
    dispatch({ type: 'SET_PRIVATE_MOVE_CHOICE', choice });
  }, []);

  const setCompareProfile = useCallback(
    (profile: {
      housingType?: HousingType | null;
      compareProfileKwh?: CompareProfileKwh | null;
      customConsumptionKwh?: number | null;
    }) => {
      dispatch({ type: 'SET_PRIVATE_COMPARE_PROFILE', profile });
    },
    [],
  );

  const setFacilityHandling = useCallback(
    (handling: FacilityHandling | null) => {
      dispatch({ type: 'SET_PRIVATE_FACILITY_HANDLING', handling });
    },
    [],
  );

  const setInvoice = useCallback((invoice: Invoice | null) => {
    dispatch({ type: 'SET_PRIVATE_INVOICE', invoice });
  }, []);

  const setCustomerDetails = useCallback(
    (details: {
      email: string;
      phone: string;
      startDate: string;
      startDateMode: 'EARLIEST' | 'SPECIFIC';
    }) => {
      dispatch({ type: 'SET_PRIVATE_CUSTOMER_DETAILS', details });
    },
    [],
  );

  const setElomrade = useCallback((elomrade: Elomrade) => {
    dispatch({ type: 'SET_PRIVATE_ELOMRADE', elomrade });
  }, []);

  const resolvePriceConflict = useCallback(() => {
    dispatch({ type: 'RESOLVE_PRIVATE_PRICE_CONFLICT' });
  }, []);

  const setConsents = useCallback(
    (consents: {
      terms?: boolean;
      risk?: boolean;
      marketing?: { email: boolean; sms: boolean };
    }) => {
      dispatch({ type: 'SET_PRIVATE_CONSENTS', consents });
    },
    [],
  );

  const navigatePrivate = useCallback(
    (step: PrivateFlowStep, detailsStep?: PrivateDetailsStep) => {
      dispatch({ type: 'NAVIGATE_PRIVATE', step, detailsStep });
    },
    [],
  );

  const setPrivateDetailsStep = useCallback((step: PrivateDetailsStep) => {
    dispatch({ type: 'SET_PRIVATE_DETAILS_STEP', step });
  }, []);

  const setDateDraft = useCallback(
    (value: DateSelection) =>
      dispatch({ type: 'SET_PRIVATE_DATE_DRAFT', value }),
    [],
  );
  const confirmDate = useCallback(
    (value: DateSelection) => dispatch({ type: 'CONFIRM_PRIVATE_DATE', value }),
    [],
  );
  const setContactDraft = useCallback(
    (value: ContactDraft) =>
      dispatch({ type: 'SET_PRIVATE_CONTACT_DRAFT', value }),
    [],
  );
  const completeSigning = useCallback(
    () =>
      dispatch({
        type: 'COMPLETE_PRIVATE_SIGNING',
        signedAt: new Date().toISOString(),
      }),
    [],
  );

  const setPrivateStop = useCallback((reason: StopReason | null) => {
    dispatch({ type: 'SET_PRIVATE_STOP', reason });
  }, []);

  const setExtraServicesSelection = useCallback(
    (selection: ExtraServicesSelection | null) => {
      dispatch({ type: 'SET_PRIVATE_EXTRA_SERVICES', selection });
    },
    [],
  );

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_FLOW' });
  }, []);

  const clearPersistedState = useCallback(() => {
    try {
      sessionStorage.removeItem(FLOW_STATE_STORAGE_KEY);
      LEGACY_FLOW_STATE_STORAGE_KEYS.forEach((key) =>
        sessionStorage.removeItem(key),
      );
    } catch {
      markStorageUnavailable();
    }
  }, []);

  const setCompanyProduct = useCallback((product: Product) => {
    dispatch({ type: 'SET_COMPANY_PRODUCT', product });
  }, []);

  const setCompanyGatekeeper = useCallback(
    (data: { totalConsumption: number; facilityCount: number }) => {
      dispatch({ type: 'SET_COMPANY_GATEKEEPER', data });
    },
    [],
  );

  const setCompanyLookupData = useCallback((data: CompanyLookupData) => {
    dispatch({ type: 'SET_COMPANY_LOOKUP_DATA', data });
  }, []);

  const setCompanyFacilities = useCallback((facilities: Facility[]) => {
    dispatch({ type: 'SET_COMPANY_FACILITIES', facilities });
  }, []);

  const value: FlowStateContextType = {
    state,
    isInitialized,
    storageUnavailable,
    setCustomerType,
    startPrivateFlow,
    selectProduct,
    setAddress,
    setAuthenticated,
    setCustomerScenario,
    setMoveChoice,
    setCompareProfile,
    setFacilityHandling,
    setInvoice,
    setCustomerDetails,
    setElomrade,
    resolvePriceConflict,
    setConsents,
    navigatePrivate,
    setPrivateDetailsStep,
    setDateDraft,
    confirmDate,
    setContactDraft,
    completeSigning,
    setPrivateStop,
    setExtraServicesSelection,
    resetState,
    clearPersistedState,
    setCompanyProduct,
    setCompanyGatekeeper,
    setCompanyLookupData,
    setCompanyFacilities,
  };

  return (
    <FlowStateContext.Provider value={value}>
      {children}
    </FlowStateContext.Provider>
  );
};
