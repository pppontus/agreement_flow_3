import { useCallback, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FacilityLoop } from '@/components/company/FacilityLoop';
import { CompanyGatekeeper } from '@/components/company/CompanyGatekeeper';
import { CompanySearch } from '@/components/company/CompanySearch';
import { CompanyLookupResult } from '@/services/companyService';
import { ProductSelection } from '@/components/flow/ProductSelection';
import { Product } from '@/types';
import { useFlowState } from '@/context/FlowStateContext';

export type CompanyStep = 'PRODUCT_SELECT' | 'GATEKEEPER' | 'SEARCH' | 'FACILITIES_LOOP';
const COMPANY_STEPS: readonly CompanyStep[] = ['PRODUCT_SELECT', 'GATEKEEPER', 'SEARCH', 'FACILITIES_LOOP'];

const isCompanyStep = (value: string | null): value is CompanyStep =>
  typeof value === 'string' && COMPANY_STEPS.includes(value as CompanyStep);

interface CompanyFlowProps {
  onStepChange?: (step: CompanyStep) => void;
}

export const CompanyFlow = ({ onStepChange }: CompanyFlowProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('companyStep');
  const currentStep: CompanyStep = isCompanyStep(stepParam) ? stepParam : 'PRODUCT_SELECT';

  const {
    state: rawState,
    isInitialized,
    setCompanyProduct,
    setCompanyGatekeeper,
    setCompanyLookupData,
    setCompanyFacilities,
  } = useFlowState();

  const state = rawState.customerType === 'COMPANY' ? rawState : null;

  const goToStep = useCallback((step: CompanyStep) => {
    const params = new URLSearchParams(searchParams);
    params.set('companyStep', step);
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

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
    if (!isInitialized || !state) return;
    if (currentStep !== 'PRODUCT_SELECT' && !state.selectedProduct) {
      goToStep('PRODUCT_SELECT');
    }
  }, [currentStep, goToStep, isInitialized, state]);

  useEffect(() => {
    if (!isInitialized || !state) return;
    if (currentStep === 'FACILITIES_LOOP' && !state.companyName) {
      goToStep('SEARCH');
    }
  }, [currentStep, goToStep, isInitialized, state]);

  useEffect(() => {
    if (!isInitialized || !state) return;
    onStepChange?.(currentStep);
  }, [currentStep, isInitialized, onStepChange, state]);

  if (!isInitialized || !state) return null;

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
