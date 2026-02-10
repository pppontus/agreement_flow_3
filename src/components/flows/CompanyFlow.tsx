import { useEffect, useState } from 'react';
import { FacilityLoop } from '@/components/company/FacilityLoop';
import { Facility } from '@/types/company';
import { CompanyGatekeeper } from '@/components/company/CompanyGatekeeper';
import { CompanySearch } from '@/components/company/CompanySearch';
import { CompanyLookupResult } from '@/services/companyService';

import { ProductSelection } from '@/components/flow/ProductSelection';
import { Product } from '@/types';

export type CompanyStep = 'PRODUCT_SELECT' | 'GATEKEEPER' | 'SEARCH' | 'FACILITIES_LOOP';

interface CompanyFlowProps {
  onStepChange?: (step: CompanyStep) => void;
}

export const CompanyFlow = ({ onStepChange }: CompanyFlowProps) => {
  const [step, setStep] = useState<CompanyStep>('PRODUCT_SELECT');

  // Temporary local state until we wire up context setters in Phase 3
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [gatekeeperData, setGatekeeperData] = useState<{ consumption: number; facilities: number } | null>(null);
  const [companyData, setCompanyData] = useState<CompanyLookupResult | null>(null);
  const [facilitiesData, setFacilitiesData] = useState<Facility[]>([]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setStep('GATEKEEPER');
  };

  const handleGatekeeperContinue = (consumption: number, facilities: number) => {
    setGatekeeperData({ consumption, facilities });
    setStep('SEARCH');
  };

  const handleCompanyFound = (company: CompanyLookupResult) => {
    setCompanyData(company);
    setStep('FACILITIES_LOOP');
  };

  const handleFacilitiesComplete = (facilities: Facility[]) => {
    setFacilitiesData(facilities);
    // Move to next logical step (e.g. Signing or Summary)
    // For now we just stay here to show verification
    console.log('Facilities configured:', facilities);
  };

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  return (
    <>
      
      {step === 'PRODUCT_SELECT' && (
        <ProductSelection 
          isCompany={true}
          onProductSelect={handleProductSelect}
        />
      )}

      {step === 'GATEKEEPER' && (
        <CompanyGatekeeper onContinue={handleGatekeeperContinue} />
      )}

      {step === 'SEARCH' && (
        <CompanySearch 
          onCompanyFound={handleCompanyFound} 
          onBack={() => setStep('GATEKEEPER')}
        />
      )}

      {step === 'FACILITIES_LOOP' && gatekeeperData && selectedProduct && (
        <FacilityLoop 
          initialCount={1} // Always start with 1 facility in the new flow
          globalProduct={selectedProduct}
          onComplete={handleFacilitiesComplete}
          onBack={() => setStep('SEARCH')}
        />
      )}

      {/* Debug View for Verification */}
      {facilitiesData.length > 0 && (
        <div style={{ marginTop: '40px', padding: '20px', background: '#e0f2fe', borderRadius: '8px', maxWidth: '800px', margin: '40px auto' }}>
          <h3>✅ Färdigt! (Fas 3 Resultat)</h3>
          <p><strong>Företag:</strong> {companyData?.companyName}</p>
          <p><strong>Totalt förbrukning:</strong> {gatekeeperData?.consumption} kWh</p>
          <p><strong>Antal anläggningar:</strong> {facilitiesData.length} st</p>
          <div style={{ marginTop: '10px' }}>
            {facilitiesData.map((f, i) => (
              <div key={i} style={{ padding: '8px', background: 'white', marginBottom: '4px', borderRadius: '4px' }}>
                {f.address} - {f.annualConsumption} kWh
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
