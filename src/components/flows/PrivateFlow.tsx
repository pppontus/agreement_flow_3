"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ProductSelection } from "@/components/flow/ProductSelection";
import { AddressSearch } from "@/components/flow/AddressSearch";
import { Identification } from "@/components/flow/Identification";
import { MoveOffer } from "@/components/flow/MoveOffer";
import { StartDatePicker } from "@/components/flow/StartDatePicker";
import { ContactForm } from "@/components/flow/ContactForm";
import { TermsConsent } from "@/components/flow/TermsConsent";
import { RiskInfo } from "@/components/flow/RiskInfo";
import { SigningFlow } from "@/components/flow/SigningFlow";
import { Confirmation } from "@/components/flow/Confirmation";
import { AppDownloadPrompt } from "@/components/flow/AppDownloadPrompt";
import { Address, Product, IdMethod, PrivateCaseState } from "@/types";
import { useFlowState } from '@/hooks/useFlowState';
import { determineScenario } from '@/services/scenarioService';
import { detectRegion } from '@/services/regionService';
import { useDevPanel } from '@/context/DevPanelContext';
import { PriceConflictResolver } from '@/components/flow/PriceConflictResolver';
import { ExtraServicesSelection, saveExtraServicesSelection } from '@/services/extraServicesService';

type FlowStep = 
  | 'PRODUCT_SELECT'
  | 'ADDRESS_SEARCH'
  | 'IDENTIFY'
  | 'MOVE_OFFER'
  | 'DETAILS'
  | 'TERMS'
  | 'RISK_INFO'
  | 'SIGNING'
  | 'CONFIRMATION'
  | 'APP_DOWNLOAD';

const FLOW_STEPS: FlowStep[] = [
  'PRODUCT_SELECT',
  'ADDRESS_SEARCH',
  'IDENTIFY',
  'MOVE_OFFER',
  'DETAILS',
  'TERMS',
  'RISK_INFO',
  'SIGNING',
  'CONFIRMATION',
  'APP_DOWNLOAD',
];

const isValidFlowStep = (step: string | null): step is FlowStep => {
  if (!step) return false;
  return FLOW_STEPS.includes(step as FlowStep);
};

