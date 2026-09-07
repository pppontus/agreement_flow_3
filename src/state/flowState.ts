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
  PrivateCaseState,
  PrivateDetailsStep,
  PrivateFlowStep,
  Product,
  Scenario,
  ScenarioCustomer,
  StopReason,
} from '../types';
import type {
  CompanyLookupData,
  CompanyState,
  Facility,
} from '../types/company';

import {
  resolvePrivateNavigation,
  areAddressesEqual,
} from '../flow/privateFlow.ts';
import { isValidDateSelection } from '../flow/validation.ts';

export const PRIVATE_FLOW_STEPS: readonly PrivateFlowStep[] = [
  'PRODUCT_SELECT',
  'PRODUCT_CLARIFY',
  'ADDRESS_SEARCH',
  'IDENTIFY',
  'FLOW_STOP',
  'EXISTING_CONTRACT_EXTRAS',
  'MOVE_OFFER',
  'DETAILS',
  'TERMS',
  'SIGNING',
  'CONFIRMATION',
  'EXTRA_BIXIA_NARA',
  'EXTRA_REALTIME_METER',
  'APP_DOWNLOAD',
  'EXTRA_CONTACT',
];

export const isPrivateFlowStep = (value: unknown): value is PrivateFlowStep =>
  typeof value === 'string' &&
  PRIVATE_FLOW_STEPS.includes(value as PrivateFlowStep);

export const getInitialPrivateStep = (
  entryPoint: EntryPoint,
): PrivateFlowStep =>
  entryPoint === 'ADDRESS_FIRST' ? 'ADDRESS_SEARCH' : 'PRODUCT_SELECT';

const createEmptyCustomer = (): ScenarioCustomer => ({
  isExistingCustomer: false,
  name: null,
  email: null,
  phone: null,
  folkbokforing: null,
  facilityId: null,
  marketingConsent: { email: false, sms: false },
});

export const createInitialPrivateState = (options?: {
  entryPoint?: EntryPoint;
  entryOffer?: EntryOffer | null;
  createCaseId?: boolean;
}): PrivateCaseState => {
  const entryPoint = options?.entryPoint ?? 'ADDRESS_FIRST';

  return {
    customerType: 'PRIVATE',
    caseId: options?.createCaseId === false ? null : `DEMO-${Date.now()}`,
    entryPoint,
    entryOffer: options?.entryOffer ?? null,
    currentStep: getInitialPrivateStep(entryPoint),
    detailsStep: 'DATE',
    dateDraft: null,
    contactDraft: null,
    signedAt: null,
    extraServicesSelection: null,
    scenario: 'UNKNOWN',
    elomrade: null,
    valdAdress: null,
    moveChoice: null,
    housingType: 'KWH_5000',
    compareProfileKwh: 5000,
    customConsumptionKwh: null,
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
    customer: createEmptyCustomer(),
    selectedProduct: null,
    isPriceConflict: false,
    startDate: null,
    startDateMode: 'EARLIEST',
    marketingConsent: { email: false, sms: false },
    riskInfoAccepted: false,
    termsAccepted: false,
    stop: { isStopped: false, reason: null },
  };
};

export const createInitialCompanyState = (): CompanyState => ({
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
});

