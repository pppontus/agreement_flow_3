import { apiClient } from './apiClient';
import { SignatoryType } from '@/types/company';

export interface CompanyLookupResult {
  orgNr: string;
  companyName: string;
  address: {
    street: string;
    zip: string;
    city: string;
  };
  isCreditApproved: boolean;
  signatoryType: SignatoryType;
  primarySigner?: {
    name: string;
    pnr: string;
  };
}

const MOCK_COMPANIES: Record<string, CompanyLookupResult> = {
  '556012-3456': {
    orgNr: '556012-3456',
    companyName: 'Acme Corp AB',
    address: {
      street: 'Storgatan 1',
      zip: '123 45',
      city: 'Stockholm'
    },
    isCreditApproved: true,
    signatoryType: 'SINGLE',
    primarySigner: {
      name: 'Anders Andersson',
      pnr: '19800101-1234'
    }
  },
  '556999-9999': {
    orgNr: '556999-9999',
    companyName: 'Denied AB',
    address: {
      street: 'Bakgatan 9',
      zip: '999 99',
      city: 'Kiruna'
    },
    isCreditApproved: false,
    signatoryType: 'SINGLE'
  },
  '556111-2222': {
    orgNr: '556111-2222',
    companyName: 'Dual Signers AB',
    address: {
      street: 'Dubbelvägen 2',
      zip: '222 22',
      city: 'Malmö'
    },
    isCreditApproved: true,
    signatoryType: 'DUAL'
  }
};

export const lookupCompany = async (orgNr: string): Promise<CompanyLookupResult> => {
  // Clean input
  const cleanOrgNr = orgNr.replace(/[^0-9]/g, '');
  const formattedOrgNr = cleanOrgNr.length === 10 
    ? `${cleanOrgNr.slice(0, 6)}-${cleanOrgNr.slice(6)}` 
    : orgNr;

  return apiClient.loggedApiCall(
    'GET' as any, // Temporary cast until we add COMPANY_SEARCH type
    `/api/company/${formattedOrgNr}`,
    undefined,
    async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const company = MOCK_COMPANIES[formattedOrgNr];
      
      if (!company) {
        throw new Error('Företaget hittades inte');
      }

      return company;
    }
  );
};