export const PrivateFlow = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const currentStep: FlowStep = isValidFlowStep(stepParam) ? stepParam : 'PRODUCT_SELECT';
  
  const { state: rawState, isInitialized, selectProduct, setAddress, setAuthenticated, setCustomerScenario, setCustomerDetails, setElomrade, setConsents, resetState } = useFlowState();
  const { state: devState, setCurrentPhase } = useDevPanel();
  const isPrivateFlow = rawState.customerType === 'PRIVATE';
  const state = rawState as PrivateCaseState;
  const selectedProduct = isPrivateFlow ? rawState.selectedProduct : null;
  const scenario = isPrivateFlow ? rawState.scenario : 'UNKNOWN';
  const selectedAddress = isPrivateFlow ? rawState.valdAdress : null;
  const folkbokforingAddress = isPrivateFlow ? rawState.customer.folkbokforing : null;
  const elomrade = isPrivateFlow ? rawState.elomrade : null;

  // Local state for the DETAILS step to manage substeps (Date -> Contact)
  const [detailsSubStep, setDetailsSubStep] = useState<'DATE' | 'CONTACT'>('DATE');
  const [tempDateData, setTempDateData] = useState<{date: string, mode: 'EARLIEST' | 'SPECIFIC'} | null>(null);

  // Security: Track when BankID-only verification is required
  const [requireBankIdVerification, setRequireBankIdVerification] = useState(false);
  const [pendingScenarioResponse, setPendingScenarioResponse] = useState<any>(null);
  const [extraServicesSelection, setExtraServicesSelection] = useState<ExtraServicesSelection | null>(null);

  // Navigation helper
  const goToStep = (step: FlowStep) => {
    const params = new URLSearchParams(searchParams);
    params.set('step', step);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Hydration check: If at a later step but missing state, redirect to start
  useEffect(() => {
    if (!isPrivateFlow) return;

    if (isInitialized) {
      if (stepParam && !isValidFlowStep(stepParam)) {
        console.log(`Invalid step "${stepParam}", restarting flow`);
        goToStep('PRODUCT_SELECT');
        return;
      }

      if (currentStep !== 'PRODUCT_SELECT' && !selectedProduct) {
        console.log('Missing flow state, restarting flow');
        goToStep('PRODUCT_SELECT');
      }

      if (
        currentStep === 'MOVE_OFFER' &&
        (scenario !== 'FLYTT' || !selectedAddress || !folkbokforingAddress)
      ) {
        console.log('Missing move offer state, returning to identify');
        goToStep('IDENTIFY');
      }
    }
  }, [
    isPrivateFlow,
    isInitialized,
    currentStep,
    selectedProduct,
    scenario,
    selectedAddress,
    folkbokforingAddress,
    stepParam,
  ]);

  // Sync current step to DevPanel
  useEffect(() => {
    setCurrentPhase(currentStep);
  }, [currentStep, setCurrentPhase]);

  // Detect region on initial load
  useEffect(() => {
    if (isPrivateFlow && isInitialized && !elomrade) {
      detectRegion().then(response => {
        setElomrade(response.elomrade);
      }).catch(err => {
        console.error('Failed to detect region:', err);
      });
    }
  }, [isPrivateFlow, isInitialized, elomrade, setElomrade]);

  const handleProductSelect = (product: Product) => {
    selectProduct(product);
    goToStep('ADDRESS_SEARCH');
  };

  const handleAddressConfirm = (address: Address, apartmentDetails?: { number: string, co?: string }) => {
    setAddress(address, apartmentDetails ? { number: apartmentDetails.number, co: apartmentDetails.co || null } : undefined);
    goToStep('IDENTIFY');
  };

  const handleAuthenticated = async (pnr: string, method: IdMethod) => {
    setAuthenticated(pnr, method);
    
    if (state.valdAdress) {
      try {
        const mockOverride = devState.isOpen ? devState.mockScenario : undefined;
        const mockMarketingConsent = devState.isOpen ? devState.mockMarketingConsent : undefined;
        const scenarioResponse = await determineScenario(pnr, state.valdAdress, mockOverride, mockMarketingConsent);
        
        if (scenarioResponse.customer.isExistingCustomer && method === 'MANUAL_PNR') {
          setPendingScenarioResponse(scenarioResponse);
          setRequireBankIdVerification(true);
          return;
        }

        const finalResponse = pendingScenarioResponse || scenarioResponse;
        setRequireBankIdVerification(false);
        setPendingScenarioResponse(null);

        setCustomerScenario(finalResponse.scenario, finalResponse.customer);

        if (finalResponse.scenario === 'FLYTT' && finalResponse.currentContractAddress) {
          goToStep('MOVE_OFFER');
        } else {
          goToStep('DETAILS');
        }
      } catch (error) {
        console.error('Error determining scenario:', error);
      }
    }
  };

  const handleMoveChoice = () => {
    goToStep('DETAILS');
  };

  const handleDateSelect = (date: string, mode: 'EARLIEST' | 'SPECIFIC') => {
    setTempDateData({ date, mode });
    setDetailsSubStep('CONTACT');
  };

  const handleContactConfirm = (contact: { email: string, phone: string }) => {
    if (tempDateData) {
      setCustomerDetails({
        startDate: tempDateData.date,
        startDateMode: tempDateData.mode,
        email: contact.email,
        phone: contact.phone
      });
      goToStep('TERMS');
    }
  };

  const handleTermsConfirm = (consents: { termsAccepted: boolean; marketing: { email: boolean; sms: boolean } }) => {
    setConsents({ 
      terms: consents.termsAccepted, 
      marketing: consents.marketing 
    });
    
    const productType = state.selectedProduct?.type;
    if (productType === 'FAST' || productType === 'KVARTS') {
      goToStep('RISK_INFO');
    } else {
      goToStep('SIGNING');
    }
  };

  const handleRiskConfirm = () => {
    setConsents({ risk: true });
    goToStep('SIGNING');
  };

  const handleSigned = () => {
    goToStep('CONFIRMATION');
  };

  const handleExtrasSelectionsSubmit = async (selection: ExtraServicesSelection) => {
    await saveExtraServicesSelection('ORD-123456', selection);
    setExtraServicesSelection(selection);
    goToStep('APP_DOWNLOAD');
  };

  const handleConfirmationReset = () => {
    setExtraServicesSelection(null);
    resetState();
    router.push(pathname);
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'ADDRESS_SEARCH':
        goToStep('PRODUCT_SELECT');
        break;
      case 'IDENTIFY':
        goToStep('ADDRESS_SEARCH');
        break;
      case 'MOVE_OFFER':
        goToStep('IDENTIFY');
        break;
      case 'DETAILS':
        if (detailsSubStep === 'CONTACT') {
          setDetailsSubStep('DATE');
        } else {
          if (state.scenario === 'FLYTT' && state.customer.folkbokforing && state.valdAdress) {
            goToStep('MOVE_OFFER');
          } else {
            goToStep('IDENTIFY');
          }
        }
        break;
      case 'TERMS':
        setDetailsSubStep('CONTACT');
        goToStep('DETAILS');
        break;
      case 'RISK_INFO':
        goToStep('TERMS');
        break;
      case 'SIGNING':
        if (state.selectedProduct?.type === 'FAST' || state.selectedProduct?.type === 'KVARTS') {
          goToStep('RISK_INFO');
        } else {
          goToStep('TERMS');
        }
        break;
      case 'CONFIRMATION':
        goToStep('SIGNING');
        break;
      case 'APP_DOWNLOAD':
        goToStep('CONFIRMATION');
        break;
      default:
        console.warn('Unknown step for back navigation');
    }
  };

  const [enteredFromForward, setEnteredFromForward] = useState(false);

  useEffect(() => {
    if (currentStep === 'DETAILS' && !enteredFromForward) {
      setDetailsSubStep('DATE');
      setTempDateData(null);
      setEnteredFromForward(true);
    }
    if (currentStep !== 'DETAILS') {
      setEnteredFromForward(false);
    }
  }, [currentStep, enteredFromForward]);

  if (!isPrivateFlow || !isInitialized) return null;

  return (
    <>
      {currentStep === 'PRODUCT_SELECT' && (
        <ProductSelection onProductSelect={handleProductSelect} />
      )}

      {currentStep === 'ADDRESS_SEARCH' && (
        <AddressSearch 
          onConfirmAddress={handleAddressConfirm}
          onBack={handleBack}
          suggestedAddress={state.customer.folkbokforing}
        />
      )}

      {currentStep === 'IDENTIFY' && (
        state.isPriceConflict ? (
          <PriceConflictResolver />
        ) : (
          <Identification 
            onAuthenticated={handleAuthenticated}
            onBack={handleBack}
            bankIdOnly={requireBankIdVerification}
            securityMessage={requireBankIdVerification 
              ? 'Du är redan kund hos oss! För din säkerhet behöver du verifiera dig med BankID.' 
              : undefined
            }
          />
        )
      )}

      {currentStep === 'DETAILS' && detailsSubStep === 'DATE' && (
        <StartDatePicker 
          onSelectDate={handleDateSelect}
          onBack={handleBack}
          address={state.valdAdress || undefined}
          isSwitching={state.scenario === 'BYTE'}
          productName={state.selectedProduct?.name}
          isExistingCustomer={state.customer.isExistingCustomer}
          bindingEndDate={state.customer.contractEndDate || undefined}
        />
      )}

      {currentStep === 'DETAILS' && detailsSubStep === 'CONTACT' && (
        <ContactForm 
          initialData={state.customer}
          onConfirm={handleContactConfirm}
          onBack={handleBack}
        />
      )}

      {currentStep === 'MOVE_OFFER' && state.customer.folkbokforing && state.valdAdress && (
        <MoveOffer 
          currentAddress={state.customer.folkbokforing}
          newAddress={state.valdAdress}
          onMove={handleMoveChoice}
          onNew={handleMoveChoice}
          onBack={handleBack}
        />
      )}

      {currentStep === 'TERMS' && (
        <TermsConsent 
          onConfirm={handleTermsConfirm}
          onBack={handleBack}
          requiresFacilityId={state.scenario !== 'BYTE'}
          existingMarketingConsent={state.customer.marketingConsent}
          initialMarketingConsent={state.marketingConsent}
        />
      )}

      {currentStep === 'RISK_INFO' && (
        <RiskInfo 
          onConfirm={handleRiskConfirm}
          onBack={handleBack}
          productType={state.selectedProduct?.type || 'FAST'}
        />
      )}

      {currentStep === 'SIGNING' && (
        <SigningFlow 
          onSigned={handleSigned}
          onCancel={handleBack}
        />
      )}

      {currentStep === 'CONFIRMATION' && (
        <Confirmation 
          orderId="ORD-123456"
          product={state.selectedProduct || undefined}
          address={state.valdAdress || undefined}
          email={state.customer.email || undefined}
          initialSelection={extraServicesSelection}
          onSubmitSelections={handleExtrasSelectionsSubmit}
          onBack={handleBack}
        />
      )}

      {currentStep === 'APP_DOWNLOAD' && (
        <AppDownloadPrompt
          selection={extraServicesSelection}
          onDone={handleConfirmationReset}
          onBack={handleBack}
        />
      )}
    </>
  );
};