export type FlowStateAction =
  | { type: 'HYDRATE'; state: CaseState }
  | { type: 'SET_CUSTOMER_TYPE'; customerType: 'PRIVATE' | 'COMPANY' }
  | {
      type: 'START_PRIVATE_FLOW';
      entryPoint: EntryPoint;
      entryOffer: EntryOffer | null;
    }
  | { type: 'SELECT_PRIVATE_PRODUCT'; product: Product }
  | {
      type: 'SET_PRIVATE_ADDRESS';
      address: Address;
      apartmentDetails?: { number: string | null; co: string | null };
    }
  | {
      type: 'SET_PRIVATE_AUTHENTICATED';
      personnummer: string;
      method: IdMethod;
    }
  | {
      type: 'SET_PRIVATE_SCENARIO';
      scenario: Scenario;
      customer: ScenarioCustomer;
    }
  | { type: 'SET_PRIVATE_MOVE_CHOICE'; choice: MoveChoice }
  | {
      type: 'SET_PRIVATE_COMPARE_PROFILE';
      profile: {
        housingType?: HousingType | null;
        compareProfileKwh?: CompareProfileKwh | null;
        customConsumptionKwh?: number | null;
      };
    }
  | { type: 'SET_PRIVATE_FACILITY_HANDLING'; handling: FacilityHandling | null }
  | { type: 'SET_PRIVATE_INVOICE'; invoice: Invoice | null }
  | {
      type: 'SET_PRIVATE_CUSTOMER_DETAILS';
      details: {
        email: string;
        phone: string;
        startDate: string;
        startDateMode: 'EARLIEST' | 'SPECIFIC';
      };
    }
  | { type: 'SET_PRIVATE_ELOMRADE'; elomrade: Elomrade }
  | { type: 'RESOLVE_PRIVATE_PRICE_CONFLICT' }
  | {
      type: 'SET_PRIVATE_CONSENTS';
      consents: {
        terms?: boolean;
        risk?: boolean;
        marketing?: { email: boolean; sms: boolean };
      };
    }
  | {
      type: 'NAVIGATE_PRIVATE';
      step: PrivateFlowStep;
      detailsStep?: PrivateDetailsStep;
    }
  | { type: 'SET_PRIVATE_DETAILS_STEP'; step: PrivateDetailsStep }
  | { type: 'SET_PRIVATE_DATE_DRAFT'; value: DateSelection }
  | { type: 'CONFIRM_PRIVATE_DATE'; value: DateSelection }
  | { type: 'SET_PRIVATE_CONTACT_DRAFT'; value: ContactDraft }
  | { type: 'COMPLETE_PRIVATE_SIGNING'; signedAt: string }
  | { type: 'SET_PRIVATE_STOP'; reason: StopReason | null }
  | {
      type: 'SET_PRIVATE_EXTRA_SERVICES';
      selection: ExtraServicesSelection | null;
    }
  | { type: 'RESET_FLOW' }
  | { type: 'SET_COMPANY_PRODUCT'; product: Product }
  | {
      type: 'SET_COMPANY_GATEKEEPER';
      data: { totalConsumption: number; facilityCount: number };
    }
  | { type: 'SET_COMPANY_LOOKUP_DATA'; data: CompanyLookupData }
  | { type: 'SET_COMPANY_FACILITIES'; facilities: Facility[] };

