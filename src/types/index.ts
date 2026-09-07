export type EntryPoint = 'ADDRESS_FIRST' | 'PRODUCT_FIRST';
export type EntryOffer = {
  source: 'PRODUCT_PAGE' | 'PARTNER';
  productId: string;
};
export type Scenario = 'UNKNOWN' | 'NY' | 'BYTE' | 'FLYTT' | 'EXTRA';
export type IdMethod = 'BANKID_MOBILE' | 'BANKID_QR' | 'MANUAL_PNR';
export type MoveChoice = 'MOVE_EXISTING' | 'NEW_ON_NEW_ADDRESS';
export type HousingType =
  | 'KWH_2000'
  | 'KWH_5000'
  | 'KWH_20000';
export type CompareProfileKwh = number;
export type PrivateFlowStep =
  | 'PRODUCT_SELECT'
  | 'PRODUCT_CLARIFY'
  | 'ADDRESS_SEARCH'
  | 'IDENTIFY'
  | 'FLOW_STOP'
  | 'EXISTING_CONTRACT_EXTRAS'
  | 'MOVE_OFFER'
  | 'DETAILS'
  | 'TERMS'
  | 'SIGNING'
  | 'CONFIRMATION'
  | 'EXTRA_BIXIA_NARA'
  | 'EXTRA_REALTIME_METER'
  | 'APP_DOWNLOAD'
  | 'EXTRA_CONTACT';
export type PrivateDetailsStep = 'DATE' | 'CONTACT';
export type DateSelection = { date: string; mode: 'EARLIEST' | 'SPECIFIC' };
export type ContactDraft = {
  email: string;
  phone: string;
  useRecommendedInvoice: boolean;
  invoiceQuery: string;
  selectedCustomInvoiceAddress: Address | null;
  invoiceApartmentNumber: string;
  invoiceCoValue: string;
  isConfirming: boolean;
};
export type FacilityHandling = {
  mode: 'FETCH_WITH_POWER_OF_ATTORNEY' | 'MANUAL' | 'FROM_CRM';
  facilityId: string | null;
};
export type ContactInterestServiceId =
  | 'HOME_BATTERY'
  | 'CHARGER'
  | 'SOLAR'
  | 'ATTIC_INSULATION';
export type ExtraServicesSelection = {
  bixiaNara: {
    selected: boolean;
    county?: string;
  };
  realtimeMeter: {
    selected: boolean;
  };
  contactMeServices: ContactInterestServiceId[];
};
export type Invoice = {
  mode: 'SAME_AS_RECOMMENDED' | 'CUSTOM';
  address: Address | null;
  apartmentDetails?: {
    number: string;
    co: string | null;
  } | null;
};
export type ScenarioCustomer = {
  isExistingCustomer: boolean;
  name: string | null;
  email: string | null;
  phone: string | null;
  folkbokforing: Address | null;
  facilityId: string | null;
  extraServices?: ExtraServicesSelection | null;
  contractEndDate?: string | null;
  marketingConsent: { email: boolean; sms: boolean };
};

export type { Address, Elomrade, Product } from './shared';

import type { Address, Elomrade, Product } from './shared';
import type { CompanyState } from './company';

export type PrivateCaseState = {
  customerType: 'PRIVATE';
  // Meta
  caseId: string | null;
  entryPoint: EntryPoint;
  entryOffer: EntryOffer | null;
  currentStep: PrivateFlowStep;
  detailsStep: PrivateDetailsStep;
  dateDraft: DateSelection | null;
  contactDraft: ContactDraft | null;
  signedAt: string | null;
  extraServicesSelection: ExtraServicesSelection | null;
  scenario: Scenario;
  elomrade: Elomrade | null;

  // Address Context
  valdAdress: Address | null;
  moveChoice: MoveChoice | null;
  housingType: HousingType | null;
  compareProfileKwh: CompareProfileKwh | null;
  customConsumptionKwh: number | null;
  facilityHandling: FacilityHandling | null;
  invoice: Invoice | null;
  addressDetails: {
    boendeform: 'villa' | 'lägenhet' | null;
    apartmentNumber: string | null;
    co: string | null;
  };

  // Identity & Customer
  idMethod: IdMethod | null;
  personnummer: string | null;
  isAuthenticated: boolean;
  customer: ScenarioCustomer;

  // Product & Price
  selectedProduct: Product | null;
  isPriceConflict: boolean;

  // Dates
  startDate: string | null;
  startDateMode: DateSelection['mode'];

  // Legal & Consents
  marketingConsent: { email: boolean; sms: boolean };
  riskInfoAccepted: boolean;
  termsAccepted: boolean;

  // Stop & Recovery
  stop: { isStopped: boolean; reason: StopReason | null };
};

export type CaseState = PrivateCaseState | CompanyState;

export type StopReason = 
  | 'DUPLICATE_SAME_CONTRACT'
  | 'PENDING_CASE'
  | 'CANNOT_DELIVER';
