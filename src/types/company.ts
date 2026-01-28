import { Address, Elomrade } from './index';

export type CompanyScenario = 'NYTECKNING' | 'LEVERANTÖRSBYTE' | 'OMTECKNING';
export type SignatoryType = 'SINGLE' | 'DUAL' | 'UNKNOWN';

export type Facility = {
  id: string; // Temporärt GUI-id
  anlaggningId: string; // Det riktiga ID:t (GSRN)
  address: string;
  zipCode: string;
  city: string;
  annualConsumption: number; // kWh
  elomrade?: Elomrade;
};

export type CompanyState = {
  customerType: 'COMPANY';
  
  // Gatekeeper Data
  totalConsumption: number; // Max 150 000
  facilityCount: number; // Max 5

  // Company Entity
  orgNr: string | null;
  companyName: string | null;
  isCreditApproved: boolean; // Mocked check
  
  // Signatory Logic
  signatoryType: SignatoryType;
  primarySigner: { 
    name: string; 
    email: string; 
    phone: string; 
    pnr: string 
  } | null;
  secondarySigner?: { 
    name: string; 
    email: string; 
    phone: string 
  } | null;
  
  // Facilities
  facilities: Facility[];
  
  // Product
  selectedProduct: 'RÖRLIGT' | 'KVARTS' | 'FÖRVALTAT' | null;
  startDate: string | null; // Format: YYYY-MM-01 (Alltid den 1:a)
  
  // Invoice
  invoiceAddress: 'SAME_AS_VISITING' | 'OTHER';
  invoiceReference: string | null; // Obligatoriskt "Er referens"
  
  // Legal
  termsAccepted: boolean;
  authorityDeclared: boolean; // "Jag intygar att jag är behörig..."
};
