export type EntryPoint = 'ADDRESS_FIRST' | 'PRODUCT_FIRST';
export type Scenario = 'UNKNOWN' | 'NY' | 'BYTE' | 'FLYTT' | 'EXTRA';
export type IdMethod = 'BANKID_MOBILE' | 'BANKID_QR' | 'MANUAL_PNR';

export type Address = {
  street: string;
  number: string;
  postalCode: string;
  city: string;
  type?: 'LGH' | 'VILLA' | 'UNKNOWN';
  elomrade?: 'SE1' | 'SE2' | 'SE3' | 'SE4';
  apartmentNumber?: string;
};

export type Elomrade = 'SE1' | 'SE2' | 'SE3' | 'SE4';

import { CompanyState } from './company';

export type PrivateCaseState = {
  customerType: 'PRIVATE';
  // Meta
  caseId: string | null;
  entryPoint: EntryPoint;
  scenario: Scenario;
  elomrade: Elomrade | null;

  // Address Context
  valdAdress: Address | null;
  addressDetails: {
    boendeform: 'villa' | 'lägenhet' | null;
    apartmentNumber: string | null;
    co: string | null;
  };

  // Identity & Customer
  idMethod: IdMethod | null;
  personnummer: string | null;
  isAuthenticated: boolean;
  customer: {
    isExistingCustomer: boolean;
    name: string | null;
    email: string | null;
    phone: string | null;
    folkbokforing: Address | null;
    contractEndDate?: string | null; // ISO Date YYYY-MM-DD
  };

  // Product & Price
  selectedProduct: Product | null;
  isPriceConflict: boolean;

  // Dates
  startDate: string | null;
  startDateMode: 'EARLIEST' | 'CHOOSE_DATE';

  // Legal & Consents
  marketingConsent: { email: boolean; sms: boolean };
  riskInfoAccepted: boolean;
  termsAccepted: boolean;

  // Stop & Recovery
  stop: { isStopped: boolean; reason: StopReason | null };
};

export type CaseState = PrivateCaseState | CompanyState;

export type Product = {
  id: string;
  name: string;
  type: 'FAST' | 'RORLIGT' | 'KVARTS' | 'FORVALTAT';
  description: string;
  pricePerKwh?: number;
  isDiscounted?: boolean;
  discountText?: string;
  isCompanyOnly?: boolean;
};

export type StopReason = 
  | 'DUPLICATE_SAME_CONTRACT'
  | 'PENDING_CASE'
  | 'CANNOT_DELIVER';