export const flowStateReducer = (
  state: CaseState,
  action: FlowStateAction,
): CaseState => {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;
    case 'SET_CUSTOMER_TYPE':
      return action.customerType === 'PRIVATE'
        ? createInitialPrivateState()
        : createInitialCompanyState();
    case 'START_PRIVATE_FLOW':
      return createInitialPrivateState({
        entryPoint: action.entryPoint,
        entryOffer: action.entryOffer,
      });
    case 'RESET_FLOW':
      return state.customerType === 'PRIVATE'
        ? createInitialPrivateState()
        : createInitialCompanyState();
    case 'SELECT_PRIVATE_PRODUCT':
      if (state.customerType !== 'PRIVATE') return state;
      return {
        ...state,
        selectedProduct: action.product,
        signedAt:
          JSON.stringify(state.selectedProduct) ===
          JSON.stringify(action.product)
            ? state.signedAt
            : null,
        termsAccepted:
          JSON.stringify(state.selectedProduct) ===
          JSON.stringify(action.product)
            ? state.termsAccepted
            : false,
        riskInfoAccepted:
          JSON.stringify(state.selectedProduct) ===
          JSON.stringify(action.product)
            ? state.riskInfoAccepted
            : false,
      };
    case 'SET_PRIVATE_ADDRESS': {
      if (state.customerType !== 'PRIVATE') return state;
      if (
        areAddressesEqual(state.valdAdress, action.address, {
          includeApartmentNumber: true,
        }) &&
        state.addressDetails.apartmentNumber ===
          (action.apartmentDetails?.number ?? null) &&
        state.addressDetails.co === (action.apartmentDetails?.co ?? null)
      )
        return state;
      const isPriceConflict = Boolean(
        action.address.elomrade &&
        state.elomrade &&
        action.address.elomrade !== state.elomrade,
      );

      return {
        ...state,
        valdAdress: {
          ...action.address,
          apartmentNumber:
            action.apartmentDetails?.number ??
            action.address.apartmentNumber ??
            undefined,
        },
        elomrade: action.address.elomrade ?? state.elomrade,
        isPriceConflict,
        addressDetails: {
          boendeform: action.address.type === 'LGH' ? 'lägenhet' : 'villa',
          apartmentNumber: action.apartmentDetails?.number ?? null,
          co: action.apartmentDetails?.co ?? null,
        },
        idMethod: null,
        personnummer: null,
        isAuthenticated: false,
        scenario: 'UNKNOWN',
        customer: createEmptyCustomer(),
        moveChoice: null,
        facilityHandling: null,
        invoice: null,
        startDate: null,
        startDateMode: 'EARLIEST',
        detailsStep: 'DATE',
        dateDraft: null,
        contactDraft: null,
        signedAt: null,
        marketingConsent: { email: false, sms: false },
        riskInfoAccepted: false,
        termsAccepted: false,
        stop: { isStopped: false, reason: null },
        extraServicesSelection: null,
      };
    }
    case 'SET_PRIVATE_AUTHENTICATED':
      if (state.customerType !== 'PRIVATE') return state;
      return {
        ...state,
        personnummer: action.personnummer,
        idMethod: action.method,
        isAuthenticated: true,
      };
    case 'SET_PRIVATE_SCENARIO':
      if (state.customerType !== 'PRIVATE') return state;
      return {
        ...state,
        scenario: action.scenario,
        customer: {
          ...action.customer,
          folkbokforing: action.customer.folkbokforing ?? null,
          facilityId: action.customer.facilityId ?? null,
          marketingConsent: action.customer.marketingConsent ?? {
            email: false,
            sms: false,
          },
        },
        moveChoice: null,
        facilityHandling: null,
        invoice: null,
        startDate: null,
        startDateMode: 'EARLIEST',
        detailsStep: 'DATE',
        dateDraft: null,
        contactDraft: null,
        signedAt: null,
        marketingConsent: action.customer.marketingConsent ?? {
          email: false,
          sms: false,
        },
        riskInfoAccepted: false,
        termsAccepted: false,
        stop: { isStopped: false, reason: null },
        extraServicesSelection: null,
      };
    case 'SET_PRIVATE_MOVE_CHOICE':
      if (state.customerType !== 'PRIVATE') return state;
      return state.moveChoice === action.choice
        ? state
        : {
            ...state,
            moveChoice: action.choice,
            invoice: null,
            contactDraft: null,
            termsAccepted: false,
            riskInfoAccepted: false,
            signedAt: null,
          };
    case 'SET_PRIVATE_COMPARE_PROFILE':
      if (state.customerType !== 'PRIVATE') return state;
      return {
        ...state,
        housingType:
          action.profile.housingType !== undefined
            ? action.profile.housingType
            : state.housingType,
        compareProfileKwh:
          action.profile.compareProfileKwh !== undefined
            ? action.profile.compareProfileKwh
            : state.compareProfileKwh,
        customConsumptionKwh:
          action.profile.customConsumptionKwh !== undefined
            ? action.profile.customConsumptionKwh
            : state.customConsumptionKwh,
      };
    case 'SET_PRIVATE_FACILITY_HANDLING':
      if (state.customerType !== 'PRIVATE') return state;
      return JSON.stringify(state.facilityHandling) ===
        JSON.stringify(action.handling)
        ? state
        : {
            ...state,
            facilityHandling: action.handling,
            termsAccepted: false,
            riskInfoAccepted: false,
            signedAt: null,
          };
    case 'SET_PRIVATE_INVOICE':
      if (state.customerType !== 'PRIVATE') return state;
      return { ...state, invoice: action.invoice };
    case 'SET_PRIVATE_CUSTOMER_DETAILS':
      if (state.customerType !== 'PRIVATE') return state;
      return {
        ...state,
        startDate: action.details.startDate,
        startDateMode: action.details.startDateMode,
        dateDraft: {
          date: action.details.startDate,
          mode: action.details.startDateMode,
        },
        termsAccepted:
          state.startDate === action.details.startDate
            ? state.termsAccepted
            : false,
        riskInfoAccepted:
          state.startDate === action.details.startDate
            ? state.riskInfoAccepted
            : false,
        signedAt: null,
        customer: {
          ...state.customer,
          email: action.details.email,
          phone: action.details.phone,
        },
      };
    case 'SET_PRIVATE_ELOMRADE':
      if (state.customerType !== 'PRIVATE') return state;
      return { ...state, elomrade: action.elomrade };
    case 'RESOLVE_PRIVATE_PRICE_CONFLICT':
      if (state.customerType !== 'PRIVATE') return state;
      return { ...state, isPriceConflict: false };
    case 'SET_PRIVATE_CONSENTS':
      if (state.customerType !== 'PRIVATE') return state;
      return {
        ...state,
        termsAccepted: action.consents.terms ?? state.termsAccepted,
        riskInfoAccepted: action.consents.risk ?? state.riskInfoAccepted,
        marketingConsent: action.consents.marketing
          ? { ...action.consents.marketing }
          : state.marketingConsent,
      };
    case 'NAVIGATE_PRIVATE':
      if (state.customerType !== 'PRIVATE') return state;
      const target = resolvePrivateNavigation(
        state,
        action.step,
        action.detailsStep ?? state.detailsStep,
      );
      if (
        state.currentStep === target.step &&
        state.detailsStep === target.detailsStep
      )
        return state;
      return {
        ...state,
        currentStep: target.step,
        detailsStep: target.detailsStep,
      };
    case 'SET_PRIVATE_DETAILS_STEP':
      if (state.customerType !== 'PRIVATE' || state.detailsStep === action.step)
        return state;
      return { ...state, detailsStep: action.step };
    case 'SET_PRIVATE_DATE_DRAFT':
      if (state.customerType !== 'PRIVATE') return state;
      return { ...state, dateDraft: action.value };
    case 'SET_PRIVATE_CONTACT_DRAFT':
      if (state.customerType !== 'PRIVATE') return state;
      return { ...state, contactDraft: action.value };
    case 'CONFIRM_PRIVATE_DATE':
      if (
        state.customerType !== 'PRIVATE' ||
        !isValidDateSelection(action.value)
      )
        return state;
      return {
        ...state,
        dateDraft: action.value,
        startDate: action.value.date,
        startDateMode: action.value.mode,
        detailsStep: 'CONTACT',
        termsAccepted:
          state.startDate === action.value.date &&
          state.startDateMode === action.value.mode
            ? state.termsAccepted
            : false,
        riskInfoAccepted:
          state.startDate === action.value.date &&
          state.startDateMode === action.value.mode
            ? state.riskInfoAccepted
            : false,
        signedAt: null,
      };
    case 'COMPLETE_PRIVATE_SIGNING':
      if (
        state.customerType !== 'PRIVATE' ||
        state.currentStep !== 'SIGNING' ||
        resolvePrivateNavigation(state, 'SIGNING').step !== 'SIGNING'
      )
        return state;
      return {
        ...state,
        signedAt: action.signedAt,
        currentStep: 'CONFIRMATION',
      };
    case 'SET_PRIVATE_STOP':
      if (state.customerType !== 'PRIVATE') return state;
      return {
        ...state,
        stop: { isStopped: action.reason !== null, reason: action.reason },
      };
    case 'SET_PRIVATE_EXTRA_SERVICES':
      if (state.customerType !== 'PRIVATE') return state;
      return { ...state, extraServicesSelection: action.selection };
    case 'SET_COMPANY_PRODUCT':
      if (state.customerType !== 'COMPANY') return state;
      return { ...state, selectedProduct: action.product };
    case 'SET_COMPANY_GATEKEEPER':
      if (state.customerType !== 'COMPANY') return state;
      return { ...state, ...action.data };
    case 'SET_COMPANY_LOOKUP_DATA':
      if (state.customerType !== 'COMPANY') return state;
      return {
        ...state,
        orgNr: action.data.orgNr,
        companyName: action.data.companyName,
        isCreditApproved: action.data.isCreditApproved,
        signatoryType: action.data.signatoryType,
      };
    case 'SET_COMPANY_FACILITIES':
      if (state.customerType !== 'COMPANY') return state;
      return {
        ...state,
        facilities: action.facilities,
        facilityCount: action.facilities.length || state.facilityCount,
      };
    default:
      return state;
  }
};
