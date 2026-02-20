import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FacilityLoop } from '@/components/company/FacilityLoop';
import { CompanyGatekeeper } from '@/components/company/CompanyGatekeeper';
import { CompanySearch } from '@/components/company/CompanySearch';
import { CompanyLookupResult } from '@/services/companyService';
import { ProductSelection } from '@/components/flow/ProductSelection';
import { Product } from '@/types';
import { useFlowState } from '@/hooks/useFlowState';

export type CompanyStep = 'PRODUCT_SELECT' | 'GATEKEEPER' | 'SEARCH' | 'FACILITIES_LOOP';

interface CompanyFlowProps {
  onStepChange?: (step: CompanyStep) => void;
}

export const CompanyFlow = ({ onStepChange }: CompanyFlowProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStep = (searchParams.get('companyStep') as CompanyStep) || 'PRODUCT_SELECT';

  const {
    state: rawState,
    isInitialized,
    setCompanyProduct,
    setCompanyGatekeeper,
    setCompanyLookupData,
    setCompanyFacilities,
  } = useFlowState();

  if (!isInitialized) return null;
  if (rawState.customerType !== 'COMPANY') return null;
  const state = rawState;

  const goToStep = (step: CompanyStep) => {
    const params = new URLSearchParams(searchParams);
    params.set('companyStep', step);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleProductSelect = (product: Product) => {
    setCompanyProduct(product);
    goToStep('GATEKEEPER');
  };

  const handleGatekeeperContinue = (consumption: number, facilities: number) => {
    setCompanyGatekeeper({ totalConsumption: consumption, facilityCount: facilities });
    goToStep('SEARCH');
  };

  const handleCompanyFound = (company: CompanyLookupResult) => {
    setCompanyLookupData({
      orgNr: company.orgNr,
      companyName: company.companyName,
      isCreditApproved: company.isCreditApproved,
      signatoryType: company.signatoryType,
    });
    goToStep('FACILITIES_LOOP');
  };

  const handleFacilitiesComplete = setCompanyFacilities;

  useEffect(() => {
    if (currentStep !== 'PRODUCT_SELECT' && !state.selectedProduct) {
      goToStep('PRODUCT_SELECT');
    }
  }, [currentStep, state.selectedProduct]);

  useEffect(() => {
    if (currentStep === 'FACILITIES_LOOP' && !state.companyName) {
      goToStep('SEARCH');
    }
  }, [currentStep, state.companyName]);

  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  return (
    <>
      {currentStep === 'PRODUCT_SELECT' && (
        <ProductSelection 
          isCompany={true}
          onProductSelect={handleProductSelect}
        />
      )}

      {currentStep === 'GATEKEEPER' && (
        <CompanyGatekeeper onContinue={handleGatekeeperContinue} />
      )}

      {currentStep === 'SEARCH' && (
        <CompanySearch 
          onCompanyFound={handleCompanyFound} 
          onBack={() => goToStep('GATEKEEPER')}
        />
      )}

      {currentStep === 'FACILITIES_LOOP' && state.selectedProduct && (
        <FacilityLoop 
          initialCount={Math.max(1, state.facilityCount || 1)}
          globalProduct={state.selectedProduct}
          onComplete={handleFacilitiesComplete}
          onBack={() => goToStep('SEARCH')}
        />
      )}
    </>
  );
};
